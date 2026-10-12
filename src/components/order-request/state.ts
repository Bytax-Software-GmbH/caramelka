/**
 * Zustand des Anfrage-Formulars: Reducer, Schritte, Validierung je Schritt,
 * Schätzung und die Nutzlast für `$submitOrderRequest`. Rein, ohne React,
 * damit sich alles einzeln prüfen lässt.
 */
import * as z from "zod";

import type { OrderKind } from "#/lib/db/schema/caramelka.schema";
import type { Dict } from "#/lib/i18n/dict";
import { computeEstimate, type Estimate } from "#/lib/order-request/estimate";
import { isBookableDate, requiredLeadTimeHours, slotsFor } from "#/lib/order-request/schedule";
import {
  decorStyleSchema,
  eventTypeSchema,
  type DecorStyle,
  type EventType,
  type OrderRequestInput,
} from "#/lib/order-request/schema";
import type { $getOrderRequestOptions } from "#/lib/server/orders";
import { site } from "#/lib/site";

export type OrderRequestOptions = Awaited<ReturnType<typeof $getOrderRequestOptions>>;
export type OptionProduct = OrderRequestOptions["products"][number];
export type OptionFilling = OrderRequestOptions["fillings"][number];

export const stepKeySchema = z.enum([
  "anlass",
  "torte",
  "desserts",
  "feier",
  "dekor",
  "termin",
  "kontakt",
]);
export type StepKey = z.infer<typeof stepKeySchema>;

const STEPS_BY_KIND: Record<OrderKind, StepKey[]> = {
  cake: ["anlass", "torte", "dekor", "termin", "kontakt"],
  dessert: ["anlass", "desserts", "dekor", "termin", "kontakt"],
  event: ["anlass", "feier", "kontakt"],
};

/** Ohne gewählte Art zeigt die Schrittanzeige den Torten-Ablauf. */
export function stepsFor(kind: OrderKind | null): StepKey[] {
  return STEPS_BY_KIND[kind ?? "cake"];
}

/** URL-Kurzform der Art (`?art=`) → interne Art. */
export const kindParamSchema = z.enum(["torte", "desserts", "event"]);
const KIND_BY_PARAM: Record<z.infer<typeof kindParamSchema>, OrderKind> = {
  torte: "cake",
  desserts: "dessert",
  event: "event",
};

const cakeLineSchema = z.object({
  fillingId: z.number().int().nullable(),
  weightGrams: z.number().int(),
  inscription: z.string(),
});
const dessertLineSchema = z.object({
  productId: z.number().int().nullable(),
  sizeId: z.number().int().nullable(),
  fillingId: z.number().int().nullable(),
  quantity: z.number().int(),
});

/** Formularzustand; dient zugleich als Schema für den Entwurf in sessionStorage. */
export const wizardStateSchema = z.object({
  kind: z.enum(["cake", "dessert", "event"]).nullable(),
  cake: cakeLineSchema,
  desserts: z.array(dessertLineSchema).min(1).max(site.shop.dessert.maxItems),
  eventType: eventTypeSchema.nullable(),
  guestCount: z.string(),
  decorStyles: z.array(decorStyleSchema),
  decorNote: z.string(),
  fulfilment: z.enum(["pickup", "delivery"]),
  date: z.string().nullable(),
  time: z.string().nullable(),
  street: z.string(),
  zip: z.string(),
  city: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  note: z.string(),
  privacy: z.boolean(),
  inspirationProductId: z.number().int().nullable(),
});
export type WizardState = z.infer<typeof wizardStateSchema>;
export type CakeLine = WizardState["cake"];
export type DessertLine = WizardState["desserts"][number];

const DEFAULT_CAKE_GRAMS = 2000;

export function emptyDessertLine(): DessertLine {
  return { productId: null, sizeId: null, fillingId: null, quantity: 1 };
}

export function emptyState(): WizardState {
  return {
    kind: null,
    cake: { fillingId: null, weightGrams: DEFAULT_CAKE_GRAMS, inscription: "" },
    desserts: [emptyDessertLine()],
    eventType: null,
    guestCount: "",
    decorStyles: [],
    decorNote: "",
    fulfilment: "pickup",
    date: null,
    time: null,
    street: "",
    zip: "",
    city: "",
    name: "",
    email: "",
    phone: "",
    note: "",
    privacy: false,
    inspirationProductId: null,
  };
}

export interface Prefill {
  art?: z.infer<typeof kindParamSchema>;
  produkt?: string;
  fuellung?: string;
}

/** Startzustand aus den Links "Jetzt anfragen" (Produkt, Füllung, Art). */
export function prefilledState(prefill: Prefill, options: OrderRequestOptions): WizardState {
  const state = emptyState();
  const product = prefill.produkt
    ? options.products.find((p) => p.slug === prefill.produkt)
    : undefined;
  const filling = prefill.fuellung
    ? options.fillings.find((f) => f.slug === prefill.fuellung)
    : undefined;

  state.kind = prefill.art ? KIND_BY_PARAM[prefill.art] : (product?.orderKind ?? null);
  if (product) {
    state.inspirationProductId = product.id;
    if (product.orderKind === "dessert") {
      state.desserts = [
        {
          productId: product.id,
          sizeId: product.sizes[0]?.id ?? null,
          fillingId: product.fillingSelectable && filling ? filling.id : null,
          quantity: 1,
        },
      ];
    }
  }
  if (filling) state.cake.fillingId = filling.id;
  return state;
}

