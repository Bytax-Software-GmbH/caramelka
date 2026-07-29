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

/**
 * Editorial-Produktkarte: Foto, gesperrter Name, Ab-Preis. Kein Container,
 * kein Schatten. Die Karte ist eine Spalte, keine Box.
 */
export function ProductCard({ product }: { product: ProductCardData }) {
  const { t, locale, pickL } = useI18n();
  const name = pickL(product.nameDe, product.nameRu);
  return (
    <Link
      to="/torten/$slug"
      params={{ slug: product.slug }}
      className="group flex flex-col gap-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-caramel"
    >
      <div className="relative overflow-hidden">
        <Placeholder
          imageKey={product.imageKey}
          alt={name}
          className="aspect-[4/5] transition-transform duration-[900ms] ease-[var(--ease-lux)] group-hover:scale-[1.045]"
        />
        {/* Haarlinie, die beim Hover einläuft */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-3 border border-white/0 transition-[border-color] duration-500 ease-[var(--ease-lux)] group-hover:border-white/45"
        />
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t border-rule pt-3">
        <span className="text-[0.78rem] font-semibold tracking-[0.14em] text-ink uppercase transition-colors duration-300 group-hover:text-ink-3">
          {name}
        </span>
        {product.fromPriceCents != null && (
          <span className="ck-price text-body-l whitespace-nowrap text-ink-2">
            <span className="mr-1.5 font-sans text-[0.65rem] tracking-[0.1em] text-ink-3 uppercase">
              {t.common.from}
            </span>
            {formatPrice(product.fromPriceCents, locale)}
          </span>
        )}
      </div>
    </Link>
  );
}
