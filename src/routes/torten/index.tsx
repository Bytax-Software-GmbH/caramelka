import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import * as z from "zod";

import { PublicShell } from "#/components/ck/layout";
import { Kicker, SectionTitle } from "#/components/ck/primitives";
import { ProductCard } from "#/components/ck/product-card";
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
          "Alle Torten von Caramelka: Bento-Törtchen, Klassiker, Hochzeitstorten und feine Patisserie — online bestellen, abholen oder liefern lassen.",
      },
    ],
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
      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <Kicker className="mb-4">{t.catalog.kicker}</Kicker>
        <SectionTitle as="h1" className="mb-9 text-5xl md:text-[56px]">
          {t.catalog.title}
        </SectionTitle>

        <nav
          className="mb-10 flex flex-wrap gap-2.5 border-b border-espresso/12 pb-6"
          aria-label={t.catalog.kicker}
        >
          <CategoryChip to={undefined} active={!activeCategory}>
            {t.catalog.all}
          </CategoryChip>
          {data.categories.map((c) => (
            <CategoryChip key={c.id} to={c.slug} active={activeCategory?.id === c.id}>
              {pickL(c.nameDe, c.nameRu)}
            </CategoryChip>
          ))}
        </nav>

        {products.length === 0 ? (
          <p className="py-16 text-center text-espresso/60">{t.catalog.empty}</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
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
        "rounded-full border px-5 py-2 text-[12px] font-semibold tracking-[0.12em] uppercase transition-colors",
        active
          ? "border-espresso bg-espresso text-creme"
          : "border-espresso/25 text-espresso/70 hover:border-espresso hover:text-espresso",
      )}
    >
      {children}
    </Link>
  );
}
