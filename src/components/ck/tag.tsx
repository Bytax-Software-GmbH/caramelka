import { cva, type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";

import { cn } from "#/lib/utils";

/**
 * Filter-Tag: die einzige Pille im System (neben Zählern). Gewählt wird sie
 * burgund. Für Links: `tagVariants({ selected })` als className an <Link>.
 */
const tagCva = cva(
  "inline-flex h-8 items-center gap-2 rounded-full border border-hairline bg-surface px-3.5 whitespace-nowrap text-ink transition-[background-color,color,border-color] duration-(--dur-fast) ease-out ck-body-sm hover:border-hairline-accent disabled:cursor-default disabled:opacity-60 disabled:hover:border-hairline",
  {
    variants: {
      selected: {
        true: "border-primary bg-primary text-primary-contrast hover:border-primary",
      },
    },
  },
);

/** Klassen eines Tags, konfliktbereinigt. Für <Link className={tagVariants(...)}>. */
export const tagVariants = (options?: VariantProps<typeof tagCva>) => cn(tagCva(options));

export function Tag({
  selected,
  onRemove,
  onClick,
  className,
  children,
  ...rest
}: Omit<React.ComponentProps<"button">, "onClick"> &
  VariantProps<typeof tagCva> & {
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    onRemove?: () => void;
  }) {
  const isStatic = !onClick && !onRemove;
  return (
    <button
      type="button"
      onClick={onRemove && !onClick ? onRemove : onClick}
      aria-pressed={onClick ? !!selected : undefined}
      className={cn(tagCva({ selected }), isStatic && "cursor-default", className)}
      {...rest}
    >
      {children}
      {onRemove && <XIcon aria-hidden className="-mr-1 size-3 opacity-70" strokeWidth={2} />}
    </button>
  );
}
