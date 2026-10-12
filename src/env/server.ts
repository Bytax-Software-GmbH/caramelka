import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

/** "a@x.de, b@y.de" → ["a@x.de", "b@y.de"] (klein, ohne Leereinträge). */
const emailList = z
  .string()
  .default("")
  .transform((value) =>
    value
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );

/**
 * Alles außer DATABASE_URL/BETTER_AUTH_SECRET ist optional: drizzle.config.ts
 * importiert diese Datei, und der migrate-Container kennt nur die beiden.
 */
export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    VITE_BASE_URL: z.url().default("http://localhost:3000"),
    BETTER_AUTH_SECRET: z.string().min(1),
    /** Kommagetrennte Admin-E-Mails. Leer = niemand kommt in den Admin. */
    ADMIN_EMAILS: emailList,
    /** SMTP für Bestell-Mails. Ohne SMTP_HOST werden keine Mails verschickt. */
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    /** Standard: TLS direkt bei Port 465, sonst STARTTLS. */
    SMTP_SECURE: z.stringbool().optional(),
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASS: z.string().min(1).optional(),
    /** Absender, z. B. "Caramelka <bestellung@caramelka.de>". */
    MAIL_FROM: z.string().min(3).optional(),
    /** Wer neue Anfragen bekommt (kommagetrennt). Standard: site.contact.email. */
    ORDER_NOTIFY_TO: emailList,
    /** Optionale Blindkopie jeder Mail, z. B. fürs eigene Postfach. */
    MAIL_BCC: z.string().min(3).optional(),
    /** Ablage für Kundenfotos (im Container ein Volume). */
    UPLOAD_DIR: z.string().min(1).default("./.data/uploads"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
