import { cn } from "#/lib/utils";

/**
 * Logo-Variante 2e aus den Design Directions: zweisprachige Wortmarke,
 * lateinisch + kyrillisch gespiegelt (DE/RU-Kundschaft).
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
  const main = { sm: "text-xl", md: "text-[26px]", lg: "text-[34px]" }[size];
  const sub = { sm: "text-[10px]", md: "text-[12px]", lg: "text-[15px]" }[size];

  return (
    <span className={cn("flex flex-col leading-none", className)}>
      <span
        className={cn(
          "font-display font-medium tracking-[0.1em]",
          main,
          onDark ? "text-creme" : "text-espresso",
        )}
      >
        Caramelka
      </span>
      <span
        className={cn(
          "font-display tracking-[0.18em] italic",
          sub,
          onDark ? "text-gold" : "text-caramel",
        )}
      >
        Карамелька
      </span>
    </span>
  );
}
