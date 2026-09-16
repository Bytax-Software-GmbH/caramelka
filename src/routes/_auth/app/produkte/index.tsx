import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import {
  AdminEmpty,
  AdminHeading,
  AdminTable,
  adminTd,
  adminTh,
  adminTheadTr,
  adminTr,
} from "#/components/ck/admin";
import { Badge } from "#/components/ck/badge";
import { Button, buttonVariants } from "#/components/ck/button";
import { Price } from "#/components/ck/primitives";
import { formatPrice } from "#/lib/format";
import { $adminDeleteProduct, $adminListProducts } from "#/lib/server/admin";

export const Route = createFileRoute("/_auth/app/produkte/")({
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: ({ signal }) => $adminListProducts({ signal }),
  });

  const deactivate = useMutation({
    mutationFn: (id: number) => $adminDeleteProduct({ data: id }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      toast.success("Produkt deaktiviert");
    },
  });

  const categoryName = (id: number) => data?.categories.find((c) => c.id === id)?.nameDe ?? "—";
  const fromPrice = (productId: number) => {
    const prices =
      data?.sizes.filter((s) => s.productId === productId).map((s) => s.priceCents) ?? [];
    return prices.length ? Math.min(...prices) : null;
  };

  return (
    <div>
      <AdminHeading
        eyebrow="Sortiment"
        title="Produkte"
        actions={
          <Link to="/app/produkte/neu" className={buttonVariants({ size: "sm" })}>
            <PlusIcon strokeWidth={1.5} /> Neues Produkt
          </Link>
        }
      />

      {isPending ? (
        <AdminEmpty>Laden …</AdminEmpty>
      ) : (
        <AdminTable>
          <thead>
            <tr className={adminTheadTr}>
              <th className={adminTh}>Name</th>
              <th className={adminTh}>Kategorie</th>
              <th className={`${adminTh} text-right`}>ab Preis</th>
              <th className={adminTh}>Vorlauf</th>
              <th className={adminTh}>Status</th>
              <th className={adminTh}>
                <span className="sr-only">Aktionen</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data?.products.map((p) => {
              const price = fromPrice(p.id);
              return (
                <tr key={p.id} className={adminTr}>
                  <td className={adminTd}>
                    <span className="flex flex-wrap items-center gap-2">
                      <Link
                        to="/app/produkte/$id"
                        params={{ id: p.id }}
                        className="font-medium text-brand underline-offset-[3px] hover:underline"
                      >
                        {p.nameDe}
                      </Link>
                      {p.featured && <Badge tone="accent">Startseite</Badge>}
                    </span>
                  </td>
                  <td className={adminTd}>{categoryName(p.categoryId)}</td>
                  <td className={`${adminTd} text-right`}>
                    {price != null ? <Price className="text-md">{formatPrice(price)}</Price> : "—"}
                  </td>
                  <td className={adminTd}>{Math.round(p.leadTimeHours / 24)} Tage</td>
                  <td className={adminTd}>
                    <Badge tone={p.active ? "success" : "error"} dot>
                      {p.active ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  </td>
                  <td className={`${adminTd} text-right`}>
                    {p.active && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-ink-muted hover:text-error"
                        onClick={() => deactivate.mutate(p.id)}
                      >
                        Deaktivieren
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
