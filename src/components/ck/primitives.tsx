import { cn } from "#/lib/utils";

/**
 * Uppercase-Zeile über einer Überschrift.
 *
 * Bewusst rationiert: maximal eine pro drei Sektionen. Wenn eine Sektion
 * ohne sie auskommt, kommt sie ohne sie aus. Die Position auf der Seite
 * kategorisiert die Sektion bereits.
 */
export function Kicker({
  children,
  onDark = false,
  className,
}: {
  children: React.ReactNode;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("ck-kicker", onDark && "text-ink-2-on-dark", className)}>{children}</div>
  );
}

/** Editorial-Überschrift in der Display-Serif (Playfair Display). */
export function SectionTitle({
  children,
  as: Tag = "h2",
  size = "l",
  onDark = false,
  className,
}: {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  size?: "xl" | "l" | "m";
  onDark?: boolean;
  className?: string;
}) {
  const scale = { xl: "text-display-xl", l: "text-display-l", m: "text-display-m" }[size];
  return (
    <Tag className={cn("ck-display", scale, onDark ? "text-ink-on-dark" : "text-ink", className)}>
      {children}
    </Tag>
  );
}

/** Fließtext in den drei definierten Stufen. Hierarchie über Farbe, nie Opacity. */
export function Body({
  children,
  size = "m",
  tone = "secondary",
  className,
}: {
  children: React.ReactNode;
  size?: "l" | "m" | "s";
  tone?: "primary" | "secondary" | "muted" | "on-dark" | "on-dark-muted";
  className?: string;
}) {
  const scale = { l: "text-body-l", m: "text-body-m", s: "text-body-s" }[size];
  const color = {
    primary: "text-ink",
    secondary: "text-ink-2",
    muted: "text-ink-3",
    "on-dark": "text-ink-on-dark",
    "on-dark-muted": "text-ink-2-on-dark",
  }[tone];
  return <p className={cn(scale, color, "text-pretty", className)}>{children}</p>;
}

/**
 * Pill-Buttons. Shape-Rule: alles Interaktive ist voll gerundet.
 * Kontraste gegen die jeweilige Fläche sind gegen WCAG AA geprüft.
 */
const pillBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-[0.78125rem] font-semibold whitespace-nowrap uppercase tracking-[0.14em] transition-[background-color,border-color,color,transform,letter-spacing] duration-500 ease-[var(--ease-lux)] hover:tracking-[0.18em] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-caramel disabled:pointer-events-none disabled:opacity-50";

export const pillVariants = {
  /** Graphit auf Milchweiß, 14.6:1. */
  primary: cn(pillBase, "bg-espresso text-creme hover:bg-espresso-2"),
  /** Haarlinie, füllt sich beim Hover. */
  outline: cn(pillBase, "border border-rule-strong text-ink hover:bg-espresso hover:text-creme"),
  /** Für dunkle Flächen: Silbergrau auf Graphit, 7.9:1. */
  gold: cn(pillBase, "border border-gold text-gold hover:bg-gold hover:text-dark"),
  /** Sekundär, Taupe-Tiefe für AA gegen Weiß, 6.3:1. */
  caramel: cn(pillBase, "bg-toffee-deep text-white hover:bg-espresso"),
} as const;

/** Pill-Button. Für Links: `pillVariants.x` als className an <Link> geben. */
export function Pill({
  variant = "primary",
  className,
  ...props
}: React.ComponentProps<"button"> & { variant?: keyof typeof pillVariants }) {
  return <button type="button" className={cn(pillVariants[variant], className)} {...props} />;
}

/** Textlink im Kapitälchen-Stil, mit Haarlinie darunter. */
export function TextLink({
  children,
  onDark = false,
  className,
}: {
  children: React.ReactNode;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "ck-nav-link border-b pb-1 transition-[color,border-color,letter-spacing] duration-500 ease-[var(--ease-lux)] hover:tracking-[0.2em]",
        onDark
          ? "border-gold/50 text-gold hover:border-cream-on-dark hover:text-cream-on-dark"
          : "border-rule-strong text-ink-2 hover:border-espresso hover:text-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}
