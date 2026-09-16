import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge kennt nur die eingebaute Schriftgrößen-Skala. Die Skala des
 * Design Systems (`text-2xs`, `text-md`) wird hier gespiegelt, damit sie
 * neben `text-ink` nicht als Farbe gelesen und verworfen wird.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["2xs", "md"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
