import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeftIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PublicShell, shell } from "#/components/ck/layout";
import { Placeholder } from "#/components/ck/placeholder";
import { Body, Pill } from "#/components/ck/primitives";
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

function ProductPage() {
  const { slug } = Route.useParams();
  const { t, locale, pickL } = useI18n();
  const cart = useCart();
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
  const selectedSize = product.sizes.find((s) => s.id === sizeId) ?? product.sizes[0];
  const selectedFilling = product.fillings.find((f) => f.id === fillingId) ?? null;

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
    toast.success(t.product.added);
  }

  return (
    <PublicShell>
      <section className={cn(shell, "py-12 md:py-16")}>
        <Link
          to="/torten"
          className="ck-nav-link mb-10 inline-flex items-center gap-2 text-ink-2 transition-colors hover:text-ink"
        >
          <ArrowLeftIcon className="size-3.5" aria-hidden /> {t.product.backToCatalog}
        </Link>

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-20">
          <div className="h-fit lg:sticky lg:top-28 lg:col-span-6">
            <div className="ck-frame">
              <Placeholder imageKey={product.imageKey} alt={name} priority className="aspect-[4/5]" />
            </div>
          </div>

          <div className="lg:col-span-5 lg:col-start-8">
            <h1 className="mb-4 ck-display text-display-l text-ink">{name}</h1>
            <Body size="l" className="mb-3">
              {pickL(product.descriptionDe, product.descriptionRu)}
            </Body>
            <Body size="s" tone="muted" className="mb-10">
              {t.product.leadTimeNote(earliest)}
            </Body>

            {/* Größe */}
            <fieldset className="mb-9">
              <legend className="mb-4 ck-kicker">{t.product.size}</legend>
              <div className="flex flex-col">
                {product.sizes.map((size) => (
                  <label
                    key={size.id}
                    className={cn(
                      "flex cursor-pointer items-center justify-between border-b py-4 transition-colors",
                      selectedSize?.id === size.id
                        ? "border-espresso"
                        : "border-rule hover:border-rule-strong",
                    )}
                  >
                    <span className="flex items-center gap-3.5">
                      <input
                        type="radio"
                        name="size"
                        checked={selectedSize?.id === size.id}
                        onChange={() => setSizeId(size.id)}
                        className="accent-espresso"
                      />
                      <span
                        className={cn(
                          "text-body-m",
                          selectedSize?.id === size.id ? "text-ink" : "text-ink-2",
                        )}
                      >
                        {pickL(size.labelDe, size.labelRu)}
                      </span>
                    </span>
                    <span className="ck-price text-body-l text-ink">
                      {formatPrice(size.priceCents, locale)}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Füllung */}
            {product.fillingSelectable ? (
              <fieldset className="mb-9">
                <legend className="mb-4 ck-kicker">{t.product.filling}</legend>
                <div className="flex flex-wrap gap-2.5">
                  {product.fillings.map((filling) => (
                    <button
                      key={filling.id}
                      type="button"
                      onClick={() => setFillingId(filling.id)}
                      aria-pressed={selectedFilling?.id === filling.id}
                      className={cn(
                        "rounded-full border px-4.5 py-2 text-body-s transition-colors duration-300",
                        selectedFilling?.id === filling.id
                          ? "border-espresso bg-espresso text-creme"
                          : "border-rule-strong text-ink-2 hover:border-espresso hover:text-ink",
                      )}
                    >
                      {pickL(filling.nameDe, filling.nameRu)}
                    </button>
                  ))}
                </div>
                {selectedFilling && (
                  <div className="mt-4 border-l border-espresso bg-creme-2 px-5 py-4">
                    <Body size="s" tone="primary">
                      {pickL(selectedFilling.descriptionDe, selectedFilling.descriptionRu)}
                    </Body>
                    {selectedFilling.allergensDe && (
                      <Body size="s" tone="muted" className="mt-1.5">
                        {t.product.allergens}:{" "}
                        {pickL(selectedFilling.allergensDe, selectedFilling.allergensRu)}
                      </Body>
                    )}
                  </div>
                )}
              </fieldset>
            ) : (
              <div className="mb-9 border-l border-rule-strong bg-creme-2 px-5 py-4">
                <Body size="s">{t.product.fillingByArrangement}</Body>
              </div>
            )}

            {/* Aufschrift */}
            <div className="mb-9">
              <label htmlFor="inscription" className="mb-3 block ck-kicker">
                {t.product.inscription}
              </label>
              <input
                id="inscription"
                type="text"
                maxLength={120}
                value={inscription}
                onChange={(e) => setInscription(e.target.value)}
                placeholder={t.product.inscriptionPlaceholder}
                className="w-full rounded-sm border border-rule-strong bg-white px-4 py-3 text-body-m text-ink placeholder:text-ink-3 focus:border-espresso focus:outline-none"
              />
            </div>

            {/* Menge und Warenkorb */}
            <div className="flex flex-wrap items-center gap-4">
              <div
                className="flex items-center rounded-full border border-rule-strong"
                aria-label={t.product.quantity}
              >
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="grid size-11 place-items-center text-ink-2 transition-colors hover:text-ink"
                  aria-label={`${t.product.quantity} verringern`}
                >
                  <MinusIcon className="size-4" aria-hidden />
                </button>
                <span className="w-8 text-center text-body-m font-semibold tabular-nums text-ink">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  className="grid size-11 place-items-center text-ink-2 transition-colors hover:text-ink"
                  aria-label={`${t.product.quantity} erhöhen`}
                >
                  <PlusIcon className="size-4" aria-hidden />
                </button>
              </div>
              <Pill onClick={addToCart} className="flex-1 sm:flex-none">
                {t.product.addToCart}
                {selectedSize && (
                  <span className="opacity-75">
                    {formatPrice(selectedSize.priceCents * quantity, locale)}
                  </span>
                )}
              </Pill>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
