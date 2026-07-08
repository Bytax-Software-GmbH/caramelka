import { createFileRoute, Link } from "@tanstack/react-router";
import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { PublicShell } from "#/components/ck/layout";
import { Placeholder } from "#/components/ck/placeholder";
import { Kicker, pillVariants, SectionTitle } from "#/components/ck/primitives";
import { useCart } from "#/lib/cart";
import { formatPrice } from "#/lib/format";
import { useI18n } from "#/lib/i18n";
import { site } from "#/lib/site";

export const Route = createFileRoute("/warenkorb")({
  head: () => ({
    meta: [{ title: `Warenkorb | ${site.name}` }, { name: "robots", content: "noindex, follow" }],
  }),
  component: CartPage,
});

function CartPage() {
  const { t, locale, pickL } = useI18n();
  const cart = useCart();

  return (
    <PublicShell>
      <section className="mx-auto max-w-4xl px-5 py-14 md:px-8 md:py-16">
        <Kicker className="mb-4">{site.name}</Kicker>
        <SectionTitle as="h1" className="mb-10 text-5xl">
          {t.cart.title}
        </SectionTitle>

        {cart.items.length === 0 ? (
          <div className="py-14 text-center">
            <p className="mb-7 text-espresso/60">{t.cart.empty}</p>
            <Link to="/torten" className={pillVariants.primary}>
              {t.cart.emptyCta}
            </Link>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-espresso/10 border-y border-espresso/10">
              {cart.items.map((item) => (
                <li key={item.key} className="flex gap-4 py-6 md:gap-6">
                  <Placeholder
                    imageKey={item.imageKey}
                    className="size-24 shrink-0 rounded-[4px] md:size-28"
                  />
                  <div className="flex flex-1 flex-col justify-between gap-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link
                          to="/torten/$slug"
                          params={{ slug: item.slug }}
                          className="text-[14px] font-semibold tracking-[0.12em] uppercase hover:text-caramel-deep"
                        >
                          {pickL(item.nameDe, item.nameRu)}
                        </Link>
                        <dl className="mt-1.5 space-y-0.5 text-[13px] text-espresso/60">
                          <div>
                            {t.cart.size}: {pickL(item.sizeLabelDe, item.sizeLabelRu)}
                          </div>
                          {item.fillingNameDe && (
                            <div>
                              {t.cart.filling}:{" "}
                              {pickL(item.fillingNameDe, item.fillingNameRu ?? item.fillingNameDe)}
                            </div>
                          )}
                          {item.inscription && (
                            <div>
                              {t.cart.inscription}: „{item.inscription}“
                            </div>
                          )}
                        </dl>
                      </div>
                      <div className="text-[15px] font-semibold whitespace-nowrap">
                        {formatPrice(item.unitPriceCents * item.quantity, locale)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center rounded-full border border-espresso/20"
                        aria-label={t.product.quantity}
                      >
                        <button
                          type="button"
                          onClick={() => cart.setQuantity(item.key, item.quantity - 1)}
                          className="grid size-9 place-items-center text-espresso/60 hover:text-espresso"
                          aria-label="−"
                        >
                          <MinusIcon className="size-3.5" />
                        </button>
                        <span className="w-7 text-center text-[14px] font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => cart.setQuantity(item.key, item.quantity + 1)}
                          className="grid size-9 place-items-center text-espresso/60 hover:text-espresso"
                          aria-label="+"
                        >
                          <PlusIcon className="size-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => cart.remove(item.key)}
                        className="inline-flex items-center gap-1.5 text-[12px] tracking-[0.1em] text-espresso/70 uppercase hover:text-destructive"
                      >
                        <Trash2Icon className="size-3.5" aria-hidden /> {t.cart.remove}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col items-end gap-6">
              <div className="flex w-full max-w-xs items-baseline justify-between">
                <span className="ck-kicker">{t.cart.subtotal}</span>
                <span className="ck-display text-[28px]">
                  {formatPrice(cart.subtotalCents, locale)}
                </span>
              </div>
              <div className="flex flex-wrap justify-end gap-4">
                <Link to="/torten" className={pillVariants.outline}>
                  {t.cart.continueShopping}
                </Link>
                <Link to="/kasse" className={pillVariants.primary}>
                  {t.cart.checkout}
                </Link>
              </div>
            </div>
          </>
        )}
      </section>
    </PublicShell>
  );
}
