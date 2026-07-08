import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminProductForm } from "#/components/ck/admin-product-form";
import { $adminListProducts } from "#/lib/server/admin";

export const Route = createFileRoute("/_auth/app/produkte/neu")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["admin", "products"],
      queryFn: () => $adminListProducts(),
    });
  },
  component: NewProductPage,
});

function NewProductPage() {
  const { data } = useSuspenseQuery({
    queryKey: ["admin", "products"],
    queryFn: ({ signal }) => $adminListProducts({ signal }),
  });

  return (
    <div>
      <h1 className="mb-6 ck-display text-3xl">Neues Produkt</h1>
      <AdminProductForm
        categories={data.categories}
        initial={{
          slug: "",
          categoryId: data.categories[0]?.id ?? 1,
          nameDe: "",
          nameRu: "",
          descriptionDe: "",
          descriptionRu: "",
          imageKey: "torte",
          leadTimeHours: 48,
          fillingSelectable: true,
          featured: false,
          active: true,
          sort: 0,
          sizes: [],
        }}
      />
    </div>
  );
}
