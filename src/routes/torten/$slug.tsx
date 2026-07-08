import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeftIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PublicShell } from "#/components/ck/layout";
import { Placeholder } from "#/components/ck/placeholder";
import { Pill } from "#/components/ck/primitives";
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
    return { title: product.nameDe };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.title ?? "Torte"} | ${site.name}` }],
  }),
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
      <section className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <Link
          to="/torten"
          className="mb-8 inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.14em] text-caramel-deep uppercase hover:text-espresso"
        >
          <ArrowLeftIcon className="size-3.5" aria-hidden /> {t.product.backToCatalog}
        </Link>

        <div className="grid gap-10 md:grid-cols-2 md:gap-14">
          <div className="h-fit md:sticky md:top-24">
            <div className="ck-frame">
              <Placeholder imageKey={product.imageKey} className="aspect-[3/3.4] rounded-[4px]" />
            </div>
          </div>

          <div>
            <h1 className="mb-3 ck-display text-4xl md:text-[44px]">
              {pickL(product.nameDe, product.nameRu)}
            </h1>
            <p className="mb-2 text-[15px] leading-[1.65] text-espresso/70">
              {pickL(product.descriptionDe, product.descriptionRu)}
            </p>
            <p className="mb-8 text-[13px] text-caramel-deep">{t.product.leadTimeNote(earliest)}</p>

            {/* Größe */}
            <fieldset className="mb-7">
              <legend className="mb-3 ck-kicker">{t.product.size}</legend>
              <div className="flex flex-col gap-2">
                {product.sizes.map((size) => (
                  <label
                    key={size.id}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-md border px-4 py-3 transition-colors",
                      selectedSize?.id === size.id
                        ? "border-espresso bg-espresso/[0.04]"
                        : "border-espresso/20 hover:border-espresso/50",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="size"
                        checked={selectedSize?.id === size.id}
                        onChange={() => setSizeId(size.id)}
                        className="accent-caramel"
                      />
                      <span className="text-[14.5px]">{pickL(size.labelDe, size.labelRu)}</span>
                    </span>
                    <span className="ck-price text-[17px]">
                      {formatPrice(size.priceCents, locale)}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Füllung */}
            {product.fillingSelectable ? (
              <fieldset className="mb-7">
                <legend className="mb-3 ck-kicker">{t.product.filling}</legend>
                <div className="flex flex-wrap gap-2">
                  {product.fillings.map((filling) => (
                    <button
                      key={filling.id}
                      type="button"
                      onClick={() => setFillingId(filling.id)}
                      aria-pressed={selectedFilling?.id === filling.id}
                      className={cn(
                        "rounded-full border px-4 py-2 text-[13px] transition-colors",
                        selectedFilling?.id === filling.id
                          ? "border-caramel bg-caramel text-creme"
                          : "border-espresso/25 text-espresso/75 hover:border-caramel hover:text-caramel-deep",
                      )}
                    >
                      {pickL(filling.nameDe, filling.nameRu)}
                    </button>
                  ))}
                </div>
                {selectedFilling && (
                  <div className="mt-3 rounded-md bg-creme-2/70 px-4 py-3 text-[13px] leading-relaxed text-espresso/75">
                    <p>{pickL(selectedFilling.descriptionDe, selectedFilling.descriptionRu)}</p>
                    {selectedFilling.allergensDe && (
                      <p className="mt-1 text-espresso/55">
                        {t.product.allergens}:{" "}
                        {pickL(selectedFilling.allergensDe, selectedFilling.allergensRu)}
                      </p>
                    )}
                  </div>
                )}
              </fieldset>
            ) : (
              <p className="mb-7 rounded-md bg-creme-2/70 px-4 py-3 text-[13.5px] text-espresso/70">
                {t.product.fillingByArrangement}
              </p>
            )}

            {/* Aufschrift */}
            <div className="mb-7">
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
                className="w-full rounded-md border border-espresso/25 bg-white px-4 py-3 text-[14.5px] placeholder:text-espresso/35 focus:border-caramel focus:outline-none"
              />
            </div>

            {/* Menge + CTA */}
            <div className="flex flex-wrap items-center gap-4">
              <div
                className="flex items-center rounded-full border border-espresso/25"
                aria-label={t.product.quantity}
              >
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="grid size-11 place-items-center text-espresso/70 hover:text-espresso"
                  aria-label="−"
                >
                  <MinusIcon className="size-4" />
                </button>
                <span className="w-8 text-center text-[15px] font-semibold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  className="grid size-11 place-items-center text-espresso/70 hover:text-espresso"
                  aria-label="+"
                >
                  <PlusIcon className="size-4" />
                </button>
              </div>
              <Pill onClick={addToCart} className="flex-1 sm:flex-none">
                {t.product.addToCart}
                {selectedSize && (
                  <span className="opacity-70">
                    · {formatPrice(selectedSize.priceCents * quantity, locale)}
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
