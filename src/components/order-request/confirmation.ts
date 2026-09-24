/**
 * Was die Danke-Seite zeigt, liegt nur im sessionStorage des Browsers, der
 * die Anfrage geschickt hat. So muss `/bestellung/<nr>` keine Bestelldaten
 * öffentlich aus der Datenbank laden.
 */
import * as z from "zod";

const KEY_PREFIX = "ck-request-";

export const confirmationSchema = z.object({
  kind: z.enum(["cake", "dessert", "event"]),
  date: z.string(),
  time: z.string().nullable(),
  fulfilment: z.enum(["pickup", "delivery"]).nullable(),
  lines: z.object({ de: z.array(z.string()), ru: z.array(z.string()) }),
  estimateCents: z.number().nullable(),
  photoCount: z.number(),
});
export type ConfirmationData = z.infer<typeof confirmationSchema>;

export function saveConfirmation(orderNo: string, data: ConfirmationData): void {
  try {
    sessionStorage.setItem(KEY_PREFIX + orderNo, JSON.stringify(data));
  } catch {
    // Privater Modus o. Ä.: Danke-Seite zeigt dann nur den allgemeinen Text.
  }
}

export function loadConfirmation(orderNo: string): ConfirmationData | null {
  try {
    const raw = sessionStorage.getItem(KEY_PREFIX + orderNo);
    if (!raw) return null;
    const parsed = confirmationSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
