/** Lädt eine Bestellung so, wie die E-Mail-Vorlagen sie brauchen. */
import { count, eq } from "drizzle-orm";

import type { db } from "#/lib/db";
import { orderFiles, orderItems, orders, products } from "#/lib/db/schema";

import type { OrderMailData } from "./mail/templates.server";

type Database = typeof db;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export async function loadOrderMailData(
  dbi: Database | Transaction,
  orderId: number,
): Promise<OrderMailData | null> {
  const [order] = await dbi.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return null;

  const [items, [files], inspiration] = await Promise.all([
    dbi.select().from(orderItems).where(eq(orderItems.orderId, orderId)).orderBy(orderItems.id),
    dbi.select({ total: count() }).from(orderFiles).where(eq(orderFiles.orderId, orderId)),
    order.inspirationProductId
      ? dbi
          .select({ nameDe: products.nameDe, nameRu: products.nameRu })
          .from(products)
          .where(eq(products.id, order.inspirationProductId))
          .limit(1)
      : Promise.resolve([]),
  ]);
  const inspirationProduct = inspiration[0];

  return {
    id: order.id,
    orderNo: order.orderNo,
    kind: order.kind,
    locale: order.locale,
    desiredDate: order.desiredDate,
    desiredTime: order.desiredTime,
    fulfilment: order.fulfilment,
    street: order.street,
    zip: order.zip,
    city: order.city,
    customerName: order.customerName,
    email: order.email,
    phone: order.phone,
    note: order.note,
    decorNote: order.decorNote,
    decorStyles: order.decorStyles,
    eventType: order.eventType,
    guestCount: order.guestCount,
    inspirationName: inspirationProduct
      ? order.locale === "ru"
        ? inspirationProduct.nameRu
        : inspirationProduct.nameDe
      : null,
    deliveryFeeCents: order.deliveryFeeCents,
    totalCents: order.totalCents,
    // Torten ohne hinterlegten kg-Preis haben 0 als Einzelpreis: dann keine Schätzung zeigen.
    estimateComplete:
      order.kind !== "event" &&
      items.every((item) => item.weightGrams === null || item.unitPriceCents > 0),
    finalTotalCents: order.finalTotalCents,
    customerMessage: order.customerMessage,
    fileCount: files?.total ?? 0,
    items: items.map((item) => ({
      productName: item.productName,
      sizeLabel: item.sizeLabel,
      fillingName: item.fillingName,
      weightGrams: item.weightGrams,
      inscription: item.inscription,
      quantity: item.quantity,
    })),
  };
}
