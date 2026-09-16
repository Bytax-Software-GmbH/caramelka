import { Monogram } from "#/components/ck/logo";
import { cn } from "#/lib/utils";

/**
 * Typografische Bausteine des Design Systems. Die Rollen sitzen als
 * Utilities in styles.css (ck-display, ck-heading, …); hier kommen nur
 * Farbe, Element und die Marken-Motive dazu.
 */

type Tone = "brand" | "ink" | "muted" | "inverse" | "inverse-muted";

const toneClass: Record<Tone, string> = {
  brand: "text-brand",
  ink: "text-ink",
  muted: "text-ink-muted",
  inverse: "text-on-inverse",
  "inverse-muted": "text-on-inverse-muted",
};

/**
 * Kurze versale Zeile über einer Überschrift. `dashed` rahmt sie mit
 * Gedankenstrichen, das Motiv der Tagline "— Sweet by nature —".
 */
export function Eyebrow({
  children,
  tone = "accent",
  dashed = false,
  as: Tag = "div",
  className,
}: {
  children: React.ReactNode;
  tone?: "accent" | "muted" | "inverse";
  dashed?: boolean;
  as?: "div" | "span" | "p";
  className?: string;
}) {
  const color = {
    accent: "text-rosegold-600",
    muted: "text-ink-muted",
    inverse: "text-on-inverse-muted",
  }[tone];
  return (
    <Tag className={cn("ck-eyebrow", color, className)}>
      {dashed ? <>— {children} —</> : children}
    </Tag>
  );
}

/** Von Haarlinien flankiertes Wort in Cinzel, das "LILY"-Motiv des Logos. */
export function SectionRule({
  children,
  inverse = false,
  className,
}: {
  children: React.ReactNode;
  inverse?: boolean;
  className?: string;
}) {
  const line = cn("h-px flex-1", inverse ? "bg-rosegold-500/50" : "bg-rosegold-500");
  return (
    <div className={cn("flex items-center gap-5", className)}>
      <span aria-hidden className={line} />
      <span
        className={cn(
          "font-display ck-label tracking-caps-wide",
          inverse ? "text-rosegold-300" : "text-brand",
        )}
      >
        {children}
      </span>
      <span aria-hidden className={line} />
    </div>
  );
}

/** Display-Kapitalen in Cinzel, gesperrt. */
export function Display({
  children,
  as: Tag = "h2",
  tone = "brand",
  className,
}: {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "p";
  tone?: Tone;
  className?: string;
}) {
  return <Tag className={cn("ck-display", toneClass[tone], className)}>{children}</Tag>;
}

/** Editorial-Überschrift in Cormorant Garamond. */
export function Heading({
  children,
  as: Tag = "h2",
  tone = "ink",
  className,
}: {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "p";
  tone?: Tone;
  className?: string;
}) {
  return <Tag className={cn("ck-heading", toneClass[tone], className)}>{children}</Tag>;
}

/** Kursive Einleitung in Cormorant Garamond. */
export function Lede({
  children,
  tone = "muted",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <p
      className={cn("ck-lede", tone === "inverse" ? "text-cream-200" : toneClass[tone], className)}
    >
      {children}
    </p>
  );
}

/** Fließtext in Jost, 16 oder 14 px. */
export function Body({
  children,
  size = "md",
  tone = "ink",
  className,
}: {
  children: React.ReactNode;
  size?: "md" | "sm";
  tone?: Tone;
  className?: string;
}) {
  return (
    <p
      className={cn(
        size === "sm" ? "ck-body-sm" : "ck-body",
        tone === "inverse" ? "text-cream-200" : toneClass[tone],
        "text-pretty",
        className,
      )}
    >
      {children}
    </p>
  );
}

/**
 * Kopf jeder Unterseite: zentriert, Eyebrow mit Gedankenstrichen, Titel in
 * Cinzel-Kapitalen, optional eine kursive Einleitung und das Monogramm als
 * Siegel. Ein Muster für alle Seiten, damit nichts zwischen ihnen springt.
 */
export function PageHead({
  eyebrow,
  title,
  lede,
  seal = false,
  className,
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  lede?: React.ReactNode;
  seal?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-narrow text-center", className)}>
      {seal && <Monogram className="mx-auto mb-6 w-14" />}
      <Eyebrow dashed>{eyebrow}</Eyebrow>
      <Display as="h1" className="mt-5">
        {title}
      </Display>
      {lede && <Lede className="mx-auto mt-5">{lede}</Lede>}
    </div>
  );
}

/** Preis in der Serif, Tabellenziffern. */
export function Price({
  children,
  className,
  ...rest
}: React.ComponentProps<"span"> & { children: React.ReactNode }) {
  return (
    <span className={cn("text-brand ck-price", className)} {...rest}>
      {children}
    </span>
  );
}

/** Versaler Textlink mit roségoldener Haarlinie. Als className an <Link>. */
export const textLinkClass = (inverse = false) =>
  cn(
    "inline-flex items-center gap-2 border-b pb-1 ck-label transition-colors duration-(--dur-fast) ease-out",
    inverse
      ? "border-rosegold-500/60 text-rosegold-300 hover:border-cream-100 hover:text-cream-100"
      : "border-hairline-accent text-brand hover:text-accent-hover",
  );
