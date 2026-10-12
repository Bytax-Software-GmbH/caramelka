import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { centsToEuroInput, parseEuroToCents } from "#/components/admin/format";
import { AdminPanel } from "#/components/ck/admin";
import { Button } from "#/components/ck/button";
import { Checkbox } from "#/components/ck/checkbox";
import { IconButton } from "#/components/ck/icon-button";
import { Input, Textarea } from "#/components/ck/input";
import { Select } from "#/components/ck/select";
import type { OrderKind } from "#/lib/db/schema/caramelka.schema";
import { ORDER_KIND_ORDER, PRODUCT_ORDER_KIND_LABEL } from "#/lib/order-status";
import { $adminUpsertProduct } from "#/lib/server/admin";

interface SizeRow {
  /** Vorhandene Größe; bleibt beim Speichern stabil (Bestellungen verweisen darauf). */
  id?: number;
  labelDe: string;
  labelRu: string;
  priceEuro: string;
}

export interface ProductFormValues {
  id?: number;
  slug: string;
  categoryId: number;
  nameDe: string;
  nameRu: string;
  descriptionDe: string;
  descriptionRu: string;
  imageKey: string;
  leadTimeHours: number;
  fillingSelectable: boolean;
  orderKind: OrderKind;
  featured: boolean;
  active: boolean;
  sort: number;
  sizes: { id?: number; labelDe: string; labelRu: string; priceCents: number }[];
}

const emptySize: SizeRow = { labelDe: "", labelRu: "", priceEuro: "" };

const DUPLICATE_LABEL_MESSAGE =
  "Zwei Größen haben dasselbe Label (DE). Labels müssen je Produkt eindeutig sein.";

/** Labels (DE), die mehr als einmal vorkommen. */
function duplicateLabels(rows: SizeRow[]): Set<string> {
  const labels = rows.map((row) => row.labelDe.trim()).filter(Boolean);
  return new Set(labels.filter((label, index) => labels.indexOf(label) !== index));
}

