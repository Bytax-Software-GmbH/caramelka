import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { AdminBack, AdminEmpty, AdminField, AdminPanel } from "#/components/ck/admin";
import { Eyebrow, Price } from "#/components/ck/primitives";
import { Tag } from "#/components/ck/tag";
import type { OrderStatus } from "#/lib/db/schema/caramelka.schema";
import { formatDate, formatPrice } from "#/lib/format";
import { ORDER_STATUS, ORDER_STATUS_ORDER } from "#/lib/order-status";
import { $adminGetOrder, $adminSetOrderStatus } from "#/lib/server/admin";

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

  if (isPending) return <AdminEmpty>Laden …</AdminEmpty>;
  if (!order) return <AdminEmpty>Bestellung nicht gefunden.</AdminEmpty>;

  return (
    <div className="max-w-3xl">
      <AdminBack to="/app">Alle Bestellungen</AdminBack>

      <div className="mt-6 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>
            {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(
              order.createdAt,
            )}
          </Eyebrow>
          <h1 className="mt-2 ck-title text-brand">{order.orderNo}</h1>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Status setzen">
          {ORDER_STATUS_ORDER.map((status) => (
            <Tag
              key={status}
              selected={order.status === status}
              disabled={statusMutation.isPending || order.status === status}
              onClick={() => statusMutation.mutate(status)}
            >
              {ORDER_STATUS[status].label}
            </Tag>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <AdminPanel title="Kunde">
          <dl className="flex flex-col gap-3 ck-body-sm">
            <AdminField label="Name">{order.customerName}</AdminField>
            <AdminField label="Telefon">
              <a href={`tel:${order.phone}`} className="underline-offset-[3px] hover:underline">
                {order.phone}
              </a>
            </AdminField>
            <AdminField label="E-Mail">
              <a href={`mailto:${order.email}`} className="underline-offset-[3px] hover:underline">
                {order.email}
              </a>
            </AdminField>
            <AdminField label="Sprache">
              <span className="uppercase">{order.locale}</span>
            </AdminField>
          </dl>
        </AdminPanel>

        <AdminPanel title={order.fulfilment === "pickup" ? "Abholung" : "Lieferung"}>
          <dl className="flex flex-col gap-3 ck-body-sm">
            <AdminField label="Wunschtermin">{formatDate(order.desiredDate)}</AdminField>
            {order.fulfilment === "delivery" && (
              <AdminField label="Adresse">
                {order.street}
                <br />
                {order.zip} {order.city}
              </AdminField>
            )}
            {order.note && (
              <AdminField label="Anmerkung">
                <span className="whitespace-pre-wrap">{order.note}</span>
              </AdminField>
            )}
          </dl>
        </AdminPanel>
      </div>

      <AdminPanel title="Positionen" className="mt-6">
        <ul className="flex flex-col gap-3 ck-body-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4">
              <span>
                {item.quantity} × {item.productName}
                <span className="block text-ink-muted">
                  {item.sizeLabel}
                  {item.fillingName ? ` · ${item.fillingName}` : ""}
                  {item.inscription ? ` · Aufschrift: „${item.inscription}“` : ""}
                </span>
              </span>
              <Price className="text-md whitespace-nowrap">{formatPrice(item.totalCents)}</Price>
            </li>
          ))}
        </ul>
        <dl className="mt-4 flex flex-col gap-1.5 border-t border-hairline pt-4 ck-body-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Zwischensumme</dt>
            <dd>{formatPrice(order.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Lieferung</dt>
            <dd>{formatPrice(order.deliveryFeeCents)}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-hairline pt-3">
            <dt className="ck-label">Gesamt</dt>
            <dd>
              <Price className="text-xl">{formatPrice(order.totalCents)}</Price>
            </dd>
          </div>
        </dl>
      </AdminPanel>
    </div>
  );
}
