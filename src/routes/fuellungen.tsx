import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { PublicShell } from "#/components/ck/layout";
import { Placeholder } from "#/components/ck/placeholder";
import { Kicker, pillVariants, SectionTitle } from "#/components/ck/primitives";
import { useI18n } from "#/lib/i18n";
import { fillingsQueryOptions } from "#/lib/queries";
import { site } from "#/lib/site";

export const Route = createFileRoute("/fuellungen")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(fillingsQueryOptions());
  },
  head: () => ({
    meta: [
      { title: `Füllungen | ${site.name}` },
      {
        name: "description",
        content:
          "Alle Caramelka-Füllungen im Überblick — mit Zutaten und Allergenen. Jede Torte, jede Füllung: frei kombinierbar.",
      },
    ],
  }),
  component: FillingsPage,
});

function FillingsPage() {
  const { t, pickL } = useI18n();
  const { data: fillings } = useSuspenseQuery(fillingsQueryOptions());

  return (
    <PublicShell>
      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <Kicker className="mb-4">{t.fillings.kicker}</Kicker>
        <SectionTitle as="h1" className="mb-4 text-5xl md:text-[56px]">
          {t.fillings.title}
        </SectionTitle>
        <p className="mb-12 max-w-[60ch] text-[15.5px] leading-[1.65] text-espresso/70">
          {t.fillings.intro}
        </p>

        <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {fillings.map((filling) => (
            <article key={filling.id} className="flex flex-col gap-4">
              <Placeholder
                imageKey={filling.imageKey === "fuellung" ? filling.slug : filling.imageKey}
                className="aspect-[4/3] rounded-[4px]"
              />
              <div>
                <h2 className="mb-2 ck-display text-[26px]">
                  {pickL(filling.nameDe, filling.nameRu)}
                </h2>
                <p className="mb-2 text-[14px] leading-[1.6] text-espresso/70">
                  {pickL(filling.descriptionDe, filling.descriptionRu)}
                </p>
                {filling.allergensDe && (
                  <p className="text-[12.5px] text-espresso/70">
                    {t.fillings.allergens}: {pickL(filling.allergensDe, filling.allergensRu)}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link to="/torten" className={pillVariants.primary}>
            {t.hero.ctaPrimary}
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
