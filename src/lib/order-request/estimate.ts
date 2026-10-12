/**
 * Preisschätzung für das Anfrage-Formular. Dieselbe Funktion rechnet im
 * Browser (Anzeige "ca. …") und auf dem Server (gespeicherter Schätzwert).
 * Der verbindliche Endpreis kommt erst mit der Bestätigung.
 */
import type { OrderKind } from "#/lib/db/schema/caramelka.schema";
import { site } from "#/lib/site";

export interface EstimateCatalog {
  fillings: ReadonlyArray<{ id: number; active: boolean; pricePerKgCents: number | null }>;
  products: ReadonlyArray<{
    id: number;
    active: boolean;
    orderKind: OrderKind;
    fillingSelectable: boolean;
    sizes: ReadonlyArray<{ id: number; priceCents: number }>;
  }>;
}

export type EstimateInput =
  | {
      kind: "cake";
      fulfilment: "pickup" | "delivery";
      items: ReadonlyArray<{ fillingId: number; weightGrams: number }>;
    }
  | {
      kind: "dessert";
      fulfilment: "pickup" | "delivery";
      items: ReadonlyArray<{
        productId: number;
        sizeId: number;
        fillingId: number | null;
        quantity: number;
      }>;
    }
  | { kind: "event" };

export interface EstimateLine {
  /** Cake: €/kg, Dessert: Preis der Größe. 0 = noch kein Preis hinterlegt. */
  unitPriceCents: number;
  totalCents: number;
  priced: boolean;
}

export interface Estimate {
  lines: EstimateLine[];
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  /** false, wenn mindestens einer Position ein Preis fehlt (dann "Preis folgt"). */
  complete: boolean;
}

export type EstimateResult =
  | { ok: true; estimate: Estimate }
  | { ok: false; code: "FILLING_UNAVAILABLE" | "PRODUCT_UNAVAILABLE"; index: number };

export function computeEstimate(input: EstimateInput, catalog: EstimateCatalog): EstimateResult {
  if (input.kind === "event") {
    return {
      ok: true,
      estimate: {
        lines: [],
        subtotalCents: 0,
        deliveryFeeCents: 0,
        totalCents: 0,
        complete: false,
      },
    };
  }

  const fillingById = new Map(catalog.fillings.map((f) => [f.id, f]));
  const productById = new Map(catalog.products.map((p) => [p.id, p]));
  const lines: EstimateLine[] = [];

  if (input.kind === "cake") {
    for (const [index, item] of input.items.entries()) {
      const filling = fillingById.get(item.fillingId);
      if (!filling?.active) return { ok: false, code: "FILLING_UNAVAILABLE", index };
      const perKg = filling.pricePerKgCents;
      lines.push({
        unitPriceCents: perKg ?? 0,
        totalCents: perKg === null ? 0 : Math.round((item.weightGrams * perKg) / 1000),
        priced: perKg !== null,
      });
    }
  } else {
    for (const [index, item] of input.items.entries()) {
      const product = productById.get(item.productId);
      const size = product?.sizes.find((s) => s.id === item.sizeId);
      if (!product?.active || product.orderKind !== "dessert" || !size) {
        return { ok: false, code: "PRODUCT_UNAVAILABLE", index };
      }
      if (product.fillingSelectable) {
        const filling = item.fillingId === null ? undefined : fillingById.get(item.fillingId);
        if (!filling?.active) return { ok: false, code: "FILLING_UNAVAILABLE", index };
      }
      lines.push({
        unitPriceCents: size.priceCents,
        totalCents: size.priceCents * item.quantity,
        priced: true,
      });
    }
  }

  const subtotalCents = lines.reduce((sum, line) => sum + line.totalCents, 0);
  const deliveryFeeCents = input.fulfilment === "delivery" ? site.shop.deliveryFeeCents : 0;
  return {
    ok: true,
    estimate: {
      lines,
      subtotalCents,
      deliveryFeeCents,
      totalCents: subtotalCents + deliveryFeeCents,
      complete: lines.every((line) => line.priced),
    },
  };
}

/** Schätzungen auf ganze Euro runden, damit Formular und E-Mail dieselbe Zahl zeigen. */
export function roundEstimate(cents: number): number {
  return Math.round(cents / 100) * 100;
}

/** Ungefähre Portionen für ein Tortengewicht. */
export function portionsFor(weightGrams: number): number {
  return Math.max(1, Math.round(weightGrams / site.shop.cake.gramsPerPortion));
}
