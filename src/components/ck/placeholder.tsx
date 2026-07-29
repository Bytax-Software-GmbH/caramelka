import { availableImages, normalizeImageKey } from "#/lib/image-manifest";
import { cn } from "#/lib/utils";

/**
 * Produktfoto per `imageKey` aus `public/images/<key>.webp`.
 *
 * `alt` beschreibt das Motiv und macht das Bild für Screenreader nutzbar.
 * Ohne `alt` gilt das Bild als dekorativ und wird ausgeblendet. Das ist die
 * Ausnahme, nicht der Normalfall.
 *
 * Liegt kein Foto vor, rendert eine ruhige Graphit-Fläche statt eines Fotos.
 */
export function Placeholder({
  imageKey,
  alt,
  onDark = false,
  priority = false,
  className,
}: {
  imageKey: string;
  alt?: string;
  onDark?: boolean;
  /** Für das LCP-Bild: eager laden und hoch priorisieren. */
  priority?: boolean;
  className?: string;
}) {
  const key = normalizeImageKey(imageKey);

  if (availableImages.has(key)) {
    return (
      <div
        aria-hidden={alt ? undefined : true}
        className={cn("overflow-hidden bg-creme-2", className)}
      >
        <img
          src={`/images/${key}.webp`}
          alt={alt ?? ""}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding={priority ? "sync" : "async"}
          className="size-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={cn(
        "grid place-items-center overflow-hidden",
        onDark ? "bg-espresso-2" : "bg-creme-2",
        className,
      )}
    />
  );
}
