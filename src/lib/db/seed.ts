/**
 * Platzhalter-Seed für Caramelka. Idempotent: löscht Katalogdaten und legt
 * sie neu an (Bestellungen bleiben unangetastet).
 *
 * Run: pnpm db:seed
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { categories, fillings, products, productSizes } from "./schema";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle({ client, casing: "snake_case" });

async function seed() {
  await db.delete(productSizes);
  await db.delete(products);
  await db.delete(fillings);
  await db.delete(categories);

  const cats = await db
    .insert(categories)
    .values([
      { slug: "bento", nameDe: "Bento & Mini", nameRu: "Бенто и мини", sort: 1 },
      { slug: "klassiker", nameDe: "Klassiker", nameRu: "Классика", sort: 2 },
      { slug: "hochzeit", nameDe: "Hochzeit & Event", nameRu: "Свадьба и праздник", sort: 3 },
      { slug: "patisserie", nameDe: "Patisserie", nameRu: "Десерты", sort: 4 },
    ])
    .returning();
  const cat = Object.fromEntries(cats.map((c) => [c.slug, c.id]));

  await db.insert(fillings).values([
    {
      slug: "karamell-creme",
      nameDe: "Karamell-Creme",
      nameRu: "Карамельный крем",
      descriptionDe:
        "Unsere Signatur: gesalzenes Karamell, Vanillebiskuit und seidige Mascarpone-Creme.",
      descriptionRu:
        "Наша фирменная: солёная карамель, ванильный бисквит и нежный крем маскарпоне.",
      allergensDe: "Gluten, Milch, Ei",
      allergensRu: "Глютен, молоко, яйцо",
      sort: 1,
    },
    {
      slug: "himbeer-vanille",
      nameDe: "Himbeer-Vanille",
      nameRu: "Малина-ваниль",
      descriptionDe: "Frische Himbeeren, leichte Vanillecreme und saftiger heller Biskuit.",
      descriptionRu: "Свежая малина, лёгкий ванильный крем и сочный светлый бисквит.",
      allergensDe: "Gluten, Milch, Ei",
      allergensRu: "Глютен, молоко, яйцо",
      sort: 2,
    },
    {
      slug: "schokolade-70",
      nameDe: "Schokolade 70 %",
      nameRu: "Шоколад 70 %",
      descriptionDe: "Dunkler Schokoladenbiskuit, Ganache aus 70 %-Kuvertüre, kaum süß.",
      descriptionRu: "Тёмный шоколадный бисквит и ганаш из кувертюра 70 % — минимум сахара.",
      allergensDe: "Gluten, Milch, Ei, Soja",
      allergensRu: "Глютен, молоко, яйцо, соя",
      sort: 3,
    },
    {
      slug: "pistazie-himbeere",
      nameDe: "Pistazie-Himbeere",
      nameRu: "Фисташка-малина",
      descriptionDe: "Pistaziencreme mit echter Pistazienpaste und fruchtigem Himbeerkern.",
      descriptionRu: "Фисташковый крем на настоящей пасте и яркая малиновая прослойка.",
      allergensDe: "Gluten, Milch, Ei, Schalenfrüchte",
      allergensRu: "Глютен, молоко, яйцо, орехи",
      sort: 4,
    },
    {
      slug: "zitrone-mohn",
      nameDe: "Zitrone-Mohn",
      nameRu: "Лимон-мак",
      descriptionDe: "Zitronencurd, Mohnbiskuit und Frischkäsecreme — frisch und leicht.",
      descriptionRu: "Лимонный курд, маковый бисквит и крем-чиз — свежо и легко.",
      allergensDe: "Gluten, Milch, Ei",
      allergensRu: "Глютен, молоко, яйцо",
      sort: 5,
    },
    {
      slug: "snickers",
      nameDe: "Karamell-Erdnuss",
      nameRu: "Карамель-арахис",
      descriptionDe:
        "Karamell, geröstete Erdnüsse und Schokoladenbiskuit — wie der Riegel, nur besser.",
      descriptionRu: "Карамель, жареный арахис и шоколадный бисквит — как батончик, только лучше.",
      allergensDe: "Gluten, Milch, Ei, Erdnüsse",
      allergensRu: "Глютен, молоко, яйцо, арахис",
      sort: 6,
    },
  ]);

  const prods = await db
    .insert(products)
    .values([
      {
        slug: "bento-mini",
        categoryId: cat.bento!,
        nameDe: "Bento Mini",
        nameRu: "Бенто мини",
        descriptionDe:
          "Die kleine Torte für den großen Moment — perfekt für zwei, mit Wunsch-Aufschrift.",
        descriptionRu: "Маленький торт для большого момента — идеален на двоих, с надписью.",
        imageKey: "bento",
        leadTimeHours: 24,
        featured: true,
        sort: 1,
      },
      {
        slug: "karamell-signature",
        categoryId: cat.klassiker!,
        nameDe: "Karamell Signature",
        nameRu: "Фирменный карамельный",
        descriptionDe:
          "Unsere Signatur-Torte: gesalzenes Karamell, Vanille und ein Hauch Fleur de Sel.",
        descriptionRu: "Наш фирменный торт: солёная карамель, ваниль и щепотка fleur de sel.",
        imageKey: "karamell",
        leadTimeHours: 48,
        featured: true,
        sort: 2,
      },
      {
        slug: "himbeer-vanille-torte",
        categoryId: cat.klassiker!,
        nameDe: "Himbeer-Vanille",
        nameRu: "Малина-ваниль",
        descriptionDe: "Der Sommerklassiker mit frischen Himbeeren — leicht, fruchtig, nie zu süß.",
        descriptionRu: "Летняя классика со свежей малиной — легко, фруктово, в меру сладко.",
        imageKey: "himbeere",
        leadTimeHours: 48,
        featured: true,
        sort: 3,
      },
      {
        slug: "schokolade-noir",
        categoryId: cat.klassiker!,
        nameDe: "Schokolade Noir",
        nameRu: "Шоколад нуар",
        descriptionDe: "Für Schokoladenmenschen: 70 % Kakao, dunkle Ganache, tiefer Geschmack.",
        descriptionRu: "Для шоколадных людей: 70 % какао, тёмный ганаш, глубокий вкус.",
        imageKey: "schokolade",
        leadTimeHours: 48,
        sort: 4,
      },
      {
        slug: "hochzeit-klassik",
        categoryId: cat.hochzeit!,
        nameDe: "Hochzeit Klassik",
        nameRu: "Свадебный классический",
        descriptionDe:
          "Mehrstöckig, elegant, ganz nach eurem Stil — Beratung und Probeverkostung inklusive.",
        descriptionRu:
          "Многоярусный, элегантный, в вашем стиле — консультация и дегустация включены.",
        imageKey: "hochzeit",
        leadTimeHours: 168,
        fillingSelectable: false,
        featured: true,
        sort: 5,
      },
      {
        slug: "hochzeit-grande",
        categoryId: cat.hochzeit!,
        nameDe: "Hochzeit Grande",
        nameRu: "Свадебный гранд",
        descriptionDe:
          "Das große Format für große Feste — bis 120 Portionen, individuell gestaltet.",
        descriptionRu:
          "Большой формат для больших праздников — до 120 порций, индивидуальный дизайн.",
        imageKey: "hochzeit-grande",
        leadTimeHours: 336,
        fillingSelectable: false,
        sort: 6,
      },
      {
        slug: "eclair-box",
        categoryId: cat.patisserie!,
        nameDe: "Éclair-Box",
        nameRu: "Бокс эклеров",
        descriptionDe: "Sechs Éclairs, sechs Geschmäcker — von Karamell bis Pistazie.",
        descriptionRu: "Шесть эклеров, шесть вкусов — от карамели до фисташки.",
        imageKey: "eclair",
        leadTimeHours: 24,
        fillingSelectable: false,
        sort: 7,
      },
      {
        slug: "pralinen-box",
        categoryId: cat.patisserie!,
        nameDe: "Pralinen-Box",
        nameRu: "Бокс конфет",
        descriptionDe: "Handgerollte Pralinen aus eigener Herstellung — 9 oder 16 Stück.",
        descriptionRu: "Конфеты ручной работы собственного производства — 9 или 16 штук.",
        imageKey: "praline",
        leadTimeHours: 24,
        fillingSelectable: false,
        sort: 8,
      },
    ])
    .returning();
  const prod = Object.fromEntries(prods.map((p) => [p.slug, p.id]));

  await db.insert(productSizes).values([
    {
      productId: prod["bento-mini"]!,
      labelDe: "Ø 10 cm · für 2",
      labelRu: "Ø 10 см · на двоих",
      priceCents: 2400,
      sort: 0,
    },
    {
      productId: prod["bento-mini"]!,
      labelDe: "Ø 13 cm · für 4",
      labelRu: "Ø 13 см · на 4",
      priceCents: 3200,
      sort: 1,
    },

    {
      productId: prod["karamell-signature"]!,
      labelDe: "Ø 16 cm · 8 Stücke",
      labelRu: "Ø 16 см · 8 кусочков",
      priceCents: 4200,
      sort: 0,
    },
    {
      productId: prod["karamell-signature"]!,
      labelDe: "Ø 20 cm · 12 Stücke",
      labelRu: "Ø 20 см · 12 кусочков",
      priceCents: 5600,
      sort: 1,
    },
    {
      productId: prod["karamell-signature"]!,
      labelDe: "Ø 24 cm · 18 Stücke",
      labelRu: "Ø 24 см · 18 кусочков",
      priceCents: 7400,
      sort: 2,
    },

    {
      productId: prod["himbeer-vanille-torte"]!,
      labelDe: "Ø 16 cm · 8 Stücke",
      labelRu: "Ø 16 см · 8 кусочков",
      priceCents: 4500,
      sort: 0,
    },
    {
      productId: prod["himbeer-vanille-torte"]!,
      labelDe: "Ø 20 cm · 12 Stücke",
      labelRu: "Ø 20 см · 12 кусочков",
      priceCents: 5900,
      sort: 1,
    },

    {
      productId: prod["schokolade-noir"]!,
      labelDe: "Ø 16 cm · 8 Stücke",
      labelRu: "Ø 16 см · 8 кусочков",
      priceCents: 4800,
      sort: 0,
    },
    {
      productId: prod["schokolade-noir"]!,
      labelDe: "Ø 20 cm · 12 Stücke",
      labelRu: "Ø 20 см · 12 кусочков",
      priceCents: 6200,
      sort: 1,
    },

    {
      productId: prod["hochzeit-klassik"]!,
      labelDe: "2 Etagen · ~30 Portionen",
      labelRu: "2 яруса · ~30 порций",
      priceCents: 12000,
      sort: 0,
    },
    {
      productId: prod["hochzeit-klassik"]!,
      labelDe: "3 Etagen · ~50 Portionen",
      labelRu: "3 яруса · ~50 порций",
      priceCents: 19000,
      sort: 1,
    },

    {
      productId: prod["hochzeit-grande"]!,
      labelDe: "4 Etagen · ~80 Portionen",
      labelRu: "4 яруса · ~80 порций",
      priceCents: 29000,
      sort: 0,
    },
    {
      productId: prod["hochzeit-grande"]!,
      labelDe: "5 Etagen · ~120 Portionen",
      labelRu: "5 ярусов · ~120 порций",
      priceCents: 42000,
      sort: 1,
    },

    {
      productId: prod["eclair-box"]!,
      labelDe: "6er-Box",
      labelRu: "Бокс из 6",
      priceCents: 1800,
      sort: 0,
    },
    {
      productId: prod["eclair-box"]!,
      labelDe: "12er-Box",
      labelRu: "Бокс из 12",
      priceCents: 3400,
      sort: 1,
    },

    {
      productId: prod["pralinen-box"]!,
      labelDe: "9 Stück",
      labelRu: "9 штук",
      priceCents: 1600,
      sort: 0,
    },
    {
      productId: prod["pralinen-box"]!,
      labelDe: "16 Stück",
      labelRu: "16 штук",
      priceCents: 2600,
      sort: 1,
    },
  ]);

  console.log(`Seed fertig: ${cats.length} Kategorien, ${prods.length} Produkte, 6 Füllungen.`);
}

seed()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => client.end());
