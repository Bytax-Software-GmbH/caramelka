/**
 * Legt den ersten Admin an, denn die öffentliche Registrierung ist geschlossen.
 * Idempotent: existiert die E-Mail schon, passiert nichts (Passwort wird nie
 * überschrieben). Ohne ADMIN_BOOTSTRAP_EMAIL/PASSWORD ein No-op.
 *
 * Run: pnpm admin:ensure (lokal) bzw. admin:ensure:prod (migrate-Container)
 */
import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { account, user } from "./schema";

const MIN_PASSWORD_LENGTH = 12;

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle({ client, casing: "snake_case" });

async function ensureAdmin() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD ?? "";
  if (!email || !password) {
    console.log("Admin-Bootstrap übersprungen: ADMIN_BOOTSTRAP_EMAIL/PASSWORD nicht gesetzt.");
    return;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_BOOTSTRAP_PASSWORD braucht mindestens ${MIN_PASSWORD_LENGTH} Zeichen.`);
  }

  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase());
  if (!allowlist.includes(email)) {
    console.warn(`Achtung: ${email} fehlt in ADMIN_EMAILS und kommt so nicht in den Admin.`);
  }

  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  if (existing) {
    console.log(`Admin-Bootstrap übersprungen: ${email} existiert bereits.`);
    return;
  }

  // Gleiche Datensätze wie better-auths Sign-up: user + credential-account.
  const passwordHash = await hashPassword(password);
  const userId = randomUUID();
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.insert(user).values({
      id: userId,
      name: "Admin",
      email,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });
    await tx.insert(account).values({
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    });
  });
  console.log(`Admin angelegt: ${email}`);
}

ensureAdmin()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => client.end());
