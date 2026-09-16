import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  CalendarIcon,
  MinusIcon,
  PlusIcon,
  ShoppingBagIcon,
  TruckIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "#/components/ck/badge";
import { Button } from "#/components/ck/button";
import { IconButton } from "#/components/ck/icon-button";
import { Input } from "#/components/ck/input";
import { PublicShell, shell } from "#/components/ck/layout";
import { Placeholder } from "#/components/ck/placeholder";
import { Body, Eyebrow, Heading, Lede, Price, textLinkClass } from "#/components/ck/primitives";
import { Radio } from "#/components/ck/radio";
import { Tabs } from "#/components/ck/tabs";
import { Tag } from "#/components/ck/tag";
import { useBagDrawer } from "#/lib/bag-drawer";
import { useCart } from "#/lib/cart";
import { earliestDate, formatDate, formatPrice, toIsoDate } from "#/lib/format";
import { useI18n } from "#/lib/i18n";
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
                availability: "https://schema.org/InStock",
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
 * Produktseite: Foto 4:5 links (klebend), rechts Eyebrow, Name in der Serif,
 * Preis, kursive Beschreibung, dann Größe als Radio-Karten, Füllung als
 * Tags, Aufschrift, Menge und der eine Primär-Button. Darunter Reiter.
 */
function ProductPage() {
  const { slug } = Route.useParams();
  const { t, locale, pickL } = useI18n();
  const cart = useCart();
  const { openBag } = useBagDrawer();
  const { data: product } = useSuspenseQuery(productQueryOptions(slug));

  const [sizeId, setSizeId] = useState<number | null>(null);
  const [fillingId, setFillingId] = useState<number | null>(null);
  const [inscription, setInscription] = useState("");
  const [quantity, setQuantity] = useState(1);

  const earliest = useMemo(
    () =>
      product
        ? formatDate(
            toIsoDate(earliestDate(product.leadTimeHours, site.shop.closedWeekdays)),
            locale,
          )
        : "",
    [product, locale],
  );

  if (!product) return null;

  const name = pickL(product.nameDe, product.nameRu);
  const description = pickL(product.descriptionDe, product.descriptionRu);
  const selectedSize = product.sizes.find((s) => s.id === sizeId) ?? product.sizes[0];
  const selectedFilling = product.fillings.find((f) => f.id === fillingId) ?? null;
  const totalCents = selectedSize ? selectedSize.priceCents * quantity : 0;

  const allergenText = selectedFilling?.allergensDe
    ? `${t.product.allergens}: ${pickL(selectedFilling.allergensDe, selectedFilling.allergensRu)}`
    : product.fillingSelectable
      ? t.product.allergensByFilling
      : t.product.allergensNone;

  function addToCart() {
    if (!product || !selectedSize) return;
    cart.add({
      productId: product.id,
      slug: product.slug,
      nameDe: product.nameDe,
      nameRu: product.nameRu,
      imageKey: product.imageKey,
      sizeId: selectedSize.id,
      sizeLabelDe: selectedSize.labelDe,
      sizeLabelRu: selectedSize.labelRu,
      fillingId: selectedFilling?.id ?? null,
      fillingNameDe: selectedFilling?.nameDe ?? null,
      fillingNameRu: selectedFilling?.nameRu ?? null,
      inscription: inscription.trim() || null,
      unitPriceCents: selectedSize.priceCents,
      quantity,
      leadTimeHours: product.leadTimeHours,
    });
    toast.success(t.product.added, {
      description: `${name} · ${pickL(selectedSize.labelDe, selectedSize.labelRu)}`,
      action: { label: t.product.viewBag, onClick: openBag },
    });
  }

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
              <Eyebrow>{t.catalog.leadTime(product.leadTimeHours)}</Eyebrow>
              {product.featured && <Badge tone="accent">{t.catalog.featuredBadge}</Badge>}
            </div>
            <Heading as="h1" className="mt-3">
              {name}
            </Heading>
            {selectedSize && (
              <div className="mt-2.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <Price className="text-2xl">{formatPrice(selectedSize.priceCents, locale)}</Price>
                <span className="text-ink-muted ck-body-sm">
                  {pickL(selectedSize.labelDe, selectedSize.labelRu)} · {t.product.priceNote}
                </span>
              </div>
            )}
            <Lede className="mt-5 text-[19px]">{description}</Lede>

            {/* Größe */}
            <fieldset className="mt-8">
              <legend className={legendClass}>{t.product.size}</legend>
              <div className="flex flex-col gap-2">
                {product.sizes.map((size) => (
                  <Radio
                    key={size.id}
                    card
                    name="size"
                    label={pickL(size.labelDe, size.labelRu)}
                    meta={formatPrice(size.priceCents, locale)}
                    checked={selectedSize?.id === size.id}
                    onChange={() => setSizeId(size.id)}
                  />
                ))}
              </div>
            </fieldset>

            {/* Füllung */}
            {product.fillingSelectable ? (
              <fieldset className="mt-8">
                <legend className={legendClass}>{t.product.filling}</legend>
                <div className="flex flex-wrap gap-2">
                  {product.fillings.map((filling) => (
                    <Tag
                      key={filling.id}
                      selected={selectedFilling?.id === filling.id}
                      onClick={() => setFillingId(filling.id)}
                    >
                      {pickL(filling.nameDe, filling.nameRu)}
                    </Tag>
                  ))}
                </div>
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
              </fieldset>
            ) : (
              <div className="mt-8 border-l-2 border-hairline-strong bg-sunken px-5 py-4">
                <Body size="sm">{t.product.fillingByArrangement}</Body>
              </div>
            )}

            {/* Aufschrift */}
            <Input
              className="mt-8"
              label={t.product.inscription}
              maxLength={120}
              value={inscription}
              onChange={(e) => setInscription(e.target.value)}
              placeholder={t.product.inscriptionPlaceholder}
              hint={`${inscription.length} / 120`}
            />

            {/* Menge und Warenkorb */}
            <div className="mt-8 grid grid-cols-1 items-end gap-3 sm:grid-cols-[132px_1fr]">
              <div className="flex flex-col gap-2">
                <span className="ck-label text-ink-muted">{t.product.quantity}</span>
                <div
                  className="flex h-13 items-center rounded-sm border border-hairline bg-surface px-1"
                  aria-label={t.product.quantity}
                >
                  <IconButton
                    size="sm"
                    label={`${t.product.quantity} −`}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <MinusIcon className="size-3.5" strokeWidth={1.5} />
                  </IconButton>
                  <span className="flex-1 text-center tabular-nums ck-body">{quantity}</span>
                  <IconButton
                    size="sm"
                    label={`${t.product.quantity} +`}
                    onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  >
                    <PlusIcon className="size-3.5" strokeWidth={1.5} />
                  </IconButton>
                </div>
              </div>
              <Button
                size="lg"
                block
                icon={<ShoppingBagIcon strokeWidth={1.5} />}
                onClick={addToCart}
              >
                {t.product.addToCart} · {formatPrice(totalCents, locale)}
              </Button>
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
