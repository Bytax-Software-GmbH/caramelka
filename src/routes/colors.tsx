import { createFileRoute } from "@tanstack/react-router";
import { CheckIcon, CopyIcon, RefreshCwIcon } from "lucide-react";
import { useMemo, useState } from "react";
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

/** Aktuelle Caramelka-Markenfarben (Quelle: src/styles.css :root) — Graphit/Grau/Milch. */
const BRAND: { name: string; hex: string }[] = [
  { name: "Milchweiß", hex: "#F4F3F1" },
  { name: "Milchgrau", hex: "#E8E7E3" },
  { name: "Nebelgrau", hex: "#DEDDDB" },
  { name: "Grauweiß", hex: "#E7E8EA" },
  { name: "Silbergrau", hex: "#AAB0B6" },
  { name: "Mittelgrau", hex: "#878D94" },
  { name: "Stahlgrau", hex: "#6B7178" },
  { name: "Graphitgrau", hex: "#52575D" },
  { name: "Graphit 2", hex: "#3B4046" },
  { name: "Graphit", hex: "#23262B" },
  { name: "Tiefgraphit", hex: "#17191C" },
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
      { title: `Farbpalette-Generator | ${site.name}` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ColorsPage,
});

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (hex: string) => {
    void navigator.clipboard.writeText(hex).then(() => {
      setCopied(hex);
      toast.success(`${hex.toUpperCase()} kopiert`);
      window.setTimeout(() => setCopied((c) => (c === hex ? null : c)), 1200);
    });
  };
  return { copied, copy };
}

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

function ColorsPage() {
  const [base, setBase] = useState("#6B7178"); // Stahlgrau als Start
  const [seed, setSeed] = useState(7);
  const { copied, copy } = useCopy();

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
          Farbpalette-Generator
        </SectionTitle>
        <p className="mb-10 max-w-[58ch] text-[15.5px] leading-[1.65] text-pretty text-espresso/70">
          Basisfarbe wählen — die Tint-/Shade-Rampe und passende Harmonien werden live erzeugt.
          Klick auf ein Feld kopiert den Hex-Wert.
        </p>

        {/* Steuerung */}
        <div className="mb-12 flex flex-wrap items-end gap-5 rounded-lg border border-espresso/12 bg-white/60 p-5">
          <label className="flex flex-col gap-2">
            <span className="ck-kicker">Basisfarbe</span>
            <span className="flex items-center gap-3">
              <input
                type="color"
                value={validHex ? (base.startsWith("#") ? base : `#${base}`) : "#A96A32"}
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

        {/* Tint-/Shade-Rampe */}
        <div className="mb-14">
          <h2 className="mb-4 ck-display text-2xl">Rampe (50 – 950)</h2>
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

        {/* Harmonien */}
        <div className="mb-16">
          <h2 className="mb-4 ck-display text-2xl">Harmonien</h2>
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
                      sub={
                        i === 0
                          ? undefined
                          : `${contrastRatio(hex, base).toFixed(1)}:1 zu Basis`
                      }
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

        <Ornament className="mb-12" />

        {/* Marken-Palette */}
        <div>
          <h2 className="mb-1 ck-display text-2xl">Caramelka-Markenpalette</h2>
          <p className="mb-5 text-[13.5px] text-espresso/60">
            Die 11 festen Marken-Töne aus dem Design-System.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11">
            {BRAND.map((c) => (
              <Swatch
                key={c.hex}
                hex={c.hex}
                label={c.name}
                onCopy={copy}
                copied={copied === c.hex}
                className="min-h-[92px]"
              />
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
