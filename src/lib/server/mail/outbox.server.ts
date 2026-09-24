/**
 * E-Mail-Outbox: Mails entstehen in derselben Transaktion wie die Bestellung
 * und werden danach verschickt. Fehlversuche laufen mit Backoff erneut, ein
 * Worker im Prozess schaut jede Minute nach. Zeilen werden mit
 * FOR UPDATE SKIP LOCKED reserviert, damit bei einem Deploy mit zwei
 * laufenden Containern nichts doppelt rausgeht.
 */
import { and, eq, inArray, lt, lte, or, sql } from "drizzle-orm";

import { db } from "#/lib/db";
import { emailOutbox, type EmailKind } from "#/lib/db/schema";

import { isMailConfigured, sendMail } from "./transport.server";

/** Wartezeit vor Versuch 2, 3, … in Minuten; danach gilt die Mail als fehlgeschlagen. */
const BACKOFF_MINUTES = [1, 5, 15, 60, 180];
const MAX_ATTEMPTS = BACKOFF_MINUTES.length + 1;
const BATCH_SIZE = 10;
const WORKER_INTERVAL_MS = 60_000;

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface OutboxMessage {
  orderId: number | null;
  kind: EmailKind;
  recipient: string;
  replyTo?: string | null;
  subject: string;
  html: string;
  text: string;
  ics?: string | null;
}

/** In derselben Transaktion wie die fachliche Änderung aufrufen. */
export async function enqueueEmail(tx: Transaction, message: OutboxMessage): Promise<void> {
  const configured = isMailConfigured();
  await tx.insert(emailOutbox).values({
    orderId: message.orderId,
    kind: message.kind,
    recipient: message.recipient,
    replyTo: message.replyTo ?? null,
    subject: message.subject,
    bodyHtml: message.html,
    bodyText: message.text,
    ics: message.ics ?? null,
    // Ohne SMTP nicht still liegen lassen (sonst gehen Wochen alte Mails raus,
    // sobald SMTP konfiguriert wird): gleich als fehlgeschlagen markieren,
    // im Admin sichtbar und von dort erneut sendbar.
    status: configured ? "pending" : "failed",
    lastError: configured ? null : "SMTP ist nicht konfiguriert",
  });
}

async function claimBatch() {
  return db.transaction(async (tx) => {
    const due = await tx
      .select({ id: emailOutbox.id })
      .from(emailOutbox)
      .where(
        or(
          and(eq(emailOutbox.status, "pending"), lte(emailOutbox.nextAttemptAt, sql`now()`)),
          // Hängengebliebene Versuche (Prozess beendet mitten im Senden) neu aufnehmen.
          and(
            eq(emailOutbox.status, "sending"),
            lt(emailOutbox.updatedAt, sql`now() - interval '10 minutes'`),
          ),
        ),
      )
      .orderBy(emailOutbox.id)
      .limit(BATCH_SIZE)
      .for("update", { skipLocked: true });
    if (due.length === 0) return [];
    return tx
      .update(emailOutbox)
      .set({
        status: "sending",
        attempts: sql`${emailOutbox.attempts} + 1`,
        updatedAt: sql`now()`,
      })
      .where(
        inArray(
          emailOutbox.id,
          due.map((row) => row.id),
        ),
      )
      .returning();
  });
}

async function runDispatch(): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  for (;;) {
    const rows = await claimBatch();
    for (const row of rows) {
      try {
        await sendMail({
          to: row.recipient,
          replyTo: row.replyTo,
          subject: row.subject,
          html: row.bodyHtml,
          text: row.bodyText,
          ics: row.ics,
        });
        await db
          .update(emailOutbox)
          .set({ status: "sent", sentAt: sql`now()`, updatedAt: sql`now()`, lastError: null })
          .where(eq(emailOutbox.id, row.id));
        sent++;
      } catch (error) {
        const exhausted = row.attempts >= MAX_ATTEMPTS;
        const delay = BACKOFF_MINUTES[Math.min(row.attempts, BACKOFF_MINUTES.length) - 1] ?? 180;
        await db
          .update(emailOutbox)
          .set({
            status: exhausted ? "failed" : "pending",
            lastError: (error instanceof Error ? error.message : String(error)).slice(0, 500),
            nextAttemptAt: sql`now() + make_interval(mins => ${delay}::int)`,
            updatedAt: sql`now()`,
          })
          .where(eq(emailOutbox.id, row.id));
        failed++;
      }
    }
    if (rows.length < BATCH_SIZE) break;
  }
  return { sent, failed };
}

let inFlight: Promise<{ sent: number; failed: number }> | undefined;

/** Fällige Mails senden. Parallele Aufrufe teilen sich einen Lauf. */
export function dispatchOutbox(): Promise<{ sent: number; failed: number }> {
  if (!isMailConfigured()) return Promise.resolve({ sent: 0, failed: 0 });
  inFlight ??= runDispatch().finally(() => {
    inFlight = undefined;
  });
  return inFlight;
}

/** Nach einem Commit anstoßen, ohne die Antwort an den Browser aufzuhalten. */
export function dispatchOutboxInBackground(): void {
  dispatchOutbox().catch((error: unknown) => {
    console.error("[outbox] Versand fehlgeschlagen", error);
  });
}

declare global {
  // Überlebt Hot-Reload im Dev-Server, damit nur ein Intervall läuft.
  var caramelkaOutboxWorker: ReturnType<typeof setInterval> | undefined;
}

/** Startet den Minuten-Worker einmal pro Prozess (No-op ohne SMTP). */
export function ensureOutboxWorker(): void {
  if (globalThis.caramelkaOutboxWorker || !isMailConfigured()) return;
  globalThis.caramelkaOutboxWorker = setInterval(dispatchOutboxInBackground, WORKER_INTERVAL_MS);
  globalThis.caramelkaOutboxWorker.unref();
  dispatchOutboxInBackground();
}
