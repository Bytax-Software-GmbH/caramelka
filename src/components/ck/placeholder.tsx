import { availableImages, normalizeImageKey } from "#/lib/image-manifest";
import { cn } from "#/lib/utils";

/**
 * Produktfoto per `imageKey` aus `public/images/<key>.webp`. Liegt (noch)
 * kein Foto vor, rendert der gestylte Streifen-Platzhalter aus den Design
 * Directions.
 */
export function Placeholder({
  imageKey,
  onDark = false,
  className,
}: {
  imageKey: string;
  onDark?: boolean;
  className?: string;
}) {
  const key = normalizeImageKey(imageKey);

  if (availableImages.has(key)) {
    return (
      <div
        aria-hidden
        className={cn(
          "overflow-hidden shadow-[inset_0_0_0_1px_rgba(0,0,0,0.07)]",
          className,
        )}
      >
        <img
          src={`/images/${key}.webp`}
          alt=""
          loading="lazy"
          className="size-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={cn(
        "grid place-items-center overflow-hidden shadow-[inset_0_0_0_1px_rgba(0,0,0,0.07)]",
        onDark
          ? "bg-[repeating-linear-gradient(45deg,#2B1D13_0_12px,#332316_12px_24px)]"
          : "bg-[repeating-linear-gradient(45deg,#EFE6D6_0_12px,#E7DBC6_12px_24px)]",
        className,
      )}
    >
      <span
        className={cn(
          "rounded-sm px-2.5 py-1 font-mono text-[11px]",
          onDark ? "bg-dark text-gold" : "bg-creme text-caramel-deep",
        )}
      >
        foto: {imageKey}
      </span>
    </div>
  );
}
