/** Central site metadata used for SEO, JSON-LD, canonical URLs and shop config. */
export const site = {
  name: "Caramelka",
  nameCyrillic: "Карамелька",
  domain: "caramelka.de",
  url: "https://caramelka.de",
  /** Zeile unter dem Logo, "— SWEET BY NATURE —". Bleibt in beiden Sprachen. */
  tagline: "Sweet by nature",
  /** Deutscher Claim für Titel und Social Cards. */
  claim: "Torten, die in Erinnerung bleiben",
  description:
    "Caramelka Konditorei: individuelle Torten und feine Patisserie, handgefertigt aus frischen Zutaten. Abholung & Lieferung im Umkreis von 100 km.",
  locale: "de_DE",
  /** Social-Card, ausgeliefert aus `public`. */
  ogImage: "/images/og-caramelka.jpg",

  contact: {
    phone: "+49 123 456789", // TODO: echte Nummer vor Launch
    phoneLink: "tel:+49123456789",
    email: "hallo@caramelka.de",
    instagram: "https://instagram.com/caramelka",
    address: {
      street: "Musterstraße 1",
      zip: "84568",
      city: "Pleiskirchen",
    },
    hours: "Mo bis Sa, 9:00 bis 18:00",
  },

  shop: {
    currency: "EUR",
    timeZone: "Europe/Berlin",
    deliveryRadiusKm: 100,
    deliveryFeeCents: 990,
    /**
     * Vorlaufzeit je Anfrage-Art in Stunden; eine größere Produkt-Vorlaufzeit
     * hat Vorrang. TODO: mit der Kundin bestätigen.
     */
    leadTimeHoursByKind: { cake: 48, dessert: 24, event: 168 },
    /** Sonntag geschlossen, keine Abholung/Lieferung (Events: Datum frei). */
    closedWeekdays: [0] as number[],
    /** Weitere Schließtage (Urlaub, Feiertage) als "YYYY-MM-DD". */
    closedDates: [] as string[],
    /** Abholung/Lieferung, Zeitfenster im Raster ab `open`, letztes vor `close`. */
    openingHours: { open: "09:00", close: "18:00" },
    slotStepMinutes: 30,
    /** Torten nach Gewicht. TODO: Grenzen und Portionsgröße mit der Kundin klären. */
    cake: { minGrams: 1000, maxGrams: 10000, stepGrams: 500, gramsPerPortion: 150, maxItems: 3 },
    dessert: { maxItems: 5, maxQuantity: 20 },
    event: { maxGuests: 2000 },
    upload: { maxFiles: 3, maxBytes: 6 * 1024 * 1024 },
  },
} as const;

/** Absolute URL for a path, used in canonical/OG/sitemap. */
export function absUrl(path: string): string {
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}
