import { cn } from "#/lib/utils";

/**
 * Wortmarke aus dem Design System: CARAMELKA in Cinzel, darunter LILY
 * zwischen zwei Haarlinien. Für Header und Admin; das vollständige Logo
 * (Monogramm + Wortmarke + Tagline) liegt als Bild in `LogoLockup`.
 */
export function Logo({
  size = "md",
  onDark = false,
  className,
}: {
  size?: "sm" | "md" | "lg";
  onDark?: boolean;
  className?: string;
}) {
  const main = { sm: "text-[19px]", md: "text-[26px]", lg: "text-[34px]" }[size];
  const sub = { sm: "text-[8px]", md: "text-[10px]", lg: "text-[13px]" }[size];
  const line = onDark ? "bg-rosegold-500/60" : "bg-rosegold-500";

  return (
    <span className={cn("inline-flex flex-col items-center leading-none", className)}>
      <span
        className={cn(
          "-mr-[0.22em] font-display font-medium tracking-caps uppercase",
          main,
          onDark ? "text-rosegold-400" : "text-brand",
        )}
      >
        Caramelka
      </span>
      <span className="mt-1 flex w-full items-center gap-2">
        <span aria-hidden className={cn("h-px flex-1", line)} />
        <span
          className={cn(
            "-mr-[0.32em] font-display tracking-caps-wide uppercase",
            sub,
            onDark ? "text-rosegold-300" : "text-rosegold-600",
          )}
        >
          Lily
        </span>
        <span aria-hidden className={cn("h-px flex-1", line)} />
      </span>
    </span>
  );
}

/** Vollständiges Logo, roségold freigestellt (Footer, Bestätigung). */
export function LogoLockup({ className }: { className?: string }) {
  return (
    <img
      src="/brand/logo-rosegold.png"
      alt="Caramelka Lily, Sweet by nature"
      width={1024}
      height={711}
      loading="lazy"
      className={cn("h-auto", className)}
    />
  );
}

/** CL-Monogramm als Siegel. Dekorativ. */
export function Monogram({ className }: { className?: string }) {
  return (
    <img
      src="/brand/monogram-rosegold.png"
      alt=""
      aria-hidden
      width={420}
      height={399}
      loading="lazy"
      className={cn("h-auto", className)}
    />
  );
}
