import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { $adminListFillings, $adminUpsertFilling } from "#/lib/server/admin";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/_auth/app/fuellungen")({
  component: AdminFillingsPage,
});

interface FillingDraft {
  id?: number;
  slug: string;
  nameDe: string;
  nameRu: string;
  descriptionDe: string;
  descriptionRu: string;
  allergensDe: string;
  allergensRu: string;
  active: boolean;
  sort: number;
}

const emptyDraft: FillingDraft = {
  slug: "",
  nameDe: "",
  nameRu: "",
  descriptionDe: "",
  descriptionRu: "",
  allergensDe: "",
  allergensRu: "",
  active: true,
  sort: 0,
};

function AdminFillingsPage() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<FillingDraft | null>(null);

  const { data: fillings, isPending } = useQuery({
    queryKey: ["admin", "fillings"],
    queryFn: ({ signal }) => $adminListFillings({ signal }),
  });

  const save = useMutation({
    mutationFn: (d: FillingDraft) =>
      $adminUpsertFilling({
        data: {
          ...(d.id ? { id: d.id } : {}),
          slug: d.slug.trim(),
          nameDe: d.nameDe.trim(),
          nameRu: d.nameRu.trim() || d.nameDe.trim(),
          descriptionDe: d.descriptionDe.trim(),
          descriptionRu: d.descriptionRu.trim(),
          allergensDe: d.allergensDe.trim(),
          allergensRu: d.allergensRu.trim(),
          active: d.active,
          sort: d.sort,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      void queryClient.invalidateQueries({ queryKey: ["fillings"] });
      toast.success("Füllung gespeichert");
      setDraft(null);
    },
    onError: () => toast.error("Speichern fehlgeschlagen"),
  });

  function field(key: keyof FillingDraft, label: string, props?: { textarea?: boolean }) {
    if (!draft) return null;
    const id = `filling-${key}`;
    return (
      <div className="grid gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        {props?.textarea ? (
          <textarea
            id={id}
            rows={2}
            value={String(draft[key] ?? "")}
            onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
            className="rounded-md border border-input bg-white px-3 py-2 text-sm"
          />
        ) : (
          <Input
            id={id}
            value={String(draft[key] ?? "")}
            onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="ck-display text-3xl">Füllungen</h1>
        <Button onClick={() => setDraft({ ...emptyDraft, sort: (fillings?.length ?? 0) + 1 })}>
          <PlusIcon className="size-4" /> Neue Füllung
        </Button>
      </div>

      {draft && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(draft);
          }}
          className="mb-8 space-y-4 rounded-md border border-espresso/15 bg-white p-5"
        >
          <h2 className="ck-kicker">{draft.id ? "Füllung bearbeiten" : "Neue Füllung"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("nameDe", "Name (DE)")}
            {field("nameRu", "Name (RU)")}
            {field("slug", "Slug")}
            <div className="grid gap-1.5">
              <Label htmlFor="filling-sort">Sortierung</Label>
              <Input
                id="filling-sort"
                type="number"
                min={0}
                value={draft.sort}
                onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })}
              />
            </div>
            {field("descriptionDe", "Beschreibung (DE)", { textarea: true })}
            {field("descriptionRu", "Beschreibung (RU)", { textarea: true })}
            {field("allergensDe", "Allergene (DE)")}
            {field("allergensRu", "Allergene (RU)")}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              className="accent-caramel"
            />
            Aktiv
          </label>
          <div className="flex gap-3">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Speichern …" : "Speichern"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setDraft(null)}>
              Abbrechen
            </Button>
          </div>
        </form>
      )}

      {isPending ? (
        <p className="py-12 text-center text-espresso/50">Laden …</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-espresso/15 bg-white">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-espresso/10 text-[11px] tracking-[0.14em] text-espresso/50 uppercase">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Allergene</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Aktionen</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {fillings?.map((f) => (
                <tr
                  key={f.id}
                  className="border-b border-espresso/5 last:border-0 hover:bg-creme-2/50"
                >
                  <td className="px-4 py-3 font-semibold">
                    {f.nameDe}
                    <span className="block text-[12px] font-normal text-espresso/50">
                      {f.nameRu}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-espresso/70">{f.allergensDe || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        f.active
                          ? "bg-espresso/10 text-espresso"
                          : "bg-destructive/10 text-destructive",
                      )}
                    >
                      {f.active ? "Aktiv" : "Inaktiv"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          id: f.id,
                          slug: f.slug,
                          nameDe: f.nameDe,
                          nameRu: f.nameRu,
                          descriptionDe: f.descriptionDe,
                          descriptionRu: f.descriptionRu,
                          allergensDe: f.allergensDe,
                          allergensRu: f.allergensRu,
                          active: f.active,
                          sort: f.sort,
                        })
                      }
                      className="text-[12px] tracking-[0.1em] text-caramel-deep uppercase hover:text-espresso"
                    >
                      Bearbeiten
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
