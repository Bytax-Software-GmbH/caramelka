/** Kernlogik des Anfrage-Formulars: prüfen, schätzen, speichern, Mails anlegen. */
import { randomInt } from "node:crypto";

import { asc, eq } from "drizzle-orm";

import { db } from "#/lib/db";
import { fillings, orderFiles, orderItems, orders, products, productSizes } from "#/lib/db/schema";
import { formatWeight } from "#/lib/format";
import { computeEstimate, type Estimate, type EstimateInput } from "#/lib/order-request/estimate";
import { checkSchedule, requiredLeadTimeHours } from "#/lib/order-request/schedule";
import {
  orderRequestSchema,
  type OrderRequest,
  type OrderRequestResult,
} from "#/lib/order-request/schema";
import { site } from "#/lib/site";

import { dispatchOutboxInBackground, enqueueEmail, ensureOutboxWorker } from "./mail/outbox.server";
import { requestReceivedMail, staffNewRequestMail } from "./mail/templates.server";
import { staffRecipients } from "./mail/transport.server";
import { loadOrderMailData } from "./order-mail.server";
import { checkSpam } from "./spam-guard.server";
import {
  processImage,
  removeStoredFiles,
  storeImage,
  UploadError,
  type ProcessedImage,
} from "./uploads.server";

const ORDER_NO_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** Kurz und am Telefon gut durchzugeben; ohne 0/O/1/I. */
function makeOrderNo(): string {
  let code = "";
  for (let i = 0; i < 5; i++) code += ORDER_NO_ALPHABET[randomInt(ORDER_NO_ALPHABET.length)];
  return `CK-${code}`;
}

/** Formular-Optionen: aktive Füllungen und Produkte mit Größen. */
export async function loadOrderRequestOptions() {
  const [fillingRows, productRows, sizeRows] = await Promise.all([
    db
      .select({
        id: fillings.id,
        slug: fillings.slug,
        nameDe: fillings.nameDe,
        nameRu: fillings.nameRu,
        descriptionDe: fillings.descriptionDe,
        descriptionRu: fillings.descriptionRu,
        allergensDe: fillings.allergensDe,
        allergensRu: fillings.allergensRu,
        imageKey: fillings.imageKey,
        pricePerKgCents: fillings.pricePerKgCents,
      })
      .from(fillings)
      .where(eq(fillings.active, true))
      .orderBy(asc(fillings.sort), asc(fillings.id)),
    db
      .select({
        id: products.id,
        slug: products.slug,
        nameDe: products.nameDe,
        nameRu: products.nameRu,
        imageKey: products.imageKey,
        orderKind: products.orderKind,
        leadTimeHours: products.leadTimeHours,
        fillingSelectable: products.fillingSelectable,
      })
      .from(products)
      .where(eq(products.active, true))
      .orderBy(asc(products.sort), asc(products.id)),
    db
      .select({
        id: productSizes.id,
        productId: productSizes.productId,
        labelDe: productSizes.labelDe,
        labelRu: productSizes.labelRu,
        priceCents: productSizes.priceCents,
      })
      .from(productSizes)
      .orderBy(asc(productSizes.sort), asc(productSizes.priceCents)),
  ]);

  return {
    fillings: fillingRows,
    products: productRows.map((product) => ({
      ...product,
      sizes: sizeRows.filter((size) => size.productId === product.id),
    })),
  };
}

async function loadEstimateCatalog() {
  const [fillingRows, productRows, sizeRows] = await Promise.all([
    db.select().from(fillings),
    db.select().from(products),
    db.select().from(productSizes),
  ]);
  return {
    fillings: fillingRows,
    products: productRows.map((product) => ({
      ...product,
      sizes: sizeRows.filter((size) => size.productId === product.id),
    })),
  };
}

type FullCatalog = Awaited<ReturnType<typeof loadEstimateCatalog>>;

function toEstimateInput(request: OrderRequest): EstimateInput {
  if (request.kind === "event") return { kind: "event" };
  if (request.kind === "cake") {
    return { kind: "cake", fulfilment: request.fulfilment, items: request.items };
  }
  return { kind: "dessert", fulfilment: request.fulfilment, items: request.items };
}

