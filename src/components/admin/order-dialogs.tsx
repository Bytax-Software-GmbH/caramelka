import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "#/components/ck/button";
import { Checkbox } from "#/components/ck/checkbox";
import { Dialog } from "#/components/ck/dialog";
import { Input, Textarea } from "#/components/ck/input";
import { Select } from "#/components/ck/select";
import type { Fulfilment, OrderKind, OrderStatus } from "#/lib/db/schema/caramelka.schema";
import { formatDate, formatPrice, formatTime } from "#/lib/format";
import { roundEstimate } from "#/lib/order-request/estimate";
import { daySlots, isClosedDay } from "#/lib/order-request/schedule";
import { $adminConfirmOrder, $adminDeclineOrder } from "#/lib/server/admin";

import { centsToEuroInput, parseEuroToCents } from "./format";

/** Fehlercodes der Bestell-Aktionen als Text. */
export const ORDER_ACTION_ERROR: Record<
  "NOT_FOUND" | "INVALID_STATUS" | "INVALID_SCHEDULE",
  string
> = {
  NOT_FOUND: "Bestellung nicht gefunden.",
  INVALID_STATUS: "Der Status hat sich inzwischen geändert. Die Ansicht ist jetzt aktualisiert.",
  INVALID_SCHEDULE: "Termin nicht möglich: Ruhetag oder Uhrzeit außerhalb der Zeitfenster.",
};

const MAX_FINAL_CENTS = 10_000_000;

export interface ActionOrder {
  id: number;
  orderNo: string;
  kind: OrderKind;
  status: OrderStatus;
  email: string;
  desiredDate: string;
  desiredTime: string | null;
  fulfilment: Fulfilment | null;
  totalCents: number;
  finalTotalCents: number | null;
  estimateComplete: boolean;
  customerMessage: string | null;
  mailConfigured: boolean;
}

function scheduleText(order: ActionOrder): string {
  const date = formatDate(order.desiredDate);
  return order.desiredTime ? `${date}, ${formatTime(order.desiredTime)}` : date;
}

function mailHint(order: ActionOrder, extra: string): string {
  return order.mailConfigured
    ? `An ${order.email}${extra}.`
    : "SMTP ist nicht eingerichtet: Die E-Mail steht dann als fehlgeschlagen im Verlauf und lässt sich später erneut senden.";
}

function mailToastDescription(order: ActionOrder, sendEmail: boolean): string {
  if (!sendEmail) return "Ohne E-Mail an die Kundin.";
  return order.mailConfigured
    ? "Die E-Mail an die Kundin wird verschickt."
    : "SMTP fehlt: Die E-Mail steht als fehlgeschlagen im Verlauf.";
}

/** Vorbelegung des Endpreises: bisheriger Endpreis, sonst gerundete Schätzung. */
function initialPrice(order: ActionOrder): string {
  if (order.finalTotalCents !== null) return centsToEuroInput(order.finalTotalCents);
  if (order.kind !== "event" && order.estimateComplete) {
    return centsToEuroInput(roundEstimate(order.totalCents));
  }
  return "";
}

function priceHint(order: ActionOrder): string {
  if (order.kind === "event") {
    return "Bei Hochzeit/Event steht der Preis nicht in der E-Mail. Bitte in der Nachricht nennen.";
  }
  const scope = order.fulfilment === "delivery" ? "Gesamtbetrag inkl. Lieferung. " : "";
  if (!order.estimateComplete) {
    return `${scope}Keine Schätzung: Mindestens eine Füllung hat keinen kg-Preis.`;
  }
  return `${scope}Schätzung aus der Anfrage: ca. ${formatPrice(roundEstimate(order.totalCents))}.`;
}

interface ConfirmInput {
  finalTotalCents: number;
  message?: string;
  desiredDate?: string;
  desiredTime?: string;
  sendEmail: boolean;
}

