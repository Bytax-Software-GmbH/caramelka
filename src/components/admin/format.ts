/** Formatierung und Eingaben im Admin (Euro-Felder, Zeitstempel, Preisangaben). */
import type { OrderKind } from "#/lib/db/schema/caramelka.schema";
import { formatPrice } from "#/lib/format";
import { roundEstimate } from "#/lib/order-request/estimate";
import { site } from "#/lib/site";

const dateTimeFormat = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: site.shop.timeZone,
});

/** Zeitstempel in Berliner Zeit, z. B. "23.09.26, 14:05". */
export function formatDateTime(moment: Date): string {
  return dateTimeFormat.format(moment);
}

/**
 * Euro-Eingabe in Cent: "64", "64,5", "64,50", "1.234,50" oder "64.50".
 * null = leer oder ungültig.
 */
export function parseEuroToCents(input: string): number | null {
  let value = input.replace(/[€\s]/g, "");
  // Mit Komma ist der Punkt ein Tausendertrenner.
  if (value.includes(",")) value = value.replace(/\./g, "").replace(",", ".");
  const match = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) return null;
  const [, euros = "0", cents = ""] = match;
  return Number(euros) * 100 + Number(cents.padEnd(2, "0"));
}

/** Cent als Vorbelegung für ein Euro-Feld: 6400 → "64", 6450 → "64,50". */
export function centsToEuroInput(cents: number): string {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2).replace(".", ",");
}

export interface OrderPriceInput {
  kind: OrderKind;
  totalCents: number;
  finalTotalCents: number | null;
  estimateComplete: boolean;
}

/** Endpreis, sonst gerundete Schätzung aus dem Formular, sonst offen. */
export function orderPrice(order: OrderPriceInput): {
  type: "final" | "estimate" | "open";
  text: string;
} {
  if (order.finalTotalCents !== null) {
    return { type: "final", text: formatPrice(order.finalTotalCents) };
  }
  if (order.kind !== "event" && order.estimateComplete) {
    return { type: "estimate", text: `ca. ${formatPrice(roundEstimate(order.totalCents))}` };
  }
  return { type: "open", text: "offen" };
}
