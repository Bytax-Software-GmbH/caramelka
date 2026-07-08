/** Admin-Serverfunktionen: Produkte, Füllungen, Bestellungen. Immer authMiddleware. */
import { createServerFn } from "@tanstack/react-start";
import { asc, desc, eq } from "drizzle-orm";
import * as z from "zod";

import { authMiddleware } from "#/lib/auth/middleware";
import { db } from "#/lib/db";
import {
  categories,
  fillings,
  orderItems,
  orders,
  type OrderStatus,
  products,
  productSizes,
} from "#/lib/db/schema";

// ── Bestellungen ────────────────────────────────────────────────────────

export const $adminListOrders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(200);
  });

export const $adminGetOrder = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: number) => z.number().int().positive().parse(id))
  .handler(async ({ data: id }) => {
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return null;
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    return { ...order, items };
  });

const orderStatusSchema = z.enum(["new", "confirmed", "ready", "completed", "cancelled"]);

export const $adminSetOrderStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { id: number; status: OrderStatus }) =>
    z.object({ id: z.number().int().positive(), status: orderStatusSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await db
      .update(orders)
      .set({ status: data.status, updatedAt: new Date() })
      .where(eq(orders.id, data.id));
    return { ok: true };
  });

// ── Produkte ────────────────────────────────────────────────────────────

export const $adminListProducts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const [prods, cats, sizes] = await Promise.all([
      db.select().from(products).orderBy(asc(products.sort), asc(products.id)),
      db.select().from(categories).orderBy(asc(categories.sort), asc(categories.id)),
      db.select().from(productSizes).orderBy(asc(productSizes.sort)),
    ]);
    return { products: prods, categories: cats, sizes };
  });

const upsertProductSchema = z.object({
  id: z.number().int().positive().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  categoryId: z.number().int().positive(),
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
  featured: z.boolean(),
  active: z.boolean(),
  sort: z.number().int().min(0).max(9999).default(0),
  sizes: z
    .array(
      z.object({
        labelDe: z.string().trim().min(1).max(120),
        labelRu: z.string().trim().min(1).max(120),
        priceCents: z.number().int().min(0).max(1_000_000),
      }),
    )
    .min(1)
    .max(12),
});

export const $adminUpsertProduct = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: z.infer<typeof upsertProductSchema>) => upsertProductSchema.parse(d))
  .handler(async ({ data }) => {
    const { id, sizes, ...fields } = data;
    return db.transaction(async (tx) => {
      let productId = id;
      if (productId) {
        await tx
          .update(products)
          .set({ ...fields, updatedAt: new Date() })
          .where(eq(products.id, productId));
        // Größen ersetzen (einfach & robust für Admin-Formular)
        await tx.delete(productSizes).where(eq(productSizes.productId, productId));
      } else {
        const [created] = await tx.insert(products).values(fields).returning();
        if (!created) throw new Error("Produkt konnte nicht angelegt werden");
        productId = created.id;
      }
      await tx.insert(productSizes).values(sizes.map((s, i) => ({ ...s, productId, sort: i })));
      return { id: productId };
    });
  });

export const $adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: number) => z.number().int().positive().parse(id))
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
  id: z.number().int().positive().optional(),
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
  active: z.boolean(),
  sort: z.number().int().min(0).max(9999).default(0),
});

export const $adminUpsertFilling = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: z.infer<typeof upsertFillingSchema>) => upsertFillingSchema.parse(d))
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