/** Produkt-Vorlaufzeiten, die für diese Anfrage gelten. */
function productLeadTimes(request: OrderRequest, catalog: FullCatalog): number[] {
  const byId = new Map(catalog.products.map((product) => [product.id, product]));
  const ids = request.kind === "dessert" ? request.items.map((item) => item.productId) : [];
  const inspiration = request.inspirationProductId
    ? byId.get(request.inspirationProductId)
    : undefined;
  // Die Inspiration zählt nur, wenn sie zur gewählten Art passt.
  if (inspiration && inspiration.orderKind === request.kind) ids.push(inspiration.id);
  return ids.flatMap((id) => {
    const product = byId.get(id);
    return product ? [product.leadTimeHours] : [];
  });
}

function itemRows(request: OrderRequest, catalog: FullCatalog, estimate: Estimate) {
  const useRu = request.locale === "ru";
  const fillingById = new Map(catalog.fillings.map((f) => [f.id, f]));
  const productById = new Map(catalog.products.map((p) => [p.id, p]));

  if (request.kind === "cake") {
    return request.items.map((item, index) => {
      const filling = fillingById.get(item.fillingId);
      const line = estimate.lines[index];
      return {
        productId: null,
        sizeId: null,
        fillingId: item.fillingId,
        productName: useRu ? "Торт" : "Torte",
        sizeLabel: formatWeight(item.weightGrams, request.locale),
        fillingName: filling ? (useRu ? filling.nameRu : filling.nameDe) : null,
        weightGrams: item.weightGrams,
        inscription: item.inscription || null,
        unitPriceCents: line?.unitPriceCents ?? 0,
        quantity: 1,
        totalCents: line?.totalCents ?? 0,
      };
    });
  }
  if (request.kind === "dessert") {
    return request.items.map((item, index) => {
      const product = productById.get(item.productId);
      const size = product?.sizes.find((s) => s.id === item.sizeId);
      const filling =
        product?.fillingSelectable && item.fillingId !== null
          ? fillingById.get(item.fillingId)
          : undefined;
      const line = estimate.lines[index];
      return {
        productId: item.productId,
        sizeId: item.sizeId,
        fillingId: filling?.id ?? null,
        productName: product ? (useRu ? product.nameRu : product.nameDe) : "",
        sizeLabel: size ? (useRu ? size.labelRu : size.labelDe) : "",
        fillingName: filling ? (useRu ? filling.nameRu : filling.nameDe) : null,
        weightGrams: null,
        inscription: null,
        unitPriceCents: line?.unitPriceCents ?? 0,
        quantity: item.quantity,
        totalCents: line?.totalCents ?? 0,
      };
    });
  }
  return [];
}

function isNonEmptyFile(value: FormDataEntryValue): value is File {
  return value instanceof File && value.size > 0;
}

