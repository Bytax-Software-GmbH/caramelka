import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import * as z from "zod";

import { PublicShell, shell } from "#/components/ck/layout";
import { Lede, PageHead } from "#/components/ck/primitives";
import { ProductCard } from "#/components/ck/product-card";
import { Reveal } from "#/components/ck/reveal";
import { tagVariants } from "#/components/ck/tag";
import { useI18n } from "#/lib/i18n";
import { catalogQueryOptions } from "#/lib/queries";
import { site } from "#/lib/site";
import { cn } from "#/lib/utils";

const searchSchema = z.object({
  kategorie: z.string().optional(),
});

export const Route = createFileRoute("/torten/")({
  validateSearch: searchSchema,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(catalogQueryOptions());
  },
  head: () => ({
    meta: [
      { title: `Torten & Patisserie | ${site.name}` },
      {
        name: "description",
        content:
          "Alle Torten von Caramelka: Bento-Törtchen, Klassiker, Hochzeitstorten und feine Patisserie. Online bestellen, abholen oder liefern lassen.",
      },
    ],
    // Kategorie-Filter läuft über Query-Params. Kanonisch ist immer die
    // ungefilterte Liste, sonst entsteht Duplicate Content.
    links: [{ rel: "canonical", href: `${site.url}/torten` }],
  }),
  component: CatalogPage,
});

/** Shop: zentrierter Kopf, Filter-Tags, dreispaltiges Kartenraster. */
function CatalogPage() {
  const { t, pickL } = useI18n();
  const { kategorie } = Route.useSearch();
  const { data } = useSuspenseQuery(catalogQueryOptions());

  const activeCategory = data.categories.find((c) => c.slug === kategorie);
  const products = activeCategory
    ? data.products.filter((p) => p.categoryId === activeCategory.id)
    : data.products;

  const categoryName = (id: number) => {
    const category = data.categories.find((c) => c.id === id);
    return category ? pickL(category.nameDe, category.nameRu) : undefined;
  };

  return (
    <PublicShell>
      <section className={cn(shell, "pt-14 pb-20 lg:pt-16 lg:pb-24")}>
        <PageHead eyebrow={t.catalog.kicker} title={t.catalog.title} />

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-6">
          <nav className="flex flex-wrap gap-2" aria-label={t.catalog.kicker}>
            <Link to="/torten" search={{}} className={tagVariants({ selected: !activeCategory })}>
              {t.catalog.all}
            </Link>
            {data.categories.map((category) => (
              <Link
                key={category.id}
                to="/torten"
                search={{ kategorie: category.slug }}
                className={tagVariants({ selected: activeCategory?.id === category.id })}
              >
                {pickL(category.nameDe, category.nameRu)}
              </Link>
            ))}
          </nav>
          <span className="text-ink-muted ck-body-sm">{t.catalog.count(products.length)}</span>
        </div>

        {products.length === 0 ? (
          <Lede className="py-24 text-center">{t.catalog.empty}</Lede>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <Reveal key={product.id} delay={(index % 3) * 80} className="h-full">
                <ProductCard product={product} eyebrow={categoryName(product.categoryId)} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </PublicShell>
  );
}
