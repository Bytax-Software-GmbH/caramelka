import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { formatDate, formatPrice } from "#/lib/format";
import { ORDER_STATUS } from "#/lib/order-status";
import { $adminListOrders } from "#/lib/server/admin";
import { cn } from "#/lib/utils";

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
      <h1 className="mb-6 ck-display text-3xl">Bestellungen</h1>
      {isPending ? (
        <p className="py-12 text-center text-espresso/50">Laden …</p>
      ) : !orders || orders.length === 0 ? (
        <p className="py-12 text-center text-espresso/50">Noch keine Bestellungen.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-espresso/15 bg-white">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-espresso/10 text-[11px] tracking-[0.14em] text-espresso/50 uppercase">
                <th className="px-4 py-3">Nr.</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Kunde</th>
                <th className="px-4 py-3">Termin</th>
                <th className="px-4 py-3">Art</th>
                <th className="px-4 py-3 text-right">Summe</th>
                <th className="px-4 py-3">Eingang</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-espresso/5 last:border-0 hover:bg-creme-2/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      to="/app/bestellungen/$id"
                      params={{ id: order.id }}
                      className="font-mono font-semibold text-caramel-deep hover:underline"
                    >
                      {order.orderNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        ORDER_STATUS[order.status].className,
                      )}
                    >
                      {ORDER_STATUS[order.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">{order.customerName}</td>
                  <td className="px-4 py-3">{formatDate(order.desiredDate)}</td>
                  <td className="px-4 py-3">
                    {order.fulfilment === "pickup" ? "Abholung" : "Lieferung"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatPrice(order.totalCents)}
                  </td>
                  <td className="px-4 py-3 text-espresso/55">
                    {new Intl.DateTimeFormat("de-DE", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(order.createdAt)}
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
