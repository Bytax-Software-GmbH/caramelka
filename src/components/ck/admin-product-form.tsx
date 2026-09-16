import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminPanel } from "#/components/ck/admin";
import { Button } from "#/components/ck/button";
import { Checkbox } from "#/components/ck/checkbox";
import { IconButton } from "#/components/ck/icon-button";
import { Input, Textarea } from "#/components/ck/input";
import { Select } from "#/components/ck/select";
import { $adminUpsertProduct } from "#/lib/server/admin";

interface SizeRow {
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
  featured: boolean;
  active: boolean;
  sort: number;
  sizes: { labelDe: string; labelRu: string; priceCents: number }[];
}

const emptySize: SizeRow = { labelDe: "", labelRu: "", priceEuro: "" };

export function AdminProductForm({
  initial,
  categories,
}: {
  initial: ProductFormValues;
  categories: { id: number; nameDe: string }[];
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [values, setValues] = useState(() => ({
    ...initial,
    sizes: undefined as never,
  }));
  const [sizes, setSizes] = useState<SizeRow[]>(() =>
    initial.sizes.length > 0
      ? initial.sizes.map((s) => ({
          labelDe: s.labelDe,
          labelRu: s.labelRu,
          priceEuro: (s.priceCents / 100).toFixed(2).replace(".", ","),
        }))
      : [{ ...emptySize }],
  );

  const mutation = useMutation({
    mutationFn: () => {
      const parsedSizes = sizes
        .filter((s) => s.labelDe.trim())
        .map((s) => ({
          labelDe: s.labelDe.trim(),
          labelRu: s.labelRu.trim() || s.labelDe.trim(),
          priceCents: Math.round(Number(s.priceEuro.replace(",", ".")) * 100),
        }));
      if (parsedSizes.length === 0 || parsedSizes.some((s) => !Number.isFinite(s.priceCents))) {
        throw new Error("Mindestens eine Größe mit gültigem Preis angeben.");
      }
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
          featured: values.featured,
          active: values.active,
          sort: values.sort,
          sizes: parsedSizes,
        },
      });
    },
    onSuccess: () => {
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
            onChange={(e) => set("slug", e.target.value)}
            pattern="[a-z0-9-]+"
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
        <div className="grid gap-5 sm:grid-cols-3">
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
          {(
            [
              ["fillingSelectable", "Füllung wählbar"],
              ["featured", "Auf Startseite"],
              ["active", "Aktiv (im Shop sichtbar)"],
            ] as const
          ).map(([key, label]) => (
            <Checkbox
              key={key}
              label={label}
              checked={values[key]}
              onChange={(e) => set(key, e.target.checked)}
            />
          ))}
        </div>
      </AdminPanel>

      <AdminPanel title="Größen & Preise">
        <div className="flex flex-col gap-2.5">
          {sizes.map((size, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={i} className="grid grid-cols-[1fr_1fr_120px_36px] items-center gap-2.5">
              <Input
                aria-label="Label DE"
                placeholder="Label DE, z. B. Ø 16 cm · 8 Stücke"
                value={size.labelDe}
                onChange={(e) => setSize(i, { labelDe: e.target.value })}
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
                disabled={sizes.length === 1}
                onClick={() => setSizes((s) => s.filter((_, j) => j !== i))}
              >
                <Trash2Icon strokeWidth={1.5} />
              </IconButton>
            </div>
          ))}
        </div>
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
