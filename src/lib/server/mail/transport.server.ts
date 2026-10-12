/** SMTP-Versand über nodemailer. Konfiguration komplett über SMTP_* in der Env. */
import { createTransport, type Transporter } from "nodemailer";

import { env } from "#/env/server";
import { site } from "#/lib/site";

let transporter: Transporter | undefined;

export function isMailConfigured(): boolean {
  return Boolean(env.SMTP_HOST);
}

function getTransporter(): Transporter {
  if (!env.SMTP_HOST) throw new Error("SMTP ist nicht konfiguriert (SMTP_HOST fehlt).");
  transporter ??= createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE ?? env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return transporter;
}

export function mailFrom(): string {
  return env.MAIL_FROM ?? `${site.name} <${site.contact.email}>`;
}

/** Empfänger neuer Anfragen. */
export function staffRecipients(): string[] {
  return env.ORDER_NOTIFY_TO.length > 0 ? env.ORDER_NOTIFY_TO : [site.contact.email];
}

export interface MailMessage {
  to: string;
  replyTo?: string | null;
  subject: string;
  html: string;
  text: string;
  /** text/calendar-Inhalt, wird als Termin angehängt. */
  ics?: string | null;
}

export async function sendMail(message: MailMessage): Promise<void> {
  await getTransporter().sendMail({
    from: mailFrom(),
    to: message.to,
    replyTo: message.replyTo ?? undefined,
    bcc: env.MAIL_BCC,
    subject: message.subject,
    html: message.html,
    text: message.text,
    icalEvent: message.ics
      ? { method: "PUBLISH", filename: "caramelka-termin.ics", content: message.ics }
      : undefined,
  });
}
