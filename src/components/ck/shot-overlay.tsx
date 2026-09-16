import { Link } from "@tanstack/react-router";
import { XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { textLinkClass } from "#/components/ck/primitives";
import { cn } from "#/lib/utils";

/**
 * Gemeinsame Großansicht für alle Galerie-Darstellungen (Magnetband,
 * Snap-Streifen, Mosaik). Eine Implementierung, ein Verhalten: Escape,
 * Backdrop-Klick, Fokus zurück auf den auslösenden Button.
 */

export interface Shot {
  /** Dateiname unter `public/images/<key>.webp`. */
  imageKey: string;
  /** Beschreibender Alt-Text. Pflicht, die Bilder tragen hier Inhalt. */
  alt: string;
  /** Bildunterschrift in der geöffneten Ansicht. */
  caption: string;
  /** Optionaler Produkt-Slug; blendet im geöffneten Zustand einen Link ein. */
  slug?: string;
}

/**
 * Geteilte `layoutId`, damit Motion die Kachel in die Großansicht morpht.
 * Wichtig: pro Seite darf ein `imageKey` nur in einer Darstellung vorkommen,
 * sonst konkurrieren zwei Quellen um dieselbe ID.
 */
export const shotLayoutId = (imageKey: string) => `ck-shot-${imageKey}`;

/** Offen-Zustand, Escape-Handling und Fokus-Rückgabe an einer Stelle. */
export function useShotOverlay(shots: Shot[]) {
  const [open, setOpen] = useState<number | null>(null);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);

  const close = useCallback(() => {
    setOpen((current) => {
      if (current !== null) triggers.current[current]?.focus();
      return null;
    });
  }, []);

  useEffect(() => {
    if (open === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  const registerTrigger = useCallback((index: number, node: HTMLButtonElement | null) => {
    triggers.current[index] = node;
  }, []);

  return {
    open,
    setOpen,
    close,
    registerTrigger,
    activeShot: open !== null ? shots[open] : undefined,
  };
}

export function ShotOverlay({
  shot,
  onClose,
  openLinkLabel,
}: {
  shot: Shot | undefined;
  onClose: () => void;
  openLinkLabel?: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (shot) closeRef.current?.focus();
  }, [shot]);

  return (
    <AnimatePresence>
      {shot && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          // Bewusst div + ARIA statt <dialog>: Escape und Fokus werden hier
          // selbst gesteuert, und <dialog> ohne showModal() bringt weder
          // Top-Layer noch Fokusfalle mit.
          // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
          role="dialog"
          aria-modal="true"
          aria-label={shot.caption}
        >
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-scrim"
          />
          <div className="relative flex w-full max-w-[min(88vw,600px)] flex-col gap-4">
            <motion.div layoutId={shotLayoutId(shot.imageKey)} className="aspect-square w-full">
              <img
                src={`/images/${shot.imageKey}.webp`}
                alt={shot.alt}
                className="size-full object-cover"
              />
            </motion.div>
            <div className="flex items-baseline justify-between gap-6">
              <p className="text-on-inverse ck-subheading">{shot.caption}</p>
              {shot.slug && openLinkLabel && (
                <Link
                  to="/torten/$slug"
                  params={{ slug: shot.slug }}
                  className={cn(textLinkClass(true), "shrink-0")}
                >
                  {openLinkLabel}
                </Link>
              )}
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="absolute top-5 right-5 grid size-11 place-items-center rounded-sm border border-hairline-inverse text-rosegold-300 transition-colors duration-(--dur-fast) ease-out hover:bg-rosegold-500/12"
          >
            <XIcon className="size-5" strokeWidth={1.5} aria-hidden />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
