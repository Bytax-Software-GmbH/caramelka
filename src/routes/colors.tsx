import { createFileRoute } from "@tanstack/react-router";
import { CheckIcon, CopyIcon, DownloadIcon, RefreshCwIcon, RotateCcwIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { PublicShell } from "#/components/ck/layout";
import { Kicker, Ornament, SectionTitle } from "#/components/ck/primitives";
import {
  contrastRatio,
  type HarmonyKind,
  harmony,
  hexToHsl,
  randomHex,
  ramp,
  readableText,
} from "#/lib/color";
import { site } from "#/lib/site";
import { cn } from "#/lib/utils";

interface BrandToken {
  /** CSS-Custom-Property in src/styles.css :root. */
  cssVar: string;
  name: string;
  hex: string;
}

/**
 * Editierbare Marken-Token (Reihenfolge = hell → dunkel). Quelle: styles.css.
 * Die CSS-Var-Namen ermöglichen Live-Vorschau (setProperty) und den Export.
 */
const DEFAULT_BRAND: BrandToken[] = [
  { cssVar: "--creme", name: "Milchweiß", hex: "#F4F3F1" },
  { cssVar: "--creme-2", name: "Milchgrau", hex: "#E8E7E3" },
  { cssVar: "--toffee-light", name: "Nebelgrau", hex: "#DEDDDB" },
  { cssVar: "--cream-on-dark", name: "Grauweiß", hex: "#E7E8EA" },
  { cssVar: "--gold", name: "Silbergrau", hex: "#AAB0B6" },
  { cssVar: "--toffee", name: "Mittelgrau", hex: "#878D94" },
  { cssVar: "--caramel", name: "Stahlgrau", hex: "#6B7178" },
  { cssVar: "--caramel-deep", name: "Graphitgrau", hex: "#52575D" },
  { cssVar: "--espresso-2", name: "Graphit 2", hex: "#3B4046" },
  { cssVar: "--espresso", name: "Graphit", hex: "#23262B" },
  { cssVar: "--dark", name: "Tiefgraphit", hex: "#17191C" },
];

const HARMONIES: { key: HarmonyKind; label: string }[] = [
  { key: "complementary", label: "Komplementär" },
  { key: "analogous", label: "Analog" },
  { key: "triadic", label: "Triade" },
  { key: "split", label: "Split-Komplementär" },
  { key: "tetradic", label: "Tetradisch" },
];

export const Route = createFileRoute("/colors")({
  head: () => ({
    meta: [
      { title: `Farbpalette-Editor | ${site.name}` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ColorsPage,
});

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, toastLabel?: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(text);
      toast.success(toastLabel ?? `${text.toUpperCase()} kopiert`);
      window.setTimeout(() => setCopied((c) => (c === text ? null : c)), 1200);
    });
  };
  return { copied, copy };
}

/** Reiner Anzeige-Swatch (Rampe, Harmonien, Generator). Klick kopiert Hex. */
function Swatch({
  hex,
  label,
  sub,
  onCopy,
  copied,
  className,
}: {
  hex: string;
  label?: string;
  sub?: string;
  onCopy: (hex: string) => void;
  copied: boolean;
  className?: string;
}) {
  const text = readableText(hex);
  return (
    <button
      type="button"
      onClick={() => onCopy(hex)}
      title={`${hex} kopieren`}
      style={{ background: hex, color: text }}
      className={cn(
        "group relative flex min-h-[76px] flex-col justify-end gap-0.5 rounded-md p-3 text-left ring-1 ring-espresso/10 transition-transform duration-300 ease-[var(--ease-lux)] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-caramel active:scale-[0.98]",
        className,
      )}
    >
      <span className="absolute top-2.5 right-2.5 opacity-0 transition-opacity group-hover:opacity-70">
        {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
      </span>
      {label && <span className="text-[12px] leading-tight font-semibold">{label}</span>}
      <span className="font-mono text-[11px] tracking-wide tabular-nums opacity-80">
        {hex.toUpperCase()}
      </span>
      {sub && <span className="text-[10px] opacity-70">{sub}</span>}
    </button>
  );
}

/** Editierbarer Marken-Swatch: Klick öffnet den Farbwähler, Wert wird live gesetzt. */
function EditableSwatch({
  token,
  onChange,
}: {
  token: BrandToken;
  onChange: (hex: string) => void;
}) {
  const text = readableText(token.hex);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      style={{ background: token.hex, color: text }}
      className="group relative flex min-h-[104px] flex-col justify-end gap-0.5 rounded-md p-3 ring-1 ring-espresso/10 transition-transform duration-300 ease-[var(--ease-lux)] hover:-translate-y-0.5"
    >
      {/* Ganzer Swatch klickbar → nativer Farbwähler */}
      <input
        ref={inputRef}
        type="color"
        value={token.hex}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        aria-label={`${token.name} ändern`}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
      <span className="pointer-events-none absolute top-2.5 right-2.5 text-[10px] font-semibold tracking-wide uppercase opacity-0 transition-opacity group-hover:opacity-70">
        ändern
      </span>
      <span className="pointer-events-none text-[12px] leading-tight font-semibold">
        {token.name}
      </span>
      <span className="pointer-events-none font-mono text-[10.5px] tracking-wide opacity-70">
        {token.cssVar}
      </span>
      {/* Präzise Hex-Eingabe (klickbar über dem Overlay) */}
      <input
        type="text"
        value={token.hex}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        aria-label={`${token.name} Hex`}
        style={{ color: text, borderColor: `${text}44` }}
        className="relative z-10 mt-1 w-full rounded border bg-transparent px-1.5 py-1 font-mono text-[11px] tracking-wide uppercase focus:outline-none"
      />
    </div>
  );
}

function ColorsPage() {
  const { copied, copy } = useCopy();

  // ── Marken-Editor ──────────────────────────────────────────────────────
  const [brand, setBrand] = useState<BrandToken[]>(DEFAULT_BRAND);

  // Live-Vorschau: Token-Werte auf :root anwenden; beim Verlassen zurücksetzen.
  useEffect(() => {
    const root = document.documentElement;
    for (const t of brand) {
      if (/^#[0-9a-fA-F]{6}$/.test(t.hex)) root.style.setProperty(t.cssVar, t.hex);
    }
    return () => {
      for (const t of brand) root.style.removeProperty(t.cssVar);
    };
  }, [brand]);

  function setToken(cssVar: string, hex: string) {
    setBrand((prev) => prev.map((t) => (t.cssVar === cssVar ? { ...t, hex } : t)));
  }

  const cssExport = useMemo(
    () => `:root {\n${brand.map((t) => `  ${t.cssVar}: ${t.hex.toLowerCase()};`).join("\n")}\n}`,
    [brand],
  );
  const jsonExport = useMemo(
    () =>
      JSON.stringify(
        Object.fromEntries(brand.map((t) => [t.cssVar, t.hex.toUpperCase()])),
        null,
        2,
      ),
    [brand],
  );

  function download() {
    const blob = new Blob([`${cssExport}\n`], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "caramelka-theme.css";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("caramelka-theme.css heruntergeladen");
  }

  // ── Generator ──────────────────────────────────────────────────────────
  const [base, setBase] = useState("#6B7178");
  const [seed, setSeed] = useState(7);
  const scale = useMemo(() => ramp(base), [base]);
  const hsl = useMemo(() => hexToHsl(base), [base]);
  const harmonies = useMemo(
    () => HARMONIES.map((h) => ({ ...h, colors: harmony(base, h.key) })),
    [base],
  );
  const validHex = /^#?[0-9a-fA-F]{6}$/.test(base);

  function randomize() {
    const next = seed + 1 + Math.floor(performance.now() % 5);
    setSeed(next);
    setBase(randomHex(next));
  }

  return (
    <PublicShell>
      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <Kicker className="mb-4">Design-Werkzeug</Kicker>
        <SectionTitle as="h1" className="mb-4 text-5xl md:text-[56px]">
          Farbpalette-Editor
        </SectionTitle>
        <p className="mb-10 max-w-[62ch] text-[15.5px] leading-[1.65] text-pretty text-espresso/70">
          Jede Marken-Farbe ist anklickbar und anpassbar — Änderungen sind sofort auf der ganzen
          Seite sichtbar (Live-Vorschau). Unten lässt sich die fertige Konfiguration als CSS
          exportieren.
        </p>

        {/* ── Editierbare Markenpalette ── */}
        <div className="mb-10">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="ck-display text-2xl">Markenpalette</h2>
            <button
              type="button"
              onClick={() => {
                setBrand(DEFAULT_BRAND);
                toast.success("Auf Standard zurückgesetzt");
              }}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.12em] text-caramel-deep uppercase transition-colors hover:text-espresso"
            >
              <RotateCcwIcon className="size-3.5" /> Zurücksetzen
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {brand.map((t) => (
              <EditableSwatch
                key={t.cssVar}
                token={t}
                onChange={(hex) => setToken(t.cssVar, hex)}
              />
            ))}
          </div>
        </div>

        {/* ── Export ── */}
        <div className="mb-16 rounded-lg border border-espresso/12 bg-white/60 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="ck-kicker">Konfiguration exportieren</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copy(cssExport, "CSS kopiert")}
                className="inline-flex items-center gap-2 rounded-full border border-espresso/25 px-4 py-2 text-[12px] font-semibold tracking-[0.1em] text-espresso uppercase transition-colors hover:border-espresso hover:bg-espresso/5"
              >
                <CopyIcon className="size-3.5" /> CSS
              </button>
              <button
                type="button"
                onClick={() => copy(jsonExport, "JSON kopiert")}
                className="inline-flex items-center gap-2 rounded-full border border-espresso/25 px-4 py-2 text-[12px] font-semibold tracking-[0.1em] text-espresso uppercase transition-colors hover:border-espresso hover:bg-espresso/5"
              >
                <CopyIcon className="size-3.5" /> JSON
              </button>
              <button
                type="button"
                onClick={download}
                className="inline-flex items-center gap-2 rounded-full bg-espresso px-4 py-2 text-[12px] font-semibold tracking-[0.1em] text-creme uppercase transition-[background-color,transform] duration-500 ease-[var(--ease-lux)] hover:bg-caramel-deep active:scale-[0.96]"
              >
                <DownloadIcon className="size-3.5" /> .css
              </button>
            </div>
          </div>
          <pre className="max-h-64 overflow-auto rounded-md bg-espresso p-4 font-mono text-[12px] leading-relaxed text-cream-on-dark">
            {cssExport}
          </pre>
          <p className="mt-2 text-[12px] text-espresso/55">
            In <span className="font-mono">src/styles.css</span> im <span className="font-mono">
              :root
            </span>
            -Block einsetzen, um die Farben dauerhaft zu übernehmen.
          </p>
        </div>

        <Ornament className="mb-14" />

        {/* ── Generator ── */}
        <h2 className="mb-2 ck-display text-3xl">Paletten-Generator</h2>
        <p className="mb-8 max-w-[58ch] text-[14.5px] text-espresso/65">
          Basisfarbe wählen — Tint-/Shade-Rampe und Harmonien werden live erzeugt. Klick auf ein
          Feld kopiert den Hex-Wert.
        </p>

        <div className="mb-12 flex flex-wrap items-end gap-5 rounded-lg border border-espresso/12 bg-white/60 p-5">
          <label className="flex flex-col gap-2">
            <span className="ck-kicker">Basisfarbe</span>
            <span className="flex items-center gap-3">
              <input
                type="color"
                value={validHex ? (base.startsWith("#") ? base : `#${base}`) : "#6B7178"}
                onChange={(e) => setBase(e.target.value)}
                aria-label="Farbwähler"
                className="size-12 cursor-pointer rounded-md border border-espresso/20 bg-transparent p-0.5"
              />
              <input
                type="text"
                value={base}
                onChange={(e) => setBase(e.target.value)}
                spellCheck={false}
                aria-label="Hex-Wert"
                className={cn(
                  "w-32 rounded-md border bg-white px-3 py-2.5 font-mono text-[14px] uppercase focus:outline-none",
                  validHex ? "border-espresso/25 focus:border-caramel" : "border-destructive",
                )}
              />
            </span>
          </label>

          {hsl && (
            <div className="flex flex-col gap-1.5">
              <span className="ck-kicker">HSL</span>
              <span className="font-mono text-[13px] text-espresso/70 tabular-nums">
                {hsl.h}° · {hsl.s}% · {hsl.l}%
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={randomize}
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-espresso px-6 py-3 text-[12.5px] font-semibold tracking-[0.12em] text-creme uppercase transition-[background-color,transform] duration-500 ease-[var(--ease-lux)] hover:bg-caramel-deep active:scale-[0.96]"
          >
            <RefreshCwIcon className="size-4" /> Zufall
          </button>
        </div>

        <div className="mb-14">
          <h3 className="mb-4 ck-display text-2xl">Rampe (50 – 950)</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11">
            {scale.map((s) => (
              <Swatch
                key={s.step}
                hex={s.hex}
                label={String(s.step)}
                onCopy={copy}
                copied={copied === s.hex}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 ck-display text-2xl">Harmonien</h3>
          <div className="grid gap-6 md:grid-cols-2">
            {harmonies.map((h) => (
              <div key={h.key}>
                <div className="mb-2 ck-kicker">{h.label}</div>
                <div className="flex gap-2">
                  {h.colors.map((hex, i) => (
                    <Swatch
                      // eslint-disable-next-line react/no-array-index-key
                      key={`${h.key}-${i}`}
                      hex={hex}
                      sub={i === 0 ? undefined : `${contrastRatio(hex, base).toFixed(1)}:1 zu Basis`}
                      onCopy={copy}
                      copied={copied === hex}
                      className="flex-1"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
