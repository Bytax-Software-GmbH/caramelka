import { availableImages, normalizeImageKey } from "#/lib/image-manifest";
import { cn } from "#/lib/utils";

/**
 * Produktfoto per `imageKey` aus `public/images/<key>.webp`, gerendert als
 * <img>, das seinen Container füllt. Der Aufrufer gibt Format und Rahmen
 * vor (CardMedia, ck-frame, aspect-*).
 *
 * `alt` beschreibt das Motiv. Ohne `alt` gilt das Bild als dekorativ.
 * Liegt kein Foto vor, rendert eine ruhige Creme-Fläche.
 */
export function Placeholder({
  imageKey,
  alt,
  priority = false,
  className,
}: {
  imageKey: string;
  alt?: string;
  /** Für das LCP-Bild: eager laden und hoch priorisieren. */
  priority?: boolean;
  className?: string;
}) {
  const key = normalizeImageKey(imageKey);

  if (availableImages.has(key)) {
    return (
      <img
        src={`/images/${key}.webp`}
        alt={alt ?? ""}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? "sync" : "async"}
        className={cn("size-full object-cover", className)}
      />
    );
  }

  return <div aria-hidden className={cn("size-full bg-sunken", className)} />;
}
