import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { buttonVariants } from "#/components/ck/button";
import { Card, CardBody, CardDescription, CardMedia, CardTitle } from "#/components/ck/card";
import { PublicShell, shell } from "#/components/ck/layout";
import { Placeholder } from "#/components/ck/placeholder";
import { PageHead, textLinkClass } from "#/components/ck/primitives";
import { Reveal } from "#/components/ck/reveal";
import { formatPrice } from "#/lib/format";
import { useI18n } from "#/lib/i18n";
import { fillingImageKey } from "#/lib/image-manifest";
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
  const { t, locale, pickL } = useI18n();
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
                    <Placeholder imageKey={fillingImageKey(filling)} alt={name} />
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
                    <div className="mt-auto flex flex-wrap items-baseline justify-between gap-3 pt-4">
                      {filling.pricePerKgCents !== null && (
                        <span className="text-md text-brand ck-price">
                          {t.fillings.perKg(formatPrice(filling.pricePerKgCents, locale))}
                        </span>
                      )}
                      <Link
                        to="/bestellen"
                        search={{ art: "torte", fuellung: filling.slug }}
                        className={cn(textLinkClass(), "ml-auto")}
                      >
                        {t.fillings.requestCta}
                      </Link>
                    </div>
                  </CardBody>
                </Card>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-16 border-t border-hairline pt-12 text-center">
          <Link to="/bestellen" className={buttonVariants({ variant: "secondary" })}>
            {t.hero.ctaSecondary}
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