export function AdminProductForm({
  initial,
  categories,
}: {
  initial: ProductFormValues;
  categories: { id: number; nameDe: string }[];
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { sizes: initialSizes, ...initialValues } = initial;
  const [values, setValues] = useState(initialValues);
  const [sizes, setSizes] = useState((): SizeRow[] =>
    initialSizes.length > 0
      ? initialSizes.map((s) => ({
          id: s.id,
          labelDe: s.labelDe,
          labelRu: s.labelRu,
          priceEuro: centsToEuroInput(s.priceCents),
        }))
      : [{ ...emptySize }],
  );
  const [slugError, setSlugError] = useState("");
  const [sizesError, setSizesError] = useState("");

  const duplicates = duplicateLabels(sizes);

  const mutation = useMutation({
    mutationFn: () => {
      const parsedSizes = sizes
        .filter((s) => s.labelDe.trim())
        .map((s) => ({
          ...(s.id ? { id: s.id } : {}),
          labelDe: s.labelDe.trim(),
          labelRu: s.labelRu.trim() || s.labelDe.trim(),
          priceCents: parseEuroToCents(s.priceEuro),
        }));
      const validSizes = parsedSizes.flatMap(({ priceCents, ...size }) =>
        priceCents === null ? [] : [{ ...size, priceCents }],
      );
      if (validSizes.length === 0 || validSizes.length !== parsedSizes.length) {
        throw new Error(
          "Mindestens eine Größe angeben, jede mit gültigem Preis (z. B. 42 oder 42,50).",
        );
      }
      if (duplicates.size > 0) throw new Error(DUPLICATE_LABEL_MESSAGE);
      return $adminUpsertProduct({
        data: {
          ...(initial.id ? { id: initial.id } : {}),
          slug: values.slug.trim(),
          categoryId: values.categoryId,
          nameDe: values.nameDe.trim(),
          nameRu: values.nameRu.trim() || values.nameDe.trim(),
          descriptionDe: values.descriptionDe.trim(),
          descriptionRu: values.descriptionRu.trim(),
          imageKey: values.imageKey.trim() || "torte",
          leadTimeHours: values.leadTimeHours,
          fillingSelectable: values.fillingSelectable,
          orderKind: values.orderKind,
          featured: values.featured,
          active: values.active,
          sort: values.sort,
          sizes: validSizes,
        },
      });
    },
    onSuccess: (result) => {
      if (!result.ok) {
        if (result.code === "DUPLICATE_SIZE_LABEL") {
          setSizesError(DUPLICATE_LABEL_MESSAGE);
          toast.error("Doppeltes Größen-Label");
        } else if (result.code === "DUPLICATE_SLUG") {
          setSlugError("Dieser Slug ist schon vergeben.");
          toast.error("Slug ist schon vergeben");
        } else {
          toast.error("Produkt nicht gefunden");
        }
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      toast.success("Produkt gespeichert");
      void navigate({ to: "/app/produkte" });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Speichern fehlgeschlagen"),
  });

  function set<K extends keyof typeof values>(key: K, v: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function setSize(index: number, patch: Partial<SizeRow>) {
    setSizesError("");
    setSizes((s) => s.map((row, j) => (j === index ? { ...row, ...patch } : row)));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="flex max-w-3xl flex-col gap-6"
    >
      <AdminPanel title="Stammdaten">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Name (DE)"
            value={values.nameDe}
            onChange={(e) => set("nameDe", e.target.value)}
            required
          />
          <Input
            label="Name (RU)"
            value={values.nameRu}
            onChange={(e) => set("nameRu", e.target.value)}
          />
          <Input
            label="Slug (URL)"
            value={values.slug}
            onChange={(e) => {
              setSlugError("");
              set("slug", e.target.value);
            }}
            pattern="[a-z0-9-]+"
            error={slugError || undefined}
            required
          />
          <Select
            label="Kategorie"
            value={String(values.categoryId)}
            onChange={(e) => set("categoryId", Number(e.target.value))}
            options={categories.map((c) => ({ value: String(c.id), label: c.nameDe }))}
          />
          <Textarea
            label="Beschreibung (DE)"
            rows={3}
            value={values.descriptionDe}
            onChange={(e) => set("descriptionDe", e.target.value)}
          />
          <Textarea
            label="Beschreibung (RU)"
            rows={3}
            value={values.descriptionRu}
            onChange={(e) => set("descriptionRu", e.target.value)}
          />
        </div>
      </AdminPanel>

      <AdminPanel title="Darstellung & Bestellung">
        <div className="grid gap-5 sm:grid-cols-2">
          <Select
            label="Anfrage-Art"
            hint="Wohin „Jetzt anfragen“ auf der Produktseite führt."
            value={values.orderKind}
            onChange={(e) => {
              const kind = ORDER_KIND_ORDER.find((k) => k === e.target.value);
              if (kind) set("orderKind", kind);
            }}
            options={ORDER_KIND_ORDER.map((kind) => ({
              value: kind,
              label: PRODUCT_ORDER_KIND_LABEL[kind],
            }))}
          />
          <Input
            label="Bild-Key"
            hint="Datei unter public/images/<key>.webp"
            value={values.imageKey}
            onChange={(e) => set("imageKey", e.target.value)}
          />
          <Input
            label="Vorlauf (Stunden)"
            type="number"
            min={0}
            value={values.leadTimeHours}
            onChange={(e) => set("leadTimeHours", Number(e.target.value))}
          />
          <Input
            label="Sortierung"
            type="number"
            min={0}
            value={values.sort}
            onChange={(e) => set("sort", Number(e.target.value))}
          />
        </div>
        <div className="mt-5 flex flex-wrap gap-6">
          <Checkbox
            label="Füllung wählbar"
            checked={values.fillingSelectable}
            onChange={(e) => set("fillingSelectable", e.target.checked)}
          />
          <Checkbox
            label="Auf Startseite"
            checked={values.featured}
            onChange={(e) => set("featured", e.target.checked)}
          />
          <Checkbox
            label="Aktiv (im Shop sichtbar)"
            checked={values.active}
            onChange={(e) => set("active", e.target.checked)}
          />
        </div>
      </AdminPanel>

      <AdminPanel title="Größen & Preise">
        <div className="flex flex-col gap-2.5">
          {sizes.map((size, i) => {
            const duplicate = duplicates.has(size.labelDe.trim());
            return (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={size.id ?? `neu-${i}`}
                className="grid grid-cols-[1fr_1fr_120px_36px] items-start gap-2.5"
              >
                <Input
                  aria-label="Label DE"
                  placeholder="Label DE, z. B. Ø 16 cm · 8 Stücke"
                  value={size.labelDe}
                  onChange={(e) => setSize(i, { labelDe: e.target.value })}
                  error={duplicate ? "Label doppelt" : undefined}
                />
                <Input
                  aria-label="Label RU"
                  placeholder="Label RU"
                  value={size.labelRu}
                  onChange={(e) => setSize(i, { labelRu: e.target.value })}
                />
                <Input
                  aria-label="Preis in Euro"
                  placeholder="€, z. B. 42,00"
                  inputMode="decimal"
                  value={size.priceEuro}
                  onChange={(e) => setSize(i, { priceEuro: e.target.value })}
                />
                <IconButton
                  size="sm"
                  label="Größe entfernen"
                  className="mt-1"
                  disabled={sizes.length === 1}
                  onClick={() => {
                    setSizesError("");
                    setSizes((s) => s.filter((_, j) => j !== i));
                  }}
                >
                  <Trash2Icon strokeWidth={1.5} />
                </IconButton>
              </div>
            );
          })}
        </div>
        {sizesError && (
          <p role="alert" className="mt-3 text-error ck-body-sm">
            {sizesError}
          </p>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-4"
          icon={<PlusIcon strokeWidth={1.5} />}
          onClick={() => setSizes((s) => [...s, { ...emptySize }])}
        >
          Größe hinzufügen
        </Button>
      </AdminPanel>

      <div className="flex gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Speichern …" : "Speichern"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => navigate({ to: "/app/produkte" })}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
