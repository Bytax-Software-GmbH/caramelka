import { createFileRoute } from "@tanstack/react-router";

import { SimplePage } from "#/components/ck/simple-page";
import { site } from "#/lib/site";

export const Route = createFileRoute("/datenschutz")({
  head: () => ({
    meta: [{ title: `Datenschutz | ${site.name}` }, { name: "robots", content: "noindex, follow" }],
  }),
  component: () => (
    <SimplePage kicker="Rechtliches" title="Datenschutzerklärung">
      {/* TODO: Vor Launch vollständige DSGVO-Erklärung ergänzen. */}
      <h2>Verantwortlicher</h2>
      <p>
        Caramelka Konditorei, {site.contact.address.street}, {site.contact.address.zip}{" "}
        {site.contact.address.city} · {site.contact.email}
      </p>
      <h2>Bestelldaten</h2>
      <p>
        Für die Abwicklung deiner Bestellung verarbeiten wir Name, Kontaktdaten, ggf. Lieferadresse
        und Bestellinhalt (Art. 6 Abs. 1 lit. b DSGVO). Die Daten werden nach den gesetzlichen
        Aufbewahrungsfristen gelöscht.
      </p>
      <h2>Cookies</h2>
      <p>
        Diese Website verwendet ausschließlich technisch notwendige Cookies (Spracheinstellung,
        Warenkorb im lokalen Speicher deines Browsers). Es findet kein Tracking statt.
      </p>
      <h2>WhatsApp</h2>
      <p>
        Wenn du uns per WhatsApp kontaktierst, gelten zusätzlich die Datenschutzhinweise von
        WhatsApp (Meta Platforms Ireland Ltd.).
      </p>
      <h2>Deine Rechte</h2>
      <p>Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch.</p>
    </SimplePage>
  ),
});
