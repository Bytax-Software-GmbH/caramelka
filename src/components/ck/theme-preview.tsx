import { useEffect, useState } from "react";

import { darken, normalizeHex } from "#/lib/color";

/**
 * Sitewide Farb-Vorschau über URL-Parameter, damit der Kunde Kombis live
 * testen kann: `/?primary=6B7178&secondary=AAB0B6` (Hex ohne #).
 *
 * - `primary`   → --caramel, --caramel-deep (automatisch abgedunkelt)
 * - `secondary` → --gold, --toffee (automatisch abgedunkelt)
 * - Persistenz in sessionStorage → Kombi überlebt Navigation + Reload im Tab
 * - `?theme=reset` beendet die Vorschau
 */

const STORAGE_KEY = "ck-theme-preview";

interface ThemePreview {
  primary?: string;
  secondary?: string;
}

function readStored(): ThemePreview | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const p = parsed as ThemePreview;
    const primary = normalizeHex(p.primary) ?? undefined;
    const secondary = normalizeHex(p.secondary) ?? undefined;
    return primary || secondary ? { primary, secondary } : null;
  } catch {
    return null;
  }
}

function applyPreview(preview: ThemePreview) {
  const root = document.documentElement;
  if (preview.primary) {
    root.style.setProperty("--caramel", preview.primary);
    root.style.setProperty("--caramel-deep", darken(preview.primary, 12));
  }
  if (preview.secondary) {
    root.style.setProperty("--gold", preview.secondary);
    root.style.setProperty("--toffee", darken(preview.secondary, 8));
  }
}

function clearPreview() {
  const root = document.documentElement;
  for (const v of ["--caramel", "--caramel-deep", "--gold", "--toffee"]) {
    root.style.removeProperty(v);
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

/** Teilbarer Link aus zwei Farben (für den „Link teilen"-Button). */
export function buildShareUrl(primary: string, secondary: string): string {
  const p = normalizeHex(primary)?.slice(1) ?? "";
  const s = normalizeHex(secondary)?.slice(1) ?? "";
  return `${window.location.origin}/?primary=${p}&secondary=${s}`;
}

export function ThemeParamSync() {
  const [active, setActive] = useState<ThemePreview | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("theme") === "reset") {
      clearPreview();
      setActive(null);
      return;
    }

    const fromUrl: ThemePreview = {
      primary: normalizeHex(params.get("primary")) ?? undefined,
      secondary: normalizeHex(params.get("secondary")) ?? undefined,
    };

    // URL-Params gewinnen und werden persistiert; sonst gespeicherte Vorschau.
    const preview = fromUrl.primary || fromUrl.secondary ? fromUrl : readStored();
    if (!preview) return;

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(preview));
    applyPreview(preview);
    setActive(preview);
  }, []);

  if (!active) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-full bg-espresso/95 py-2 pr-4 pl-3 text-creme shadow-lg backdrop-blur">
      <span className="flex items-center gap-1.5" aria-hidden>
        {active.primary && (
          <span
            className="size-4 rounded-full ring-1 ring-white/30"
            style={{ background: active.primary }}
          />
        )}
        {active.secondary && (
          <span
            className="size-4 rounded-full ring-1 ring-white/30"
            style={{ background: active.secondary }}
          />
        )}
      </span>
      <span className="text-[11.5px] font-semibold tracking-[0.08em] uppercase">
        Farb-Vorschau aktiv
      </span>
      <button
        type="button"
        onClick={() => {
          clearPreview();
          setActive(null);
        }}
        className="rounded-full border border-creme/40 px-2.5 py-0.5 text-[10.5px] font-semibold tracking-[0.08em] uppercase transition-colors hover:bg-creme hover:text-espresso"
      >
        Zurücksetzen
      </button>
    </div>
  );
}
