import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  ShotOverlay,
  shotLayoutId,
  useShotOverlay,
  type Shot,
} from "#/components/ck/shot-overlay";

/**
 * Magnetic Carousel: Bildstreifen, die sich macOS-Dock-artig vergrößern,
 * je näher der Cursor kommt. Klick öffnet einen Streifen groß, die übrigen
 * treten unscharf zurück.
 *
 * Adaptiert nach dem Vorbild von originkit.dev/components/magneticcarousel.
 * Zwei bewusste Abweichungen von der Vorlage:
 *
 *  1. Die Vorlage animiert `width`/`height` und hält die Zwischenwerte in
 *     `useState` (Re-Render pro Frame). Hier laufen alle Werte als Motion
 *     Values außerhalb des React-Render-Zyklus und wirken ausschließlich auf
 *     `transform`, kein Layout-Reflow, stabil auf Mobilgeräten.
 *  2. Die Vorlage skaliert Breite und Höhe getrennt, das Seitenverhältnis
 *     kippt dabei. Hier wird uniform skaliert (wie das echte Dock), damit die
 *     Fotos nicht verzerren.
 *
 * Die Magnetik hängt an einem feinen Zeigegerät. Auf Touch rendert stattdessen
 * ein horizontaler Snap-Streifen (siehe `TouchStrip`).
 */

interface MagneticCarouselProps {
  shots: Shot[];
  /** Ruhebreite eines Streifens in px. */
  collapsedWidth?: number;
  /** Ruhehöhe eines Streifens in px. */
  collapsedHeight?: number;
  /** Maximaler Skalierungsfaktor direkt unter dem Cursor. */
  maxScale?: number;
  /** Abstand zwischen den Streifen in px. */
  gap?: number;
  /** Reichweite der Magnetik in px. */
  influence?: number;
  /** Unschärfe der ruhenden Streifen, während einer geöffnet ist. */
  blur?: number;
  /** Beschriftung des geöffneten Links. */
  openLinkLabel?: string;
  className?: string;
}

/** Smoothstep, weicher Abfall statt linearer Rampe. */
function falloff(distance: number, influence: number): number {
  const t = Math.max(0, Math.min(1, 1 - distance / influence));
  return t * t * (3 - 2 * t);
}

export function MagneticCarousel({
  shots,
  collapsedWidth = 104,
  collapsedHeight = 300,
  maxScale = 1.6,
  gap = 14,
  influence = 260,
  blur = 3,
  openLinkLabel,
  className,
}: MagneticCarouselProps) {
  const reduceMotion = useReducedMotion();
  const [finePointer, setFinePointer] = useState(false);
  const [fits, setFits] = useState(false);
  const { open, setOpen, close, registerTrigger, activeShot } = useShotOverlay(shots);
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLUListElement>(null);

  /**
   * Zeigerposition relativ zur linken Kante der Streifenreihe, nicht zum
   * äußeren Container: die Reihe ist darin zentriert, und `restingCenter()`
   * rechnet ebenfalls ab Reihenanfang. Ein full-bleed Band verschiebt den
   * Nullpunkt sonst um mehrere hundert Pixel.
   */
  const pointerX = useMotionValue(-9999);
  /** 0 = Ruhe, 1 = Magnetik aktiv. Trennt „Cursor weg" sauber von „Cursor links". */
  const intensity = useMotionValue(0);

  useEffect(() => {
    const query = window.matchMedia("(pointer: fine)");
    const sync = () => setFinePointer(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  /**
   * Die Ruhebreite der ganzen Reihe muss in den Container passen, sonst würden
   * die äußeren Streifen beschnitten. Sonst greift der Snap-Streifen.
   */
  const restingRowWidth = shots.length * collapsedWidth + (shots.length - 1) * gap;
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setFits(entry.contentRect.width >= restingRowWidth);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [restingRowWidth]);

  const magnetic = finePointer && fits && !reduceMotion;

  /** Ruheposition der Streifenmitte, unabhängig von der aktuellen Skalierung. */
  const restingCenter = useCallback(
    (index: number) => index * (collapsedWidth + gap) + collapsedWidth / 2,
    [collapsedWidth, gap],
  );

  /** Skalierung eines Streifens aus Zeigerabstand und Intensität. */
  const scaleAt = useCallback(
    (index: number, x: number, k: number) =>
      1 + (maxScale - 1) * falloff(Math.abs(x - restingCenter(index)), influence) * k,
    [influence, maxScale, restingCenter],
  );

  /**
   * Verschiebung, damit gewachsene Streifen einander nicht überlappen: der
   * Zuwachs aller linken Nachbarn plus der halbe eigene Zuwachs, zentriert
   * um die Gesamtbreite.
   */
  const offsetAt = useCallback(
    (index: number, x: number, k: number) => {
      let before = 0;
      let total = 0;
      for (let i = 0; i < shots.length; i++) {
        const extra = collapsedWidth * (scaleAt(i, x, k) - 1);
        if (i < index) before += extra;
        total += extra;
      }
      const own = collapsedWidth * (scaleAt(index, x, k) - 1);
      return before + own / 2 - total / 2;
    },
    [collapsedWidth, scaleAt, shots.length],
  );

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!magnetic || open !== null || !rowRef.current) return;
    // Reihe messen, nicht den Container. Die Streifen sind zu diesem Zeitpunkt
    // per transform verschoben; `getBoundingClientRect` der Liste bleibt davon
    // unberührt, weil die Liste selbst nicht transformiert wird.
    const rect = rowRef.current.getBoundingClientRect();
    pointerX.set(event.clientX - rect.left);
  }

  function handlePointerEnter() {
    if (!magnetic || open !== null) return;
    animate(intensity, 1, { duration: 0.45, ease: [0.22, 1, 0.36, 1] });
  }

  function handlePointerLeave() {
    animate(intensity, 0, { duration: 0.6, ease: [0.22, 1, 0.36, 1] });
  }

  function openShot(index: number) {
    // Magnetik zurückfahren, damit die Öffnungs-Animation nicht auf einer
    // bereits skalierten Ebene aufsetzt.
    animate(intensity, 0, { duration: 0.25, ease: [0.22, 1, 0.36, 1] });
    setOpen(index);
  }

  return (
    <>
      <div ref={containerRef} className={className}>
        {magnetic ? (
          <div
            // Nur horizontal beschneiden: gewachsene Streifen dürfen vertikal
            // in das Sektions-Padding ragen, statt hier Leerraum zu reservieren.
            className="flex justify-center overflow-x-clip py-8"
            onPointerMove={handlePointerMove}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
          >
            <ul
              ref={rowRef}
              className="relative flex list-none items-center"
              style={{ gap: `${gap}px`, height: collapsedHeight }}
            >
              {shots.map((shot, index) => (
                <Bar
                  key={shot.imageKey}
                  shot={shot}
                  index={index}
                  width={collapsedWidth}
                  height={collapsedHeight}
                  pointerX={pointerX}
                  intensity={intensity}
                  scaleAt={scaleAt}
                  offsetAt={offsetAt}
                  dimmed={open !== null && open !== index}
                  hidden={open === index}
                  blur={blur}
                  onOpen={openShot}
                  registerTrigger={(node) => registerTrigger(index, node)}
                />
              ))}
            </ul>
          </div>
        ) : (
          <TouchStrip
            shots={shots}
            height={collapsedHeight}
            onOpen={openShot}
            registerTrigger={registerTrigger}
          />
        )}
      </div>
      <ShotOverlay shot={activeShot} onClose={close} openLinkLabel={openLinkLabel} />
    </>
  );
}

