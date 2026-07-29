import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge kennt nur die eingebaute Schriftgrößen-Skala. Ohne diesen
 * Hinweis hält es `text-display-xl` für eine Textfarbe und wirft die Klasse
 * weg, sobald im selben Aufruf auch `text-ink` steht. Die Rampe aus
 * `styles.css` muss deshalb hier gespiegelt werden.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-xl",
            "display-l",
            "display-m",
            "display-s",
            "body-l",
            "body-m",
            "body-s",
            "label",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
