CREATE TABLE "email_outbox" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"kind" text NOT NULL,
	"recipient" text NOT NULL,
	"reply_to" text,
	"subject" text NOT NULL,
	"body_html" text NOT NULL,
	"body_text" text NOT NULL,
	"ics" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp DEFAULT now() NOT NULL,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "order_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"storage_key" text NOT NULL,
	"original_name" text NOT NULL,
	"mime" text NOT NULL,
	"bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_files_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "fulfilment" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "fillings" ADD COLUMN "price_per_kg_cents" integer;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "size_id" integer;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "filling_id" integer;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "weight_grams" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "submission_id" text;--> statement-breakpoint
-- Altbestand (Warenkorb: Produkt + Größe) ist fachlich eine Dessert-Bestellung.
ALTER TABLE "orders" ADD COLUMN "kind" text DEFAULT 'dessert' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "kind" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "desired_time" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "decor_note" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "decor_styles" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "event_type" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "guest_count" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "inspiration_product_id" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "final_total_cents" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_message" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "staff_note" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "privacy_accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "confirmed_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cancelled_at" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "order_kind" text DEFAULT 'cake' NOT NULL;--> statement-breakpoint
-- Anfrage-Fluss aus der Kategorie ableiten (im Admin später änderbar).
UPDATE "products" SET "order_kind" = 'event' WHERE "category_id" IN (SELECT "id" FROM "categories" WHERE "slug" = 'hochzeit');--> statement-breakpoint
UPDATE "products" SET "order_kind" = 'dessert' WHERE "category_id" IN (SELECT "id" FROM "categories" WHERE "slug" IN ('patisserie', 'bento'));--> statement-breakpoint
ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_files" ADD CONSTRAINT "order_files_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_outbox_status_next_idx" ON "email_outbox" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "email_outbox_order_id_idx" ON "email_outbox" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_files_order_id_idx" ON "order_files" USING btree ("order_id");--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_size_id_product_sizes_id_fk" FOREIGN KEY ("size_id") REFERENCES "public"."product_sizes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_filling_id_fillings_id_fk" FOREIGN KEY ("filling_id") REFERENCES "public"."fillings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_inspiration_product_id_products_id_fk" FOREIGN KEY ("inspiration_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_filling_id_idx" ON "order_items" USING btree ("filling_id");--> statement-breakpoint
CREATE INDEX "orders_desired_date_idx" ON "orders" USING btree ("desired_date");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_submission_id_unique" UNIQUE("submission_id");