/**
 * Admin-Serverfunktionen: Bestellungen, E-Mails, Produkte, Füllungen.
 * Immer mit authMiddleware; Aktionen, die E-Mails verschicken, mit
 * freshAuthMiddleware. Erwartbare Fehler kommen als Code zurück, nicht als
 * Exception, damit die Oberfläche sie verständlich anzeigen kann.
 */
import { createServerFn } from "@tanstack/react-start";
import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  inArray,
  isNotNull,
  notInArray,
  sql,
} from "drizzle-orm";
import * as z from "zod";

import { authMiddleware, freshAuthMiddleware } from "#/lib/auth/middleware";
import { db } from "#/lib/db";
import {
  categories,
  emailOutbox,
  type EmailStatus,
  fillings,
  orderFiles,
  orderItems,
  orders,
  products,
  productSizes,
} from "#/lib/db/schema";
import { formatPrice } from "#/lib/format";
import { buildIcs } from "#/lib/ics";
import { isPriceOffer, offerResponseDeadline } from "#/lib/order-request/offer";
import { daySlots, isClosedDay } from "#/lib/order-request/schedule";
import { orderKindSchema } from "#/lib/order-request/schema";
import { canConfirmOrDecline, isManualTransition } from "#/lib/order-status";
import { site } from "#/lib/site";

import { dispatchOutbox, dispatchOutboxInBackground, enqueueEmail } from "./mail/outbox.server";
import {
  orderConfirmedMail,
  orderDeclinedMail,
  type OrderMailData,
  testMail,
} from "./mail/templates.server";
import { isMailConfigured, mailFrom, staffRecipients } from "./mail/transport.server";
import { loadOrderMailData } from "./order-mail.server";

// ── Gemeinsames ─────────────────────────────────────────────────────────

const idSchema = z.number().int().positive();
const orderStatusSchema = z.enum(["new", "confirmed", "ready", "completed", "cancelled"]);
/** "HH:MM" */
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

type OrderActionResult = { ok: true } | { ok: false; code: "NOT_FOUND" | "INVALID_STATUS" };

type ConfirmOrderResult =
  /** `offerUntil`: ISO-Zeitpunkt, wenn die Mail als Angebot mit Frist rausging. */
  | { ok: true; offerUntil: string | null }
  | { ok: false; code: "NOT_FOUND" | "INVALID_STATUS" | "INVALID_SCHEDULE" };

type EmailSendResult =
  | { ok: true; id: number; status: EmailStatus; lastError: string | null }
  | { ok: false; code: "NOT_FOUND" | "MAIL_NOT_CONFIGURED" };

type UpsertProductResult =
  | { ok: true; id: number }
  | { ok: false; code: "NOT_FOUND" | "DUPLICATE_SIZE_LABEL" | "DUPLICATE_SLUG" };

/** Name der verletzten Unique-Constraint (Postgres 23505), sonst null. */
function violatedUniqueConstraint(error: unknown): string | null {
  const cause = error instanceof Error ? error.cause : undefined;
  if (
    typeof cause === "object" &&
    cause !== null &&
    "code" in cause &&
    cause.code === "23505" &&
    "constraint_name" in cause &&
    typeof cause.constraint_name === "string"
  ) {
    return cause.constraint_name;
  }
  return null;
}

/** Versand anstoßen und abwarten; Fehler landen am Outbox-Eintrag, nicht hier. */
async function dispatchNow(): Promise<void> {
  try {
    await dispatchOutbox();
  } catch (error) {
    console.error("[admin] Versand fehlgeschlagen", error);
  }
}

async function emailState(id: number): Promise<EmailSendResult> {
  const [row] = await db
    .select({ status: emailOutbox.status, lastError: emailOutbox.lastError })
    .from(emailOutbox)
    .where(eq(emailOutbox.id, id))
    .limit(1);
  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, id, status: row.status, lastError: row.lastError };
}

// ── Bestellungen ────────────────────────────────────────────────────────

const listOrdersSchema = z.object({
  status: orderStatusSchema.optional(),
  kind: orderKindSchema.optional(),
});

