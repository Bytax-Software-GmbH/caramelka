import type { BadgeTone } from "#/components/ck/badge";
import type { OrderStatus } from "#/lib/db/schema/caramelka.schema";

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  new: { label: "Neu", tone: "accent" },
  confirmed: { label: "Bestätigt", tone: "brand" },
  ready: { label: "Fertig", tone: "success" },
  completed: { label: "Abgeschlossen", tone: "neutral" },
  cancelled: { label: "Storniert", tone: "error" },
};

export const ORDER_STATUS_ORDER: OrderStatus[] = [
  "new",
  "confirmed",
  "ready",
  "completed",
  "cancelled",
];
