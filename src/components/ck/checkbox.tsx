import { CheckIcon } from "lucide-react";

import { cn } from "#/lib/utils";

/** Kästchen 18 px, fast eckig; gefüllt in Burgund, wenn gewählt. */
export function Checkbox({
  label,
  description,
  className,
  ...rest
}: React.ComponentProps<"input"> & {
  label?: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "group relative inline-flex cursor-pointer items-start gap-3 text-ink ck-body-sm has-disabled:cursor-not-allowed has-disabled:opacity-50",
        className,
      )}
    >
      <input type="checkbox" className="peer sr-only" {...rest} />
      <span
        aria-hidden
        className="mt-px grid size-[18px] shrink-0 place-items-center rounded-xs border border-hairline-strong bg-surface text-transparent transition-all duration-(--dur-fast) ease-out group-hover:border-hairline-accent peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-contrast peer-focus-visible:shadow-(--focus-ring)"
      >
        <CheckIcon className="size-3" strokeWidth={2.5} />
      </span>
      {(label || description) && (
        <span>
          {label}
          {description && <span className="mt-0.5 block text-ink-muted">{description}</span>}
        </span>
      )}
    </label>
  );
}