/**
 * Verbindlich bestätigen (aus "Anfrage") oder eine Bestätigung korrigieren.
 * Wird nur gerendert, solange er offen ist: jedes Öffnen startet frisch.
 */
export function ConfirmOrderDialog({
  order,
  onClose,
}: {
  order: ActionOrder;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const formId = useId();
  const isEvent = order.kind === "event";
  const isUpdate = order.status === "confirmed";
  const slots = daySlots();

  const [price, setPrice] = useState(() => initialPrice(order));
  const [message, setMessage] = useState(order.customerMessage ?? "");
  const [changeSchedule, setChangeSchedule] = useState(false);
  const [date, setDate] = useState(order.desiredDate);
  const [time, setTime] = useState(order.desiredTime ?? "");
  const [sendEmail, setSendEmail] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const priceCents = parseEuroToCents(price);
  const dateChanged = changeSchedule && date !== order.desiredDate;
  const timeChanged = changeSchedule && !isEvent && time !== (order.desiredTime ?? "");

  let priceError: string | null = null;
  if (price.trim() === "") {
    priceError = submitted ? "Bitte den Endpreis eingeben." : null;
  } else if (priceCents === null || priceCents > MAX_FINAL_CENTS) {
    priceError = "Bitte einen Betrag in Euro eingeben, z. B. 64 oder 64,50.";
  }
  let dateError: string | null = null;
  if (dateChanged && date === "") dateError = "Bitte ein Datum wählen.";
  else if (dateChanged && isClosedDay(date, order.kind))
    dateError = "An diesem Tag ist geschlossen.";
  const timeError = timeChanged && !slots.includes(time) ? "Bitte eine Uhrzeit wählen." : null;

  const timeOptions = [
    ...(time === "" ? [{ value: "", label: "Uhrzeit wählen", disabled: true }] : []),
    ...(order.desiredTime && !slots.includes(order.desiredTime)
      ? [{ value: order.desiredTime, label: formatTime(order.desiredTime) }]
      : []),
    ...slots.map((slot) => ({ value: slot, label: formatTime(slot) })),
  ];

  const confirm = useMutation({
    mutationFn: (input: ConfirmInput) => $adminConfirmOrder({ data: { id: order.id, ...input } }),
    onSuccess: (result, input) => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      if (!result.ok) {
        toast.error(ORDER_ACTION_ERROR[result.code]);
        return;
      }
      toast.success(isUpdate ? "Bestätigung aktualisiert" : "Bestellung bestätigt", {
        description: mailToastDescription(order, input.sendEmail),
      });
      onClose();
    },
    onError: () => toast.error("Bestätigen fehlgeschlagen"),
  });

  function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (priceCents === null || priceError || dateError || timeError) return;
    confirm.mutate({
      finalTotalCents: priceCents,
      message: message.trim() || undefined,
      desiredDate: dateChanged ? date : undefined,
      desiredTime: timeChanged ? time : undefined,
      sendEmail,
    });
  }

  return (
    <Dialog
      open
      onClose={onClose}
      eyebrow={order.orderNo}
      title={isUpdate ? "Bestätigung ändern" : "Bestellung bestätigen"}
      width={560}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" form={formId} disabled={confirm.isPending}>
            {confirm.isPending
              ? "Wird gespeichert …"
              : isUpdate
                ? "Änderung bestätigen"
                : "Bestätigen"}
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={submit} className="flex flex-col gap-5">
        <p className="text-ink-muted ck-body-sm">
          {isUpdate
            ? "Die Kundin bekommt die aktualisierten Angaben mit Kalendereintrag."
            : "Erst mit dieser Bestätigung wird die Anfrage verbindlich. Die Kundin bekommt Endpreis und Termin mit Kalendereintrag."}
        </p>
        <Input
          label="Endpreis in €"
          inputMode="decimal"
          autoComplete="off"
          placeholder="z. B. 64 oder 64,50"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          error={priceError}
          hint={priceHint(order)}
          trailing={<span aria-hidden>€</span>}
        />
        <Textarea
          label="Nachricht an die Kundin (optional)"
          rows={3}
          maxLength={2000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          hint="Steht oben in der E-Mail, z. B. zu Dekor, Preis oder Abholung."
        />
        <div>
          <Checkbox
            label="Termin ändern"
            description={`Aktuell: ${scheduleText(order)}`}
            checked={changeSchedule}
            onChange={(event) => setChangeSchedule(event.target.checked)}
          />
          {changeSchedule && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                label={isEvent ? "Datum der Feier" : "Datum"}
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                error={dateError}
              />
              {!isEvent && (
                <Select
                  label="Uhrzeit"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  options={timeOptions}
                  error={timeError}
                />
              )}
            </div>
          )}
        </div>
        <Checkbox
          label="E-Mail an Kundin senden"
          description={mailHint(order, ", mit Kalendereintrag")}
          checked={sendEmail}
          onChange={(event) => setSendEmail(event.target.checked)}
        />
      </form>
    </Dialog>
  );
}

