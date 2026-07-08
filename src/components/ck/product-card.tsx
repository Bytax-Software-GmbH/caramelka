import { Link } from "@tanstack/react-router";

import { Placeholder } from "#/components/ck/placeholder";
import { formatPrice } from "#/lib/format";
import { useI18n } from "#/lib/i18n";

export interface ProductCardData {
  slug: string;
  nameDe: string;
  nameRu: string;
  imageKey: string;
  fromPriceCents: number | null;
}

/** Editorial-Produktkarte (Direction 1a): Bild, gesperrter Name, ab-Preis. */
export function ProductCard({ product }: { product: ProductCardData }) {
  const { t, locale, pickL } = useI18n();
  return (
    <Link
      to="/torten/$slug"
      params={{ slug: product.slug }}
      className="group flex flex-col gap-3.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-caramel"
    >
      <div className="relative overflow-hidden rounded-[4px]">
        <Placeholder
          imageKey={product.imageKey}
          className="aspect-square transition-transform duration-700 ease-[var(--ease-lux)] group-hover:scale-[1.04]"
        />
        {/* Gold-Hairline, die beim Hover einblendet */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-2.5 border border-gold/0 transition-[border-color] duration-500 ease-[var(--ease-lux)] group-hover:border-gold/60"
        />
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-semibold tracking-[0.14em] text-espresso uppercase transition-colors duration-300 group-hover:text-caramel-deep">
          {pickL(product.nameDe, product.nameRu)}
        </span>
        <span className="ck-price text-[17px] whitespace-nowrap text-espresso/70">
          {product.fromPriceCents != null ? (
            <>
              <span className="mr-1 font-sans text-[11px] tracking-[0.08em] text-espresso/45 uppercase">
                {t.common.from}
              </span>
              {formatPrice(product.fromPriceCents, locale)}
            </>
          ) : (
            "—"
          )}
        </span>
      </div>
    </Link>
  );
}
