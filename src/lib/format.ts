import type { Locale } from "#/lib/i18n";

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

/**
 * Frühestes bestellbares Datum: jetzt + Vorlaufzeit, dann auf den nächsten
 * offenen Tag (Mo–Sa) vorrücken.
 */
export function earliestDate(leadTimeHours: number, closedWeekdays: number[]): Date {
  const d = new Date(Date.now() + leadTimeHours * 3_600_000);
  while (closedWeekdays.includes(d.getDay())) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}
