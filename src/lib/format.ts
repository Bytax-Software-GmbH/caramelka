import type { Locale } from "#/lib/i18n";
import { site } from "#/lib/site";

/** 4200 → "42 €" / "42,50 €" — ganze Beträge ohne Nachkommastellen. */
export function formatPrice(cents: number, locale: Locale = "de"): string {
  const hasFraction = cents % 100 !== 0;
  return new Intl.NumberFormat(locale === "ru" ? "ru-DE" : "de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(cents / 100);
}

/** "2026-07-10" → "Fr., 10. Juli 2026" bzw. russisches Pendant. */
export function formatDate(isoDate: string, locale: Locale = "de"): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "de-DE", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** ISO-Datum (yyyy-mm-dd) in lokaler Zeit. */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 2500 → "2,5 kg" bzw. "2,5 кг". */
export function formatWeight(grams: number, locale: Locale = "de"): string {
  const kg = new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "de-DE", {
    maximumFractionDigits: 1,
  }).format(grams / 1000);
  return `${kg} ${locale === "ru" ? "кг" : "kg"}`;
}

/** Zeitpunkt in Berliner Zeit: "Mi., 14. Oktober 2026 um 16:00 Uhr" bzw. russisches Pendant. */
export function formatDateTime(at: Date, locale: Locale = "de"): string {
  const text = new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "de-DE", {
    timeZone: site.shop.timeZone,
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(at);
  return locale === "ru" ? text : `${text} Uhr`;
}

/** "14:30" → "14:30 Uhr" (DE), im Russischen ohne Zusatz. */
export function formatTime(hhmm: string, locale: Locale = "de"): string {
  return locale === "ru" ? hhmm : `${hhmm} Uhr`;
}
