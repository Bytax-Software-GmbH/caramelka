import { Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";

import { Badge } from "#/components/ck/badge";
import {
  Card,
  CardBody,
  CardDescription,
  CardEyebrow,
  CardFooter,
  CardMedia,
  CardPrice,
  CardTitle,
} from "#/components/ck/card";
import { Placeholder } from "#/components/ck/placeholder";
import { formatPrice } from "#/lib/format";
import { useI18n } from "#/lib/i18n";

export interface ProductCardData {
  slug: string;
  nameDe: string;
  nameRu: string;
  imageKey: string;
  fromPriceCents: number | null;
  leadTimeHours?: number;
  featured?: boolean;
}

/**
 * Produktkarte des Design Systems: Foto 4:5, Eyebrow, Name in der Serif,
 * Vorlauf, Ab-Preis. Der Titel-Link deckt die ganze Karte ab.
 */
export function ProductCard({ product, eyebrow }: { product: ProductCardData; eyebrow?: string }) {
  const { t, locale, pickL } = useI18n();
  const name = pickL(product.nameDe, product.nameRu);
  return (
    <Card interactive className="h-full">
      <CardMedia
        corner={
          product.featured ? <Badge tone="accent">{t.catalog.featuredBadge}</Badge> : undefined
        }
      >
        <Placeholder imageKey={product.imageKey} alt={name} />
      </CardMedia>
      <CardBody className="flex-1">
        {eyebrow && <CardEyebrow>{eyebrow}</CardEyebrow>}
        <CardTitle>
          <Link
            to="/torten/$slug"
            params={{ slug: product.slug }}
            className="text-inherit after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {name}
          </Link>
        </CardTitle>
        {product.leadTimeHours != null && (
          <CardDescription>{t.catalog.leadTime(product.leadTimeHours)}</CardDescription>
        )}
        <CardFooter className="mt-auto pt-3">
          {product.fromPriceCents != null ? (
            <CardPrice>
              <span className="mr-1.5 ck-eyebrow text-ink-subtle">{t.common.from}</span>
              {formatPrice(product.fromPriceCents, locale)}
            </CardPrice>
          ) : (
            <span />
          )}
          <span className="inline-flex items-center gap-1.5 ck-label text-rosegold-600 transition-[gap] duration-(--dur-base) ease-out group-hover/card:gap-2.5">
            {t.catalog.view}
            <ArrowRightIcon aria-hidden strokeWidth={1.5} className="size-3.5" />
          </span>
        </CardFooter>
      </CardBody>
    </Card>
  );
}