/** Neueste 200 Anfragen/Bestellungen, optional nach Status und Art gefiltert. */
export const $adminListOrders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((d: z.input<typeof listOrdersSchema> | undefined) => listOrdersSchema.parse(d ?? {}))
  .handler(async ({ data }) => {
    const rows = await db
      .select({
        id: orders.id,
        orderNo: orders.orderNo,
        status: orders.status,
        kind: orders.kind,
        fulfilment: orders.fulfilment,
        desiredDate: orders.desiredDate,
        desiredTime: orders.desiredTime,
        customerName: orders.customerName,
        locale: orders.locale,
        totalCents: orders.totalCents,
        finalTotalCents: orders.finalTotalCents,
        createdAt: orders.createdAt,
        photoCount: db.$count(orderFiles, eq(orderFiles.orderId, orders.id)),
        // Torten nach Gewicht ohne hinterlegten kg-Preis: dann keine Schätzung.
        unpricedItems: db.$count(
          orderItems,
          and(
            eq(orderItems.orderId, orders.id),
            isNotNull(orderItems.weightGrams),
            eq(orderItems.unitPriceCents, 0),
          ),
        ),
      })
      .from(orders)
      .where(
        and(
          data.status ? eq(orders.status, data.status) : undefined,
          data.kind ? eq(orders.kind, data.kind) : undefined,
        ),
      )
      .orderBy(desc(orders.createdAt), desc(orders.id))
      .limit(200);

    return rows.map(({ unpricedItems, ...row }) => ({
      ...row,
      estimateComplete: row.kind !== "event" && unpricedItems === 0,
    }));
  });

/** Eine Bestellung mit Positionen, Fotos, Inspiration und E-Mail-Verlauf. */
export const $adminGetOrder = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: number) => idSchema.parse(id))
  .handler(async ({ data: id }) => {
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return null;

    const [items, files, inspiration, emails] = await Promise.all([
      db
        .select({
          ...getTableColumns(orderItems),
          // Snapshots stehen in der Sprache der Kundin; für die Backstube die deutschen Namen.
          productNameDe: products.nameDe,
          sizeLabelDe: productSizes.labelDe,
          fillingNameDe: fillings.nameDe,
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .leftJoin(productSizes, eq(orderItems.sizeId, productSizes.id))
        .leftJoin(fillings, eq(orderItems.fillingId, fillings.id))
        .where(eq(orderItems.orderId, id))
        .orderBy(asc(orderItems.id)),
      db
        .select({
          id: orderFiles.id,
          originalName: orderFiles.originalName,
          width: orderFiles.width,
          height: orderFiles.height,
        })
        .from(orderFiles)
        .where(eq(orderFiles.orderId, id))
        .orderBy(asc(orderFiles.id)),
      order.inspirationProductId
        ? db
            .select({ id: products.id, slug: products.slug, nameDe: products.nameDe })
            .from(products)
            .where(eq(products.id, order.inspirationProductId))
            .limit(1)
        : Promise.resolve([]),
      db
        .select({
          id: emailOutbox.id,
          kind: emailOutbox.kind,
          recipient: emailOutbox.recipient,
          status: emailOutbox.status,
          attempts: emailOutbox.attempts,
          lastError: emailOutbox.lastError,
          nextAttemptAt: emailOutbox.nextAttemptAt,
          sentAt: emailOutbox.sentAt,
          createdAt: emailOutbox.createdAt,
        })
        .from(emailOutbox)
        .where(eq(emailOutbox.orderId, id))
        .orderBy(desc(emailOutbox.id)),
    ]);

    return {
      ...order,
      items,
      files: files.map((file) => ({ ...file, url: `/api/admin/order-files/${file.id}` })),
      inspiration: inspiration[0] ?? null,
      emails,
      mailConfigured: isMailConfigured(),
      estimateComplete:
        order.kind !== "event" &&
        items.every((item) => item.weightGrams === null || item.unitPriceCents > 0),
    };
  });

const setStatusSchema = z.object({ id: idSchema, status: orderStatusSchema });

/** Manueller Statuswechsel laut MANUAL_TRANSITIONS (order-status.ts). */
export const $adminSetOrderStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: z.input<typeof setStatusSchema>) => setStatusSchema.parse(d))
  .handler(async ({ data }): Promise<OrderActionResult> => {
    const [order] = await db
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.id, data.id))
      .limit(1);
    if (!order) return { ok: false, code: "NOT_FOUND" };
    if (!isManualTransition(order.status, data.status)) {
      return { ok: false, code: "INVALID_STATUS" };
    }
    // Nur wechseln, wenn der Status seit dem Lesen gleich geblieben ist.
    const updated = await db
      .update(orders)
      .set({ status: data.status, updatedAt: new Date() })
      .where(and(eq(orders.id, data.id), eq(orders.status, order.status)))
      .returning({ id: orders.id });
    return updated.length > 0 ? { ok: true } : { ok: false, code: "INVALID_STATUS" };
  });

