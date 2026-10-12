import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeftIcon, CalendarIcon, TruckIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "#/components/ck/badge";
import { buttonVariants } from "#/components/ck/button";
import { PublicShell, shell } from "#/components/ck/layout";
import { Placeholder } from "#/components/ck/placeholder";
import { Body, Eyebrow, Heading, Lede, Price, textLinkClass } from "#/components/ck/primitives";
import { Tabs } from "#/components/ck/tabs";
import { Tag } from "#/components/ck/tag";
import { formatDate, formatPrice } from "#/lib/format";
import { useI18n } from "#/lib/i18n";
import { earliestBookableDate, requiredLeadTimeHours } from "#/lib/order-request/schedule";
import { productQueryOptions } from "#/lib/queries";
import { site } from "#/lib/site";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/torten/$slug")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productQueryOptions(params.slug));
    if (!product) throw notFound();
    return {
      title: product.nameDe,
      description: product.descriptionDe,
      slug: product.slug,
      imageKey: product.imageKey,
      fromPriceCents: product.sizes.reduce<number | null>(
        (min, size) => (min === null || size.priceCents < min ? size.priceCents : min),
        null,
      ),
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const url = `${site.url}/torten/${loaderData.slug}`;
    const image = `${site.url}/images/${loaderData.imageKey}.webp`;
    return {
      meta: [
        { title: `${loaderData.title} | ${site.name}` },
        { name: "description", content: loaderData.description },
        { property: "og:title", content: `${loaderData.title} | ${site.name}` },
        { property: "og:description", content: loaderData.description },
        { property: "og:image", content: image },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: loaderData.title,
            description: loaderData.description,
            image,
            url,
            brand: { "@type": "Brand", name: site.name },
            ...(loaderData.fromPriceCents != null && {
              offers: {
                "@type": "Offer",
                priceCurrency: site.shop.currency,
                price: (loaderData.fromPriceCents / 100).toFixed(2),
                availability: "https://schema.org/MadeToOrder",
                url,
              },
            }),
          }),
        },
      ],
    };
  },
  component: ProductPage,
});

const legendClass = "mb-3 ck-label text-ink-muted";

/**
 * Produktseite: Foto 4:5 links (klebend), rechts Name, "ab"-Preis, kursive
 * Beschreibung, Größen als Richtpreise und Füllungen als Tags. Der eine
 * Primär-Button führt ins Anfrage-Formular, vorbelegt mit Produkt und
 * gewählter Füllung. Darunter Reiter.
 */
