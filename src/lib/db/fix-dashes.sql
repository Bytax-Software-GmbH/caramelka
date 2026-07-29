-- Einmalige Inhalts-Korrektur: Gedankenstriche aus den Texten in der Datenbank
-- entfernen. Gleiche Wirkung wie fix-dashes.ts, aber ohne Node-Toolchain, damit
-- es im Postgres-Container laufen kann. Das Runtime-Image der App enthält nur
-- `.output`, also weder `src/` noch `tsx`.
--
--   psql -U caramelka -d caramelka -f fix-dashes.sql
--
-- Arbeitet ausschließlich mit UPDATE, löscht nichts und lässt damit
-- order_items.product_id unangetastet (anders als ein voller Re-Seed).

DO $$
DECLARE
  target record;
  touched integer;
BEGIN
  FOR target IN
    SELECT * FROM (VALUES
      ('products',      'description_de'),
      ('products',      'description_ru'),
      ('fillings',      'description_de'),
      ('fillings',      'description_ru'),
      ('fillings',      'allergens_de'),
      ('fillings',      'allergens_ru'),
      ('categories',    'name_de'),
      ('categories',    'name_ru'),
      ('product_sizes', 'label_de'),
      ('product_sizes', 'label_ru')
    ) AS t(tbl, col)
  LOOP
    EXECUTE format(
      -- Mit umgebenden Leerzeichen wird der Strich zum Komma. Was danach noch
      -- übrig ist (Bereichsangaben wie "Mo–Sa") wird zum Bindestrich, damit
      -- garantiert kein Gedankenstrich stehen bleibt.
      'UPDATE %I SET %I = replace(replace(replace(replace(%I,'
      || ' '' — '', '', ''), '' – '', '', ''), ''—'', ''-''), ''–'', ''-'')'
      || ' WHERE %I LIKE ''%%—%%'' OR %I LIKE ''%%–%%''',
      target.tbl, target.col, target.col, target.col, target.col
    );
    GET DIAGNOSTICS touched = ROW_COUNT;
    RAISE NOTICE '%.%: % Zeile(n) korrigiert', target.tbl, target.col, touched;
  END LOOP;
END $$;

-- Kontrolle: muss 0 liefern.
SELECT count(*) AS verbleibende_gedankenstriche
FROM (
  SELECT description_de AS v FROM products
  UNION ALL SELECT description_ru FROM products
  UNION ALL SELECT description_de FROM fillings
  UNION ALL SELECT description_ru FROM fillings
  UNION ALL SELECT allergens_de FROM fillings
  UNION ALL SELECT allergens_ru FROM fillings
  UNION ALL SELECT name_de FROM categories
  UNION ALL SELECT name_ru FROM categories
  UNION ALL SELECT label_de FROM product_sizes
  UNION ALL SELECT label_ru FROM product_sizes
) AS alle
WHERE v LIKE '%—%' OR v LIKE '%–%';
