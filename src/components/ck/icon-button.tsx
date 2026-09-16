import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "#/lib/utils";

/**
 * Quadratische Icon-Schaltfläche (36 / 44 / 52). `label` ist Pflicht und
 * wird zu aria-label und title. `badge` zeigt einen Zähler (Warenkorb).
 *
 * Für Links: `iconButtonVariants({ variant, size })` als className an <Link>.
 */
const iconButtonCva = cva(
  "relative inline-flex shrink-0 items-center justify-center rounded-sm border border-transparent bg-transparent text-ink transition-[background-color,color] duration-(--dur-fast) ease-out disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        ghost: "hover:bg-sunken active:bg-cream-300",
        outline: "border-hairline-accent text-brand hover:bg-accent-soft",
        filled: "bg-primary text-primary-contrast hover:bg-primary-hover",
        inverse: "text-rosegold-300 hover:bg-rosegold-500/12",
      },
      size: {
        sm: "size-9 [&_svg]:size-4",
        md: "size-11 [&_svg]:size-[18px]",
        lg: "size-13 [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "md",
    },
  },
);

export const iconButtonVariants = (options?: VariantProps<typeof iconButtonCva>) =>
  cn(iconButtonCva(options));

export function IconBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute top-1 right-1 h-4 min-w-4 rounded-full bg-accent px-1 text-center font-sans text-[10px] leading-4 font-medium text-burgundy-900">
      {count}
    </span>
  );
}

export function IconButton({
  variant,
  size,
  label,
  badge,
  className,
  children,
  type = "button",
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof iconButtonCva> & {
    label: string;
    badge?: number;
  }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(iconButtonCva({ variant, size }), className)}
      {...props}
    >
      {children}
      {badge != null && <IconBadge count={badge} />}
    </button>
  );
}
