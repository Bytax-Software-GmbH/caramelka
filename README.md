# Caramelka · Карамелька

Website + Bestellsystem für die Caramelka Konditorei (Torten auf Bestellung).
Inspiration: [paulinecake.ae](https://www.paulinecake.ae) · Design: `docs/design/Caramelka-Directions.dc.html`
(gewählt: polierter Mix aus 1a Editorial Crème + 1b Karamell-Palette + 1c Espresso/Gold-Akzente, Logo 2e zweisprachig).

## Features

- **Sortiment:** Katalog mit Kategorien, Produktseiten mit Richtpreisen und "Jetzt anfragen"
- **Anfrage-Formular** (`/bestellen`, ersetzt Warenkorb und WhatsApp): Torte nach Gewicht mit
  Füllung, Desserts in festen Größen oder Hochzeit/Bankett; Dekor mit bis zu 3 Wunschfotos;
  Termin mit Zeitfenster (Vorlaufzeit, So geschlossen); Abholung/Lieferung (bis 100 km).
  Preis als Schätzung (€/kg je Füllung), verbindlich erst mit der Bestätigung per E-Mail.
  Zahlung bei Übergabe; PayPal-Integration folgt.
- **E-Mails** über SMTP mit Outbox (Wiederholversuche): Eingangsbestätigung an die Kundin,
  neue Anfrage an die Backstube
- **Zweisprachig:** DE (Standard) / RU, Cookie-persistiert, Inhalte aus der DB zweisprachig
- **Füllungs-Guide** mit Allergenen und kg-Preisen, **Galerie**, **Kontakt** (Telefon, E-Mail)
- **Admin** (`/app`, better-auth): Bestellungen mit Status-Workflow, Produkt- & Füllungs-CRUD
- SEO: Sitemap, robots, JSON-LD (Bakery), OG-Tags

## Stack

- **TanStack Start** (Router, Vite, SSR, Server Functions) + React 19
- **PostgreSQL + Drizzle ORM** (shared Dev-Postgres, DB `caramelka`)
- **better-auth** (E-Mail/Passwort, nur Admin)
- **Tailwind v4 + shadcn/ui**, Fonts self-hosted via Fontsource
  (Playfair Display · Jost — beide mit Kyrillisch-Subsets)

## Setup

```bash
pnpm install
cp .env.example .env             # DATABASE_URL auf die shared Dev-DB zeigen lassen
createdb caramelka               # falls noch nicht vorhanden
pnpm db:push                     # Schema anlegen
pnpm db:seed                     # Platzhalter-Katalog (idempotent, Bestellungen bleiben)
pnpm dev                         # http://localhost:3000
```

Admin: Registrierung ist geschlossen. In `.env` `ADMIN_EMAILS` und
`ADMIN_BOOTSTRAP_EMAIL`/`ADMIN_BOOTSTRAP_PASSWORD` setzen, dann `pnpm admin:ensure`,
danach `/login` → `/app`. Nur E-Mails aus `ADMIN_EMAILS` kommen in den Admin.

Produktion (Coolify): `ADMIN_EMAILS` für app + migrate setzen. Der migrate-Container
legt den Bootstrap-Admin beim Deploy an (überschreibt nie); die Bootstrap-Variablen
danach wieder leeren.

Mails lokal: `docker compose -f docker-compose.dev.yml up -d` startet Mailpit
(SMTP `localhost:1025`, Postfach http://localhost:8025). In `.env`: `SMTP_HOST=localhost`,
`SMTP_PORT=1025`. Schema-Änderungen für Produktion immer per `pnpm db:generate` als
Migration (`drizzle/`), nie per `db:push` gegen Prod.

## Scripts

| Script                   | Zweck                           |
| ------------------------ | ------------------------------- |
| `pnpm dev`               | Dev-Server                      |
| `pnpm build`             | Produktions-Build               |
| `pnpm check`             | Format + Lint (oxfmt/oxlint)    |
| `pnpm db:push`           | Drizzle-Schema in die DB pushen |
| `pnpm db:seed`           | Platzhalter-Daten einspielen    |
| `pnpm exec tsc --noEmit` | Typecheck                       |

## Struktur

```
src/
  components/ck/      Design-System (logo, layout, primitives, placeholder, …)
  lib/
    i18n/             DE/RU-Wörterbuch + Provider (Cookie "ck-locale")
    order-request/    Formular-Vertrag: Zod-Schema, Schätzung, Termin-Logik (Client + Server)
    db/               schema, seed, queries, ensure-admin
    server/           Server Functions (catalog, orders, admin), *.server.ts (Upload, Mail)
    site.ts           Site-/Shop-Konfiguration (Kontakt, Lieferradius, Gebühren)
  components/order-request/  Anfrage-Wizard (Schritte, Zusammenfassung, Fotos)
  routes/             TanStack file-based routes (torten, bestellen, /app-Admin, …)
docs/design/          Caramelka Directions (Design-Referenz)
```

## Vor Launch (TODOs)

- Echte Fotos statt `Placeholder` (imageKey → Bildpfad)
- Echte Telefonnummer und Adresse in `src/lib/site.ts`
- Preise je kg für jede Füllung im Admin pflegen (Seed hat nur Platzhalter)
- SMTP des Geschäftspostfachs in Coolify setzen (`SMTP_*`, `MAIL_FROM`, `ORDER_NOTIFY_TO`),
  SPF/DKIM prüfen, Test-Mail aus dem Admin schicken
- Volume `uploads-data` (Kundenfotos) ins Backup aufnehmen
- Impressum/Datenschutz/AGB juristisch finalisieren
- PayPal-Zahlung

# caramelka
