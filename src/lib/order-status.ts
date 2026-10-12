/**
 * Status, Arten und Labels für den Admin (nur Deutsch). Wird von Server und
 * UI gemeinsam genutzt, darf daher nichts Serverseitiges importieren.
 */
import type { BadgeTone } from "#/components/ck/badge";
import type {
  EventType,
  Fulfilment,
  OrderKind,
  OrderStatus,
} from "#/lib/db/schema/caramelka.schema";
import { DECOR_STYLES, type DecorStyle } from "#/lib/order-request/schema";

/** "new" ist eine Anfrage; verbindlich wird sie erst mit der Bestätigung. */
export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  new: { label: "Anfrage", tone: "accent" },
  confirmed: { label: "Bestätigt", tone: "brand" },
  ready: { label: "Fertig", tone: "success" },
  completed: { label: "Abgeschlossen", tone: "neutral" },
  cancelled: { label: "Abgesagt", tone: "error" },
};

export const ORDER_STATUS_ORDER: OrderStatus[] = [
  "new",
  "confirmed",
  "ready",
  "completed",
  "cancelled",
];

export const ORDER_KIND_LABEL: Record<OrderKind, string> = {
  cake: "Torte",
  dessert: "Desserts",
  event: "Hochzeit/Event",
};

/** Dieselben Arten aus Produktsicht: wohin führt "Jetzt anfragen"? */
export const PRODUCT_ORDER_KIND_LABEL: Record<OrderKind, string> = {
  cake: "Torte nach Gewicht",
  dessert: "Desserts",
  event: "Hochzeit & Event",
};

export const ORDER_KIND_ORDER: OrderKind[] = ["cake", "dessert", "event"];

export const FULFILMENT_LABEL: Record<Fulfilment, string> = {
  pickup: "Abholung",
  delivery: "Lieferung",
};

export const DECOR_STYLE_LABEL: Record<DecorStyle, string> = {
  classic: "Klassisch elegant",
  flowers: "Blumen",
  berries: "Beeren und Früchte",
  kids: "Kinder und Figuren",
  minimal: "Schlicht und modern",
};

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  wedding: "Hochzeit",
  banquet: "Bankett oder Feier",
  other: "Andere Feier",
};

/** Deko-Stil als Label; unbekannte Werte werden unverändert angezeigt. */
export function decorStyleLabel(value: string): string {
  const style = DECOR_STYLES.find((candidate) => candidate === value);
  return style ? DECOR_STYLE_LABEL[style] : value;
}

/** Ziele manueller Statuswechsel. "confirmed" nur als Rückschritt von "ready". */
export type ManualStatusTarget = "confirmed" | "ready" | "completed";

/**
 * Erlaubte manuelle Wechsel (Server prüft dieselbe Tabelle). Bestätigen und
 * Absagen sind keine manuellen Wechsel: sie laufen über eigene Aktionen mit
 * Endpreis bzw. Nachricht und E-Mail an die Kundin.
 */
export const MANUAL_TRANSITIONS: Record<OrderStatus, readonly ManualStatusTarget[]> = {
  new: [],
  confirmed: ["ready", "completed"],
  ready: ["completed", "confirmed"],
  completed: [],
  cancelled: [],
};

export const MANUAL_TRANSITION_LABEL: Record<ManualStatusTarget, string> = {
  ready: "Als fertig markieren",
  completed: "Abschließen",
  confirmed: "Zurück auf Bestätigt",
};

export function isManualTransition(from: OrderStatus, to: OrderStatus): boolean {
  return MANUAL_TRANSITIONS[from].some((target) => target === to);
}

/** Bestätigen (auch erneut als Korrektur) und Absagen gehen nur aus diesen Status. */
export function canConfirmOrDecline(status: OrderStatus): boolean {
  return status === "new" || status === "confirmed";
}
