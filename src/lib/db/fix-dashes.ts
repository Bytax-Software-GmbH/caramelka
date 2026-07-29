/**
 * Einmalige Inhalts-Korrektur: Gedankenstriche aus den Texten in der Datenbank
 * entfernen. Die Beschreibungen wurden ursprünglich mit `—` geseedet; die
 * Redesign-Vorgabe verbietet den Gedankenstrich in jeder sichtbaren Zeile.
 *
 * Arbeitet ausschließlich mit UPDATE, löscht nichts und lässt damit
 * `order_items.product_id` unangetastet (anders als ein voller Re-Seed).
 *
 * Lokal, mit Quellcode und Abhängigkeiten:
 *
 *   node --env-file=.env --import tsx src/lib/db/fix-dashes.ts
 *
 * NICHT im App-Container der Produktion: das Runtime-Image enthält nur
 * `.output`, also weder `src/` noch `node_modules` noch `tsx`, und die
 * Umgebung kommt aus Coolify statt aus einer `.env`. Dort stattdessen
 * `fix-dashes.sql` im Postgres-Container ausführen:
 *
 *   psql -U caramelka -d caramelka -f fix-dashes.sql
 */
import { sql } from "drizzle-orm";

import { db } from "./index";

const columns: { table: string; column: string }[] = [
  { table: "products", column: "description_de" },
  { table: "products", column: "description_ru" },
  { table: "fillings", column: "description_de" },
  { table: "fillings", column: "description_ru" },
  { table: "fillings", column: "allergens_de" },
  { table: "fillings", column: "allergens_ru" },
  { table: "categories", column: "name_de" },
  { table: "categories", column: "name_ru" },
  { table: "product_sizes", column: "label_de" },
  { table: "product_sizes", column: "label_ru" },
];

/**
 * Beide Schreibweisen abdecken: mit umgebenden Leerzeichen wird der Strich zum
 * Komma, ohne Leerzeichen (Bereichsangaben wie „Mo–Sa") zum Bindestrich.
 */
async function run() {
  for (const { table, column } of columns) {
    const result = await db.execute(
      sql`UPDATE ${sql.identifier(table)}
          SET ${sql.identifier(column)} = replace(
            replace(
              replace(${sql.identifier(column)}, ' — ', ', '),
              ' – ', ', '
            ),
            '–', '-'
          )
          WHERE ${sql.identifier(column)} LIKE '%—%'
             OR ${sql.identifier(column)} LIKE '%–%'`,
    );
    console.info(`${table}.${column}: ${result.count} Zeile(n) korrigiert`);
  }
}

await run();
process.exit(0);
