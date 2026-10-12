import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export type OrderStatus = "new" | "confirmed" | "ready" | "completed" | "cancelled";
export type Fulfilment = "pickup" | "delivery";
export type Locale = "de" | "ru";
/** Art der Anfrage: Torte nach Gewicht, Desserts in festen Größen, Hochzeit/Bankett. */
export type OrderKind = "cake" | "dessert" | "event";
export type EventType = "wedding" | "banquet" | "other";
export type EmailKind =
  | "request_received"
  | "staff_new_request"
  | "order_confirmed"
  | "order_declined"
  | "test";
export type EmailStatus = "pending" | "sending" | "sent" | "failed";

/** Torten-Kategorien (Bento, Klassiker, Hochzeit, …). */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  nameDe: text("name_de").notNull(),
  nameRu: text("name_ru").notNull(),
  sort: integer("sort").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

/** Eine Torte / ein Patisserie-Produkt. Preise als "ab"-Preis in Cent. */
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  nameDe: text("name_de").notNull(),
  nameRu: text("name_ru").notNull(),
  descriptionDe: text("description_de").notNull().default(""),
  descriptionRu: text("description_ru").notNull().default(""),
  /** Platzhalter-Key für das Foto (z. B. "bento"), bis echte Fotos da sind. */
  imageKey: text("image_key").notNull().default("torte"),
  /** Vorlaufzeit in Stunden (bestimmt den frühesten Termin im Formular). */
  leadTimeHours: integer("lead_time_hours").notNull().default(48),
  /** Füllung im Bestellflow wählbar? (Hochzeitstorten: nach Absprache) */
  fillingSelectable: boolean("filling_selectable").notNull().default(true),
  /** In welchen Anfrage-Fluss führt "Jetzt anfragen" (Torte, Desserts, Event)? */
  orderKind: text("order_kind").$type<OrderKind>().notNull().default("cake"),
  featured: boolean("featured").notNull().default(false),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Größen-Varianten einer Torte mit eigenem Preis. IDs bleiben beim Bearbeiten stabil. */
export const productSizes = pgTable(
  "product_sizes",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    labelDe: text("label_de").notNull(),
    labelRu: text("label_ru").notNull(),
    priceCents: integer("price_cents").notNull(),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [uniqueIndex("product_sizes_product_label_uniq").on(t.productId, t.labelDe)],
);

/** Füllungen — global für alle Torten mit fillingSelectable. */
export const fillings = pgTable("fillings", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  nameDe: text("name_de").notNull(),
  nameRu: text("name_ru").notNull(),
  descriptionDe: text("description_de").notNull().default(""),
  descriptionRu: text("description_ru").notNull().default(""),
  /** Kommagetrennte Allergene, z. B. "Gluten, Milch, Ei, Nüsse". */
  allergensDe: text("allergens_de").notNull().default(""),
  allergensRu: text("allergens_ru").notNull().default(""),
  imageKey: text("image_key").notNull().default("fuellung"),
  /** Preis je kg für Torten nach Gewicht. null = keine Schätzung, Preis kommt mit der Bestätigung. */
  pricePerKgCents: integer("price_per_kg_cents"),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
});

/**
 * Anfrage bzw. Bestellung. Status "new" = Anfrage eingegangen, verbindlich erst
 * nach Bestätigung per E-Mail. Beträge in subtotal/total sind die Schätzung aus
 * dem Formular; den Endpreis setzt die Bäckerei beim Bestätigen.
 * Zahlung: bei Abholung/Lieferung (PayPal folgt später).
 */
