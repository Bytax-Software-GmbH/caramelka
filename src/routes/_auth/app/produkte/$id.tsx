import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminProductForm } from "#/components/ck/admin-product-form";
import { $adminListProducts } from "#/lib/server/admin";

export const Route = createFileRoute("/_auth/app/produkte/$id")({
  params: {
    parse: (raw) => ({ id: Number(raw.id) }),
    stringify: (p) => ({ id: String(p.id) }),
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["admin", "products"],
      queryFn: () => $adminListProducts(),
    });
  },
  component: EditProductPage,
});

function EditProductPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery({
    queryKey: ["admin", "products"],
    queryFn: ({ signal }) => $adminListProducts({ signal }),
  });

  const product = data.products.find((p) => p.id === id);
  if (!product) {
    return <p className="py-12 text-center text-espresso/50">Produkt nicht gefunden.</p>;
  }
  const sizes = data.sizes.filter((s) => s.productId === id);

  return (
    <div>
      <h1 className="mb-6 ck-display text-3xl">{product.nameDe} bearbeiten</h1>
      <AdminProductForm
        categories={data.categories}
        initial={{
          id: product.id,
          slug: product.slug,
          categoryId: product.categoryId,
          nameDe: product.nameDe,
          nameRu: product.nameRu,
          descriptionDe: product.descriptionDe,
          descriptionRu: product.descriptionRu,
          imageKey: product.imageKey,
          leadTimeHours: product.leadTimeHours,
          fillingSelectable: product.fillingSelectable,
          featured: product.featured,
          active: product.active,
          sort: product.sort,
          sizes: sizes.map((s) => ({
            labelDe: s.labelDe,
            labelRu: s.labelRu,
            priceCents: s.priceCents,
          })),
        }}
      />
    </div>
  );
}
