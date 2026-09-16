import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  AdminEmpty,
  AdminHeading,
  AdminPanel,
  AdminTable,
  adminTd,
  adminTh,
  adminTheadTr,
  adminTr,
} from "#/components/ck/admin";
import { Badge } from "#/components/ck/badge";
import { Button } from "#/components/ck/button";
import { Checkbox } from "#/components/ck/checkbox";
import { Input, Textarea } from "#/components/ck/input";
import { $adminListFillings, $adminUpsertFilling } from "#/lib/server/admin";

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

  function patch(next: Partial<FillingDraft>) {
    setDraft((d) => (d ? { ...d, ...next } : d));
  }

  return (
    <div>
      <AdminHeading
        eyebrow="Sortiment"
        title="Füllungen"
        actions={
          <Button
            size="sm"
            icon={<PlusIcon strokeWidth={1.5} />}
            onClick={() => setDraft({ ...emptyDraft, sort: (fillings?.length ?? 0) + 1 })}
          >
            Neue Füllung
          </Button>
        }
      />

      {draft && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(draft);
          }}
          className="mb-8"
        >
          <AdminPanel title={draft.id ? "Füllung bearbeiten" : "Neue Füllung"}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Name (DE)"
                value={draft.nameDe}
                onChange={(e) => patch({ nameDe: e.target.value })}
                required
              />
              <Input
                label="Name (RU)"
                value={draft.nameRu}
                onChange={(e) => patch({ nameRu: e.target.value })}
              />
              <Input
                label="Slug"
                value={draft.slug}
                onChange={(e) => patch({ slug: e.target.value })}
                required
              />
              <Input
                label="Sortierung"
                type="number"
                min={0}
                value={draft.sort}
                onChange={(e) => patch({ sort: Number(e.target.value) })}
              />
              <Textarea
                label="Beschreibung (DE)"
                rows={2}
                value={draft.descriptionDe}
                onChange={(e) => patch({ descriptionDe: e.target.value })}
              />
              <Textarea
                label="Beschreibung (RU)"
                rows={2}
                value={draft.descriptionRu}
                onChange={(e) => patch({ descriptionRu: e.target.value })}
              />
              <Input
                label="Allergene (DE)"
                value={draft.allergensDe}
                onChange={(e) => patch({ allergensDe: e.target.value })}
              />
              <Input
                label="Allergene (RU)"
                value={draft.allergensRu}
                onChange={(e) => patch({ allergensRu: e.target.value })}
              />
            </div>
            <div className="mt-5">
              <Checkbox
                label="Aktiv"
                checked={draft.active}
                onChange={(e) => patch({ active: e.target.checked })}
              />
            </div>
            <div className="mt-6 flex gap-3">
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Speichern …" : "Speichern"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                Abbrechen
              </Button>
            </div>
          </AdminPanel>
        </form>
      )}

      {isPending ? (
        <AdminEmpty>Laden …</AdminEmpty>
      ) : (
        <AdminTable>
          <thead>
            <tr className={adminTheadTr}>
              <th className={adminTh}>Name</th>
              <th className={adminTh}>Allergene</th>
              <th className={adminTh}>Status</th>
              <th className={adminTh}>
                <span className="sr-only">Aktionen</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {fillings?.map((f) => (
              <tr key={f.id} className={adminTr}>
                <td className={adminTd}>
                  <span className="font-medium">{f.nameDe}</span>
                  <span className="block text-ink-muted">{f.nameRu}</span>
                </td>
                <td className={`${adminTd} text-ink-muted`}>{f.allergensDe || "—"}</td>
                <td className={adminTd}>
                  <Badge tone={f.active ? "success" : "error"} dot>
                    {f.active ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </td>
                <td className={`${adminTd} text-right`}>
                  <Button
                    variant="link"
                    size="sm"
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
                  >
                    Bearbeiten
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