export function hasPrefill(prefill: Prefill): boolean {
  return Boolean(prefill.art || prefill.produkt || prefill.fuellung);
}

export type Action =
  | { type: "setKind"; kind: OrderKind }
  | { type: "patch"; patch: Partial<Omit<WizardState, "cake" | "desserts">> }
  | { type: "patchCake"; patch: Partial<CakeLine> }
  | { type: "patchDessert"; index: number; patch: Partial<DessertLine> }
  | { type: "addDessert" }
  | { type: "removeDessert"; index: number }
  | { type: "toggleDecor"; style: DecorStyle }
  | { type: "reset" };

export function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case "setKind":
      // Termin neu wählen lassen: Vorlauf und Schließtage hängen an der Art.
      return action.kind === state.kind ? state : { ...state, kind: action.kind, time: null };
    case "patch":
      return { ...state, ...action.patch };
    case "patchCake":
      return { ...state, cake: { ...state.cake, ...action.patch } };
    case "patchDessert":
      return {
        ...state,
        desserts: state.desserts.map((line, index) =>
          index === action.index ? { ...line, ...action.patch } : line,
        ),
      };
    case "addDessert":
      return state.desserts.length >= site.shop.dessert.maxItems
        ? state
        : { ...state, desserts: [...state.desserts, emptyDessertLine()] };
    case "removeDessert":
      return state.desserts.length <= 1
        ? state
        : { ...state, desserts: state.desserts.filter((_, index) => index !== action.index) };
    case "toggleDecor":
      return {
        ...state,
        decorStyles: state.decorStyles.includes(action.style)
          ? state.decorStyles.filter((style) => style !== action.style)
          : [...state.decorStyles, action.style],
      };
    case "reset":
      return emptyState();
  }
}

/** Vorlaufzeit der aktuellen Auswahl (Art, Dessert-Produkte, passende Inspiration). */
export function leadHoursFor(state: WizardState, options: OrderRequestOptions): number {
  const kind = state.kind ?? "cake";
  const byId = new Map(options.products.map((p) => [p.id, p]));
  const ids =
    kind === "dessert"
      ? state.desserts.flatMap((line) => (line.productId === null ? [] : [line.productId]))
      : [];
  const inspiration =
    state.inspirationProductId === null ? undefined : byId.get(state.inspirationProductId);
  if (inspiration && inspiration.orderKind === kind) ids.push(inspiration.id);
  const leadTimes = ids.flatMap((id) => {
    const product = byId.get(id);
    return product ? [product.leadTimeHours] : [];
  });
  return requiredLeadTimeHours(kind, leadTimes);
}

export type ErrorKey = keyof Dict["orderForm"]["errors"];
/** Feldname → Fehlertext-Schlüssel. Felder tragen `data-field` im Markup. */
export type StepErrors = Record<string, ErrorKey>;

const ZIP_PATTERN = /^\d{4,5}$/;
const emailCheck = z.email();

export function validateStep(
  step: StepKey,
  state: WizardState,
  options: OrderRequestOptions,
  now: Date,
): StepErrors {
  const errors: StepErrors = {};
  const kind = state.kind ?? "cake";

  switch (step) {
    case "anlass":
      if (!state.kind) errors.kind = "kind";
      break;
    case "torte": {
      const filling = options.fillings.find((f) => f.id === state.cake.fillingId);
      if (!filling) errors.filling = "filling";
      const { minGrams, maxGrams, stepGrams } = site.shop.cake;
      const grams = state.cake.weightGrams;
      if (grams < minGrams || grams > maxGrams || grams % stepGrams !== 0) errors.weight = "weight";
      break;
    }
    case "desserts":
      state.desserts.forEach((line, index) => {
        const product = options.products.find(
          (p) => p.id === line.productId && p.orderKind === "dessert",
        );
        if (!product) {
          errors[`dessert.${index}.product`] = "product";
          return;
        }
        if (!product.sizes.some((size) => size.id === line.sizeId)) {
          errors[`dessert.${index}.size`] = "size";
        }
        if (product.fillingSelectable && !options.fillings.some((f) => f.id === line.fillingId)) {
          errors[`dessert.${index}.filling`] = "dessertFilling";
        }
      });
      break;
    case "feier": {
      if (!state.eventType) errors.eventType = "eventType";
      const guests = Number(state.guestCount);
      if (!Number.isInteger(guests) || guests < 1 || guests > site.shop.event.maxGuests) {
        errors.guests = "guests";
      }
      if (!state.date) errors.date = "date";
      else if (!isBookableDate(state.date, "event", leadHoursFor(state, options), now)) {
        errors.date = "dateUnavailable";
      }
      break;
    }
    case "dekor":
      break;
    case "termin": {
      const leadHours = leadHoursFor(state, options);
      if (!state.date) errors.date = "date";
      else if (!isBookableDate(state.date, kind, leadHours, now)) errors.date = "dateUnavailable";
      else if (!state.time || !slotsFor(state.date, kind, leadHours, now).includes(state.time)) {
        errors.time = "time";
      }
      if (state.fulfilment === "delivery") {
        if (!state.street.trim()) errors.street = "street";
        if (!ZIP_PATTERN.test(state.zip.trim())) errors.zip = "zip";
        if (!state.city.trim()) errors.city = "city";
      }
      break;
    }
    case "kontakt":
      if (state.name.trim().length < 2) errors.name = "name";
      if (state.phone.replace(/\D/g, "").length < 6) errors.phone = "phone";
      if (!emailCheck.safeParse(state.email.trim()).success) errors.email = "email";
      if (!state.privacy) errors.privacy = "privacy";
      break;
  }
  return errors;
}

