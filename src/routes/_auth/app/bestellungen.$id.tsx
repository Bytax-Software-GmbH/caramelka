import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { toast } from "sonner";

import type { OrderStatus } from "#/lib/db/schema/caramelka.schema";
import { formatDate, formatPrice } from "#/lib/format";
import { ORDER_STATUS, ORDER_STATUS_ORDER } from "#/lib/order-status";
import { $adminGetOrder, $adminSetOrderStatus } from "#/lib/server/admin";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/_auth/app/bestellungen/$id")({
  params: {
    parse: (raw) => ({ id: Number(raw.id) }),
    stringify: (p) => ({ id: String(p.id) }),
  },
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  const { data: order, isPending } = useQuery({
    queryKey: ["admin", "order", id],
    queryFn: ({ signal }) => $adminGetOrder({ data: id, signal }),
  });

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => $adminSetOrderStatus({ data: { id, status } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Status aktualisiert");
    },
    onError: () => toast.error("Status konnte nicht geändert werden"),
  });

  if (isPending) return <p className="py-12 text-center text-espresso/50">Laden …</p>;
  if (!order)
    return <p className="py-12 text-center text-espresso/50">Bestellung nicht gefunden.</p>;

  return (
    <div className="max-w-3xl">
      <Link
        to="/app"
        className="mb-6 inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.14em] text-caramel-deep uppercase hover:text-espresso"
      >
        <ArrowLeftIcon className="size-3.5" aria-hidden /> Alle Bestellungen
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="ck-display text-3xl">
          {order.orderNo}
          <span className="ml-3 align-middle font-sans text-[15px] text-espresso/50">
            {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(
              order.createdAt,
            )}
          </span>
        </h1>
        <div className="flex flex-wrap gap-2">
          {ORDER_STATUS_ORDER.map((status) => (
            <button
              key={status}
              type="button"
              disabled={statusMutation.isPending || order.status === status}
              onClick={() => statusMutation.mutate(status)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-opacity disabled:cursor-default",
                order.status === status
                  ? ORDER_STATUS[status].className
                  : "border border-espresso/20 text-espresso/50 hover:border-espresso hover:text-espresso",
              )}
            >
              {ORDER_STATUS[status].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-md border border-espresso/15 bg-white p-5">
          <h2 className="mb-4 ck-kicker">Kunde</h2>
          <dl className="space-y-2 text-[14px]">
            <div>
              <dt className="text-espresso/50">Name</dt>
              <dd className="font-semibold">{order.customerName}</dd>
            </div>
            <div>
              <dt className="text-espresso/50">Telefon</dt>
              <dd>
                <a href={`tel:${order.phone}`} className="hover:underline">
                  {order.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-espresso/50">E-Mail</dt>
              <dd>
                <a href={`mailto:${order.email}`} className="hover:underline">
                  {order.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-espresso/50">Sprache</dt>
              <dd className="uppercase">{order.locale}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-md border border-espresso/15 bg-white p-5">
          <h2 className="mb-4 ck-kicker">
            {order.fulfilment === "pickup" ? "Abholung" : "Lieferung"}
          </h2>
          <dl className="space-y-2 text-[14px]">
            <div>
              <dt className="text-espresso/50">Wunschtermin</dt>
              <dd className="font-semibold">{formatDate(order.desiredDate)}</dd>
            </div>
            {order.fulfilment === "delivery" && (
              <div>
                <dt className="text-espresso/50">Adresse</dt>
                <dd>
                  {order.street}
                  <br />
                  {order.zip} {order.city}
                </dd>
              </div>
            )}
            {order.note && (
              <div>
                <dt className="text-espresso/50">Anmerkung</dt>
                <dd className="whitespace-pre-wrap">{order.note}</dd>
              </div>
            )}
          </dl>
        </section>
      </div>

      <section className="mt-6 rounded-md border border-espresso/15 bg-white p-5">
        <h2 className="mb-4 ck-kicker">Positionen</h2>
        <ul className="space-y-3 text-[14px]">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4">
              <span>
                {item.quantity} × {item.productName}
                <span className="block text-[12.5px] text-espresso/55">
                  {item.sizeLabel}
                  {item.fillingName ? ` · ${item.fillingName}` : ""}
                  {item.inscription ? ` · Aufschrift: „${item.inscription}“` : ""}
                </span>
              </span>
              <span className="font-semibold whitespace-nowrap">
                {formatPrice(item.totalCents)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-espresso/10 pt-4 text-[14px]">
          <div className="flex justify-between">
            <dt className="text-espresso/55">Zwischensumme</dt>
            <dd>{formatPrice(order.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-espresso/55">Lieferung</dt>
            <dd>{formatPrice(order.deliveryFeeCents)}</dd>
          </div>
          <div className="flex justify-between text-[16px] font-semibold">
            <dt>Gesamt</dt>
            <dd>{formatPrice(order.totalCents)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
