import type { OrderStatus } from "#/lib/db/schema/caramelka.schema";

export const ORDER_STATUS: Record<OrderStatus, { label: string; className: string }> = {
  new: { label: "Neu", className: "bg-caramel text-creme" },
  confirmed: { label: "Bestätigt", className: "bg-espresso text-creme" },
  ready: { label: "Fertig", className: "bg-gold text-dark" },
  completed: { label: "Abgeschlossen", className: "bg-espresso/15 text-espresso" },
  cancelled: { label: "Storniert", className: "bg-destructive/15 text-destructive" },
};

export const ORDER_STATUS_ORDER: OrderStatus[] = [
  "new",
  "confirmed",
  "ready",
  "completed",
  "cancelled",
];
