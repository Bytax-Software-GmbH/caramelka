/**
 * Termin-Logik in Europe/Berlin: Vorlaufzeit, offene Tage, Zeitfenster.
 * Reine Funktionen mit `now` als Parameter, damit Formular und Server exakt
 * gleich rechnen (der Server ist maßgeblich).
 */
import type { OrderKind } from "#/lib/db/schema/caramelka.schema";
import { site } from "#/lib/site";

/** Wie weit im Voraus ein Termin höchstens liegen darf. */
export const MAX_DAYS_AHEAD = 365;

const berlinFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: site.shop.timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Kalenderdatum und Minuten seit Mitternacht in Berlin für einen Zeitpunkt. */
export function berlinClock(moment: Date): { isoDate: string; minutes: number } {
  const parts = berlinFormat.formatToParts(moment);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  return {
    isoDate: `${part("year")}-${part("month")}-${part("day")}`,
    minutes: Number(part("hour")) * 60 + Number(part("minute")),
  };
}

/** Wochentag (0 = Sonntag) eines ISO-Datums, unabhängig von der Zeitzone. */
export function weekdayOf(isoDate: string): number {
  return new Date(`${isoDate}T12:00:00Z`).getUTCDay();
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function toMinutes(hhmm: string): number {
  const [hours = 0, minutes = 0] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

function fromMinutes(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Alle Zeitfenster eines offenen Tages, z. B. "09:00" bis "17:30". */
export function daySlots(): string[] {
  const { open, close } = site.shop.openingHours;
  const slots: string[] = [];
  for (let m = toMinutes(open); m < toMinutes(close); m += site.shop.slotStepMinutes) {
    slots.push(fromMinutes(m));
  }
  return slots;
}

/** Geschlossen? Events zählen nur Urlaubstage, das Fest darf auch sonntags sein. */
export function isClosedDay(isoDate: string, kind: OrderKind): boolean {
  if (site.shop.closedDates.includes(isoDate)) return true;
  if (kind === "event") return false;
  return site.shop.closedWeekdays.includes(weekdayOf(isoDate));
}

/** Vorlaufzeit der Art, außer ein beteiligtes Produkt braucht länger. */
export function requiredLeadTimeHours(kind: OrderKind, productLeadTimes: number[] = []): number {
  return Math.max(site.shop.leadTimeHoursByKind[kind], ...productLeadTimes);
}

/** Frühester Zeitpunkt nach Vorlaufzeit, als Berliner Datum + Minuten. */
function earliestMoment(leadHours: number, now: Date) {
  return berlinClock(new Date(now.getTime() + leadHours * 3_600_000));
}

/** Buchbare Zeitfenster an einem Datum; leer = Tag nicht buchbar. */
export function slotsFor(isoDate: string, kind: OrderKind, leadHours: number, now: Date): string[] {
  if (isClosedDay(isoDate, kind)) return [];
  const earliest = earliestMoment(leadHours, now);
  if (isoDate < earliest.isoDate) return [];
  if (isoDate > addDays(berlinClock(now).isoDate, MAX_DAYS_AHEAD)) return [];
  const slots = daySlots();
  if (isoDate > earliest.isoDate) return slots;
  return slots.filter((slot) => toMinutes(slot) >= earliest.minutes);
}

/** Ist das Datum grundsätzlich wählbar? Events brauchen kein Zeitfenster. */
export function isBookableDate(
  isoDate: string,
  kind: OrderKind,
  leadHours: number,
  now: Date,
): boolean {
  if (kind !== "event") return slotsFor(isoDate, kind, leadHours, now).length > 0;
  return (
    !isClosedDay(isoDate, kind) &&
    isoDate >= earliestMoment(leadHours, now).isoDate &&
    isoDate <= addDays(berlinClock(now).isoDate, MAX_DAYS_AHEAD)
  );
}

/** Erstes wählbares Datum, z. B. als Startmonat im Kalender. */
export function earliestBookableDate(kind: OrderKind, leadHours: number, now: Date): string {
  let candidate = earliestMoment(leadHours, now).isoDate;
  for (let i = 0; i < 60; i++) {
    if (isBookableDate(candidate, kind, leadHours, now)) return candidate;
    candidate = addDays(candidate, 1);
  }
  return candidate;
}

/** Prüft Datum + Zeitfenster. "date" = Tag nicht buchbar, "time" = Zeit fehlt/ungültig. */
export function checkSchedule(
  input: { kind: OrderKind; date: string; time?: string | null },
  leadHours: number,
  now: Date,
): "ok" | "date" | "time" {
  if (!isBookableDate(input.date, input.kind, leadHours, now)) return "date";
  if (input.kind === "event") return "ok";
  const slots = slotsFor(input.date, input.kind, leadHours, now);
  return input.time && slots.includes(input.time) ? "ok" : "time";
}

/** Versatz Berlin gegenüber UTC in Minuten zu einem Zeitpunkt (+60 im Winter, +120 im Sommer). */
function berlinOffsetMinutes(at: Date): number {
  const whole = new Date(Math.floor(at.getTime() / 60_000) * 60_000);
  const clock = berlinClock(whole);
  const [year = 0, month = 1, day = 1] = clock.isoDate.split("-").map(Number);
  const wall = Date.UTC(year, month - 1, day) + clock.minutes * 60_000;
  return Math.round((wall - whole.getTime()) / 60_000);
}

/** Berliner Wanduhrzeit ("2026-10-25", "14:30") als echter Zeitpunkt, sommerzeitfest. */
export function berlinWallTimeToUtc(isoDate: string, hhmm: string): Date {
  const [year = 0, month = 1, day = 1] = isoDate.split("-").map(Number);
  const guess = Date.UTC(year, month - 1, day) + toMinutes(hhmm) * 60_000;
  const first = berlinOffsetMinutes(new Date(guess));
  const second = berlinOffsetMinutes(new Date(guess - first * 60_000));
  return new Date(guess - second * 60_000);
}