export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    /** Kurze, kommunizierbare Nummer, z. B. "CK-4F7K2". */
    orderNo: text("order_no").notNull().unique(),
    /** Doppel-Absenden abfangen: Client-UUID pro Formular. */
    submissionId: text("submission_id").unique(),
    kind: text("kind").$type<OrderKind>().notNull(),
    status: text("status").$type<OrderStatus>().notNull().default("new"),
    /** null bei Hochzeit/Bankett: Übergabe wird persönlich geklärt. */
    fulfilment: text("fulfilment").$type<Fulfilment>(),
    desiredDate: date("desired_date").notNull(),
    /** "HH:MM" Ortszeit Europe/Berlin; null bei Events und Altbestand. */
    desiredTime: text("desired_time"),
    customerName: text("customer_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    street: text("street"),
    zip: text("zip"),
    city: text("city"),
    note: text("note"),
    decorNote: text("decor_note"),
    decorStyles: text("decor_styles").array().notNull().default([]),
    eventType: text("event_type").$type<EventType>(),
    guestCount: integer("guest_count"),
    /** Produkt, über das die Anfrage gestartet wurde (Inspiration). */
    inspirationProductId: integer("inspiration_product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    locale: text("locale").$type<Locale>().notNull().default("de"),
    subtotalCents: integer("subtotal_cents").notNull(),
    deliveryFeeCents: integer("delivery_fee_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    /** Verbindlicher Endpreis, gesetzt beim Bestätigen. */
    finalTotalCents: integer("final_total_cents"),
    /** Nachricht an die Kundin aus Bestätigung/Absage (landet in der E-Mail). */
    customerMessage: text("customer_message"),
    /** Interne Notiz, nie in E-Mails. */
    staffNote: text("staff_note"),
    privacyAcceptedAt: timestamp("privacy_accepted_at"),
    confirmedAt: timestamp("confirmed_at"),
    cancelledAt: timestamp("cancelled_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("orders_desired_date_idx").on(t.desiredDate),
    index("orders_status_idx").on(t.status),
  ],
);

/**
 * Positions-Snapshot: Namen bleiben korrekt, auch wenn Produkte später geändert
 * werden. IDs (Füllung, Größe) und Gewicht sind für die spätere Lagerplanung da.
 * Bei Torten nach Gewicht: unitPriceCents = €/kg-Snapshot, quantity = 1.
 */
export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    sizeId: integer("size_id").references(() => productSizes.id, { onDelete: "set null" }),
    fillingId: integer("filling_id").references(() => fillings.id, { onDelete: "set null" }),
    productName: text("product_name").notNull(),
    sizeLabel: text("size_label").notNull(),
    fillingName: text("filling_name"),
    weightGrams: integer("weight_grams"),
    /** Tortenaufschrift, z. B. "Alles Gute, Anna!" */
    inscription: text("inscription"),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull().default(1),
    totalCents: integer("total_cents").notNull(),
  },
  (t) => [
    index("order_items_order_id_idx").on(t.orderId),
    index("order_items_filling_id_idx").on(t.fillingId),
  ],
);

/** Wunschfotos zur Anfrage. Dateien liegen unter UPLOAD_DIR, nie öffentlich. */
export const orderFiles = pgTable(
  "order_files",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull().unique(),
    originalName: text("original_name").notNull(),
    mime: text("mime").notNull(),
    bytes: integer("bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("order_files_order_id_idx").on(t.orderId)],
);

/**
 * Ausgehende E-Mails. Werden in derselben Transaktion wie die Bestellung
 * angelegt und danach verschickt; Fehlversuche mit Backoff wiederholt.
 */
export const emailOutbox = pgTable(
  "email_outbox",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }),
    kind: text("kind").$type<EmailKind>().notNull(),
    recipient: text("recipient").notNull(),
    replyTo: text("reply_to"),
    subject: text("subject").notNull(),
    bodyHtml: text("body_html").notNull(),
    bodyText: text("body_text").notNull(),
    /** Optionaler Kalender-Anhang (text/calendar). */
    ics: text("ics"),
    status: text("status").$type<EmailStatus>().notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at").notNull().defaultNow(),
    lastError: text("last_error"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    sentAt: timestamp("sent_at"),
  },
  (t) => [
    index("email_outbox_status_next_idx").on(t.status, t.nextAttemptAt),
    index("email_outbox_order_id_idx").on(t.orderId),
  ],
);
