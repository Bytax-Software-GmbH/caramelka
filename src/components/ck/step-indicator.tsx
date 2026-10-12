import { cn } from "#/lib/utils";

/**
 * Fortschritt eines mehrstufigen Formulars. Erledigte Schritte sind
 * Knöpfe zum Zurückspringen, der aktuelle trägt aria-current, spätere
 * sind nur Text. Mobil: "Schritt 2 von 5 · Termin" plus Haarlinie.
 */
export function StepIndicator({
  steps,
  current,
  onSelect,
  label,
  stepOf,
}: {
  steps: { key: string; label: string }[];
  current: number;
  onSelect: (index: number) => void;
  label: string;
  stepOf: (n: number, total: number) => string;
}) {
  const active = steps[current];
  return (
    <nav aria-label={label}>
      <div className="md:hidden">
        <div className="flex items-baseline justify-between gap-3 ck-body-sm">
          <span className="text-ink-muted">{stepOf(current + 1, steps.length)}</span>
          <span className="ck-label text-brand">{active?.label}</span>
        </div>
        <div className="mt-2 h-px bg-hairline">
          <div
            className="h-px bg-rosegold-500 transition-[width] duration-(--dur-slow) ease-out motion-reduce:transition-none"
            style={{ width: `${((current + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
      <ol className="hidden items-center gap-3 md:flex">
        {steps.map((step, index) => {
          const done = index < current;
          const isCurrent = index === current;
          return (
            <li key={step.key} className="flex items-center gap-3">
              {index > 0 && <span aria-hidden className="h-px w-8 bg-hairline-strong" />}
              {done ? (
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  className="flex items-center gap-2 ck-label text-brand transition-colors duration-(--dur-fast) ease-out hover:text-accent-hover"
                >
                  <StepNumber n={index + 1} state="done" />
                  {step.label}
                </button>
              ) : (
                <span
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2 ck-label",
                    isCurrent ? "text-ink" : "text-ink-subtle",
                  )}
                >
                  <StepNumber n={index + 1} state={isCurrent ? "current" : "todo"} />
                  {step.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepNumber({ n, state }: { n: number; state: "done" | "current" | "todo" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-6 place-items-center rounded-full border text-[11px] tabular-nums",
        state === "done" && "border-hairline-accent bg-accent-soft text-brand",
        state === "current" && "border-primary bg-primary text-primary-contrast",
        state === "todo" && "border-hairline text-ink-subtle",
      )}
    >
      {n}
    </span>
  );
}
