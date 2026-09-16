import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "#/lib/utils";

/**
 * Call-to-Action des Design Systems: eine Primär-Aktion pro Ansicht,
 * secondary/ghost für den Rest. Labels werden automatisch versal und
 * gesperrt gesetzt, im Code stehen sie in Satzschreibweise.
 *
 * Varianten: primary (Burgund), accent (Roségold), secondary (Haarlinie),
 * ghost, link, inverse / inverse-solid auf Burgund. Größen 36 / 44 / 52.
 *
 * Für Links: `buttonVariants({ variant, size })` als className an <Link>.
 */
const buttonCva = cva(
  "inline-flex shrink-0 items-center justify-center gap-2.5 rounded-sm border border-transparent ck-label whitespace-nowrap transition-[background-color,color,border-color] duration-(--dur-fast) ease-out select-none disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      size: {
        sm: "h-9 px-3.5",
        md: "h-11 px-5.5",
        lg: "h-13 px-7.5 [--ck-label-size:var(--text-sm)]",
      },
      variant: {
        primary: "bg-primary text-primary-contrast hover:bg-primary-hover active:bg-primary-active",
        accent: "bg-accent text-accent-contrast hover:bg-accent-hover active:bg-accent-active",
        secondary: "border-hairline-accent text-brand hover:bg-accent-soft active:bg-rosegold-200",
        ghost: "text-ink hover:bg-sunken active:bg-cream-300",
        link: "h-auto rounded-none border-0 border-b border-hairline-accent px-0 text-brand hover:text-accent-hover",
        inverse:
          "border-hairline-inverse text-rosegold-300 hover:bg-rosegold-500/12 hover:text-rosegold-200 active:bg-rosegold-500/20",
        "inverse-solid": "bg-accent text-burgundy-900 hover:bg-rosegold-300 active:bg-rosegold-400",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonCva>;

/** Klassen einer Variante, konfliktbereinigt (h-auto der link-Variante schlägt h-11 usw.). */
export const buttonVariants = (options?: ButtonVariants) => cn(buttonCva(options));

export function Button({
  variant,
  size,
  block,
  icon,
  iconRight,
  className,
  children,
  type = "button",
  ...props
}: React.ComponentProps<"button"> &
  ButtonVariants & {
    icon?: React.ReactNode;
    iconRight?: React.ReactNode;
  }) {
  return (
    <button type={type} className={cn(buttonCva({ variant, size, block }), className)} {...props}>
      {icon}
      {children}
      {iconRight}
    </button>
  );
}