function parsePayload(raw: FormDataEntryValue | null): unknown {
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isUniqueViolation(error: unknown, constraint: string): boolean {
  const cause = error instanceof Error ? error.cause : undefined;
  return (
    typeof cause === "object" &&
    cause !== null &&
    "code" in cause &&
    cause.code === "23505" &&
    "constraint_name" in cause &&
    cause.constraint_name === constraint
  );
}

async function findOrderNoBySubmission(submissionId: string): Promise<string | undefined> {
  const [existing] = await db
    .select({ orderNo: orders.orderNo })
    .from(orders)
    .where(eq(orders.submissionId, submissionId))
    .limit(1);
  return existing?.orderNo;
}

export async function submitOrderRequest(
  formData: FormData,
  ip: string,
): Promise<OrderRequestResult> {
  ensureOutboxWorker();

  const parsed = orderRequestSchema.safeParse(parsePayload(formData.get("payload")));
  if (!parsed.success) {
    return { ok: false, code: "VALIDATION", field: parsed.error.issues[0]?.path.join(".") };
  }
  const request = parsed.data;
  const photos = formData.getAll("photos").filter(isNonEmptyFile);
  if (photos.length > site.shop.upload.maxFiles) return { ok: false, code: "TOO_MANY_FILES" };

  const verdict = checkSpam({ website: request.website, startedAt: request.startedAt, ip });
  // Bots bekommen einen Schein-Erfolg; gespeichert und verschickt wird nichts.
  if (verdict === "bot") return { ok: true, orderNo: makeOrderNo() };
  if (verdict === "rate_limited") return { ok: false, code: "RATE_LIMITED" };

  const repeated = await findOrderNoBySubmission(request.submissionId);
  if (repeated) return { ok: true, orderNo: repeated };

  const catalog = await loadEstimateCatalog();
  const estimated = computeEstimate(toEstimateInput(request), catalog);
  if (!estimated.ok) return { ok: false, code: estimated.code, index: estimated.index };
  const { estimate } = estimated;

  const leadHours = requiredLeadTimeHours(request.kind, productLeadTimes(request, catalog));
  const schedule = checkSchedule(
    {
      kind: request.kind,
      date: request.desiredDate,
      time: request.kind === "event" ? null : request.desiredTime,
    },
    leadHours,
    new Date(),
  );
  if (schedule === "date") return { ok: false, code: "SLOT_DATE", field: "desiredDate" };
  if (schedule === "time") return { ok: false, code: "SLOT_TIME", field: "desiredTime" };

  // Bilder vor der Transaktion verarbeiten: früh scheitern, DB nicht blockieren.
  const images: ProcessedImage[] = [];
  try {
    for (const [index, photo] of photos.entries()) images.push(await processImage(photo, index));
  } catch (error) {
    if (error instanceof UploadError) {
      return { ok: false, code: "INVALID_IMAGE", index: error.index };
    }
    throw error;
  }

  const inspiration = request.inspirationProductId
    ? catalog.products.find((product) => product.id === request.inspirationProductId)
    : undefined;

  const storedKeys: string[] = [];
  try {
    for (const image of images) storedKeys.push(await storeImage(image));

    const orderNo = await db.transaction(async (tx) => {
      const isEvent = request.kind === "event";
      const values = {
        submissionId: request.submissionId,
        kind: request.kind,
        fulfilment: isEvent ? null : request.fulfilment,
        desiredDate: request.desiredDate,
        desiredTime: isEvent ? null : request.desiredTime,
        customerName: request.customerName,
        email: request.email,
        phone: request.phone,
        street: !isEvent && request.fulfilment === "delivery" ? (request.street ?? null) : null,
        zip: !isEvent && request.fulfilment === "delivery" ? (request.zip ?? null) : null,
        city: !isEvent && request.fulfilment === "delivery" ? (request.city ?? null) : null,
        note: request.note || null,
        decorNote: request.decorNote || null,
        decorStyles: request.decorStyles,
        eventType: isEvent ? request.eventType : null,
        guestCount: isEvent ? request.guestCount : null,
        inspirationProductId: inspiration?.id ?? null,
        locale: request.locale,
        subtotalCents: estimate.subtotalCents,
        deliveryFeeCents: estimate.deliveryFeeCents,
        totalCents: estimate.totalCents,
        privacyAcceptedAt: new Date(),
      };

      let created: { id: number; orderNo: string } | undefined;
      for (let attempt = 0; attempt < 5 && !created; attempt++) {
        [created] = await tx
          .insert(orders)
          .values({ ...values, orderNo: makeOrderNo() })
          .onConflictDoNothing({ target: orders.orderNo })
          .returning({ id: orders.id, orderNo: orders.orderNo });
      }
      if (!created) throw new Error("Keine freie Bestellnummer gefunden");
      const orderId = created.id;

      const items = itemRows(request, catalog, estimate);
      if (items.length > 0) {
        await tx.insert(orderItems).values(items.map((item) => ({ ...item, orderId })));
      }
      if (images.length > 0) {
        await tx.insert(orderFiles).values(
          images.map((image, index) => ({
            orderId,
            storageKey: storedKeys[index] ?? "",
            originalName: image.originalName,
            mime: "image/webp",
            bytes: image.buffer.length,
            width: image.width,
            height: image.height,
          })),
        );
      }

      const mailData = await loadOrderMailData(tx, orderId);
      if (mailData) {
        const staffReplyTo = staffRecipients()[0] ?? null;
        const toCustomer = requestReceivedMail(mailData);
        await enqueueEmail(tx, {
          orderId,
          kind: "request_received",
          recipient: mailData.email,
          replyTo: staffReplyTo,
          ...toCustomer,
        });
        const toStaff = staffNewRequestMail(mailData);
        for (const recipient of staffRecipients()) {
          await enqueueEmail(tx, {
            orderId,
            kind: "staff_new_request",
            recipient,
            replyTo: mailData.email,
            ...toStaff,
          });
        }
      }
      return created.orderNo;
    });

    dispatchOutboxInBackground();
    return { ok: true, orderNo };
  } catch (error) {
    await removeStoredFiles(storedKeys);
    if (isUniqueViolation(error, "orders_submission_id_unique")) {
      const existing = await findOrderNoBySubmission(request.submissionId);
      if (existing) return { ok: true, orderNo: existing };
    }
    throw error;
  }
}
