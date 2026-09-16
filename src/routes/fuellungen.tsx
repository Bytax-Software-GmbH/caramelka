import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { buttonVariants } from "#/components/ck/button";
import { Card, CardBody, CardDescription, CardMedia, CardTitle } from "#/components/ck/card";
import { PublicShell, shell } from "#/components/ck/layout";
import { Placeholder } from "#/components/ck/placeholder";
import { PageHead } from "#/components/ck/primitives";
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

/** Füllungen als Karten, dreispaltig, mit Allergenen als stille Zeile. */
function FillingsPage() {
  const { t, pickL } = useI18n();
  const { data: fillings } = useSuspenseQuery(fillingsQueryOptions());

  return (
    <PublicShell>
      <section className={cn(shell, "pt-14 pb-12 lg:pt-16")}>
        <PageHead eyebrow={t.fillings.kicker} title={t.fillings.title} lede={t.fillings.intro} />
      </section>

      <section className={cn(shell, "pb-20 lg:pb-24")}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {fillings.map((filling, index) => {
            const name = pickL(filling.nameDe, filling.nameRu);
            return (
              <Reveal key={filling.id} delay={(index % 3) * 90} className="h-full">
                <Card className="h-full">
                  <CardMedia>
                    <Placeholder
                      imageKey={filling.imageKey === "fuellung" ? filling.slug : filling.imageKey}
                      alt={name}
                    />
                  </CardMedia>
                  <CardBody>
                    <CardTitle as="h2">{name}</CardTitle>
                    <CardDescription>
                      {pickL(filling.descriptionDe, filling.descriptionRu)}
                    </CardDescription>
                    {filling.allergensDe && (
                      <p className="mt-2 text-ink-subtle ck-body-sm">
                        {t.fillings.allergens}: {pickL(filling.allergensDe, filling.allergensRu)}
                      </p>
                    )}
                  </CardBody>
                </Card>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-16 border-t border-hairline pt-12 text-center">
          <Link to="/torten" className={buttonVariants({ variant: "secondary" })}>
            {t.hero.ctaPrimary}
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