const icsCopy = {
  de: {
    summary: (orderNo: string) => `Caramelka: Bestellung ${orderNo}`,
    pickup: "Abholung in der Backstube",
    delivery: "Lieferung",
    event: "Hochzeit oder Feier",
    finalPrice: (price: string) => `Endpreis: ${price}`,
    questions: `Fragen: ${site.contact.phone}`,
  },
  ru: {
    summary: (orderNo: string) => `Caramelka: заказ ${orderNo}`,
    pickup: "Самовывоз из пекарни",
    delivery: "Доставка",
    event: "Свадьба или праздник",
    finalPrice: (price: string) => `Итоговая цена: ${price}`,
    questions: `Вопросы: ${site.contact.phone}`,
  },
};

/** Kalendereintrag zur Bestätigung; SEQUENCE steigt mit jeder Bestätigungs-Mail. */
function confirmationIcs(order: OrderMailData, sequence: number): string {
  const c = icsCopy[order.locale];
  const { address } = site.contact;
  const handover =
    order.fulfilment === "pickup"
      ? c.pickup
      : order.fulfilment === "delivery"
        ? c.delivery
        : c.event;
  const description = [handover];
  if (order.kind !== "event" && order.finalTotalCents !== null) {
    description.push(c.finalPrice(formatPrice(order.finalTotalCents, order.locale)));
  }
  description.push(c.questions);

  let location = "";
  if (order.fulfilment === "pickup") {
    location = `${site.name}, ${address.street}, ${address.zip} ${address.city}`;
  } else if (order.fulfilment === "delivery") {
    const place = [order.zip, order.city].filter(Boolean).join(" ");
    location = [order.street, place].filter(Boolean).join(", ");
  }

  return buildIcs({
    uid: `${order.orderNo}@${site.domain}`,
    sequence,
    date: order.desiredDate,
    time: order.kind === "event" ? null : order.desiredTime,
    durationMinutes: 30,
    summary: c.summary(order.orderNo),
    description: description.join("\n"),
    location,
  });
}

const confirmOrderSchema = z.object({
  id: idSchema,
  finalTotalCents: z.number().int().min(0).max(10_000_000),
  message: z.string().trim().max(2000).optional(),
  desiredDate: z.iso.date().optional(),
  desiredTime: timeSchema.nullable().optional(),
  sendEmail: z.boolean().default(true),
});

/**
 * Verbindlich bestätigen, aus "new" oder erneut aus "confirmed" (korrigierte
 * Bestätigung). Optional mit geändertem Termin; für das Team gilt keine
 * Vorlaufzeit, nur Ruhetage und Zeitfenster.
 */
export const $adminConfirmOrder = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((d: z.input<typeof confirmOrderSchema>) => confirmOrderSchema.parse(d))
  .handler(async ({ data }): Promise<ConfirmOrderResult> => {
    const result = await db.transaction(async (tx): Promise<ConfirmOrderResult> => {
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, data.id))
        .limit(1)
        .for("update");
      if (!order) return { ok: false, code: "NOT_FOUND" };
      if (!canConfirmOrDecline(order.status)) return { ok: false, code: "INVALID_STATUS" };

      const isEvent = order.kind === "event";
      const desiredDate = data.desiredDate ?? order.desiredDate;
      // Events haben keine Uhrzeit; sonst bleibt die bisherige, wenn keine neue kommt.
      const desiredTime = isEvent
        ? null
        : data.desiredTime === undefined
          ? order.desiredTime
          : data.desiredTime;
      if (desiredDate !== order.desiredDate && isClosedDay(desiredDate, order.kind)) {
        return { ok: false, code: "INVALID_SCHEDULE" };
      }
      if (
        !isEvent &&
        desiredTime !== order.desiredTime &&
        (desiredTime === null || !daySlots().includes(desiredTime))
      ) {
        return { ok: false, code: "INVALID_SCHEDULE" };
      }

      const wasConfirmed = order.status === "confirmed";
      await tx
        .update(orders)
        .set({
          status: "confirmed",
          finalTotalCents: data.finalTotalCents,
          customerMessage: data.message || null,
          confirmedAt: order.confirmedAt ?? new Date(),
          desiredDate,
          desiredTime,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));

      let offerUntil: Date | null = null;
      if (data.sendEmail) {
        // Nach dem Update laden, damit Mail und Kalender den neuen Stand zeigen.
        const mailData = await loadOrderMailData(tx, order.id);
        if (!mailData) throw new Error("Bestellung für die E-Mail nicht gefunden");
        // Endpreis über der Schätzung (oder keine Schätzung): Mail ist ein Angebot mit Frist.
        if (isPriceOffer(mailData, data.finalTotalCents)) {
          offerUntil = offerResponseDeadline(mailData, new Date());
        }
        const sequence = await tx.$count(
          emailOutbox,
          and(eq(emailOutbox.orderId, order.id), eq(emailOutbox.kind, "order_confirmed")),
        );
        await enqueueEmail(tx, {
          orderId: order.id,
          kind: "order_confirmed",
          recipient: mailData.email,
          replyTo: staffRecipients()[0] ?? null,
          ...orderConfirmedMail(mailData, { updated: wasConfirmed, offerUntil }),
          ics: confirmationIcs(mailData, sequence),
        });
      }
      return { ok: true, offerUntil: offerUntil?.toISOString() ?? null };
    });

    if (result.ok && data.sendEmail) dispatchOutboxInBackground();
    return result;
  });

