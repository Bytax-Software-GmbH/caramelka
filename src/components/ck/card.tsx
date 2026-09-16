import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "#/lib/utils";

/**
 * Produkt- und Inhaltskarte. Haarlinie statt Schatten; erst beim Hover
 * wird die Kante roségold und ein weicher Schatten kommt dazu. Das Medium
 * zoomt dabei 3 % über 520 ms.
 *
 * Zusammengesetzt aus Card, CardMedia, CardBody, CardEyebrow, CardTitle,
 * CardDescription, CardFooter und CardPrice. Ein Link im Titel mit
 * `after:absolute after:inset-0` macht die ganze Karte klickbar.
 */
const cardCva = cva(
  "group/card relative flex flex-col overflow-hidden rounded-md border border-hairline bg-surface text-ink transition-[border-color,box-shadow] duration-(--dur-base) ease-out",
  {
    variants: {
      variant: {
        outlined: "",
        elevated: "border-transparent shadow-md",
        flat: "border-transparent bg-transparent",
        inverse: "border-hairline-inverse bg-inverse text-on-inverse",
      },
      interactive: {
        true: "cursor-pointer focus-within:border-hairline-accent hover:border-hairline-accent hover:shadow-md",
      },
    },
    defaultVariants: { variant: "outlined" },
  },
);

export function Card({
  variant,
  interactive,
  className,
  ...rest
}: React.ComponentProps<"div"> & VariantProps<typeof cardCva>) {
  return (
    <div
      data-variant={variant ?? "outlined"}
      className={cn(cardCva({ variant, interactive }), className)}
      {...rest}
    />
  );
}

export function CardMedia({
  ratio = "4 / 5",
  corner,
  className,
  children,
}: {
  ratio?: string;
  corner?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{ aspectRatio: ratio }}
      className={cn(
        "relative overflow-hidden bg-sunken [&>img]:size-full [&>img]:object-cover [&>img]:transition-transform [&>img]:duration-(--dur-slow) [&>img]:ease-out group-hover/card:[&>img]:scale-[1.03]",
        className,
      )}
    >
      {children}
      {corner && <div className="absolute top-3 left-3 flex gap-1.5">{corner}</div>}
    </div>
  );
}

export function CardBody({ className, ...rest }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 px-5 pt-5 pb-6", className)} {...rest} />;
}

export function CardEyebrow({ className, ...rest }: React.ComponentProps<"div">) {
  return <div className={cn("ck-eyebrow text-rosegold-600", className)} {...rest} />;
}

export function CardTitle({
  as: Tag = "h3",
  className,
  ...rest
}: React.ComponentProps<"h3"> & { as?: "h2" | "h3" | "div" }) {
  return <Tag className={cn("text-inherit ck-subheading", className)} {...rest} />;
}

export function CardDescription({ className, ...rest }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-ink-muted ck-body-sm group-data-[variant=inverse]/card:text-on-inverse-muted",
        className,
      )}
      {...rest}
    />
  );
}

export function CardFooter({ className, ...rest }: React.ComponentProps<"div">) {
  return (
    <div className={cn("mt-3 flex items-center justify-between gap-3", className)} {...rest} />
  );
}

export function CardPrice({ className, ...rest }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "text-brand ck-price group-data-[variant=inverse]/card:text-rosegold-300",
        className,
      )}
      {...rest}
    />
  );
}
