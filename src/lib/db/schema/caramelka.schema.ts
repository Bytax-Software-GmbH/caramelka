import {
  boolean,
  date,
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
  /** Vorlaufzeit in Stunden (bestimmt frühestes Wunschdatum im Checkout). */
  leadTimeHours: integer("lead_time_hours").notNull().default(48),
  /** Füllung im Bestellflow wählbar? (Hochzeitstorten: nach Absprache) */
  fillingSelectable: boolean("filling_selectable").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Größen-Varianten einer Torte mit eigenem Preis. */
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
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
});

/** Kundenbestellung. Zahlung: bei Abholung/Lieferung (PayPal folgt später). */
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  /** Kurze, kommunizierbare Nummer, z. B. "CK-4F7K2". */
  orderNo: text("order_no").notNull().unique(),
  status: text("status").$type<OrderStatus>().notNull().default("new"),
  fulfilment: text("fulfilment").$type<Fulfilment>().notNull(),
  desiredDate: date("desired_date").notNull(),
  customerName: text("customer_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  street: text("street"),
  zip: text("zip"),
  city: text("city"),
  note: text("note"),
  locale: text("locale").$type<Locale>().notNull().default("de"),
  subtotalCents: integer("subtotal_cents").notNull(),
  deliveryFeeCents: integer("delivery_fee_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Positions-Snapshot — bleibt korrekt, auch wenn Produkte später geändert werden. */
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  sizeLabel: text("size_label").notNull(),
  fillingName: text("filling_name"),
  /** Tortenaufschrift, z. B. "Alles Gute, Anna!" */
  inscription: text("inscription"),
  unitPriceCents: integer("unit_price_cents").notNull(),
  quantity: integer("quantity").notNull().default(1),
  totalCents: integer("total_cents").notNull(),
});
