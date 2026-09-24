import { Link } from "@tanstack/react-router";
import { InfoIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { useId } from "react";

import { Button } from "#/components/ck/button";
import { Checkbox } from "#/components/ck/checkbox";
import { ChoiceCard } from "#/components/ck/choice-card";
import { DatePicker } from "#/components/ck/date-picker";
import { IconButton } from "#/components/ck/icon-button";
import { Input, Textarea } from "#/components/ck/input";
import { PhotoDropzone } from "#/components/ck/photo-dropzone";
import { Placeholder } from "#/components/ck/placeholder";
import { Radio } from "#/components/ck/radio";
import { Select } from "#/components/ck/select";
import { Tag } from "#/components/ck/tag";
import { TimeSlotPicker } from "#/components/ck/time-slot-picker";
import { formatDate, formatPrice, formatWeight } from "#/lib/format";
import { useI18n } from "#/lib/i18n";
import { fillingImageKey } from "#/lib/image-manifest";
import { portionsFor } from "#/lib/order-request/estimate";
import {
  addDays,
  berlinClock,
  daySlots,
  earliestBookableDate,
  isBookableDate,
  MAX_DAYS_AHEAD,
  slotsFor,
} from "#/lib/order-request/schedule";
import { DECOR_STYLES, EVENT_TYPES } from "#/lib/order-request/schema";
import { site } from "#/lib/site";

import {
  type Action,
  leadHoursFor,
  type OrderRequestOptions,
  type StepErrors,
  type WizardState,
} from "./state";
import type { usePhotoAttachments } from "./use-photo-attachments";

export interface StepProps {
  state: WizardState;
  dispatch: React.Dispatch<Action>;
  options: OrderRequestOptions;
  /** Nur gesetzt, nachdem "Weiter" einmal versucht wurde. */
  errors: StepErrors;
  now: Date;
}

type Photos = ReturnType<typeof usePhotoAttachments>;

const legendClass = "mb-4 ck-eyebrow text-rosegold-600";
const MB = Math.round(site.shop.upload.maxBytes / (1024 * 1024));

export function fieldErrorId(field: string): string {
  return `of-error-${field.replace(/\./g, "-")}`;
}

function FieldError({ field, errors }: { field: string; errors: StepErrors }) {
  const { t } = useI18n();
  const key = errors[field];
  if (!key) return null;
  return (
    <p id={fieldErrorId(field)} className="mt-2 text-error ck-body-sm">
      {t.orderForm.errors[key]}
    </p>
  );
}

function errorText(field: string, errors: StepErrors, t: ReturnType<typeof useI18n>["t"]) {
  const key = errors[field];
  return key ? t.orderForm.errors[key] : undefined;
}

// ── Anlass ──────────────────────────────────────────────────────────────

const KIND_IMAGES = { cake: "karamell", dessert: "eclair-selection", event: "hochzeit" };

export function KindStep({ state, dispatch, errors }: StepProps) {
  const { t } = useI18n();
  const f = t.orderForm;
  const kinds = ["cake", "dessert", "event"] as const;
  return (
    <fieldset data-field="kind" aria-describedby={errors.kind ? fieldErrorId("kind") : undefined}>
      {/* Die Überschrift des Schritts stellt die Frage schon sichtbar. */}
      <legend className="sr-only">{f.kind.legend}</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {kinds.map((kind) => (
          <ChoiceCard
            key={kind}
            name="kind"
            value={kind}
            checked={state.kind === kind}
            onChange={() => dispatch({ type: "setKind", kind })}
            title={f.kind[kind].title}
            description={f.kind[kind].text}
            media={<Placeholder imageKey={KIND_IMAGES[kind]} alt="" />}
          />
        ))}
      </div>
      <FieldError field="kind" errors={errors} />
    </fieldset>
  );
}

// ── Torte ───────────────────────────────────────────────────────────────

function InspirationChip({ state, dispatch, options }: StepProps) {
  const { t, pickL } = useI18n();
  const product = options.products.find((p) => p.id === state.inspirationProductId);
  if (!product || product.orderKind !== state.kind) return null;
  return (
    <div className="mb-6 flex items-center gap-3 rounded-sm border border-hairline-accent bg-accent-soft px-4 py-3">
      <span className="size-12 shrink-0 overflow-hidden rounded-xs bg-sunken">
        <Placeholder imageKey={product.imageKey} alt="" />
      </span>
      <span className="flex-1 ck-body-sm">
        {t.orderForm.cake.inspiration(pickL(product.nameDe, product.nameRu))}
      </span>
      <IconButton
        size="sm"
        label={t.orderForm.cake.removeInspiration}
        onClick={() => dispatch({ type: "patch", patch: { inspirationProductId: null } })}
      >
        <XIcon strokeWidth={1.5} />
      </IconButton>
    </div>
  );
}

export function CakeStep(props: StepProps) {
  const { state, dispatch, options, errors } = props;
  const { t, locale, pickL } = useI18n();
  const f = t.orderForm;
  const { minGrams, maxGrams, stepGrams } = site.shop.cake;
  const weights: number[] = [];
  for (let g = minGrams; g <= maxGrams; g += stepGrams) weights.push(g);

  return (
    <div className="flex flex-col gap-8">
      <InspirationChip {...props} />
      <fieldset
        data-field="filling"
        aria-describedby={errors.filling ? fieldErrorId("filling") : undefined}
      >
        <legend className={legendClass}>{f.cake.fillingLegend}</legend>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {options.fillings.map((filling) => {
            const name = pickL(filling.nameDe, filling.nameRu);
            const allergens = pickL(filling.allergensDe, filling.allergensRu);
            return (
              <ChoiceCard
                key={filling.id}
                name="filling"
                value={filling.id}
                checked={state.cake.fillingId === filling.id}
                onChange={() => dispatch({ type: "patchCake", patch: { fillingId: filling.id } })}
                title={name}
                description={
                  <span className="line-clamp-2">
                    {pickL(filling.descriptionDe, filling.descriptionRu)}
                  </span>
                }
                footnote={allergens ? f.cake.allergens(allergens) : undefined}
                meta={
                  filling.pricePerKgCents === null
                    ? f.cake.priceOnRequest
                    : f.cake.perKg(formatPrice(filling.pricePerKgCents, locale))
                }
                media={<Placeholder imageKey={fillingImageKey(filling)} alt="" />}
              />
            );
          })}
        </div>
        <FieldError field="filling" errors={errors} />
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <div data-field="weight">
          <Select
            id="of-weight"
            label={f.cake.weight}
            value={String(state.cake.weightGrams)}
            onChange={(event) =>
              dispatch({ type: "patchCake", patch: { weightGrams: Number(event.target.value) } })
            }
            hint={f.cake.weightHint}
            error={errorText("weight", errors, t)}
            options={weights.map((grams) => ({
              value: String(grams),
              label: f.cake.weightOption(formatWeight(grams, locale), portionsFor(grams)),
            }))}
          />
        </div>
        <Input
          id="of-inscription"
          label={f.cake.inscription}
          maxLength={120}
          value={state.cake.inscription}
          onChange={(event) =>
            dispatch({ type: "patchCake", patch: { inscription: event.target.value } })
          }
          placeholder={f.cake.inscriptionPlaceholder}
          hint={`${state.cake.inscription.length} / 120`}
        />
      </div>
    </div>
  );
}

// ── Desserts ────────────────────────────────────────────────────────────

export function DessertStep(props: StepProps) {
  const { state, dispatch, options, errors } = props;
  const { t, locale, pickL } = useI18n();
  const f = t.orderForm;
  const desserts = options.products.filter((p) => p.orderKind === "dessert");
  const quantities = Array.from({ length: site.shop.dessert.maxQuantity }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-5">
      <InspirationChip {...props} />
      {state.desserts.map((line, index) => {
        const product = desserts.find((p) => p.id === line.productId);
        return (
          <div
            key={index}
            className="rounded-sm border border-hairline bg-surface p-5"
            aria-label={f.dessert.line(index + 1)}
            // Gruppe statt <fieldset>, damit der Kopf mit Entfernen-Knopf frei gestaltbar bleibt.
            // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
            role="group"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="ck-eyebrow text-rosegold-600">{f.dessert.line(index + 1)}</span>
              {state.desserts.length > 1 && (
                <IconButton
                  size="sm"
                  label={f.dessert.removeLine(index + 1)}
                  onClick={() => dispatch({ type: "removeDessert", index })}
                >
                  <Trash2Icon strokeWidth={1.5} />
                </IconButton>
              )}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div data-field={`dessert.${index}.product`} className="sm:col-span-2">
                <Select
                  label={f.dessert.product}
                  value={line.productId === null ? "" : String(line.productId)}
                  error={errorText(`dessert.${index}.product`, errors, t)}
                  onChange={(event) => {
                    const next = desserts.find((p) => String(p.id) === event.target.value);
                    dispatch({
                      type: "patchDessert",
                      index,
                      patch: {
                        productId: next?.id ?? null,
                        sizeId: next?.sizes[0]?.id ?? null,
                        fillingId: null,
                      },
                    });
                  }}
                  options={[
                    { value: "", label: f.dessert.productPlaceholder, disabled: true },
                    ...desserts.map((p) => ({
                      value: String(p.id),
                      label: pickL(p.nameDe, p.nameRu),
                    })),
                  ]}
                />
              </div>
              {product && (
                <>
                  <div data-field={`dessert.${index}.size`}>
                    <Select
                      label={f.dessert.size}
                      value={line.sizeId === null ? "" : String(line.sizeId)}
                      error={errorText(`dessert.${index}.size`, errors, t)}
                      onChange={(event) =>
                        dispatch({
                          type: "patchDessert",
                          index,
                          patch: { sizeId: Number(event.target.value) || null },
                        })
                      }
                      options={product.sizes.map((size) => ({
                        value: String(size.id),
                        label: `${pickL(size.labelDe, size.labelRu)} · ${formatPrice(size.priceCents, locale)}`,
                      }))}
                    />
                  </div>
                  <Select
                    label={f.dessert.quantity}
                    value={String(line.quantity)}
                    onChange={(event) =>
                      dispatch({
                        type: "patchDessert",
                        index,
                        patch: { quantity: Number(event.target.value) },
                      })
                    }
                    options={quantities.map((n) => ({ value: String(n), label: String(n) }))}
                  />
                  {product.fillingSelectable && (
                    <div data-field={`dessert.${index}.filling`} className="sm:col-span-2">
                      <Select
                        label={f.dessert.filling}
                        value={line.fillingId === null ? "" : String(line.fillingId)}
                        error={errorText(`dessert.${index}.filling`, errors, t)}
                        onChange={(event) =>
                          dispatch({
                            type: "patchDessert",
                            index,
                            patch: { fillingId: Number(event.target.value) || null },
                          })
                        }
                        options={[
                          { value: "", label: f.dessert.productPlaceholder, disabled: true },
                          ...options.fillings.map((filling) => ({
                            value: String(filling.id),
                            label: pickL(filling.nameDe, filling.nameRu),
                          })),
                        ]}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
      {state.desserts.length < site.shop.dessert.maxItems && (
        <Button
          variant="secondary"
          className="self-start"
          icon={<PlusIcon strokeWidth={1.5} />}
          onClick={() => dispatch({ type: "addDessert" })}
        >
          {f.dessert.addLine}
        </Button>
      )}
    </div>
  );
}

// ── Fotos (Dekor und Feier) ─────────────────────────────────────────────

function PhotoField({ photos }: { photos: Photos }) {
  const { t } = useI18n();
  const p = t.orderForm.photos;
  const messages = photos.messages.map((message) => {
    switch (message.type) {
      case "type":
        return p.errors.type(message.name);
      case "size":
        return p.errors.size(message.name, MB);
      case "decode":
        return p.errors.decode(message.name);
      case "count":
        return p.errors.count(site.shop.upload.maxFiles);
    }
  });
  return (
    <PhotoDropzone
      photos={photos.photos}
      max={site.shop.upload.maxFiles}
      busy={photos.busy}
      messages={messages}
      onAdd={(files) => void photos.add(files)}
      onRemove={photos.remove}
      labels={{
        title: p.title,
        hint: p.hint(site.shop.upload.maxFiles, MB),
        cta: p.cta,
        dragHint: p.dragHint,
        count: p.count,
        processing: p.processing,
        alt: p.alt,
        remove: p.remove,
      }}
    />
  );
}

// ── Feier (Hochzeit, Bankett) ───────────────────────────────────────────

export function EventStep(props: StepProps & { photos: Photos }) {
  const { state, dispatch, options, errors, now, photos } = props;
  const { t, locale } = useI18n();
  const f = t.orderForm;
  const dateLabelId = useId();
  const leadHours = leadHoursFor(state, options);
  const earliest = earliestBookableDate("event", leadHours, now);
  const lastDate = addDays(berlinClock(now).isoDate, MAX_DAYS_AHEAD);

  return (
    <div className="flex flex-col gap-8">
      <InspirationChip {...props} />
      <fieldset
        data-field="eventType"
        aria-describedby={errors.eventType ? fieldErrorId("eventType") : undefined}
      >
        <legend className={legendClass}>{f.event.typeLegend}</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {EVENT_TYPES.map((type) => (
            <Radio
              key={type}
              card
              name="eventType"
              label={f.event.types[type]}
              checked={state.eventType === type}
              onChange={() => dispatch({ type: "patch", patch: { eventType: type } })}
            />
          ))}
        </div>
        <FieldError field="eventType" errors={errors} />
      </fieldset>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr]">
        <div data-field="date">
          <span id={dateLabelId} className="mb-3 block ck-label text-ink-muted">
            {f.event.date}
          </span>
          <DatePicker
            value={state.date}
            onChange={(date) => dispatch({ type: "patch", patch: { date } })}
            isDisabled={(date) => !isBookableDate(date, "event", leadHours, now)}
            locale={locale}
            firstDate={earliest}
            lastDate={lastDate}
            invalid={Boolean(errors.date)}
            labelledBy={dateLabelId}
            describedBy={errors.date ? fieldErrorId("date") : undefined}
          />
          <p className="mt-2 text-ink-muted ck-body-sm">
            {f.event.dateHint(formatDate(earliest, locale))}
          </p>
          <FieldError field="date" errors={errors} />
        </div>
        <div className="flex flex-col gap-6">
          <div data-field="guests">
            <Input
              id="of-guests"
              label={f.event.guests}
              type="number"
              inputMode="numeric"
              min={1}
              max={site.shop.event.maxGuests}
              value={state.guestCount}
              onChange={(event) =>
                dispatch({ type: "patch", patch: { guestCount: event.target.value } })
              }
              error={errorText("guests", errors, t)}
            />
          </div>
          <Textarea
            label={f.event.wishes}
            rows={4}
            maxLength={1000}
            value={state.decorNote}
            onChange={(event) =>
              dispatch({ type: "patch", patch: { decorNote: event.target.value } })
            }
            placeholder={f.event.wishesPlaceholder}
          />
        </div>
      </div>

      <PhotoField photos={photos} />

      <p className="flex items-start gap-3 rounded-sm bg-sunken px-4 py-3 text-ink-muted ck-body-sm">
        <InfoIcon
          aria-hidden
          strokeWidth={1.5}
          className="mt-0.5 size-4 shrink-0 text-rosegold-600"
        />
        {f.event.personal}
      </p>
    </div>
  );
}

// ── Dekor ───────────────────────────────────────────────────────────────

export function DecorStep({ state, dispatch, photos }: StepProps & { photos: Photos }) {
  const { t } = useI18n();
  const f = t.orderForm;
  return (
    <div className="flex flex-col gap-8">
      <fieldset>
        <legend className={legendClass}>{f.decor.stylesLegend}</legend>
        <div className="flex flex-wrap gap-2">
          {DECOR_STYLES.map((style) => (
            <Tag
              key={style}
              selected={state.decorStyles.includes(style)}
              onClick={() => dispatch({ type: "toggleDecor", style })}
            >
              {f.decor.styles[style]}
            </Tag>
          ))}
        </div>
      </fieldset>
      <Textarea
        label={f.decor.note}
        rows={4}
        maxLength={1000}
        value={state.decorNote}
        onChange={(event) => dispatch({ type: "patch", patch: { decorNote: event.target.value } })}
        placeholder={f.decor.notePlaceholder}
      />
      <PhotoField photos={photos} />
      <p className="flex items-start gap-3 rounded-sm bg-sunken px-4 py-3 text-ink-muted ck-body-sm">
        <InfoIcon
          aria-hidden
          strokeWidth={1.5}
          className="mt-0.5 size-4 shrink-0 text-rosegold-600"
        />
        <span>
          {state.decorStyles.length === 0 && !state.decorNote.trim() && photos.photos.length === 0
            ? `${f.decor.empty} `
            : ""}
          {f.decor.surcharge}
        </span>
      </p>
    </div>
  );
}

// ── Termin & Übergabe ───────────────────────────────────────────────────

export function ScheduleStep({ state, dispatch, options, errors, now }: StepProps) {
  const { t, locale } = useI18n();
  const f = t.orderForm;
  const dateLabelId = useId();
  const timeLabelId = useId();
  const kind = state.kind ?? "cake";
  const leadHours = leadHoursFor(state, options);
  const earliest = earliestBookableDate(kind, leadHours, now);
  const lastDate = addDays(berlinClock(now).isoDate, MAX_DAYS_AHEAD);
  const available = new Set(state.date ? slotsFor(state.date, kind, leadHours, now) : []);
  const fee = formatPrice(site.shop.deliveryFeeCents, locale);

  function selectDate(date: string) {
    const stillFree =
      state.time !== null && slotsFor(date, kind, leadHours, now).includes(state.time);
    dispatch({ type: "patch", patch: { date, time: stillFree ? state.time : null } });
  }

  return (
    <div className="flex flex-col gap-8">
      <fieldset>
        <legend className={legendClass}>{f.schedule.fulfilmentLegend}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Radio
            card
            name="fulfilment"
            label={f.schedule.pickup}
            description={f.schedule.pickupHint}
            meta={t.common.free}
            checked={state.fulfilment === "pickup"}
            onChange={() => dispatch({ type: "patch", patch: { fulfilment: "pickup" } })}
          />
          <Radio
            card
            name="fulfilment"
            label={f.schedule.delivery}
            description={f.schedule.deliveryHint(fee, site.shop.deliveryRadiusKm)}
            meta={fee}
            checked={state.fulfilment === "delivery"}
            onChange={() => dispatch({ type: "patch", patch: { fulfilment: "delivery" } })}
          />
        </div>
      </fieldset>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr]">
        <div data-field="date">
          <span id={dateLabelId} className="mb-3 block ck-label text-ink-muted">
            {f.schedule.date}
          </span>
          <DatePicker
            value={state.date}
            onChange={selectDate}
            isDisabled={(date) => !isBookableDate(date, kind, leadHours, now)}
            locale={locale}
            firstDate={earliest}
            lastDate={lastDate}
            invalid={Boolean(errors.date)}
            labelledBy={dateLabelId}
            describedBy={errors.date ? fieldErrorId("date") : undefined}
          />
          <p className="mt-2 text-ink-muted ck-body-sm">
            {f.schedule.dateHint(formatDate(earliest, locale))}
          </p>
          <FieldError field="date" errors={errors} />
        </div>

        <div data-field="time">
          <span id={timeLabelId} className="mb-3 block ck-label text-ink-muted">
            {state.fulfilment === "pickup" ? f.schedule.timePickup : f.schedule.timeDelivery}
          </span>
          {!state.date ? (
            <p className="text-ink-muted ck-body-sm">{f.schedule.chooseDateFirst}</p>
          ) : available.size === 0 ? (
            <p className="text-ink-muted ck-body-sm">{f.schedule.noSlots}</p>
          ) : (
            <div role="radiogroup" aria-labelledby={timeLabelId}>
              <TimeSlotPicker
                name="time"
                slots={daySlots()}
                available={available}
                value={state.time}
                onChange={(time) => dispatch({ type: "patch", patch: { time } })}
                formatLabel={(slot) => slot}
                groupLabels={{ morning: f.schedule.morning, afternoon: f.schedule.afternoon }}
                describedBy={errors.time ? fieldErrorId("time") : undefined}
              />
            </div>
          )}
          <FieldError field="time" errors={errors} />
        </div>
      </div>

      {state.fulfilment === "delivery" && (
        <fieldset>
          <legend className={legendClass}>{f.schedule.address}</legend>
          <div className="grid gap-5 sm:grid-cols-[1fr_140px_1fr]">
            <div data-field="street">
              <Input
                id="of-street"
                label={f.schedule.street}
                autoComplete="street-address"
                value={state.street}
                onChange={(event) =>
                  dispatch({ type: "patch", patch: { street: event.target.value } })
                }
                error={errorText("street", errors, t)}
              />
            </div>
            <div data-field="zip">
              <Input
                id="of-zip"
                label={f.schedule.zip}
                autoComplete="postal-code"
                inputMode="numeric"
                maxLength={5}
                value={state.zip}
                onChange={(event) =>
                  dispatch({ type: "patch", patch: { zip: event.target.value } })
                }
                error={errorText("zip", errors, t)}
              />
            </div>
            <div data-field="city">
              <Input
                id="of-city"
                label={f.schedule.city}
                autoComplete="address-level2"
                value={state.city}
                onChange={(event) =>
                  dispatch({ type: "patch", patch: { city: event.target.value } })
                }
                error={errorText("city", errors, t)}
              />
            </div>
          </div>
        </fieldset>
      )}
    </div>
  );
}

// ── Kontakt ─────────────────────────────────────────────────────────────

export function ContactStep({
  state,
  dispatch,
  errors,
  website,
  onWebsiteChange,
}: StepProps & { website: string; onWebsiteChange: (value: string) => void }) {
  const { t } = useI18n();
  const f = t.orderForm;
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div data-field="name">
          <Input
            id="of-name"
            label={f.contact.name}
            autoComplete="name"
            value={state.name}
            onChange={(event) => dispatch({ type: "patch", patch: { name: event.target.value } })}
            error={errorText("name", errors, t)}
          />
        </div>
        <div data-field="phone">
          <Input
            id="of-phone"
            label={f.contact.phone}
            type="tel"
            autoComplete="tel"
            value={state.phone}
            onChange={(event) => dispatch({ type: "patch", patch: { phone: event.target.value } })}
            error={errorText("phone", errors, t)}
          />
        </div>
        <div data-field="email" className="sm:col-span-2">
          <Input
            id="of-email"
            label={f.contact.email}
            type="email"
            autoComplete="email"
            value={state.email}
            onChange={(event) => dispatch({ type: "patch", patch: { email: event.target.value } })}
            hint={f.contact.emailHint}
            error={errorText("email", errors, t)}
          />
        </div>
      </div>
      <Textarea
        label={f.contact.note}
        rows={3}
        maxLength={1000}
        value={state.note}
        onChange={(event) => dispatch({ type: "patch", patch: { note: event.target.value } })}
        placeholder={f.contact.notePlaceholder}
      />

      {/* Honeypot: für Menschen unsichtbar, Bots füllen es gern aus. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => onWebsiteChange(event.target.value)}
          />
        </label>
      </div>

      <div data-field="privacy">
        <Checkbox
          checked={state.privacy}
          onChange={(event) =>
            dispatch({ type: "patch", patch: { privacy: event.target.checked } })
          }
          aria-describedby={errors.privacy ? fieldErrorId("privacy") : undefined}
          label={
            <span>
              {f.contact.privacyBefore}
              <Link
                to="/datenschutz"
                target="_blank"
                className="border-b border-hairline-accent text-brand"
              >
                {f.contact.privacyLink}
              </Link>
              {f.contact.privacyAfter}
            </span>
          }
        />
        <FieldError field="privacy" errors={errors} />
      </div>
    </div>
  );
}
