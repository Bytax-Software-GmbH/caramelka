import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ExternalLinkIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminField, AdminPanel } from "#/components/ck/admin";
import { Badge } from "#/components/ck/badge";
import { Button } from "#/components/ck/button";
import { Textarea } from "#/components/ck/input";
import { Price } from "#/components/ck/primitives";
import { formatDate, formatPrice, formatTime, formatWeight } from "#/lib/format";
import { roundEstimate } from "#/lib/order-request/estimate";
import { decorStyleLabel, EVENT_TYPE_LABEL, FULFILMENT_LABEL } from "#/lib/order-status";
import type { $adminGetOrder } from "#/lib/server/admin";
import { $adminUpdateStaffNote } from "#/lib/server/admin";

/** Bestellung, wie $adminGetOrder sie liefert. */
export type AdminOrder = NonNullable<Awaited<ReturnType<typeof $adminGetOrder>>>;
type AdminOrderItem = AdminOrder["items"][number];

const linkClass = "text-brand underline-offset-[3px] hover:underline";

function ItemRow({ item, german }: { item: AdminOrderItem; german: boolean }) {
  // DE-Anfragen: der Snapshot ist schon deutsch. RU: aktuelle deutsche Namen, Snapshot als Rückfall.
  const fillingName = german ? item.fillingName : (item.fillingNameDe ?? item.fillingName);
  const byWeight = item.weightGrams !== null;
  const title =
    item.weightGrams !== null
      ? `Torte, ${formatWeight(item.weightGrams)}`
      : `${item.quantity} × ${german ? item.productName : (item.productNameDe ?? item.productName)}`;
  const size = byWeight ? null : german ? item.sizeLabel : (item.sizeLabelDe ?? item.sizeLabel);
  const unpriced = byWeight && item.unitPriceCents === 0;

  return (
    <li className="flex justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-ink">{title}</p>
        {size && <p className="text-ink-muted">{size}</p>}
        {fillingName && <p className="text-ink-muted">Füllung: {fillingName}</p>}
        {item.inscription && (
          <p className="mt-1 text-ink">
            Aufschrift: <span className="font-medium">„{item.inscription}“</span>
          </p>
        )}
      </div>
      <div className="shrink-0 text-right">
        {unpriced ? (
          <span className="text-ink-muted">kg-Preis offen</span>
        ) : (
          <Price className="text-md">{formatPrice(item.totalCents)}</Price>
        )}
        {byWeight && !unpriced && (
          <p className="text-ink-muted">{formatPrice(item.unitPriceCents)} je kg</p>
        )}
        {!byWeight && item.quantity > 1 && (
          <p className="text-ink-muted">je {formatPrice(item.unitPriceCents)}</p>
        )}
      </div>
    </li>
  );
}

/** Positionen (Torte/Desserts) bzw. Eckdaten der Feier. */
export function OrderItemsPanel({ order }: { order: AdminOrder }) {
  if (order.kind === "event") {
    return (
      <AdminPanel title="Feier">
        <dl className="grid gap-3 ck-body-sm sm:grid-cols-2">
          <AdminField label="Anlass">
            {order.eventType ? EVENT_TYPE_LABEL[order.eventType] : "keine Angabe"}
          </AdminField>
          <AdminField label="Gäste">{order.guestCount ?? "keine Angabe"}</AdminField>
        </dl>
        <p className="mt-4 text-ink-muted ck-body-sm">
          Torte und Preis werden persönlich besprochen.
        </p>
      </AdminPanel>
    );
  }
  return (
    <AdminPanel title="Auswahl">
      {order.items.length === 0 ? (
        <p className="text-ink-muted ck-body-sm">Keine Positionen.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-hairline ck-body-sm">
          {order.items.map((item) => (
            <ItemRow key={item.id} item={item} german={order.locale === "de"} />
          ))}
        </ul>
      )}
    </AdminPanel>
  );
}

