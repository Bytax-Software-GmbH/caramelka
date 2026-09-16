import { motion } from "motion/react";

import { Reveal } from "#/components/ck/reveal";
import { ShotOverlay, shotLayoutId, useShotOverlay, type Shot } from "#/components/ck/shot-overlay";
import { cn } from "#/lib/utils";

/**
 * Versetztes Bildraster im Mosaik-Charakter.
 *
 * Umgesetzt mit CSS-Mehrspaltensatz, nicht mit Grid und Zeilen-Spans. Der
 * Versuch mit `grid-flow-row-dense` sah zunächst richtig aus, ließ aber
 * verlässlich die letzte Spalte mehrere hundert Pixel zu kurz auslaufen: die
 * gierige Platzierung gleicht Spaltenhöhen nicht aus. Der Mehrspaltensatz
 * balanciert die Höhen von sich aus, die Unterkante läuft eben aus.
 *
 * Die Kacheln behalten dabei ihre gesetzten Seitenverhältnisse, statt wie in
 * der Vorgängerfassung an einem hartcodierten `tall`-Flag zu hängen.
 */

/**
 * Seitenverhältnisse als Rhythmus, von Hand gesetzt. Fünf Einträge, damit sich
 * das Muster bei zwölf Aufnahmen nicht sichtbar wiederholt und in keiner
 * Spalte zweimal dasselbe Format untereinander steht.
 */
const TILE_RHYTHM = [
  "aspect-[4/5]",
  "aspect-square",
  "aspect-[3/4]",
  "aspect-[5/7]",
  "aspect-[6/5]",
];

export function MasonryGallery({
  shots,
  openLinkLabel,
  className,
}: {
  shots: Shot[];
  openLinkLabel?: string;
  className?: string;
}) {
  const { setOpen, close, registerTrigger, activeShot } = useShotOverlay(shots);

  return (
    <>
      <ul className={cn("columns-2 gap-3 md:columns-3 md:gap-4 lg:columns-4", className)}>
        {shots.map((shot, index) => (
          <Reveal
            key={shot.imageKey}
            as="li"
            delay={(index % 4) * 80}
            className="mb-3 break-inside-avoid md:mb-4"
          >
            <button
              ref={(node) => registerTrigger(index, node)}
              type="button"
              onClick={() => setOpen(index)}
              aria-label={shot.caption}
              className={cn(
                "group relative block w-full overflow-hidden",
                TILE_RHYTHM[index % TILE_RHYTHM.length],
              )}
            >
              <motion.div layoutId={shotLayoutId(shot.imageKey)} className="size-full">
                <img
                  src={`/images/${shot.imageKey}.webp`}
                  alt={shot.alt}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-(--dur-slow) ease-out group-hover:scale-[1.03]"
                />
              </motion.div>
              {/* Roségold-Haarlinie, die beim Hover einläuft. */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-3 border border-rosegold-300/0 transition-[border-color] duration-(--dur-slow) ease-out group-hover:border-rosegold-300/70"
              />
            </button>
          </Reveal>
        ))}
      </ul>
      <ShotOverlay shot={activeShot} onClose={close} openLinkLabel={openLinkLabel} />
    </>
  );
}
