# Caramelka · Карамелька

Website + Bestellsystem für die Caramelka Konditorei (Torten auf Bestellung).
Inspiration: [paulinecake.ae](https://www.paulinecake.ae) · Design: `docs/design/Caramelka-Directions.dc.html`
(gewählt: polierter Mix aus 1a Editorial Crème + 1b Karamell-Palette + 1c Espresso/Gold-Akzente, Logo 2e zweisprachig).

## Features

- **Shop:** Katalog mit Kategorien, Produktseiten mit Größen-, Füllungs- und Aufschrift-Wahl
- **Checkout:** Warenkorb (localStorage) → Abholung/Lieferung (bis 100 km, Pauschale) →
  Wunschtermin mit Vorlaufzeiten (Mo–Sa) → Bestellung mit Bestätigungsseite.
  Zahlung bei Übergabe; PayPal-Integration folgt.
- **Zweisprachig:** DE (Standard) / RU, Cookie-persistiert, Inhalte aus der DB zweisprachig
- **Füllungs-Guide** mit Allergenen, **Galerie**, **Kontakt** (WhatsApp-first)
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

Admin: erster Account via `/signup`, danach `/login` → `/app`.
(Achtung: `/signup` vor Launch deaktivieren oder Rollen-Gating ergänzen.)

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
    cart.tsx          Warenkorb (localStorage "ck-cart-v1")
    db/               schema, seed, queries
    server/           Server Functions (catalog, orders, admin)
    site.ts           Site-/Shop-Konfiguration (Kontakt, Lieferradius, Gebühren)
  routes/             TanStack file-based routes (torten, kasse, /app-Admin, …)
docs/design/          Caramelka Directions (Design-Referenz)
```

## Vor Launch (TODOs)

- Echte Fotos statt `Placeholder` (imageKey → Bildpfad)
- Echte Kontaktdaten/WhatsApp-Nummer in `src/lib/site.ts`
- Impressum/Datenschutz/AGB juristisch finalisieren
- `/signup` schließen (Invite-only) · PayPal-Zahlung · E-Mail-Bestätigung bei Bestellung
# caramelka
