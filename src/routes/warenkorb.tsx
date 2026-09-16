import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRightIcon, MinusIcon, PlusIcon } from "lucide-react";

import { Button, buttonVariants } from "#/components/ck/button";
import { IconButton } from "#/components/ck/icon-button";
import { PublicShell, shell } from "#/components/ck/layout";
import { Placeholder } from "#/components/ck/placeholder";
import { Eyebrow, Lede, PageHead, Price } from "#/components/ck/primitives";
import { useCart } from "#/lib/cart";
import { formatPrice } from "#/lib/format";
import { useI18n } from "#/lib/i18n";
import { site } from "#/lib/site";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/warenkorb")({
  head: () => ({
    meta: [{ title: `Warenkorb | ${site.name}` }, { name: "robots", content: "noindex, follow" }],
  }),
  component: CartPage,
});

/** Warenkorb als Seite (der Drawer im Header zeigt dieselben Positionen). */
function CartPage() {
  const { t, locale, pickL } = useI18n();
  const cart = useCart();

  return (
    <PublicShell>
      <section className={cn(shell, "pt-14 pb-20")}>
        <PageHead eyebrow={t.bag.items(cart.count)} title={t.cart.title} />

        {cart.items.length === 0 ? (
          <div className="mt-12 border-t border-hairline py-16 text-center">
            <Lede>{t.cart.empty}</Lede>
            <Link to="/torten" className={cn(buttonVariants({ variant: "secondary" }), "mt-6")}>
              {t.cart.emptyCta}
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-12">
            <ul className="border-t border-hairline">
              {cart.items.map((item) => (
                <li
                  key={item.key}
                  className="grid grid-cols-[88px_1fr] gap-5 border-b border-hairline py-5 sm:grid-cols-[112px_1fr_auto]"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-sunken">
                    <Placeholder imageKey={item.imageKey} />
                  </div>
                  <div className="min-w-0">
                    <Link
                      to="/torten/$slug"
                      params={{ slug: item.slug }}
                      className="text-ink ck-subheading hover:text-brand"
                    >
                      {pickL(item.nameDe, item.nameRu)}
                    </Link>
                    <dl className="mt-1.5 text-ink-muted ck-body-sm">
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
                    <div className="mt-3 flex items-center gap-4">
                      <div
                        className="flex items-center gap-1 rounded-sm border border-hairline bg-surface"
                        aria-label={t.product.quantity}
                      >
                        <IconButton
                          size="sm"
                          label="−"
                          onClick={() => cart.setQuantity(item.key, item.quantity - 1)}
                        >
                          <MinusIcon className="size-3" strokeWidth={1.5} />
                        </IconButton>
                        <span className="w-5 text-center tabular-nums ck-body-sm">
                          {item.quantity}
                        </span>
                        <IconButton
                          size="sm"
                          label="+"
                          onClick={() => cart.setQuantity(item.key, item.quantity + 1)}
                        >
                          <PlusIcon className="size-3" strokeWidth={1.5} />
                        </IconButton>
                      </div>
                      <Button variant="link" size="sm" onClick={() => cart.remove(item.key)}>
                        {t.cart.remove}
                      </Button>
                    </div>
                  </div>
                  <Price className="col-start-2 sm:col-start-3 sm:text-right">
                    {formatPrice(item.unitPriceCents * item.quantity, locale)}
                  </Price>
                </li>
              ))}
            </ul>

            <aside className="h-fit rounded-md border border-t-2 border-hairline border-t-accent bg-surface p-6 lg:sticky lg:top-24">
              <Eyebrow>{t.confirmation.summary}</Eyebrow>
              <div className="mt-5 flex items-baseline justify-between">
                <span className="ck-label text-ink-muted">{t.cart.subtotal}</span>
                <Price className="text-2xl">{formatPrice(cart.subtotalCents, locale)}</Price>
              </div>
              <p className="mt-3 text-ink-muted ck-body-sm">
                {t.bag.deliveryNote(
                  formatPrice(site.shop.deliveryFeeCents, locale),
                  site.shop.deliveryRadiusKm,
                )}
              </p>
              <Link to="/kasse" className={cn(buttonVariants({ size: "lg", block: true }), "mt-6")}>
                {t.cart.checkout}
                <ArrowRightIcon aria-hidden strokeWidth={1.5} />
              </Link>
              <div className="mt-4 text-center">
                <Link to="/torten" className={buttonVariants({ variant: "link", size: "sm" })}>
                  {t.cart.continueShopping}
                </Link>
              </div>
            </aside>
          </div>
        )}
      </section>
    </PublicShell>
  );
}
