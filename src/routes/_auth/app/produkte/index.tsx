import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import { formatPrice } from "#/lib/format";
import { $adminDeleteProduct, $adminListProducts } from "#/lib/server/admin";
import { cn } from "#/lib/utils";

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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="ck-display text-3xl">Produkte</h1>
        <Button render={<Link to="/app/produkte/neu" />} nativeButton={false}>
          <PlusIcon className="size-4" /> Neues Produkt
        </Button>
      </div>

      {isPending ? (
        <p className="py-12 text-center text-espresso/50">Laden …</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-espresso/15 bg-white">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-espresso/10 text-[11px] tracking-[0.14em] text-espresso/50 uppercase">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Kategorie</th>
                <th className="px-4 py-3 text-right">ab Preis</th>
                <th className="px-4 py-3">Vorlauf</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Aktionen</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.products.map((p) => {
                const price = fromPrice(p.id);
                return (
                  <tr
                    key={p.id}
                    className="border-b border-espresso/5 last:border-0 hover:bg-creme-2/50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to="/app/produkte/$id"
                        params={{ id: p.id }}
                        className="font-semibold text-caramel-deep hover:underline"
                      >
                        {p.nameDe}
                      </Link>
                      {p.featured && (
                        <span className="ml-2 rounded-full bg-gold/25 px-2 py-0.5 text-[10.5px] font-semibold text-caramel-deep">
                          Startseite
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{categoryName(p.categoryId)}</td>
                    <td className="px-4 py-3 text-right">
                      {price != null ? formatPrice(price) : "—"}
                    </td>
                    <td className="px-4 py-3">{Math.round(p.leadTimeHours / 24)} Tage</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                          p.active
                            ? "bg-espresso/10 text-espresso"
                            : "bg-destructive/10 text-destructive",
                        )}
                      >
                        {p.active ? "Aktiv" : "Inaktiv"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.active && (
                        <button
                          type="button"
                          onClick={() => deactivate.mutate(p.id)}
                          className="text-[12px] tracking-[0.1em] text-espresso/50 uppercase hover:text-destructive"
                        >
                          Deaktivieren
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
