import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

import { iconButtonVariants } from "#/components/ck/icon-button";
import { cn } from "#/lib/utils";

/**
 * Kalender (react-day-picker, angelegt per `pnpm ui add calendar`) im
 * Lily-Stil: fast eckige Zellen, gewählt in Burgund, heute mit roségoldener
 * Haarlinie, gesperrte Tage gedämpft. Navigation über ck-Icon-Buttons.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = false,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaults = getDefaultClassNames();
  const navButton = cn(
    iconButtonVariants({ variant: "outline", size: "sm" }),
    "aria-disabled:pointer-events-none aria-disabled:opacity-35",
  );
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-full", className)}
      classNames={{
        root: cn("relative w-full", defaults.root),
        months: cn("relative flex flex-col", defaults.months),
        month: cn("flex w-full flex-col gap-3", defaults.month),
        nav: cn("absolute inset-x-0 top-0 flex items-center justify-between", defaults.nav),
        button_previous: cn(navButton, defaults.button_previous),
        button_next: cn(navButton, defaults.button_next),
        month_caption: cn("flex h-9 items-center justify-center", defaults.month_caption),
        caption_label: cn("ck-label text-brand", defaults.caption_label),
        month_grid: cn("w-full border-collapse", defaults.month_grid),
        weekdays: cn("flex", defaults.weekdays),
        weekday: cn("flex-1 py-1 text-center ck-eyebrow text-ink-subtle", defaults.weekday),
        week: cn("mt-1 flex w-full", defaults.week),
        day: cn("flex-1 p-0.5 text-center", defaults.day),
        day_button: cn(
          "mx-auto grid aspect-square w-full max-w-11 place-items-center rounded-xs border border-transparent text-ink tabular-nums transition-[background-color,border-color,color] duration-(--dur-fast) ease-out outline-none ck-body-sm hover:border-hairline-accent focus-visible:shadow-(--focus-ring) disabled:pointer-events-none",
          defaults.day_button,
        ),
        selected: cn(
          "[&>button]:border-primary [&>button]:bg-primary [&>button]:text-primary-contrast [&>button]:hover:border-primary",
          defaults.selected,
        ),
        today: cn("[&>button]:border-hairline-accent", defaults.today),
        disabled: cn("[&>button]:text-ink-subtle [&>button]:opacity-45", defaults.disabled),
        outside: cn("[&>button]:text-ink-subtle", defaults.outside),
        hidden: cn("invisible", defaults.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass }) =>
          orientation === "left" ? (
            <ChevronLeftIcon strokeWidth={1.5} className={cn("size-4", chevronClass)} />
          ) : (
            <ChevronRightIcon strokeWidth={1.5} className={cn("size-4", chevronClass)} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
