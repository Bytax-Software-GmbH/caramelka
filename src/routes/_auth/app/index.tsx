import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

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
import { Price } from "#/components/ck/primitives";
import { formatDate, formatPrice } from "#/lib/format";
import { ORDER_STATUS } from "#/lib/order-status";
import { $adminListOrders } from "#/lib/server/admin";

export const Route = createFileRoute("/_auth/app/")({
  component: OrdersPage,
});

function OrdersPage() {
  const { data: orders, isPending } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: ({ signal }) => $adminListOrders({ signal }),
    refetchInterval: 60_000,
  });

  return (
    <div>
      <AdminHeading eyebrow="Übersicht" title="Bestellungen" />
      {isPending ? (
        <AdminEmpty>Laden …</AdminEmpty>
      ) : !orders || orders.length === 0 ? (
        <AdminEmpty>Noch keine Bestellungen.</AdminEmpty>
      ) : (
        <AdminTable>
          <thead>
            <tr className={adminTheadTr}>
              <th className={adminTh}>Nr.</th>
              <th className={adminTh}>Status</th>
              <th className={adminTh}>Kunde</th>
              <th className={adminTh}>Termin</th>
              <th className={adminTh}>Art</th>
              <th className={`${adminTh} text-right`}>Summe</th>
              <th className={adminTh}>Eingang</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className={adminTr}>
                <td className={adminTd}>
                  <Link
                    to="/app/bestellungen/$id"
                    params={{ id: order.id }}
                    className="font-mono text-brand underline-offset-[3px] hover:underline"
                  >
                    {order.orderNo}
                  </Link>
                </td>
                <td className={adminTd}>
                  <Badge tone={ORDER_STATUS[order.status].tone}>
                    {ORDER_STATUS[order.status].label}
                  </Badge>
                </td>
                <td className={adminTd}>{order.customerName}</td>
                <td className={adminTd}>{formatDate(order.desiredDate)}</td>
                <td className={adminTd}>
                  {order.fulfilment === "pickup" ? "Abholung" : "Lieferung"}
                </td>
                <td className={`${adminTd} text-right`}>
                  <Price className="text-md">{formatPrice(order.totalCents)}</Price>
                </td>
                <td className={`${adminTd} text-ink-muted`}>
                  {new Intl.DateTimeFormat("de-DE", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(order.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
