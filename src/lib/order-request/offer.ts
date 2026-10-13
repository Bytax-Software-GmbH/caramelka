/**
 * Preisabweichung bei der Bestätigung (Stufe 1, ohne Schema-Änderung).
 *
 * Liegt der Endpreis über der Schätzung aus dem Formular oder gab es dort
 * keine, ist die Bestätigung rechtlich kein Vertragsschluss, sondern ein neues
 * Angebot (§ 150 Abs. 2 BGB). Die Kundin bekommt dann eine Frist, bis zu der
 * sie kostenfrei absagen kann. Läuft sie ab, gilt der Preis als angenommen.
 * Reine Funktionen, laufen im Admin-Dialog und auf dem Server gleich.
 */
import type { OrderKind } from "#/lib/db/schema/caramelka.schema";
import { site } from "#/lib/site";

import { roundEstimate } from "./estimate";
import { berlinWallTimeToUtc, requiredLeadTimeHours } from "./schedule";

const HOUR = 60 * 60 * 1000;
/** Mindestens so lange darf die Kundin antworten, es sei denn, der Termin ist früher. */
export const OFFER_MIN_HOURS = 12;
/** Höchstens so lange, damit die Backstube rechtzeitig planen kann. */
export const OFFER_MAX_HOURS = 48;

export interface OfferSource {
  kind: OrderKind;
  estimateComplete: boolean;
  totalCents: number;
  desiredDate: string;
  desiredTime: string | null;
}

/** Schätzung, wie die Kundin sie im Formular gesehen hat (gerundet); null ohne Schätzung. */
export function shownEstimateCents(
  order: Pick<OfferSource, "kind" | "estimateComplete" | "totalCents">,
): number | null {
  if (order.kind === "event" || !order.estimateComplete) return null;
  return roundEstimate(order.totalCents);
}

/** Wahr, wenn die Bestätigung zu diesem Preis ein Angebot ist statt einer Annahme. */
export function isPriceOffer(
  order: Pick<OfferSource, "kind" | "estimateComplete" | "totalCents">,
  finalCents: number,
): boolean {
  if (order.kind === "event") return false;
  const shown = shownEstimateCents(order);
  return shown === null || finalCents > shown;
}

/**
 * Antwortfrist: 48 h ab jetzt, aber spätestens zum Beginn der Vorlaufzeit vor
 * dem Termin. Nie kürzer als 12 h, außer der Termin selbst liegt früher.
 */
export function offerResponseDeadline(
  order: Pick<OfferSource, "kind" | "desiredDate" | "desiredTime">,
  now: Date,
): Date {
  const desiredAt = berlinWallTimeToUtc(
    order.desiredDate,
    order.desiredTime ?? site.shop.openingHours.open,
  ).getTime();
  const leadStart = desiredAt - requiredLeadTimeHours(order.kind) * HOUR;
  const latest = Math.min(now.getTime() + OFFER_MAX_HOURS * HOUR, leadStart);
  const floor = Math.min(now.getTime() + OFFER_MIN_HOURS * HOUR, desiredAt);
  // Auf die volle Stunde aufrunden, damit in der Mail "16:00 Uhr" steht statt "15:54 Uhr".
  const rounded = Math.ceil(Math.max(latest, floor) / HOUR) * HOUR;
  return new Date(Math.min(rounded, desiredAt));
}
