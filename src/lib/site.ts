/** Central site metadata used for SEO, JSON-LD, canonical URLs and shop config. */
export const site = {
  name: "Caramelka",
  nameCyrillic: "Карамелька",
  domain: "caramelka.de",
  url: "https://caramelka.de",
  tagline: "Torten, die in Erinnerung bleiben",
  description:
    "Caramelka Konditorei — individuelle Torten und feine Patisserie, handgefertigt aus frischen Zutaten. Abholung & Lieferung im Umkreis von 100 km.",
  locale: "de_DE",

  contact: {
    whatsapp: "+49 123 456789", // TODO: echte Nummer vor Launch
    whatsappLink: "https://wa.me/49123456789",
    email: "hallo@caramelka.de",
    instagram: "https://instagram.com/caramelka",
    address: {
      street: "Musterstraße 1",
      zip: "84568",
      city: "Pleiskirchen",
    },
    hours: "Mo – Sa · 9:00 – 18:00",
  },

  shop: {
    currency: "EUR",
    deliveryRadiusKm: 100,
    deliveryFeeCents: 990,
    /** Fallback, wenn ein Produkt keine eigene Vorlaufzeit hat. */
    defaultLeadTimeHours: 48,
    /** Sonntag geschlossen — keine Abholung/Lieferung. */
    closedWeekdays: [0] as number[],
  },
} as const;

/** Absolute URL for a path, used in canonical/OG/sitemap. */
export function absUrl(path: string): string {
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}