interface DeclineInput {
  message?: string;
  sendEmail: boolean;
}

/** Anfrage absagen bzw. bestätigte Bestellung stornieren. */
export function DeclineOrderDialog({
  order,
  onClose,
}: {
  order: ActionOrder;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const formId = useId();
  const isCancel = order.status === "confirmed";
  const [message, setMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(true);

  const decline = useMutation({
    mutationFn: (input: DeclineInput) => $adminDeclineOrder({ data: { id: order.id, ...input } }),
    onSuccess: (result, input) => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      if (!result.ok) {
        toast.error(ORDER_ACTION_ERROR[result.code]);
        return;
      }
      toast.success(isCancel ? "Bestellung storniert" : "Anfrage abgesagt", {
        description: mailToastDescription(order, input.sendEmail),
      });
      onClose();
    },
    onError: () => toast.error("Absagen fehlgeschlagen"),
  });

  return (
    <Dialog
      open
      onClose={onClose}
      eyebrow={order.orderNo}
      title={isCancel ? "Bestellung stornieren" : "Anfrage absagen"}
      width={520}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" form={formId} disabled={decline.isPending}>
            {decline.isPending ? "Wird gespeichert …" : isCancel ? "Stornieren" : "Absagen"}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={(event) => {
          event.preventDefault();
          decline.mutate({ message: message.trim() || undefined, sendEmail });
        }}
        className="flex flex-col gap-5"
      >
        <p className="text-ink-muted ck-body-sm">
          {isCancel
            ? "Die Bestellung ist schon bestätigt. Danach gilt sie als abgesagt; das lässt sich nicht rückgängig machen."
            : "Die Anfrage gilt danach als abgesagt; das lässt sich nicht rückgängig machen."}
        </p>
        <Textarea
          label="Nachricht an die Kundin (optional)"
          rows={4}
          maxLength={2000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          hint="Z. B. der Grund und ein möglicher anderer Termin."
        />
        <Checkbox
          label="E-Mail an Kundin senden"
          description={mailHint(order, "")}
          checked={sendEmail}
          onChange={(event) => setSendEmail(event.target.checked)}
        />
      </form>
    </Dialog>
  );
}

/** Rückfrage vor "Abschließen": danach gibt es keinen manuellen Statuswechsel mehr. */
export function CompleteOrderDialog({
  orderNo,
  pending,
  onConfirm,
  onClose,
}: {
  orderNo: string;
  pending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open
      onClose={onClose}
      eyebrow={orderNo}
      title="Bestellung abschließen?"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button disabled={pending} onClick={onConfirm}>
            {pending ? "Wird gespeichert …" : "Abschließen"}
          </Button>
        </>
      }
    >
      <p className="text-ink-muted ck-body-sm">
        Für übergebene oder gelieferte Bestellungen. Danach lässt sich der Status nicht mehr ändern.
      </p>
    </Dialog>
  );
}
