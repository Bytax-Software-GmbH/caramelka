import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { formatDateTime } from "#/components/admin/format";
import {
  CompleteOrderDialog,
  ConfirmOrderDialog,
  DeclineOrderDialog,
  ORDER_ACTION_ERROR,
} from "#/components/admin/order-dialogs";
import { OrderEmailLog } from "#/components/admin/order-email-log";
import {
  type AdminOrder,
  OrderCustomerPanel,
  OrderItemsPanel,
  OrderPhotosPanel,
  OrderPricePanel,
  OrderSchedulePanel,
  OrderStaffNotePanel,
  OrderWishesPanel,
} from "#/components/admin/order-panels";
import { AdminBack, AdminEmpty, AdminNotice, AdminPanel } from "#/components/ck/admin";
import { Badge } from "#/components/ck/badge";
import { Button } from "#/components/ck/button";
import { Eyebrow } from "#/components/ck/primitives";
import {
  canConfirmOrDecline,
  MANUAL_TRANSITION_LABEL,
  MANUAL_TRANSITIONS,
  type ManualStatusTarget,
  ORDER_KIND_LABEL,
  ORDER_STATUS,
} from "#/lib/order-status";
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
  const {
    data: order,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["admin", "order", id],
    queryFn: ({ signal }) => $adminGetOrder({ data: id, signal }),
    // Neue Mails gehen sofort raus: kurz nachladen, bis der erste Versuch durch ist.
    refetchInterval: (query) =>
      query.state.data?.emails.some(
        (email) =>
          email.status === "sending" || (email.status === "pending" && email.attempts === 0),
      )
        ? 4000
        : false,
  });

  if (isPending) return <AdminEmpty>Laden …</AdminEmpty>;
  if (isError) return <AdminEmpty>Die Bestellung konnte nicht geladen werden.</AdminEmpty>;
  if (!order) return <AdminEmpty>Bestellung nicht gefunden.</AdminEmpty>;
  return <OrderDetail key={order.id} order={order} />;
}

function OrderDetail({ order }: { order: AdminOrder }) {
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);

  const setStatus = useMutation({
    mutationFn: (status: ManualStatusTarget) =>
      $adminSetOrderStatus({ data: { id: order.id, status } }),
    onSuccess: (result, status) => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      setCompleteOpen(false);
      if (!result.ok) {
        toast.error(ORDER_ACTION_ERROR[result.code]);
        return;
      }
      toast.success(`Status: ${ORDER_STATUS[status].label}`);
    },
    onError: () => toast.error("Status konnte nicht geändert werden"),
  });

  const status = ORDER_STATUS[order.status];
  const transitions = MANUAL_TRANSITIONS[order.status];
  const history = [`Eingang ${formatDateTime(order.createdAt)}`];
  if (order.confirmedAt) history.push(`bestätigt ${formatDateTime(order.confirmedAt)}`);
  if (order.cancelledAt) history.push(`abgesagt ${formatDateTime(order.cancelledAt)}`);

  return (
    <div>
      <AdminBack to="/app">Alle Bestellungen</AdminBack>

      <div className="mt-6 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>{ORDER_KIND_LABEL[order.kind]}</Eyebrow>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="ck-title text-brand">{order.orderNo}</h1>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <p className="mt-2 text-ink-muted ck-body-sm">{history.join(" · ")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {order.status === "new" && (
            <Button onClick={() => setConfirmOpen(true)}>Bestätigen …</Button>
          )}
          {transitions.map((target) => (
            <Button
              key={target}
              variant={
                target === "confirmed"
                  ? "ghost"
                  : target === transitions[0]
                    ? "primary"
                    : "secondary"
              }
              disabled={setStatus.isPending}
              onClick={() =>
                target === "completed" ? setCompleteOpen(true) : setStatus.mutate(target)
              }
            >
              {MANUAL_TRANSITION_LABEL[target]}
            </Button>
          ))}
          {order.status === "confirmed" && (
            <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
              Bestätigung ändern …
            </Button>
          )}
          {canConfirmOrDecline(order.status) && (
            <Button variant="ghost" onClick={() => setDeclineOpen(true)}>
              {order.status === "new" ? "Absagen …" : "Stornieren …"}
            </Button>
          )}
        </div>
      </div>

      {!order.mailConfigured && (
        <AdminNotice title="E-Mail-Versand ist nicht eingerichtet" className="mb-6">
          Bestätigungen und Absagen werden gespeichert, aber nicht verschickt. Die E-Mails stehen im
          Verlauf als fehlgeschlagen und lassen sich nach der Einrichtung erneut senden.
        </AdminNotice>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <OrderItemsPanel order={order} />
          <OrderWishesPanel order={order} />
          {order.files.length > 0 && <OrderPhotosPanel files={order.files} />}
          <OrderEmailLog emails={order.emails} mailConfigured={order.mailConfigured} />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <OrderSchedulePanel order={order} />
          <OrderCustomerPanel order={order} />
          <OrderPricePanel order={order} />
          {order.customerMessage && (
            <AdminPanel
              title={
                order.status === "cancelled" ? "Nachricht zur Absage" : "Nachricht an die Kundin"
              }
            >
              <p className="whitespace-pre-wrap ck-body-sm">{order.customerMessage}</p>
            </AdminPanel>
          )}
          <OrderStaffNotePanel key={order.id} orderId={order.id} initial={order.staffNote} />
        </div>
      </div>

      {confirmOpen && <ConfirmOrderDialog order={order} onClose={() => setConfirmOpen(false)} />}
      {declineOpen && <DeclineOrderDialog order={order} onClose={() => setDeclineOpen(false)} />}
      {completeOpen && (
        <CompleteOrderDialog
          orderNo={order.orderNo}
          pending={setStatus.isPending}
          onConfirm={() => setStatus.mutate("completed")}
          onClose={() => setCompleteOpen(false)}
        />
      )}
    </div>
  );
}
