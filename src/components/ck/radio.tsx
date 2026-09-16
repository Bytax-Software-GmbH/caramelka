import { cn } from "#/lib/utils";

/**
 * Radio, wahlweise als Karte (`card`): Haarlinien-Box, die gewählt eine
 * roségoldene Kante und weichen Akzentgrund bekommt. `meta` steht rechts
 * in der Preis-Serif (Versand, Größenpreis).
 */
export function Radio({
  label,
  description,
  card,
  meta,
  className,
  ...rest
}: React.ComponentProps<"input"> & {
  label?: React.ReactNode;
  description?: React.ReactNode;
  card?: boolean;
  meta?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "group relative inline-flex cursor-pointer items-start gap-3 text-ink transition-[border-color,background-color] duration-(--dur-fast) ease-out ck-body-sm has-disabled:cursor-not-allowed has-disabled:opacity-50",
        card &&
          "w-full rounded-sm border border-hairline bg-surface px-4 py-3.5 has-checked:border-hairline-accent has-checked:bg-accent-soft",
        className,
      )}
    >
      <input type="radio" className="peer sr-only" {...rest} />
      <span
        aria-hidden
        className="mt-px grid size-[18px] shrink-0 place-items-center rounded-full border border-hairline-strong bg-surface transition-[border-color] duration-(--dur-fast) ease-out group-hover:border-hairline-accent peer-checked:border-primary peer-focus-visible:shadow-(--focus-ring) peer-checked:[&>span]:scale-100"
      >
        <span className="size-2 scale-0 rounded-full bg-primary transition-transform duration-(--dur-fast) ease-out" />
      </span>
      {(label || description) && (
        <span>
          {label}
          {description && <span className="mt-0.5 block text-ink-muted">{description}</span>}
        </span>
      )}
      {meta && <span className="ml-auto text-md text-brand ck-price">{meta}</span>}
    </label>
  );
}
