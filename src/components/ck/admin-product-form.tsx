import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
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

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="max-w-3xl space-y-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="nameDe">Name (DE)</Label>
          <Input
            id="nameDe"
            value={values.nameDe}
            onChange={(e) => set("nameDe", e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="nameRu">Name (RU)</Label>
          <Input
            id="nameRu"
            value={values.nameRu}
            onChange={(e) => set("nameRu", e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input
            id="slug"
            value={values.slug}
            onChange={(e) => set("slug", e.target.value)}
            pattern="[a-z0-9-]+"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="categoryId">Kategorie</Label>
          <select
            id="categoryId"
            value={values.categoryId}
            onChange={(e) => set("categoryId", Number(e.target.value))}
            className="h-10 rounded-md border border-input bg-white px-3 text-sm"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameDe}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="descriptionDe">Beschreibung (DE)</Label>
          <textarea
            id="descriptionDe"
            rows={3}
            value={values.descriptionDe}
            onChange={(e) => set("descriptionDe", e.target.value)}
            className="rounded-md border border-input bg-white px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="descriptionRu">Beschreibung (RU)</Label>
          <textarea
            id="descriptionRu"
            rows={3}
            value={values.descriptionRu}
            onChange={(e) => set("descriptionRu", e.target.value)}
            className="rounded-md border border-input bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="imageKey">Bild-Key (Platzhalter)</Label>
          <Input
            id="imageKey"
            value={values.imageKey}
            onChange={(e) => set("imageKey", e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="leadTimeHours">Vorlauf (Stunden)</Label>
          <Input
            id="leadTimeHours"
            type="number"
            min={0}
            value={values.leadTimeHours}
            onChange={(e) => set("leadTimeHours", Number(e.target.value))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sort">Sortierung</Label>
          <Input
            id="sort"
            type="number"
            min={0}
            value={values.sort}
            onChange={(e) => set("sort", Number(e.target.value))}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6 text-sm">
        {(
          [
            ["fillingSelectable", "Füllung wählbar"],
            ["featured", "Auf Startseite"],
            ["active", "Aktiv (im Shop sichtbar)"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={values[key]}
              onChange={(e) => set(key, e.target.checked)}
              className="accent-caramel"
            />
            {label}
          </label>
        ))}
      </div>

      <fieldset>
        <legend className="mb-3 ck-kicker">Größen & Preise</legend>
        <div className="space-y-2.5">
          {sizes.map((size, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={i} className="grid grid-cols-[1fr_1fr_120px_40px] gap-2.5">
              <Input
                placeholder="Label DE, z. B. Ø 16 cm · 8 Stücke"
                value={size.labelDe}
                onChange={(e) =>
                  setSizes((s) =>
                    s.map((row, j) => (j === i ? { ...row, labelDe: e.target.value } : row)),
                  )
                }
              />
              <Input
                placeholder="Label RU"
                value={size.labelRu}
                onChange={(e) =>
                  setSizes((s) =>
                    s.map((row, j) => (j === i ? { ...row, labelRu: e.target.value } : row)),
                  )
                }
              />
              <Input
                placeholder="€, z. B. 42,00"
                inputMode="decimal"
                value={size.priceEuro}
                onChange={(e) =>
                  setSizes((s) =>
                    s.map((row, j) => (j === i ? { ...row, priceEuro: e.target.value } : row)),
                  )
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Größe entfernen"
                disabled={sizes.length === 1}
                onClick={() => setSizes((s) => s.filter((_, j) => j !== i))}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => setSizes((s) => [...s, { ...emptySize }])}
        >
          <PlusIcon className="size-4" /> Größe hinzufügen
        </Button>
      </fieldset>

      <div className="flex gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Speichern …" : "Speichern"}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/app/produkte" })}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
