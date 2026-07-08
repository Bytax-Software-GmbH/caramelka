import { cn } from "#/lib/utils";

/** Uppercase-Zeile über Überschriften (Design 1a). */
export function Kicker({
  children,
  onDark = false,
  className,
}: {
  children: React.ReactNode;
  onDark?: boolean;
  className?: string;
}) {
  return <div className={cn("ck-kicker", onDark && "text-gold", className)}>{children}</div>;
}

/** Editorial-Überschrift in der Display-Serif (Playfair Display). */
export function SectionTitle({
  children,
  as: Tag = "h2",
  onDark = false,
  className,
}: {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  onDark?: boolean;
  className?: string;
}) {
  return (
    <Tag
      className={cn(
        "ck-display text-4xl leading-[1.08] md:text-[42px]",
        onDark ? "text-cream-on-dark" : "text-espresso",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

const pillBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[12.5px] font-semibold uppercase tracking-[0.12em] transition-[background-color,border-color,color,transform,letter-spacing] duration-500 ease-[var(--ease-lux)] hover:tracking-[0.16em] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-caramel disabled:pointer-events-none disabled:opacity-50";

export const pillVariants = {
  primary: cn(pillBase, "bg-espresso text-creme hover:bg-caramel-deep"),
  outline: cn(
    pillBase,
    "border border-espresso/35 text-espresso hover:border-espresso hover:bg-espresso/5",
  ),
  gold: cn(pillBase, "border border-gold text-gold hover:bg-gold hover:text-dark"),
  caramel: cn(pillBase, "bg-caramel text-creme hover:bg-caramel-deep"),
} as const;

/** Pill-Button/-Link im Stil der Directions. Für Links: className an <Link> geben. */
export function Pill({
  variant = "primary",
  className,
  ...props
}: React.ComponentProps<"button"> & { variant?: keyof typeof pillVariants }) {
  return <button type="button" className={cn(pillVariants[variant], className)} {...props} />;
}

/** Feines Gold-Ornament als Sektions-Trenner. */
export function Ornament({ onDark = false, className }: { onDark?: boolean; className?: string }) {
  const line = onDark ? "bg-gold/35" : "bg-caramel/30";
  const star = onDark ? "text-gold" : "text-caramel";
  return (
    <div aria-hidden className={cn("flex items-center justify-center gap-4", className)}>
      <span className={cn("h-px w-12", line)} />
      <span className={cn("text-[11px] leading-none", star)}>✦</span>
      <span className={cn("h-px w-12", line)} />
    </div>
  );
}

/** Dünne Linie mit zentriertem Titel (Design 1c). */
export function RuledTitle({
  children,
  onDark = false,
}: {
  children: React.ReactNode;
  onDark?: boolean;
}) {
  const line = onDark ? "bg-gold/30" : "bg-caramel/30";
  return (
    <div className="flex items-center gap-6">
      <div className={cn("h-px flex-1", line)} />
      <h2
        className={cn(
          "ck-display text-2xl tracking-[0.1em] uppercase md:text-[28px]",
          onDark ? "text-cream-on-dark" : "text-espresso",
        )}
      >
        {children}
      </h2>
      <div className={cn("h-px flex-1", line)} />
    </div>
  );
}