/** Erster Schritt mit offenen Pflichtangaben, oder -1. */
export function firstInvalidStep(
  state: WizardState,
  options: OrderRequestOptions,
  now: Date,
): number {
  return stepsFor(state.kind).findIndex(
    (step) => Object.keys(validateStep(step, state, options, now)).length > 0,
  );
}

/** Schätzung aus den vollständigen Positionen; null, solange nichts zu rechnen ist. */
export function estimateFor(state: WizardState, options: OrderRequestOptions): Estimate | null {
  if (state.kind === "cake") {
    const { fillingId, weightGrams } = state.cake;
    if (fillingId === null) return null;
    const result = computeEstimate(
      { kind: "cake", fulfilment: state.fulfilment, items: [{ fillingId, weightGrams }] },
      { fillings: activeFillings(options), products: [] },
    );
    return result.ok ? result.estimate : null;
  }
  if (state.kind === "dessert") {
    const items = state.desserts.flatMap((line) =>
      line.productId === null || line.sizeId === null
        ? []
        : [
            {
              productId: line.productId,
              sizeId: line.sizeId,
              fillingId: line.fillingId,
              quantity: line.quantity,
            },
          ],
    );
    if (items.length === 0) return null;
    const result = computeEstimate(
      { kind: "dessert", fulfilment: state.fulfilment, items },
      { fillings: activeFillings(options), products: activeProducts(options) },
    );
    return result.ok ? result.estimate : null;
  }
  return null;
}

function activeFillings(options: OrderRequestOptions) {
  return options.fillings.map((f) => ({
    id: f.id,
    active: true,
    pricePerKgCents: f.pricePerKgCents,
  }));
}

function activeProducts(options: OrderRequestOptions) {
  return options.products.map((p) => ({ ...p, active: true }));
}

/** Nutzlast für `$submitOrderRequest` (wird dort mit demselben Schema geprüft). */
export function toPayload(
  state: WizardState,
  meta: { submissionId: string; startedAt: number; locale: "de" | "ru"; website: string },
): OrderRequestInput | null {
  // Einwilligung ist Pflicht; ohne sie gibt es keine Nutzlast.
  if (!state.kind || !state.date || !state.privacy) return null;
  const base = {
    submissionId: meta.submissionId,
    locale: meta.locale,
    desiredDate: state.date,
    decorNote: state.decorNote.trim() || undefined,
    decorStyles: state.decorStyles,
    note: state.note.trim() || undefined,
    inspirationProductId: state.inspirationProductId,
    customerName: state.name.trim(),
    email: state.email.trim(),
    phone: state.phone.trim(),
    website: meta.website,
    startedAt: meta.startedAt,
  };
  if (state.kind === "event") {
    if (!state.eventType) return null;
    return {
      ...base,
      privacyAccepted: true,
      kind: "event",
      eventType: state.eventType,
      guestCount: Number(state.guestCount),
    };
  }
  if (!state.time) return null;
  const handover = {
    desiredTime: state.time,
    fulfilment: state.fulfilment,
    street: state.fulfilment === "delivery" ? state.street.trim() : undefined,
    zip: state.fulfilment === "delivery" ? state.zip.trim() : undefined,
    city: state.fulfilment === "delivery" ? state.city.trim() : undefined,
  };
  if (state.kind === "cake") {
    if (state.cake.fillingId === null) return null;
    return {
      ...base,
      ...handover,
      privacyAccepted: true,
      kind: "cake",
      items: [
        {
          fillingId: state.cake.fillingId,
          weightGrams: state.cake.weightGrams,
          inscription: state.cake.inscription.trim() || undefined,
        },
      ],
    };
  }
  return {
    ...base,
    ...handover,
    privacyAccepted: true,
    kind: "dessert",
    items: state.desserts.flatMap((line) =>
      line.productId === null || line.sizeId === null
        ? []
        : [
            {
              productId: line.productId,
              sizeId: line.sizeId,
              fillingId: line.fillingId,
              quantity: line.quantity,
            },
          ],
    ),
  };
}

export type { DecorStyle, EventType };
