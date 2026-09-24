import { de as deLocale, ru as ruLocale } from "react-day-picker/locale";

import { Calendar } from "#/components/ui/calendar";
import { toIsoDate } from "#/lib/format";
import type { Locale } from "#/lib/i18n";
import { cn } from "#/lib/utils";

/**
 * Monatskalender, in dem nur buchbare Tage wählbar sind (Wochen ab
 * Montag, DE/RU). Arbeitet mit ISO-Daten ("2026-10-24"), damit keine
 * Zeitzonen durch das Formular wandern.
 */
export function DatePicker({
  value,
  onChange,
  isDisabled,
  locale,
  firstDate,
  lastDate,
  invalid,
  labelledBy,
  describedBy,
}: {
  value: string | null;
  onChange: (isoDate: string) => void;
  isDisabled: (isoDate: string) => boolean;
  locale: Locale;
  firstDate: string;
  lastDate: string;
  invalid?: boolean;
  labelledBy?: string;
  describedBy?: string;
}) {
  const selected = value ? new Date(`${value}T12:00:00`) : undefined;
  const startMonth = new Date(`${firstDate}T12:00:00`);
  return (
    <div
      // Ein <fieldset> würde mit seiner min-content-Breite den Kalender auf dem Handy sprengen.
      // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className={cn(
        "w-full max-w-[380px] rounded-sm border bg-surface p-3",
        invalid ? "border-error" : "border-hairline",
      )}
    >
      <Calendar
        mode="single"
        required
        selected={selected}
        onSelect={(date) => onChange(toIsoDate(date))}
        disabled={(date) => isDisabled(toIsoDate(date))}
        locale={locale === "ru" ? ruLocale : deLocale}
        weekStartsOn={1}
        startMonth={startMonth}
        endMonth={new Date(`${lastDate}T12:00:00`)}
        defaultMonth={selected ?? startMonth}
      />
    </div>
  );
}