/** Dekor, Inspiration und Anmerkung der Kundin. */
export function OrderWishesPanel({ order }: { order: AdminOrder }) {
  const hasContent =
    order.decorStyles.length > 0 ||
    Boolean(order.decorNote) ||
    order.inspiration !== null ||
    Boolean(order.note);
  return (
    <AdminPanel title="Wünsche">
      {!hasContent ? (
        <p className="text-ink-muted ck-body-sm">
          Keine Angaben zu Dekor, Inspiration oder Anmerkungen.
        </p>
      ) : (
        <dl className="flex flex-col gap-4 ck-body-sm">
          {order.decorStyles.length > 0 && (
            <AdminField label="Dekor-Stil">
              <span className="flex flex-wrap gap-1.5">
                {order.decorStyles.map((style) => (
                  <Badge key={style} tone="outline">
                    {decorStyleLabel(style)}
                  </Badge>
                ))}
              </span>
            </AdminField>
          )}
          {order.decorNote && (
            <AdminField label="Dekor-Wunsch">
              <span className="whitespace-pre-wrap">{order.decorNote}</span>
            </AdminField>
          )}
          {order.inspiration && (
            <AdminField label="Inspiration">
              <Link
                to="/torten/$slug"
                params={{ slug: order.inspiration.slug }}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-1.5 ${linkClass}`}
              >
                {order.inspiration.nameDe}
                <ExternalLinkIcon aria-hidden strokeWidth={1.5} className="size-3.5" />
                <span className="sr-only">(öffnet in neuem Tab)</span>
              </Link>
            </AdminField>
          )}
          {order.note && (
            <AdminField label="Anmerkung">
              <span className="whitespace-pre-wrap">{order.note}</span>
            </AdminField>
          )}
        </dl>
      )}
    </AdminPanel>
  );
}

/** Wunschfotos als Vorschau; Klick öffnet das Bild in voller Größe. */
export function OrderPhotosPanel({ files }: { files: AdminOrder["files"] }) {
  return (
    <AdminPanel title={files.length === 1 ? "1 Foto" : `${files.length} Fotos`}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {files.map((file, index) => (
          <li key={file.id} className="min-w-0">
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="block ck-frame transition-colors duration-(--dur-fast) ease-out hover:border-hairline-accent"
            >
              <img
                src={file.url}
                alt={`Wunschfoto ${index + 1} der Kundin: ${file.originalName}`}
                width={file.width ?? undefined}
                height={file.height ?? undefined}
                loading="lazy"
                decoding="async"
                className="aspect-square w-full bg-sunken object-cover"
              />
              <span className="sr-only">(öffnet in neuem Tab)</span>
            </a>
            <p className="mt-1.5 truncate text-ink-muted ck-body-sm" title={file.originalName}>
              {file.originalName}
            </p>
          </li>
        ))}
      </ul>
    </AdminPanel>
  );
}

export function OrderSchedulePanel({ order }: { order: AdminOrder }) {
  return (
    <AdminPanel title="Termin">
      <dl className="flex flex-col gap-3 ck-body-sm">
        <AdminField label={order.kind === "event" ? "Datum der Feier" : "Wunschtermin"}>
          {formatDate(order.desiredDate)}
          {order.desiredTime && <span className="block">{formatTime(order.desiredTime)}</span>}
        </AdminField>
        <AdminField label="Übergabe">
          {order.fulfilment ? FULFILMENT_LABEL[order.fulfilment] : "Wird persönlich besprochen"}
        </AdminField>
        {order.fulfilment === "delivery" && (
          <AdminField label="Lieferadresse">
            {order.street}
            <br />
            {order.zip} {order.city}
          </AdminField>
        )}
      </dl>
    </AdminPanel>
  );
}

export function OrderCustomerPanel({ order }: { order: AdminOrder }) {
  return (
    <AdminPanel title="Kundin">
      <dl className="flex flex-col gap-3 ck-body-sm">
        <AdminField label="Name">{order.customerName}</AdminField>
        <AdminField label="Telefon">
          <a href={`tel:${order.phone.replace(/[^\d+]/g, "")}`} className={linkClass}>
            {order.phone}
          </a>
        </AdminField>
        <AdminField label="E-Mail">
          <a href={`mailto:${order.email}`} className={`break-all ${linkClass}`}>
            {order.email}
          </a>
        </AdminField>
        <AdminField label="Sprache">{order.locale === "ru" ? "Russisch" : "Deutsch"}</AdminField>
      </dl>
    </AdminPanel>
  );
}

/** Schätzung aus dem Formular neben dem verbindlichen Endpreis. */
export function OrderPricePanel({ order }: { order: AdminOrder }) {
  const isEvent = order.kind === "event";
  const showBreakdown = !isEvent && order.estimateComplete;
  let estimate = "offen";
  if (isEvent) estimate = "keine (Event)";
  else if (order.estimateComplete) estimate = `ca. ${formatPrice(roundEstimate(order.totalCents))}`;

  return (
    <AdminPanel title="Preis">
      <dl className="flex flex-col gap-2 ck-body-sm">
        {showBreakdown && (
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Positionen</dt>
            <dd>{formatPrice(order.subtotalCents)}</dd>
          </div>
        )}
        {showBreakdown && order.deliveryFeeCents > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Lieferung</dt>
            <dd>{formatPrice(order.deliveryFeeCents)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Schätzung</dt>
          <dd>{estimate}</dd>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-hairline pt-3">
          <dt className="ck-label text-ink">Endpreis</dt>
          <dd>
            {order.finalTotalCents === null ? (
              <span className="text-ink-muted">noch offen</span>
            ) : (
              <Price className="text-xl">{formatPrice(order.finalTotalCents)}</Price>
            )}
          </dd>
        </div>
      </dl>
      {!isEvent && !order.estimateComplete && (
        <p className="mt-3 text-ink-muted ck-body-sm">
          Mindestens eine Füllung hat keinen kg-Preis, daher keine Schätzung.
        </p>
      )}
    </AdminPanel>
  );
}

/** Interne Notiz; die Komponente mit key={order.id} rendern, damit sie je Bestellung frisch startet. */
export function OrderStaffNotePanel({
  orderId,
  initial,
}: {
  orderId: number;
  initial: string | null;
}) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState(initial ?? "");
  const [saved, setSaved] = useState(initial ?? "");
  const trimmed = note.trim();

  const save = useMutation({
    mutationFn: (staffNote: string) => $adminUpdateStaffNote({ data: { id: orderId, staffNote } }),
    onSuccess: (result, staffNote) => {
      if (!result.ok) {
        toast.error("Bestellung nicht gefunden.");
        return;
      }
      setSaved(staffNote);
      void queryClient.invalidateQueries({ queryKey: ["admin", "order", orderId] });
      toast.success("Notiz gespeichert");
    },
    onError: () => toast.error("Notiz konnte nicht gespeichert werden"),
  });

  return (
    <AdminPanel title="Interne Notiz">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate(trimmed);
        }}
        className="flex flex-col gap-3"
      >
        <Textarea
          aria-label="Interne Notiz"
          rows={4}
          maxLength={2000}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          hint="Nur für das Team, erscheint in keiner E-Mail."
        />
        <div>
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={save.isPending || trimmed === saved}
          >
            {save.isPending ? "Speichern …" : "Notiz speichern"}
          </Button>
        </div>
      </form>
    </AdminPanel>
  );
}
