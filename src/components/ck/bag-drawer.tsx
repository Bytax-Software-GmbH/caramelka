import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, MinusIcon, PlusIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button, buttonVariants } from "#/components/ck/button";
import { Dialog } from "#/components/ck/dialog";
import { IconButton } from "#/components/ck/icon-button";
import { Placeholder } from "#/components/ck/placeholder";
import { Eyebrow, Price } from "#/components/ck/primitives";
import { useBagDrawer } from "#/lib/bag-drawer";
import { useCart } from "#/lib/cart";
import { formatPrice } from "#/lib/format";
import { useI18n } from "#/lib/i18n";
import { site } from "#/lib/site";
import { cn } from "#/lib/utils";

/**
 * Warenkorb als Drawer von rechts, 440 px, mit 2-px-Roségold-Kante.
 * Entfernen fragt über den Dialog nach. Escape und Scrim schließen.
 */
export function BagDrawer() {
  const { open, closeBag } = useBagDrawer();
  const cart = useCart();
  const { t, locale, pickL } = useI18n();
  const [confirm, setConfirm] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeBag();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closeBag]);

  return (
    <>
      <div className={cn("fixed inset-0 z-50", !open && "pointer-events-none")} aria-hidden={!open}>
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          onClick={closeBag}
          className={cn(
            "absolute inset-0 cursor-default bg-scrim transition-opacity duration-(--dur-base) ease-out",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <aside
          // Bewusst aside + ARIA statt <dialog>: Escape und Fokus werden hier
          // selbst gesteuert, <dialog> ohne showModal() bringt keine Fokusfalle.
          // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
          role="dialog"
          aria-modal="true"
          aria-label={t.bag.title}
          className={cn(
            "absolute inset-y-0 right-0 flex w-[440px] max-w-full flex-col border-l-2 border-accent bg-surface shadow-lg transition-transform duration-(--dur-slow) ease-out",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-hairline px-6 py-5">
            <div>
              <Eyebrow>{t.bag.title}</Eyebrow>
              <div className="mt-1 text-xl ck-title tracking-[0.06em] text-ink">
                {t.bag.items(cart.count)}
              </div>
            </div>
            <IconButton ref={closeRef} label={t.bag.close} onClick={closeBag}>
              <XIcon strokeWidth={1.5} />
            </IconButton>
          </div>

          <div className="flex-1 overflow-auto px-6 py-2">
            {cart.items.length === 0 ? (
              <div className="py-12 text-center">
                <p className="ck-lede text-ink-muted">{t.cart.empty}</p>
                <Link
                  to="/torten"
                  onClick={closeBag}
                  className={cn(buttonVariants({ variant: "secondary" }), "mt-6")}
                >
                  {t.cart.emptyCta}
                </Link>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.key}
                  className="grid grid-cols-[72px_1fr_auto] gap-4 border-b border-hairline py-4"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-sunken">
                    <Placeholder imageKey={item.imageKey} />
                  </div>
                  <div className="min-w-0">
                    <Link
                      to="/torten/$slug"
                      params={{ slug: item.slug }}
                      onClick={closeBag}
                      className="text-lg text-ink ck-subheading hover:text-brand"
                    >
                      {pickL(item.nameDe, item.nameRu)}
                    </Link>
                    <div className="mt-0.5 text-ink-muted ck-body-sm">
                      {pickL(item.sizeLabelDe, item.sizeLabelRu)}
                      {item.fillingNameDe &&
                        ` · ${pickL(item.fillingNameDe, item.fillingNameRu ?? item.fillingNameDe)}`}
                      {item.inscription && ` · „${item.inscription}“`}
                    </div>
                    <div className="mt-2.5 flex items-center gap-1">
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
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <Price>{formatPrice(item.unitPriceCents * item.quantity, locale)}</Price>
                    <Button variant="link" size="sm" onClick={() => setConfirm(item.key)}>
                      {t.cart.remove}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.items.length > 0 && (
            <div className="border-t border-hairline bg-page px-6 pt-5 pb-6">
              <div className="flex items-baseline justify-between">
                <span className="ck-label text-ink-muted">{t.cart.subtotal}</span>
                <Price className="text-2xl">{formatPrice(cart.subtotalCents, locale)}</Price>
              </div>
              <p className="mt-2 text-ink-muted ck-body-sm">
                {t.bag.deliveryNote(
                  formatPrice(site.shop.deliveryFeeCents, locale),
                  site.shop.deliveryRadiusKm,
                )}
              </p>
              <Link
                to="/kasse"
                onClick={closeBag}
                className={cn(buttonVariants({ size: "lg", block: true }), "mt-4")}
              >
                {t.cart.checkout}
                <ArrowRightIcon aria-hidden strokeWidth={1.5} />
              </Link>
              <div className="mt-3 text-center">
                <Button variant="link" size="sm" onClick={closeBag}>
                  {t.cart.continueShopping}
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>

      <Dialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        eyebrow={t.bag.title}
        title={t.bag.removeTitle}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              {t.bag.keep}
            </Button>
            <Button
              onClick={() => {
                if (confirm) cart.remove(confirm);
                setConfirm(null);
              }}
            >
              {t.cart.remove}
            </Button>
          </>
        }
      >
        <p className="text-ink-muted ck-body-sm">{t.bag.removeText}</p>
      </Dialog>
    </>
  );
}
