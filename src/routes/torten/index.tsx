import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import * as z from "zod";

import { PublicShell, shell } from "#/components/ck/layout";
import { Body, Kicker, SectionTitle } from "#/components/ck/primitives";
import { ProductCard } from "#/components/ck/product-card";
import { Reveal } from "#/components/ck/reveal";
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

function CatalogPage() {
  const { t, pickL } = useI18n();
  const { kategorie } = Route.useSearch();
  const { data } = useSuspenseQuery(catalogQueryOptions());

  const activeCategory = data.categories.find((c) => c.slug === kategorie);
  const products = activeCategory
    ? data.products.filter((p) => p.categoryId === activeCategory.id)
    : data.products;

  return (
    <PublicShell>
      <section className={cn(shell, "pt-16 pb-24 md:pt-20 md:pb-32")}>
        <Kicker className="mb-5">{t.catalog.kicker}</Kicker>
        <SectionTitle as="h1" size="xl" className="mb-10 max-w-[14ch]">
          {t.catalog.title}
        </SectionTitle>

        <nav
          className="mb-14 flex flex-wrap gap-2.5 border-b border-rule pb-8"
          aria-label={t.catalog.kicker}
        >
          <CategoryChip to={undefined} active={!activeCategory}>
            {t.catalog.all}
          </CategoryChip>
          {data.categories.map((category) => (
            <CategoryChip
              key={category.id}
              to={category.slug}
              active={activeCategory?.id === category.id}
            >
              {pickL(category.nameDe, category.nameRu)}
            </CategoryChip>
          ))}
        </nav>

        {products.length === 0 ? (
          <Body size="l" className="py-24 text-center">
            {t.catalog.empty}
          </Body>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-14 md:grid-cols-3 md:gap-x-8 lg:grid-cols-4">
            {products.map((product, index) => (
              <Reveal key={product.id} delay={(index % 4) * 80}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </PublicShell>
  );
}

function CategoryChip({
  to,
  active,
  children,
}: {
  to: string | undefined;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to="/torten"
      search={to ? { kategorie: to } : {}}
      className={cn(
        "rounded-full border px-5 py-2 text-[0.72rem] font-semibold tracking-[0.14em] uppercase transition-colors duration-300",
        active
          ? "border-espresso bg-espresso text-creme"
          : "border-rule-strong text-ink-2 hover:border-espresso hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
