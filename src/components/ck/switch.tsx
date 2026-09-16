import { cn } from "#/lib/utils";

/** Schalter 40 × 22, Knopf wird auf Burgund roségold. */
export function Switch({
  label,
  className,
  ...rest
}: React.ComponentProps<"input"> & { label?: React.ReactNode }) {
  return (
    <label
      className={cn(
        "relative inline-flex cursor-pointer items-center gap-3 text-ink ck-body-sm has-disabled:cursor-not-allowed has-disabled:opacity-50",
        className,
      )}
    >
      <input type="checkbox" className="peer sr-only" {...rest} />
      <span
        aria-hidden
        className="relative h-[22px] w-10 shrink-0 rounded-full bg-cream-400 transition-colors duration-(--dur-base) ease-out peer-checked:bg-primary peer-focus-visible:shadow-(--focus-ring) after:absolute after:top-0.5 after:left-0.5 after:size-[18px] after:rounded-full after:bg-surface after:shadow-sm after:transition-[transform,background-color] after:duration-(--dur-base) after:ease-out peer-checked:after:translate-x-[18px] peer-checked:after:bg-rosegold-300"
      />
      {label && <span>{label}</span>}
    </label>
  );
}
