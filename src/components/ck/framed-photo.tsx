import { motion, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { availableImages, normalizeImageKey } from "#/lib/image-manifest";
import { cn } from "#/lib/utils";

/**
 * Gerahmte Aufnahme mit zwei Bewegungen, die beide einen Grund haben:
 *
 *  1. Vorhang-Auftritt. Das Foto steigt in seinen Ausschnitt, statt einzublenden.
 *     Die Rahmenkante ist dabei die Maske: der Container beschneidet, das Bild
 *     fährt von unten hinein. Nur `transform`, kein `clip-path` (nicht überall
 *     verlässlich GPU-komponiert) und keine farbige Vorhangfläche, die zur
 *     Sektionsfarbe passen müsste.
 *  2. Parallaxe im Ausschnitt. Das Bild wandert beim Scrollen langsamer als der
 *     Rahmen und erzeugt so Tiefe. Der Überzoom von 1.14 verhindert, dass dabei
 *     Kanten frei laufen.
 *
 * Unter `prefers-reduced-motion` entfällt beides ersatzlos.
 */
export function FramedPhoto({
  imageKey,
  alt,
  /**
   * Vorhang-Auftritt. Für das LCP-Bild abschalten: eine Maske, die 1.25 s
   * braucht, verschiebt den Largest Contentful Paint um genau diese Zeit.
   * Oberhalb der Falte bleibt nur die Parallaxe.
   */
  curtain = true,
  priority = false,
  /** Verzögerung in Sekunden, für gestaffelte Gruppen. */
  delay = 0,
  className,
}: {
  imageKey: string;
  alt: string;
  curtain?: boolean;
  priority?: boolean;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  /**
   * Bewusst am Container beobachtet, nicht am bewegten Element: das Bild
   * schiebt sich für den Auftritt selbst aus dem Ausschnitt und wäre für
   * `whileInView` nie sichtbar. Der Auftritt würde nie starten.
   */
  const inView = useInView(ref, { once: true, amount: 0.2 });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["-5.5%", "5.5%"]);

  const key = normalizeImageKey(imageKey);
  if (!availableImages.has(key)) {
    return <div aria-hidden className={cn("bg-creme-2", className)} />;
  }

  const image = (
    <motion.img
      src={`/images/${key}.webp`}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding={priority ? "sync" : "async"}
      style={reduceMotion ? undefined : { y: parallaxY }}
      className={cn("size-full object-cover", !reduceMotion && "scale-[1.14]")}
    />
  );

  if (reduceMotion || !curtain) {
    return (
      <div ref={ref} className={cn("overflow-hidden bg-creme-2", className)}>
        {image}
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("overflow-hidden bg-creme-2", className)}>
      <motion.div
        className="size-full"
        initial={{ y: "100%" }}
        animate={inView ? { y: "0%" } : { y: "100%" }}
        transition={{ duration: 1.25, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {image}
      </motion.div>
    </div>
  );
}
