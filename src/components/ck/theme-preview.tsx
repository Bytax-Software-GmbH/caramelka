import { CopyIcon, PaletteIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { darken, normalizeHex } from "#/lib/color";

/**
 * Sitewide Farb-Vorschau über URL-Parameter, damit der Kunde Kombis live
 * testen kann. Die Parameter zeigen auf die Rampen des Design Systems;
 * Nachbarstufen (hover, active, Haarlinien) werden abgeleitet:
 *
 *   /?primary=5C1216&accent=D3A488&bg=FBF6F0&text=2A1A17&dark=4B0F14
 *
 * Hex ohne #; jeder Parameter ist optional, ungültige Werte werden ignoriert.
 * Persistenz in sessionStorage → Kombi überlebt Navigation + Reload im Tab.
 * `?theme=reset` beendet die Vorschau, `?theme=edit` öffnet das Live-Panel.
 * Das schwebende Panel (Badge anklicken) erlaubt Live-Anpassung aller Params.
 */

const STORAGE_KEY = "ck-theme-preview";

interface ParamDef {
  /** URL-Parameter-Name. */
  param: string;
  label: string;
  /** Haupt-Token. */
  cssVar: string;
  /** Standardwert (Design-System-Palette), für Panel-Anzeige & Diff im Share-Link. */
  defaultHex: string;
  /**
   * Automatisch abgeleitete Nachbar-Tokens (Lightness-Offset), damit eine
   * einzelne Param-Farbe stimmig wirkt. Wird übersprungen, wenn ein anderer
   * Parameter denselben Token explizit setzt.
   */
  derived?: { cssVar: string; delta: number }[];
}

export const THEME_PARAMS: ParamDef[] = [
  {
    param: "primary",
    label: "Burgund (Primär)",
    cssVar: "--burgundy-700",
    defaultHex: "#5C1216",
    derived: [
      { cssVar: "--burgundy-600", delta: -6 },
      { cssVar: "--burgundy-500", delta: -12 },
      { cssVar: "--burgundy-800", delta: 5 },
      { cssVar: "--burgundy-900", delta: 9 },
    ],
  },
  {
    param: "accent",
    label: "Roségold (Akzent)",
    cssVar: "--rosegold-500",
    defaultHex: "#D3A488",
    derived: [
      { cssVar: "--rosegold-600", delta: 7 },
      { cssVar: "--rosegold-700", delta: 14 },
      { cssVar: "--rosegold-400", delta: -7 },
      { cssVar: "--rosegold-300", delta: -12 },
      { cssVar: "--rosegold-200", delta: -20 },
      { cssVar: "--rosegold-100", delta: -26 },
    ],
  },
  {
    param: "bg",
    label: "Creme (Hintergrund)",
    cssVar: "--cream-100",
    defaultHex: "#FBF6F0",
    derived: [
      { cssVar: "--cream-50", delta: -1 },
      { cssVar: "--cream-200", delta: 3 },
      { cssVar: "--cream-300", delta: 8 },
      { cssVar: "--cream-400", delta: 14 },
      { cssVar: "--cream-500", delta: 25 },
    ],
  },
  { param: "surface", label: "Kartenfläche", cssVar: "--cream-50", defaultHex: "#FDFAF6" },
  {
    param: "text",
    label: "Kakao (Text)",
    cssVar: "--cocoa-800",
    defaultHex: "#2A1A17",
    derived: [
      { cssVar: "--cocoa-900", delta: 4 },
      { cssVar: "--cocoa-700", delta: -8 },
      { cssVar: "--cocoa-600", delta: -18 },
      { cssVar: "--cocoa-500", delta: -30 },
      { cssVar: "--cocoa-400", delta: -42 },
      { cssVar: "--cocoa-300", delta: -55 },
    ],
  },
  {
    param: "dark",
    label: "Footer (tiefes Burgund)",
    cssVar: "--burgundy-800",
    defaultHex: "#4B0F14",
  },
];

/** cssVar → URL-Param (für „Link teilen" im /colors-Editor). */
export const PARAM_BY_CSSVAR: Record<string, string> = Object.fromEntries(
  THEME_PARAMS.map((d) => [d.cssVar, d.param]),
);

/** param → Hex (nur gesetzte, valide Werte). */
export type ThemePreview = Record<string, string>;

function readStored(): ThemePreview | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const out: ThemePreview = {};
    for (const def of THEME_PARAMS) {
      const hex = normalizeHex((parsed as Record<string, unknown>)[def.param] as string);
      if (hex) out[def.param] = hex;
    }
    return Object.keys(out).length > 0 ? out : null;
  } catch {
    return null;
  }
}

function applyPreview(preview: ThemePreview) {
  const root = document.documentElement;
  // Explizit gesetzte Haupt-Tokens haben Vorrang vor Ableitungen.
  const explicit = new Set(THEME_PARAMS.filter((d) => preview[d.param]).map((d) => d.cssVar));
  for (const def of THEME_PARAMS) {
    const hex = preview[def.param];
    if (!hex) continue;
    root.style.setProperty(def.cssVar, hex);
    for (const d of def.derived ?? []) {
      if (explicit.has(d.cssVar)) continue;
      root.style.setProperty(d.cssVar, darken(hex, d.delta));
    }
  }
}

