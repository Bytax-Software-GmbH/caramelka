/** Kleine, abhängigkeitsfreie Farb-Helfer für den Palette-Generator. */

/** 6-stelliger Hex, führendes # optional (URL-Param-freundlich). */
export const HEX6 = /^#?[0-9a-fA-F]{6}$/;

/** "6B7178" | "#6b7178" → "#6B7178"; null bei ungültigem Wert. */
export function normalizeHex(raw: string | null | undefined): string | null {
  if (!raw || !HEX6.test(raw.trim())) return null;
  return `#${raw.trim().replace(/^#/, "").toUpperCase()}`;
}

export interface Hsl {
  h: number; // 0–360
  s: number; // 0–100
  l: number; // 0–100
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const int = Number.parseInt(m[1]!, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function hexToHsl(hex: string): Hsl | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex({ h, s, l }: Hsl): string {
  const sN = clamp(s, 0, 100) / 100;
  const lN = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] =
    hp < 1
      ? [c, x, 0]
      : hp < 2
        ? [x, c, 0]
        : hp < 3
          ? [0, c, x]
          : hp < 4
            ? [0, x, c]
            : hp < 5
              ? [x, 0, c]
              : [c, 0, x];
  const m = lN - c / 2;
  return rgbToHex((r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255);
}

/** Relative Luminanz (WCAG) für Kontrast + Textfarben-Wahl. */
export function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const chan = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * chan(rgb.r) + 0.7152 * chan(rgb.g) + 0.0722 * chan(rgb.b);
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Lesbare Textfarbe (espresso/creme) für einen Swatch-Hintergrund. */
export function readableText(hex: string): "#261D13" | "#FBF8F2" {
  return luminance(hex) > 0.42 ? "#261D13" : "#FBF8F2";
}

/**
 * 11-stufige Tint-/Shade-Rampe (50–950) um eine Basisfarbe, Sättigung leicht
 * angehoben in den Extremen für lebendigere Enden.
 */
export function ramp(baseHex: string): { step: number; hex: string }[] {
  const hsl = hexToHsl(baseHex);
  if (!hsl) return [];
  const steps = [
    { step: 50, l: 96 },
    { step: 100, l: 91 },
    { step: 200, l: 82 },
    { step: 300, l: 71 },
    { step: 400, l: 60 },
    { step: 500, l: hsl.l },
    { step: 600, l: Math.max(hsl.l - 10, 34) },
    { step: 700, l: 28 },
    { step: 800, l: 21 },
    { step: 900, l: 15 },
    { step: 950, l: 9 },
  ];
  return steps.map(({ step, l }) => ({
    step,
    hex: hslToHex({ h: hsl.h, s: clamp(hsl.s + (l < 25 || l > 90 ? 6 : 0), 0, 100), l }),
  }));
}

export type HarmonyKind = "complementary" | "analogous" | "triadic" | "split" | "tetradic";

/** Farbe um `amount` Lightness-Punkte abdunkeln (negativ = aufhellen). */
export function darken(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  return hslToHex({ ...hsl, l: clamp(hsl.l - amount, 0, 100) });
}

/** Farbharmonien relativ zum Basis-Farbton. */
export function harmony(baseHex: string, kind: HarmonyKind): string[] {
  const hsl = hexToHsl(baseHex);
  if (!hsl) return [];
  const at = (deg: number) => hslToHex({ ...hsl, h: hsl.h + deg });
  switch (kind) {
    case "complementary":
      return [baseHex, at(180)];
    case "analogous":
      return [at(-30), baseHex, at(30)];
    case "triadic":
      return [baseHex, at(120), at(240)];
    case "split":
      return [baseHex, at(150), at(210)];
    case "tetradic":
      return [baseHex, at(90), at(180), at(270)];
  }
}

/** Zufällige, angenehm gesättigte Basisfarbe (index-getrieben, kein Math.random-Zwang). */
export function randomHex(seed: number): string {
  const h = (seed * 137.508) % 360; // Golden-Angle → gute Streuung
  const s = 45 + ((seed * 23) % 35);
  const l = 40 + ((seed * 17) % 25);
  return hslToHex({ h, s, l });
}