function ProductPage() {
  const { slug } = Route.useParams();
  const { t, locale, pickL } = useI18n();
  const { data: product } = useSuspenseQuery(productQueryOptions(slug));
  const [fillingId, setFillingId] = useState<number | null>(null);

  const leadHours = product
    ? requiredLeadTimeHours(product.orderKind, [product.leadTimeHours])
    : site.shop.leadTimeHoursByKind.cake;
  const earliest = useMemo(
    () =>
      product
        ? formatDate(earliestBookableDate(product.orderKind, leadHours, new Date()), locale)
        : "",
    [product, leadHours, locale],
  );

  if (!product) return null;

  const name = pickL(product.nameDe, product.nameRu);
  const description = pickL(product.descriptionDe, product.descriptionRu);
  const fromPrice = product.sizes.reduce<number | null>(
    (min, size) => (min === null || size.priceCents < min ? size.priceCents : min),
    null,
  );
  const selectedFilling = product.fillings.find((f) => f.id === fillingId) ?? null;

  const allergenText = selectedFilling?.allergensDe
    ? `${t.product.allergens}: ${pickL(selectedFilling.allergensDe, selectedFilling.allergensRu)}`
    : product.fillingSelectable
      ? t.product.allergensByFilling
      : t.product.allergensNone;

  return (
    <PublicShell>
      <section className={cn(shell, "pt-10 pb-20")}>
        <Link to="/torten" className={textLinkClass()}>
          <ArrowLeftIcon aria-hidden strokeWidth={1.5} className="size-3.5" />
          {t.product.backToCatalog}
        </Link>

        <div className="mt-8 grid items-start gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div className="ck-frame lg:sticky lg:top-24">
            <div className="aspect-[4/5] overflow-hidden">
              <Placeholder imageKey={product.imageKey} alt={name} priority />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <Eyebrow>{t.catalog.leadTime(leadHours)}</Eyebrow>
              {product.featured && <Badge tone="accent">{t.catalog.featuredBadge}</Badge>}
            </div>
            <Heading as="h1" className="mt-3">
              {name}
            </Heading>
            {fromPrice !== null && (
              <div className="mt-2.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <Price className="text-2xl">
                  {t.product.fromPrice(formatPrice(fromPrice, locale))}
                </Price>
                <span className="text-ink-muted ck-body-sm">{t.product.priceNote}</span>
              </div>
            )}
            <Lede className="mt-5 text-[19px]">{description}</Lede>

            {/* Größen als Richtpreise */}
            {product.sizes.length > 0 && (
              <div className="mt-8">
                <div className={legendClass}>{t.product.sizes}</div>
                <ul className="divide-y divide-hairline border-y border-hairline">
                  {product.sizes.map((size) => (
                    <li
                      key={size.id}
                      className="flex items-baseline justify-between gap-4 py-3 ck-body-sm"
                    >
                      <span className="text-ink">{pickL(size.labelDe, size.labelRu)}</span>
                      <Price className="text-md">{formatPrice(size.priceCents, locale)}</Price>
                    </li>
                  ))}
                </ul>
                {product.orderKind !== "event" && (
                  <p className="mt-2 text-ink-muted ck-body-sm">
                    {product.orderKind === "cake" ? t.product.sizesNote : t.product.sizesNoteFixed}
                  </p>
                )}
              </div>
            )}

            {/* Füllung: wählt nur vor, bestellt wird im Formular */}
            {product.fillingSelectable ? (
              <div className="mt-8">
                <div className={legendClass}>{t.product.filling}</div>
                <div className="flex flex-wrap gap-2">
                  {product.fillings.map((filling) => (
                    <Tag
                      key={filling.id}
                      selected={selectedFilling?.id === filling.id}
                      onClick={() =>
                        setFillingId((current) => (current === filling.id ? null : filling.id))
                      }
                    >
                      {pickL(filling.nameDe, filling.nameRu)}
                    </Tag>
                  ))}
                </div>
                <p className="mt-2 text-ink-muted ck-body-sm">{t.product.fillingHint}</p>
                {selectedFilling && (
                  <div className="mt-4 border-l-2 border-accent bg-accent-soft px-5 py-4">
                    <Body size="sm">
                      {pickL(selectedFilling.descriptionDe, selectedFilling.descriptionRu)}
                    </Body>
                    {selectedFilling.allergensDe && (
                      <Body size="sm" tone="muted" className="mt-1">
                        {t.product.allergens}:{" "}
                        {pickL(selectedFilling.allergensDe, selectedFilling.allergensRu)}
                      </Body>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-8 border-l-2 border-hairline-strong bg-sunken px-5 py-4">
                <Body size="sm">{t.product.fillingByArrangement}</Body>
              </div>
            )}

            <div className="mt-8">
              <Link
                to="/bestellen"
                search={{ produkt: product.slug, fuellung: selectedFilling?.slug }}
                className={buttonVariants({ size: "lg", block: true })}
              >
                {t.product.requestCta}
              </Link>
              <p className="mt-3 text-center text-ink-muted ck-body-sm">{t.product.requestNote}</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-ink-muted ck-body-sm">
              <span className="inline-flex items-center gap-2">
                <TruckIcon aria-hidden strokeWidth={1.5} className="size-4" />
                {t.product.delivery(site.shop.deliveryRadiusKm)}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarIcon aria-hidden strokeWidth={1.5} className="size-4" />
                {t.product.leadTimeNote(earliest)}
              </span>
            </div>

            <Tabs
              className="mt-10"
              items={[
                {
                  value: "description",
                  label: t.product.tabs.description,
                  content: <Body size="sm">{description}</Body>,
                },
                {
                  value: "ordering",
                  label: t.product.tabs.ordering,
                  content: (
                    <Body size="sm">
                      {t.product.orderingText(earliest, site.shop.deliveryRadiusKm)}
                    </Body>
                  ),
                },
                {
                  value: "allergens",
                  label: t.product.tabs.allergens,
                  content: <Body size="sm">{allergenText}</Body>,
                },
              ]}
            />
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
