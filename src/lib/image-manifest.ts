/**
 * Motive, für die ein echtes Foto unter `public/images/<key>.webp` liegt.
 * Wird von <Placeholder> genutzt; fehlt ein Key, rendert weiter der
 * gestreifte Platzhalter. Keys sind normalisiert (Kleinbuchstaben, ohne
 * Akzente — „praliné" → „praline").
 */
export const availableImages = new Set([
  "backstube",
  "bento",
  "bento-herz",
  "blumen",
  "blumen-buttercreme",
  "eclair",
  "eclair-selection",
  "geburtstag",
  "geburtstag-gold",
  "himbeer-vanille",
  "himbeere",
  "hochzeit",
  "hochzeit-dreistoeckig",
  "hochzeit-grande",
  "hochzeit-satin",
  "karamell",
  "karamell-creme",
  "karamell-drip",
  "kinder",
  "kindergeburtstag",
  "lambeth-vintage",
  "pistazie-himbeer",
  "pistazie-himbeere",
  "praline",
  "schoko-noir",
  "schokolade",
  "schokolade-70",
  "signature-torte",
  "snickers",
  "taufe-pastell",
  "zitrone-mohn",
]);

/** „praliné" → „praline", „éclair" → „eclair" */
export function normalizeImageKey(key: string): string {
  return key
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
