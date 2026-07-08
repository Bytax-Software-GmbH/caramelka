/** Checkout: Bestellung anlegen + öffentliche Bestätigungsabfrage. */
import { createServerFn } from "@tanstack/react-start";
import { eq, inArray } from "drizzle-orm";
import * as z from "zod";

import { db } from "#/lib/db";
import { fillings, orderItems, orders, products, productSizes } from "#/lib/db/schema";
import { earliestDate, toIsoDate } from "#/lib/format";
import { site } from "#/lib/site";

const placeOrderSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.number().int().positive(),
          sizeId: z.number().int().positive(),
          fillingId: z.number().int().positive().nullable(),
          inscription: z.string().trim().max(120).nullable(),
          quantity: z.number().int().min(1).max(20),
        }),
      )
      .min(1)
      .max(30),
    fulfilment: z.enum(["pickup", "delivery"]),
    desiredDate: z.iso.date(),
    customerName: z.string().trim().min(2).max(120),
    email: z.email().max(200),
    phone: z.string().trim().min(5).max(40),
    street: z.string().trim().max(200).optional(),
    zip: z.string().trim().max(10).optional(),
    city: z.string().trim().max(100).optional(),
    note: z.string().trim().max(1000).optional(),
    locale: z.enum(["de", "ru"]).default("de"),
  })
  .refine((d) => d.fulfilment === "pickup" || (d.street && d.zip && d.city), {
    message: "Lieferadresse fehlt",
    path: ["street"],
  });

function makeOrderNo(): string {
  // Kurz & am Telefon kommunizierbar; ohne 0/O/1/I.
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `CK-${code}`;
}

export const $placeOrder = createServerFn({ method: "POST" })
  .validator((d: z.infer<typeof placeOrderSchema>) => placeOrderSchema.parse(d))
  .handler(async ({ data }) => {
    // Preise & Namen ausschließlich aus der DB (Client-Preise sind nur Anzeige).
    const productIds = [...new Set(data.items.map((i) => i.productId))];
    const sizeIds = [...new Set(data.items.map((i) => i.sizeId))];
    const fillingIds = [...new Set(data.items.flatMap((i) => (i.fillingId ? [i.fillingId] : [])))];

    const [dbProducts, dbSizes, dbFillings] = await Promise.all([
      db.select().from(products).where(inArray(products.id, productIds)),
      db.select().from(productSizes).where(inArray(productSizes.id, sizeIds)),
      fillingIds.length
        ? db.select().from(fillings).where(inArray(fillings.id, fillingIds))
        : Promise.resolve([]),
    ]);

    const productById = new Map(dbProducts.map((p) => [p.id, p]));
    const sizeById = new Map(dbSizes.map((s) => [s.id, s]));
    const fillingById = new Map(dbFillings.map((f) => [f.id, f]));

    let subtotalCents = 0;
    let maxLeadTimeHours: number = site.shop.defaultLeadTimeHours;

    const itemRows = data.items.map((item) => {
      const product = productById.get(item.productId);
      const size = sizeById.get(item.sizeId);
      if (!product || !product.active || !size || size.productId !== product.id) {
        throw new Error("Produkt nicht verfügbar");
      }
      const filling = item.fillingId ? fillingById.get(item.fillingId) : undefined;
      if (item.fillingId && !filling) throw new Error("Füllung nicht verfügbar");

      maxLeadTimeHours = Math.max(maxLeadTimeHours, product.leadTimeHours);
      const totalCents = size.priceCents * item.quantity;
      subtotalCents += totalCents;

      const useRu = data.locale === "ru";
      return {
        productId: product.id,
        productName: useRu ? product.nameRu : product.nameDe,
        sizeLabel: useRu ? size.labelRu : size.labelDe,
        fillingName: filling ? (useRu ? filling.nameRu : filling.nameDe) : null,
        inscription: item.inscription,
        unitPriceCents: size.priceCents,
        quantity: item.quantity,
        totalCents,
      };
    });

    // Wunschtermin: Vorlauf einhalten + kein geschlossener Tag.
    const earliest = toIsoDate(earliestDate(maxLeadTimeHours, site.shop.closedWeekdays));
    const desired = new Date(`${data.desiredDate}T12:00:00`);
    if (data.desiredDate < earliest || site.shop.closedWeekdays.includes(desired.getDay())) {
      throw new Error("Ungültiger Wunschtermin");
    }

    const deliveryFeeCents = data.fulfilment === "delivery" ? site.shop.deliveryFeeCents : 0;
    const totalCents = subtotalCents + deliveryFeeCents;

    const order = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(orders)
        .values({
          orderNo: makeOrderNo(),
          fulfilment: data.fulfilment,
          desiredDate: data.desiredDate,
          customerName: data.customerName,
          email: data.email,
          phone: data.phone,
          street: data.fulfilment === "delivery" ? data.street : null,
          zip: data.fulfilment === "delivery" ? data.zip : null,
          city: data.fulfilment === "delivery" ? data.city : null,
          note: data.note || null,
          locale: data.locale,
          subtotalCents,
          deliveryFeeCents,
          totalCents,
        })
        .returning();
      if (!created) throw new Error("Bestellung konnte nicht angelegt werden");

      await tx.insert(orderItems).values(itemRows.map((r) => ({ ...r, orderId: created.id })));
      return created;
    });

    return { orderNo: order.orderNo };
  });

/** Öffentliche Bestätigung — nur unkritische Felder, Zugriff via zufällige orderNo. */
export const $getOrderConfirmation = createServerFn({ method: "GET" })
  .validator((orderNo: string) =>
    z
      .string()
      .regex(/^CK-[A-Z2-9]{5}$/)
      .parse(orderNo),
  )
  .handler(async ({ data: orderNo }) => {
    const [order] = await db.select().from(orders).where(eq(orders.orderNo, orderNo)).limit(1);
    if (!order) return null;
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    return {
      orderNo: order.orderNo,
      fulfilment: order.fulfilment,
      desiredDate: order.desiredDate,
      city: order.city,
      subtotalCents: order.subtotalCents,
      deliveryFeeCents: order.deliveryFeeCents,
      totalCents: order.totalCents,
      items: items.map((i) => ({
        productName: i.productName,
        sizeLabel: i.sizeLabel,
        fillingName: i.fillingName,
        inscription: i.inscription,
        quantity: i.quantity,
        totalCents: i.totalCents,
      })),
    };
  });
