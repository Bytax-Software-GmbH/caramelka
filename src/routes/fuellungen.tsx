import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { PublicShell, shell } from "#/components/ck/layout";
import { Placeholder } from "#/components/ck/placeholder";
import { Body, Kicker, pillVariants, SectionTitle } from "#/components/ck/primitives";
import { Reveal } from "#/components/ck/reveal";
import { useI18n } from "#/lib/i18n";
import { fillingsQueryOptions } from "#/lib/queries";
import { site } from "#/lib/site";
import { cn } from "#/lib/utils";

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
          "Alle Caramelka-Füllungen im Überblick, mit Zutaten und Allergenen. Jede Torte, jede Füllung: frei kombinierbar.",
      },
    ],
    links: [{ rel: "canonical", href: `${site.url}/fuellungen` }],
  }),
  component: FillingsPage,
});

/** Wechselnde Bildformate geben dem Raster Rhythmus statt Gleichtakt. */
const shotRatio = ["aspect-[4/5]", "aspect-square", "aspect-[5/4]"];

function FillingsPage() {
  const { t, pickL } = useI18n();
  const { data: fillings } = useSuspenseQuery(fillingsQueryOptions());

  return (
    <PublicShell>
      <section className={cn(shell, "pt-16 pb-20 md:pt-20 md:pb-24")}>
        <Kicker className="mb-5">{t.fillings.kicker}</Kicker>
        <SectionTitle as="h1" size="xl" className="mb-6 max-w-[14ch]">
          {t.fillings.title}
        </SectionTitle>
        <Body size="l" className="max-w-[56ch]">
          {t.fillings.intro}
        </Body>
      </section>

      <section className={cn(shell, "pb-28 md:pb-36")}>
        <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {fillings.map((filling, index) => {
            const name = pickL(filling.nameDe, filling.nameRu);
            return (
              <Reveal key={filling.id} delay={(index % 3) * 90}>
                <article className="flex flex-col gap-5">
                  <Placeholder
                    imageKey={filling.imageKey === "fuellung" ? filling.slug : filling.imageKey}
                    alt={name}
                    className={shotRatio[index % shotRatio.length]}
                  />
                  <div>
                    <h2 className="mb-3 ck-display text-display-m text-ink">{name}</h2>
                    <Body className="mb-3">
                      {pickL(filling.descriptionDe, filling.descriptionRu)}
                    </Body>
                    {filling.allergensDe && (
                      <Body size="s" tone="muted">
                        {t.fillings.allergens}: {pickL(filling.allergensDe, filling.allergensRu)}
                      </Body>
                    )}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-24 border-t border-rule pt-16 text-center">
          <Link to="/torten" className={pillVariants.primary}>
            {t.hero.ctaPrimary}
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
