/** Minimaler iCalendar-Termin (RFC 5545) für bestätigte Bestellungen. */
import { berlinWallTimeToUtc } from "#/lib/order-request/schedule";

export interface IcsEvent {
  uid: string;
  /** Erhöhen, wenn ein Termin geändert erneut verschickt wird. */
  sequence: number;
  date: string;
  /** "HH:MM" Berlin; ohne Zeit wird ein ganztägiger Termin angelegt. */
  time: string | null;
  durationMinutes: number;
  summary: string;
  description: string;
  location: string;
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function utcStamp(moment: Date): string {
  return moment
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/** Zeilen über 75 Byte falten (Folgezeilen beginnen mit Leerzeichen). */
function fold(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  for (const char of line) {
    const limit = parts.length === 0 ? 75 : 74;
    if (encoder.encode(current + char).length > limit) {
      parts.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.join("\r\n ");
}

export function buildIcs(event: IcsEvent, now: Date = new Date()): string {
  const timing = event.time
    ? (() => {
        const start = berlinWallTimeToUtc(event.date, event.time);
        const end = new Date(start.getTime() + event.durationMinutes * 60_000);
        return [`DTSTART:${utcStamp(start)}`, `DTEND:${utcStamp(end)}`];
      })()
    : [`DTSTART;VALUE=DATE:${event.date.replace(/-/g, "")}`];

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Caramelka//Bestellungen//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `SEQUENCE:${event.sequence}`,
    `DTSTAMP:${utcStamp(now)}`,
    ...timing,
    `SUMMARY:${escapeText(event.summary)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `LOCATION:${escapeText(event.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.map(fold).join("\r\n")}\r\n`;
}