interface BarProps {
  shot: Shot;
  index: number;
  width: number;
  height: number;
  pointerX: MotionValue<number>;
  intensity: MotionValue<number>;
  scaleAt: (index: number, x: number, k: number) => number;
  offsetAt: (index: number, x: number, k: number) => number;
  dimmed: boolean;
  hidden: boolean;
  blur: number;
  onOpen: (index: number) => void;
  registerTrigger: (node: HTMLButtonElement | null) => void;
}

function Bar({
  shot,
  index,
  width,
  height,
  pointerX,
  intensity,
  scaleAt,
  offsetAt,
  dimmed,
  hidden,
  blur,
  onOpen,
  registerTrigger,
}: BarProps) {
  const scale = useTransform([pointerX, intensity], ([x, k]: number[]) =>
    scaleAt(index, x ?? 0, k ?? 0),
  );
  const x = useTransform([pointerX, intensity], ([px, k]: number[]) =>
    offsetAt(index, px ?? 0, k ?? 0),
  );

  return (
    <motion.li
      style={{ x, scale, width, height }}
      className="shrink-0 will-change-transform"
      animate={{
        filter: dimmed ? `blur(${blur}px)` : "blur(0px)",
        opacity: dimmed ? 0.35 : 1,
      }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        ref={registerTrigger}
        type="button"
        onClick={() => onOpen(index)}
        aria-label={shot.caption}
        className="size-full cursor-pointer overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-caramel"
      >
        {!hidden && (
          <motion.div layoutId={shotLayoutId(shot.imageKey)} className="size-full">
            <img
              src={`/images/${shot.imageKey}.webp`}
              alt={shot.alt}
              loading="lazy"
              className="size-full object-cover"
            />
          </motion.div>
        )}
      </button>
    </motion.li>
  );
}

/**
 * Touch- und Reduced-Motion-Variante: horizontaler Snap-Streifen ohne
 * Magnetik, gleiche Bildsprache, gleiche Öffnen-Interaktion.
 */
function TouchStrip({
  shots,
  height,
  onOpen,
  registerTrigger,
}: {
  shots: Shot[];
  height: number;
  onOpen: (index: number) => void;
  registerTrigger: (index: number, node: HTMLButtonElement | null) => void;
}) {
  return (
    // scroll-px spiegelt das Padding, sonst rastet der erste Streifen hinter
    // den linken Rand.
    <ul className="flex snap-x snap-mandatory list-none gap-3 overflow-x-auto px-6 py-8 scroll-px-6 md:px-10 md:scroll-px-10">
      {shots.map((shot, index) => (
        <li key={shot.imageKey} className="shrink-0 snap-start">
          <button
            ref={(node) => registerTrigger(index, node)}
            type="button"
            onClick={() => onOpen(index)}
            aria-label={shot.caption}
            className="block overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-caramel"
            style={{ width: height * 0.52, height: height * 0.78 }}
          >
            <motion.div layoutId={shotLayoutId(shot.imageKey)} className="size-full">
              <img
                src={`/images/${shot.imageKey}.webp`}
                alt={shot.alt}
                loading="lazy"
                className="size-full object-cover"
              />
            </motion.div>
          </button>
        </li>
      ))}
    </ul>
  );
}