const declineOrderSchema = z.object({
  id: idSchema,
  message: z.string().trim().max(2000).optional(),
  sendEmail: z.boolean().default(true),
});

/** Anfrage absagen bzw. bestätigte Bestellung stornieren. */
export const $adminDeclineOrder = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((d: z.input<typeof declineOrderSchema>) => declineOrderSchema.parse(d))
  .handler(async ({ data }): Promise<OrderActionResult> => {
    const result = await db.transaction(async (tx): Promise<OrderActionResult> => {
      const [order] = await tx
        .select({ id: orders.id, status: orders.status })
        .from(orders)
        .where(eq(orders.id, data.id))
        .limit(1)
        .for("update");
      if (!order) return { ok: false, code: "NOT_FOUND" };
      if (!canConfirmOrDecline(order.status)) return { ok: false, code: "INVALID_STATUS" };

      const wasConfirmed = order.status === "confirmed";
      await tx
        .update(orders)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          customerMessage: data.message || null,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));

      if (data.sendEmail) {
        const mailData = await loadOrderMailData(tx, order.id);
        if (!mailData) throw new Error("Bestellung für die E-Mail nicht gefunden");
        await enqueueEmail(tx, {
          orderId: order.id,
          kind: "order_declined",
          recipient: mailData.email,
          replyTo: staffRecipients()[0] ?? null,
          ...orderDeclinedMail(mailData, { wasConfirmed }),
        });
      }
      return { ok: true };
    });

    if (result.ok && data.sendEmail) dispatchOutboxInBackground();
    return result;
  });

const staffNoteSchema = z.object({ id: idSchema, staffNote: z.string().trim().max(2000) });

/** Interne Notiz; erscheint in keiner E-Mail. */
export const $adminUpdateStaffNote = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: z.input<typeof staffNoteSchema>) => staffNoteSchema.parse(d))
  .handler(async ({ data }): Promise<OrderActionResult> => {
    const updated = await db
      .update(orders)
      .set({ staffNote: data.staffNote || null, updatedAt: new Date() })
      .where(eq(orders.id, data.id))
      .returning({ id: orders.id });
    return updated.length > 0 ? { ok: true } : { ok: false, code: "NOT_FOUND" };
  });

// ── E-Mail ──────────────────────────────────────────────────────────────

/** Ob SMTP eingerichtet ist, Absender und Empfänger neuer Anfragen. */
export const $adminGetMailStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(() => ({
    configured: isMailConfigured(),
    from: mailFrom(),
    staffRecipients: staffRecipients(),
  }));

const resendEmailSchema = z.object({ id: idSchema });

/**
 * Fehlgeschlagene oder wartende Mail sofort neu versuchen; eine schon
 * gesendete Mail wird als Kopie erneut verschickt. Wartet auf den Versuch
 * und liefert den neuen Stand der (ggf. kopierten) Zeile.
 */
