/**
 * Vertrag zwischen Anfrage-Formular und `$submitOrderRequest`. Läuft auf
 * Client und Server, darf daher nichts Serverseitiges importieren.
 */
import * as z from "zod";

import { site } from "#/lib/site";

export const orderKindSchema = z.enum(["cake", "dessert", "event"]);
export const eventTypeSchema = z.enum(["wedding", "banquet", "other"]);
/** Deko-Stile zum Anklicken. TODO: Auswahl mit der Kundin abstimmen. */
export const decorStyleSchema = z.enum(["classic", "flowers", "berries", "kids", "minimal"]);

export const EVENT_TYPES = eventTypeSchema.options;
export const DECOR_STYLES = decorStyleSchema.options;

/** "HH:MM" */
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const optionalText = (max: number) => z.string().trim().max(max).optional();

const baseFields = {
  /** Client-UUID pro Formular, macht erneutes Absenden idempotent. */
  submissionId: z.uuid(),
  locale: z.enum(["de", "ru"]),
  desiredDate: z.iso.date(),
  decorNote: optionalText(1000),
  decorStyles: z.array(decorStyleSchema).max(DECOR_STYLES.length).default([]),
  note: optionalText(1000),
  inspirationProductId: z.number().int().positive().nullable().default(null),
  customerName: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine((v) => v.replace(/\D/g, "").length >= 6),
  privacyAccepted: z.literal(true),
  /** Honeypot: echte Menschen lassen das Feld leer. */
  website: z.string().max(200).default(""),
  /** Zeitpunkt (ms), zu dem das Formular geöffnet wurde. */
  startedAt: z.number().int().nonnegative(),
};

const handoverFields = {
  desiredTime: timeSchema,
  fulfilment: z.enum(["pickup", "delivery"]),
  street: optionalText(200),
  zip: z
    .string()
    .trim()
    .regex(/^\d{4,5}$/)
    .optional(),
  city: optionalText(100),
};

const { minGrams, maxGrams, stepGrams, maxItems: maxCakes } = site.shop.cake;

export const cakeItemSchema = z.object({
  fillingId: z.number().int().positive(),
  weightGrams: z
    .number()
    .int()
    .min(minGrams)
    .max(maxGrams)
    .refine((g) => g % stepGrams === 0),
  inscription: optionalText(120),
});

export const dessertItemSchema = z.object({
  productId: z.number().int().positive(),
  sizeId: z.number().int().positive(),
  fillingId: z.number().int().positive().nullable().default(null),
  quantity: z.number().int().min(1).max(site.shop.dessert.maxQuantity),
});

const cakeRequestSchema = z.object({
  kind: z.literal("cake"),
  ...baseFields,
  ...handoverFields,
  items: z.array(cakeItemSchema).min(1).max(maxCakes),
});

const dessertRequestSchema = z.object({
  kind: z.literal("dessert"),
  ...baseFields,
  ...handoverFields,
  items: z.array(dessertItemSchema).min(1).max(site.shop.dessert.maxItems),
});

const eventRequestSchema = z.object({
  kind: z.literal("event"),
  ...baseFields,
  eventType: eventTypeSchema,
  guestCount: z.number().int().min(1).max(site.shop.event.maxGuests),
});

const ADDRESS_FIELDS: Array<"street" | "zip" | "city"> = ["street", "zip", "city"];

export const orderRequestSchema = z
  .discriminatedUnion("kind", [cakeRequestSchema, dessertRequestSchema, eventRequestSchema])
  .superRefine((request, ctx) => {
    if (request.kind === "event" || request.fulfilment === "pickup") return;
    for (const field of ADDRESS_FIELDS) {
      if (!request[field]) ctx.addIssue({ code: "custom", path: [field], message: "required" });
    }
  });

export type OrderRequest = z.infer<typeof orderRequestSchema>;
export type OrderRequestInput = z.input<typeof orderRequestSchema>;
export type CakeItem = z.infer<typeof cakeItemSchema>;
export type DessertItem = z.infer<typeof dessertItemSchema>;
export type EventType = z.infer<typeof eventTypeSchema>;
export type DecorStyle = z.infer<typeof decorStyleSchema>;

/** Erwartbare Fehler kommen als Code zurück (nicht als Exception), damit das Formular sie übersetzen kann. */
export type OrderRequestErrorCode =
  | "VALIDATION"
  | "SLOT_DATE"
  | "SLOT_TIME"
  | "FILLING_UNAVAILABLE"
  | "PRODUCT_UNAVAILABLE"
  | "INVALID_IMAGE"
  | "TOO_MANY_FILES"
  | "RATE_LIMITED";

export type OrderRequestResult =
  | { ok: true; orderNo: string }
  | { ok: false; code: OrderRequestErrorCode; field?: string; index?: number };
