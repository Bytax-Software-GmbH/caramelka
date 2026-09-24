import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ImageIcon } from "lucide-react";
import * as z from "zod";

import { formatDateTime, orderPrice } from "#/components/admin/format";
import { MailNotConfiguredNotice, MailPanel } from "#/components/admin/mail-panel";
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
import { Select } from "#/components/ck/select";
import { Tag } from "#/components/ck/tag";
import type { OrderKind, OrderStatus } from "#/lib/db/schema/caramelka.schema";
import { formatDate, formatTime } from "#/lib/format";
import { orderKindSchema } from "#/lib/order-request/schema";
import {
  FULFILMENT_LABEL,
  ORDER_KIND_LABEL,
  ORDER_KIND_ORDER,
  ORDER_STATUS,
  ORDER_STATUS_ORDER,
} from "#/lib/order-status";
import { $adminListOrders } from "#/lib/server/admin";
import { cn } from "#/lib/utils";

/** Filter stehen in der URL, damit Zurück und Neuladen sie behalten. */
const searchSchema = z.object({
  status: z
    .enum(["new", "confirmed", "ready", "completed", "cancelled"])
    .optional()
    .catch(undefined),
  kind: orderKindSchema.optional().catch(undefined),
});

const LIST_LIMIT = 200;

export const Route = createFileRoute("/_auth/app/")({
  validateSearch: searchSchema,
  component: OrdersPage,
});

function OrdersPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const {
    data: orders,
    isPending,
    isError,
    isPlaceholderData,
  } = useQuery({
    queryKey: ["admin", "orders", search],
    queryFn: ({ signal }) => $adminListOrders({ data: search, signal }),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });

  function filterBy(next: { status?: OrderStatus; kind?: OrderKind }) {
    void navigate({ search: (prev) => ({ ...prev, ...next }), replace: true });
  }

  const filtered = Boolean(search.status || search.kind);

  return (
    <div>
      <AdminHeading eyebrow="Übersicht" title="Bestellungen" />
      <MailNotConfiguredNotice className="mb-6" />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div
          className="flex flex-wrap gap-2"
          // Filter-Tags als Gruppe; ein <fieldset> brächte hier nur Formular-Semantik ohne Formular.
          // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
          role="group"
          aria-label="Nach Status filtern"
        >
          <Tag selected={!search.status} onClick={() => filterBy({ status: undefined })}>
            Alle
          </Tag>
          {ORDER_STATUS_ORDER.map((status) => (
            <Tag
              key={status}
              selected={search.status === status}
              onClick={() => filterBy({ status: search.status === status ? undefined : status })}
            >
              {ORDER_STATUS[status].label}
            </Tag>
          ))}
        </div>
        <Select
          aria-label="Nach Art filtern"
          size="sm"
          className="w-52"
          value={search.kind ?? ""}
          onChange={(event) =>
            filterBy({ kind: ORDER_KIND_ORDER.find((kind) => kind === event.target.value) })
          }
          options={[
            { value: "", label: "Alle Arten" },
            ...ORDER_KIND_ORDER.map((kind) => ({ value: kind, label: ORDER_KIND_LABEL[kind] })),
          ]}
        />
      </div>

      {isPending ? (
        <AdminEmpty>Laden …</AdminEmpty>
      ) : isError ? (
        <AdminEmpty>Die Bestellungen konnten nicht geladen werden.</AdminEmpty>
      ) : orders.length === 0 ? (
        <AdminEmpty>
          {filtered ? "Keine Bestellungen für diesen Filter." : "Noch keine Bestellungen."}
        </AdminEmpty>
      ) : (
        <div
          className={cn(
            "transition-opacity duration-(--dur-fast) ease-out",
            isPlaceholderData && "opacity-60",
          )}
        >
          <AdminTable>
            <thead>
              <tr className={adminTheadTr}>
                <th className={adminTh}>Nr.</th>
                <th className={adminTh}>Status</th>
                <th className={adminTh}>Art</th>
                <th className={adminTh}>Kundin</th>
                <th className={adminTh}>Termin</th>
                <th className={adminTh}>Übergabe</th>
                <th className={`${adminTh} text-right`}>Preis</th>
                <th className={`${adminTh} text-right`}>Fotos</th>
                <th className={adminTh}>Eingang</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const status = ORDER_STATUS[order.status];
                const price = orderPrice(order);
                return (
                  <tr key={order.id} className={adminTr}>
                    <td className={`${adminTd} whitespace-nowrap`}>
                      <Link
                        to="/app/bestellungen/$id"
                        params={{ id: order.id }}
                        className="font-mono text-brand underline-offset-[3px] hover:underline"
                      >
                        {order.orderNo}
                      </Link>
                    </td>
                    <td className={adminTd}>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>
                    <td className={`${adminTd} whitespace-nowrap`}>
                      {ORDER_KIND_LABEL[order.kind]}
                    </td>
                    <td className={adminTd}>
                      {order.customerName}
                      {order.locale === "ru" && (
                        <span className="ml-2 ck-eyebrow text-ink-subtle" title="Spricht Russisch">
                          RU
                        </span>
                      )}
                    </td>
                    <td className={`${adminTd} whitespace-nowrap`}>
                      {formatDate(order.desiredDate)}
                      {order.desiredTime && (
                        <span className="block text-ink-muted">
                          {formatTime(order.desiredTime)}
                        </span>
                      )}
                    </td>
                    <td className={`${adminTd} whitespace-nowrap`}>
                      {order.fulfilment ? (
                        FULFILMENT_LABEL[order.fulfilment]
                      ) : (
                        <span className="text-ink-muted">nach Absprache</span>
                      )}
                    </td>
                    <td className={`${adminTd} text-right whitespace-nowrap`}>
                      {price.type === "open" ? (
                        <span className="text-ink-muted">{price.text}</span>
                      ) : (
                        <Price
                          className={cn("text-md", price.type === "estimate" && "text-ink-muted")}
                        >
                          {price.text}
                        </Price>
                      )}
                    </td>
                    <td className={`${adminTd} text-right`}>
                      {order.photoCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-ink-muted">
                          <ImageIcon aria-hidden strokeWidth={1.5} className="size-3.5" />
                          {order.photoCount}
                          <span className="sr-only">
                            {order.photoCount === 1 ? "Foto" : "Fotos"}
                          </span>
                        </span>
                      )}
                    </td>
                    <td className={`${adminTd} whitespace-nowrap text-ink-muted`}>
                      {formatDateTime(order.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </AdminTable>
          {orders.length >= LIST_LIMIT && (
            <p className="mt-3 text-ink-muted ck-body-sm">
              Angezeigt werden die neuesten {LIST_LIMIT}. Ältere über die Filter eingrenzen.
            </p>
          )}
        </div>
      )}

      <MailPanel className="mt-10 max-w-2xl" />
    </div>
  );
}
