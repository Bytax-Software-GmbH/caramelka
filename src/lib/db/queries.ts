import "@tanstack/react-start/server-only";
import { asc, eq } from "drizzle-orm";

import { db } from "#/lib/db";
import { products } from "#/lib/db/schema";

/** Für sitemap.xml: alle aktiven Produkte. */
export async function listForSitemap() {
  return db
    .select({ slug: products.slug, updatedAt: products.updatedAt })
    .from(products)
    .where(eq(products.active, true))
    .orderBy(asc(products.id));
}