function clearPreview() {
  const root = document.documentElement;
  for (const def of THEME_PARAMS) {
    root.style.removeProperty(def.cssVar);
    for (const d of def.derived ?? []) root.style.removeProperty(d.cssVar);
  }
  sessionStorage.removeItem(STORAGE_KEY);
}

/** Aktive Vorschau (für den /colors-Editor). */
export function getActiveThemePreview(): ThemePreview | null {
  return readStored();
}

/**
 * Gespeicherte Vorschau erneut anwenden. Der /colors-Editor entfernt beim
 * Unmount seine eigenen Overrides — da das Root-Layout (und damit
 * ThemeParamSync) über Navigationen gemountet bleibt, stellt dieser Aufruf
 * die URL-Param-Vorschau danach wieder her.
 */
export function reapplyThemePreview() {
  const stored = readStored();
  if (stored) applyPreview(stored);
}

/** Teilbarer Link aus Param→Hex-Paaren (nur valide Werte landen in der URL). */
export function buildShareUrl(params: ThemePreview): string {
  const search = new URLSearchParams();
  for (const def of THEME_PARAMS) {
    const hex = normalizeHex(params[def.param]);
    if (hex) search.set(def.param, hex.slice(1));
  }
  return `${window.location.origin}/?${search.toString()}`;
}

export function ThemeParamSync() {
  const [active, setActive] = useState<ThemePreview | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get("theme") === "reset") {
      clearPreview();
      setActive(null);
      return;
    }

    const fromUrl: ThemePreview = {};
    for (const def of THEME_PARAMS) {
      const hex = normalizeHex(urlParams.get(def.param));
      if (hex) fromUrl[def.param] = hex;
    }

    // URL-Params gewinnen und werden persistiert; sonst gespeicherte Vorschau.
    const preview = Object.keys(fromUrl).length > 0 ? fromUrl : readStored();

    if (preview) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(preview));
      applyPreview(preview);
      setActive(preview);
    }
    // ?theme=edit öffnet das Panel — auch ohne gesetzte Farben.
    if (urlParams.get("theme") === "edit") {
      setActive((prev) => prev ?? {});
      setOpen(true);
    }
  }, []);

  if (!active) return null;

  function update(param: string, hex: string) {
    const next = { ...active, [param]: hex.toUpperCase() };
    setActive(next);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    applyPreview(next);
  }

  function reset() {
    clearPreview();
    setActive(null);
    setOpen(false);
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2">
      {/* Floating-Panel: alle Parameter live änderbar */}
      {open && (
        <div className="w-[248px] rounded-md bg-cocoa-800 p-4 text-cream-100 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-[0.14em] uppercase">
              Farben anpassen
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Panel schließen"
              className="grid size-6 place-items-center rounded-full text-cream-300 hover:bg-cream-100/10 hover:text-cream-100"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {THEME_PARAMS.map((def) => {
              const value = active[def.param] ?? def.defaultHex;
              return (
                <label
                  key={def.param}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1 hover:bg-cream-100/10"
                >
                  <span className="relative inline-block size-6 shrink-0">
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-full ring-1 ring-white/30"
                      style={{ background: value }}
                    />
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => update(def.param, e.target.value)}
                      aria-label={def.label}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </span>
                  <span className="flex-1 text-[12px]">{def.label}</span>
                  <span className="font-mono text-[10.5px] text-cream-300 tabular-nums">
                    {value.toUpperCase()}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-3 flex gap-2 border-t border-hairline-inverse pt-3">
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard
                  .writeText(buildShareUrl(active))
                  .then(() => toast.success("Vorschau-Link kopiert"));
              }}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-hairline-inverse px-3 py-1.5 text-[10.5px] font-semibold tracking-[0.08em] uppercase transition-colors hover:bg-cream-100 hover:text-ink"
            >
              <CopyIcon className="size-3" /> Link
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex flex-1 items-center justify-center rounded-sm border border-hairline-inverse px-3 py-1.5 text-[10.5px] font-semibold tracking-[0.08em] uppercase transition-colors hover:bg-cream-100 hover:text-ink"
            >
              Zurücksetzen
            </button>
          </div>
        </div>
      )}

      {/* Badge = Panel-Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-3 rounded-sm bg-cocoa-800 py-2 pr-4 pl-3 text-cream-100 shadow-lg transition-colors"
      >
        <PaletteIcon className="size-4" aria-hidden />
        <span className="flex items-center gap-1.5" aria-hidden>
          {THEME_PARAMS.flatMap((def) =>
            active[def.param]
              ? [
                  <span
                    key={def.param}
                    title={def.label}
                    className="size-3.5 rounded-full ring-1 ring-white/30"
                    style={{ background: active[def.param] }}
                  />,
                ]
              : [],
          )}
        </span>
        <span className="text-[11.5px] font-semibold tracking-[0.08em] uppercase">
          Farb-Vorschau
        </span>
      </button>
    </div>
  );
}
