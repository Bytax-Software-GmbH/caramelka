import { motion, useReducedMotion } from "motion/react";

import { cn } from "#/lib/utils";

/**
 * Zeilenweiser Auftritt für Display-Überschriften: jede Zeile steigt aus ihrer
 * eigenen Maske. Begründung: die Hero-Zeile ist die Eröffnung der Seite, der
 * gestaffelte Einsatz gibt ihr die Reihenfolge, in der sie gelesen werden soll.
 *
 * Die Maske bekommt unten Luft und holt sie per negativem Margin wieder zurück.
 * Ohne das kappt `overflow-hidden` die Unterlängen kursiver Wörter (g, y, p).
 */
export function LineReveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  /** Verzögerung in Sekunden. */
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <span className={cn("block", className)}>{children}</span>;

  return (
    <span className="block overflow-hidden pb-[0.16em] mb-[-0.16em]">
      <motion.span
        className={cn("block", className)}
        initial={{ y: "110%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 1.15, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
}
