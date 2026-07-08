/** Öffentliche Lese-Serverfunktionen für Katalog, Produkt & Füllungen. */
import { createServerFn } from "@tanstack/react-start";
import { and, asc, eq, min } from "drizzle-orm";

import { db } from "#/lib/db";
import { categories, fillings, products, productSizes } from "#/lib/db/schema";

export const $getCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const [cats, prods] = await Promise.all([
    db
      .select()
      .from(categories)
      .where(eq(categories.active, true))
      .orderBy(asc(categories.sort), asc(categories.id)),
    db
      .select({
        id: products.id,
        slug: products.slug,
        categoryId: products.categoryId,
        nameDe: products.nameDe,
        nameRu: products.nameRu,
        imageKey: products.imageKey,
        leadTimeHours: products.leadTimeHours,
        featured: products.featured,
        sort: products.sort,
        fromPriceCents: min(productSizes.priceCents).as("from_price_cents"),
      })
      .from(products)
      .leftJoin(productSizes, eq(productSizes.productId, products.id))
      .where(eq(products.active, true))
      .groupBy(products.id)
      .orderBy(asc(products.sort), asc(products.id)),
  ]);

  return { categories: cats, products: prods };
});

export const $getProduct = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.slug, slug), eq(products.active, true)))
      .limit(1);
    if (!product) return null;

    const [sizes, availableFillings] = await Promise.all([
      db
        .select()
        .from(productSizes)
        .where(eq(productSizes.productId, product.id))
        .orderBy(asc(productSizes.sort), asc(productSizes.priceCents)),
      product.fillingSelectable
        ? db
            .select()
            .from(fillings)
            .where(eq(fillings.active, true))
            .orderBy(asc(fillings.sort), asc(fillings.id))
        : Promise.resolve([]),
    ]);

    return { ...product, sizes, fillings: availableFillings };
  });

export const $getFillings = createServerFn({ method: "GET" }).handler(async () => {
  return db
    .select()
    .from(fillings)
    .where(eq(fillings.active, true))
    .orderBy(asc(fillings.sort), asc(fillings.id));
});
