import { Eyebrow, Price } from "#/components/ck/primitives";
import { formatDate, formatPrice, formatTime, formatWeight } from "#/lib/format";
import { type Locale, useI18n } from "#/lib/i18n";
import { roundEstimate } from "#/lib/order-request/estimate";
import { cn } from "#/lib/utils";

import { estimateFor, type OrderRequestOptions, type WizardState } from "./state";

/** Positionen als Text in einer Sprache (auch für die Danke-Seite gespeichert). */
export function itemLines(
  state: WizardState,
  options: OrderRequestOptions,
  locale: Locale,
): string[] {
  const pick = (de: string, ru: string) => (locale === "ru" && ru ? ru : de);
  if (state.kind === "cake") {
    const filling = options.fillings.find((f) => f.id === state.cake.fillingId);
    const parts = [formatWeight(state.cake.weightGrams, locale)];
    if (filling) parts.push(pick(filling.nameDe, filling.nameRu));
    const inscription = state.cake.inscription.trim();
    if (inscription) parts.push(locale === "ru" ? `«${inscription}»` : `„${inscription}“`);
    return [parts.join(" · ")];
  }
  if (state.kind === "dessert") {
    return state.desserts.flatMap((line) => {
      const product = options.products.find((p) => p.id === line.productId);
      if (!product) return [];
      const size = product.sizes.find((s) => s.id === line.sizeId);
      const filling = options.fillings.find((f) => f.id === line.fillingId);
      const parts = [`${line.quantity} × ${pick(product.nameDe, product.nameRu)}`];
      if (size) parts.push(pick(size.labelDe, size.labelRu));
      if (product.fillingSelectable && filling) parts.push(pick(filling.nameDe, filling.nameRu));
      return [parts.join(" · ")];
    });
  }
  return [];
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="ck-eyebrow text-ink-subtle">{label}</dt>
      <dd className="text-ink ck-body-sm">{children}</dd>
    </div>
  );
}

/** Zusammenfassung mit Schätzung: rechts klebend (Desktop) und im letzten Schritt. */
export function OrderSummary({
  state,
  options,
  photoCount,
  className,
}: {
  state: WizardState;
  options: OrderRequestOptions;
  photoCount: number;
  className?: string;
}) {
  const { t, locale } = useI18n();
  const f = t.orderForm;
  const lines = itemLines(state, options, locale);
  const estimate = estimateFor(state, options);
  const isEvent = state.kind === "event";
  const decor = [
    ...state.decorStyles.map((style) => f.decor.styles[style]),
    state.decorNote.trim(),
  ].filter(Boolean);

  return (
    <aside
      className={cn(
        "h-fit rounded-md border border-t-2 border-hairline border-t-accent bg-surface p-6",
        className,
      )}
    >
      <Eyebrow>{f.summary.title}</Eyebrow>
      {!state.kind ? (
        <p className="mt-4 text-ink-muted ck-body-sm">{f.summary.empty}</p>
      ) : (
        <dl className="mt-5 flex flex-col gap-4">
          <Row label={f.summary.kind}>{f.kind[state.kind].title}</Row>
          {lines.length > 0 && (
            <Row
              label={
                isEvent ? f.summary.kind : f.steps[state.kind === "cake" ? "torte" : "desserts"]
              }
            >
              <ul className="flex flex-col gap-1">
                {lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </Row>
          )}
          {isEvent && state.eventType && (
            <Row label={f.event.typeLegend}>
              {f.event.types[state.eventType]}
              {Number(state.guestCount) > 0 && ` · ${f.summary.guests(Number(state.guestCount))}`}
            </Row>
          )}
          {decor.length > 0 && (
            <Row label={isEvent ? f.event.wishes : f.decor.title}>{decor.join(" · ")}</Row>
          )}
          {photoCount > 0 && (
            <Row label={f.summary.photosLabel}>{f.summary.photos(photoCount)}</Row>
          )}
          {state.date && (
            <Row label={f.summary.date}>
              {formatDate(state.date, locale)}
              {!isEvent && state.time && `, ${formatTime(state.time, locale)}`}
              {!isEvent && (
                <span className="block text-ink-muted">
                  {state.fulfilment === "pickup" ? f.summary.pickup : f.summary.delivery}
                </span>
              )}
            </Row>
          )}
        </dl>
      )}

      {state.kind && (
        <div className="mt-5 border-t border-hairline pt-4">
          {isEvent ? (
            <p className="text-ink-muted ck-body-sm">{f.summary.eventPrice}</p>
          ) : estimate?.complete ? (
            <>
              <div className="flex items-baseline justify-between gap-4">
                <span className="ck-label">{f.summary.estimate}</span>
                <Price className="text-2xl">
                  {f.summary.estimateValue(formatPrice(roundEstimate(estimate.totalCents), locale))}
                </Price>
              </div>
              {estimate.deliveryFeeCents > 0 && (
                <p className="mt-1 text-right text-ink-muted ck-body-sm">
                  {f.summary.deliveryFee}: {formatPrice(estimate.deliveryFeeCents, locale)}
                </p>
              )}
              <p className="mt-3 text-ink-muted ck-body-sm">{f.summary.estimateNote}</p>
            </>
          ) : (
            <p className="text-ink-muted ck-body-sm">{f.summary.priceLater}</p>
          )}
        </div>
      )}
    </aside>
  );
}
