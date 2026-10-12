import { CheckIcon } from "lucide-react";
import { useId } from "react";

import { cn } from "#/lib/utils";

/**
 * Auswahlkarte für Formulare: natives Radio/Checkbox in einem <label>,
 * optional mit Bild. Gewählt bekommt sie die roségoldene Kante und den
 * weichen Akzentgrund wie die Radio-Karte. Pfeiltasten und Screenreader
 * funktionieren über das native Element; der Titel ist der Name, der Rest
 * die Beschreibung.
 */
export function ChoiceCard({
  type = "radio",
  title,
  description,
  meta,
  footnote,
  media,
  className,
  ...rest
}: Omit<React.ComponentProps<"input">, "type" | "title"> & {
  type?: "radio" | "checkbox";
  title: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  footnote?: React.ReactNode;
  media?: React.ReactNode;
}) {
  const titleId = useId();
  const detailsId = useId();
  const hasDetails = Boolean(description || meta || footnote);
  return (
    <label
      className={cn(
        "group relative flex cursor-pointer overflow-hidden rounded-sm border border-hairline bg-surface text-ink transition-[border-color,background-color] duration-(--dur-fast) ease-out hover:border-hairline-accent has-checked:border-hairline-accent has-checked:bg-accent-soft has-focus-visible:shadow-(--focus-ring) has-disabled:cursor-not-allowed has-disabled:opacity-50",
        media ? "flex-row sm:flex-col" : "flex-col",
        className,
      )}
    >
      <input
        type={type}
        className="peer sr-only"
        aria-labelledby={titleId}
        aria-describedby={hasDetails ? detailsId : undefined}
        {...rest}
      />
      {media && (
        <span className="relative block w-28 shrink-0 overflow-hidden bg-sunken sm:aspect-[4/3] sm:w-full">
          {media}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-3.5">
        <span className="flex items-start justify-between gap-3">
          <span id={titleId} className="font-medium ck-body">
            {title}
          </span>
          <span
            aria-hidden
            className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full border border-hairline-strong bg-surface text-transparent transition-colors duration-(--dur-fast) ease-out group-has-checked:border-primary group-has-checked:bg-primary group-has-checked:text-primary-contrast"
          >
            <CheckIcon className="size-3" strokeWidth={2.5} />
          </span>
        </span>
        {hasDetails && (
          <span id={detailsId} className="flex flex-1 flex-col gap-1">
            {description && <span className="text-ink-muted ck-body-sm">{description}</span>}
            {(meta || footnote) && (
              <span className="mt-auto flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pt-1">
                {footnote && <span className="text-ink-subtle ck-body-sm">{footnote}</span>}
                {meta && <span className="ml-auto text-md text-brand ck-price">{meta}</span>}
              </span>
            )}
          </span>
        )}
      </span>
    </label>
  );
}