export const $adminResendEmail = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((d: z.input<typeof resendEmailSchema>) => resendEmailSchema.parse(d))
  .handler(async ({ data }): Promise<EmailSendResult> => {
    // Ohne SMTP bliebe die Zeile "pending" liegen und ginge Wochen später raus.
    if (!isMailConfigured()) return { ok: false, code: "MAIL_NOT_CONFIGURED" };

    const [row] = await db.select().from(emailOutbox).where(eq(emailOutbox.id, data.id)).limit(1);
    if (!row) return { ok: false, code: "NOT_FOUND" };

    let targetId = row.id;
    if (row.status === "failed" || row.status === "pending") {
      await db
        .update(emailOutbox)
        .set({
          status: "pending",
          attempts: 0,
          nextAttemptAt: sql`now()`,
          lastError: null,
          updatedAt: sql`now()`,
        })
        // Eine Zeile, die der Worker gerade verschickt ("sending"), nicht anfassen.
        .where(and(eq(emailOutbox.id, row.id), inArray(emailOutbox.status, ["failed", "pending"])));
    } else if (row.status === "sent") {
      const [copy] = await db
        .insert(emailOutbox)
        .values({
          orderId: row.orderId,
          kind: row.kind,
          recipient: row.recipient,
          replyTo: row.replyTo,
          subject: row.subject,
          bodyHtml: row.bodyHtml,
          bodyText: row.bodyText,
          ics: row.ics,
        })
        .returning({ id: emailOutbox.id });
      if (!copy) throw new Error("E-Mail konnte nicht erneut angelegt werden");
      targetId = copy.id;
    }

    await dispatchNow();
    return emailState(targetId);
  });

const testEmailSchema = z.object({ to: z.email().max(200) });

/** Test-Mail über die Outbox, um SMTP nach einem Deploy zu prüfen. */
export const $adminSendTestEmail = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .validator((d: z.input<typeof testEmailSchema>) => testEmailSchema.parse(d))
  .handler(async ({ data }): Promise<EmailSendResult> => {
    if (!isMailConfigured()) return { ok: false, code: "MAIL_NOT_CONFIGURED" };

    const id = await db.transaction(async (tx) => {
      await enqueueEmail(tx, {
        orderId: null,
        kind: "test",
        recipient: data.to,
        replyTo: null,
        ...testMail(),
      });
      const [created] = await tx
        .select({ id: emailOutbox.id })
        .from(emailOutbox)
        .where(and(eq(emailOutbox.kind, "test"), eq(emailOutbox.recipient, data.to)))
        .orderBy(desc(emailOutbox.id))
        .limit(1);
      return created?.id;
    });
    if (id === undefined) throw new Error("Test-Mail konnte nicht angelegt werden");

    await dispatchNow();
    return emailState(id);
  });

// ── Produkte ────────────────────────────────────────────────────────────

export const $adminListProducts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const [prods, cats, sizes] = await Promise.all([
      db.select().from(products).orderBy(asc(products.sort), asc(products.id)),
      db.select().from(categories).orderBy(asc(categories.sort), asc(categories.id)),
      db.select().from(productSizes).orderBy(asc(productSizes.sort), asc(productSizes.id)),
    ]);
    return { products: prods, categories: cats, sizes };
  });

const upsertProductSchema = z.object({
  id: idSchema.optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  categoryId: idSchema,
  nameDe: z.string().trim().min(2).max(120),
  nameRu: z.string().trim().min(2).max(120),
  descriptionDe: z.string().trim().max(2000).default(""),
  descriptionRu: z.string().trim().max(2000).default(""),
  imageKey: z.string().trim().max(60).default("torte"),
  leadTimeHours: z
    .number()
    .int()
    .min(0)
    .max(24 * 30),
  fillingSelectable: z.boolean(),
  orderKind: orderKindSchema,
  featured: z.boolean(),
  active: z.boolean(),
  sort: z.number().int().min(0).max(9999).default(0),
  sizes: z
    .array(
      z.object({
        /** Vorhandene Größe (bleibt stabil, Bestellungen verweisen darauf); ohne = neu. */
        id: idSchema.optional(),
        labelDe: z.string().trim().min(1).max(120),
        labelRu: z.string().trim().min(1).max(120),
        priceCents: z.number().int().min(0).max(1_000_000),
      }),
    )
    .min(1)
    .max(12),
});

/**
 * Produkt anlegen/ändern. Größen behalten ihre IDs: entfernte zuerst löschen,
 * dann vorhandene ändern, dann neue anlegen (so kollidiert ein freigewordenes
 * Label nicht mit dem Unique-Index je Produkt).
 */
