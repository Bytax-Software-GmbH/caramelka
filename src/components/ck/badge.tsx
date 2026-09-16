import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "#/lib/utils";

/** Statusmarke 22 px hoch, versal und gesperrt. */
const badgeCva = cva(
  "inline-flex h-[22px] items-center gap-1.5 rounded-xs px-2.5 ck-eyebrow tracking-label whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-sunken text-ink-muted",
        brand: "bg-primary text-primary-contrast",
        accent: "bg-accent text-burgundy-900",
        outline: "border border-hairline-accent bg-surface text-brand",
        success: "bg-success-bg text-success",
        warning: "bg-warning-bg text-warning",
        error: "bg-error-bg text-error",
        info: "bg-info-bg text-info",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeCva>["tone"]>;

export const badgeVariants = (options?: VariantProps<typeof badgeCva>) => cn(badgeCva(options));

export function Badge({
  tone,
  dot,
  className,
  children,
  ...rest
}: React.ComponentProps<"span"> & VariantProps<typeof badgeCva> & { dot?: boolean }) {
  return (
    <span className={cn(badgeCva({ tone }), className)} {...rest}>
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