export const $adminUpsertProduct = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: z.input<typeof upsertProductSchema>) => upsertProductSchema.parse(d))
  .handler(async ({ data }): Promise<UpsertProductResult> => {
    const { id, sizes, ...fields } = data;
    const labels = sizes.map((size) => size.labelDe);
    if (new Set(labels).size !== labels.length) return { ok: false, code: "DUPLICATE_SIZE_LABEL" };

    try {
      return await db.transaction(async (tx): Promise<UpsertProductResult> => {
        let productId: number;
        if (id) {
          const [updated] = await tx
            .update(products)
            .set({ ...fields, updatedAt: new Date() })
            .where(eq(products.id, id))
            .returning({ id: products.id });
          if (!updated) return { ok: false, code: "NOT_FOUND" };
          productId = updated.id;
        } else {
          const [created] = await tx.insert(products).values(fields).returning({ id: products.id });
          if (!created) throw new Error("Produkt konnte nicht angelegt werden");
          productId = created.id;
        }

        // Nur IDs, die wirklich zu diesem Produkt gehören, gelten als vorhanden.
        const existing = id
          ? await tx
              .select({ id: productSizes.id })
              .from(productSizes)
              .where(eq(productSizes.productId, productId))
          : [];
        const existingIds = new Set(existing.map((row) => row.id));
        const kept = sizes.flatMap((size, sort) =>
          size.id !== undefined && existingIds.has(size.id) ? [{ ...size, id: size.id, sort }] : [],
        );
        const added = sizes.flatMap((size, sort) =>
          size.id === undefined || !existingIds.has(size.id)
            ? [
                {
                  productId,
                  labelDe: size.labelDe,
                  labelRu: size.labelRu,
                  priceCents: size.priceCents,
                  sort,
                },
              ]
            : [],
        );
        const keptIds = kept.map((size) => size.id);

        if (existingIds.size > 0) {
          await tx
            .delete(productSizes)
            .where(
              and(
                eq(productSizes.productId, productId),
                keptIds.length > 0 ? notInArray(productSizes.id, keptIds) : undefined,
              ),
            );
        }
        for (const size of kept) {
          await tx
            .update(productSizes)
            .set({
              labelDe: size.labelDe,
              labelRu: size.labelRu,
              priceCents: size.priceCents,
              sort: size.sort,
            })
            .where(and(eq(productSizes.id, size.id), eq(productSizes.productId, productId)));
        }
        if (added.length > 0) await tx.insert(productSizes).values(added);

        return { ok: true, id: productId };
      });
    } catch (error) {
      const constraint = violatedUniqueConstraint(error);
      if (constraint === "product_sizes_product_label_uniq") {
        return { ok: false, code: "DUPLICATE_SIZE_LABEL" };
      }
      if (constraint === "products_slug_unique") return { ok: false, code: "DUPLICATE_SLUG" };
      throw error;
    }
  });

export const $adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: number) => idSchema.parse(id))
  .handler(async ({ data: id }) => {
    // Soft-delete: Bestell-Historie referenziert Produkte weiterhin.
    await db
      .update(products)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(products.id, id));
    return { ok: true };
  });

// ── Füllungen ───────────────────────────────────────────────────────────

export const $adminListFillings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    return db.select().from(fillings).orderBy(asc(fillings.sort), asc(fillings.id));
  });

const upsertFillingSchema = z.object({
  id: idSchema.optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  nameDe: z.string().trim().min(2).max(120),
  nameRu: z.string().trim().min(2).max(120),
  descriptionDe: z.string().trim().max(1000).default(""),
  descriptionRu: z.string().trim().max(1000).default(""),
  allergensDe: z.string().trim().max(300).default(""),
  allergensRu: z.string().trim().max(300).default(""),
  /** Preis je kg für Torten nach Gewicht; null = Preis kommt erst mit der Bestätigung. */
  pricePerKgCents: z.number().int().min(0).max(100_000).nullable(),
  active: z.boolean(),
  sort: z.number().int().min(0).max(9999).default(0),
});

export const $adminUpsertFilling = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: z.input<typeof upsertFillingSchema>) => upsertFillingSchema.parse(d))
  .handler(async ({ data }) => {
    const { id, ...fields } = data;
    if (id) {
      await db.update(fillings).set(fields).where(eq(fillings.id, id));
      return { id };
    }
    const [created] = await db.insert(fillings).values(fields).returning();
    if (!created) throw new Error("Füllung konnte nicht angelegt werden");
    return { id: created.id };
  });
