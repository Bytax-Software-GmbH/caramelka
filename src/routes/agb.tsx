import { createFileRoute } from "@tanstack/react-router";

import { SimplePage } from "#/components/ck/simple-page";
import { site } from "#/lib/site";

export const Route = createFileRoute("/agb")({
  head: () => ({
    meta: [{ title: `AGB | ${site.name}` }, { name: "robots", content: "noindex, follow" }],
  }),
  component: () => (
    <SimplePage kicker="Rechtliches" title="Allgemeine Geschäftsbedingungen">
      {/* TODO: Vor Launch juristisch prüfen lassen. */}
      <h2>1. Geltungsbereich</h2>
      <p>
        Diese AGB gelten für alle Bestellungen über {site.name} ({site.domain}). Bestellungen sind
        erst nach unserer persönlichen Bestätigung (Telefon oder WhatsApp) verbindlich.
      </p>
      <h2>2. Bestellung & Vorlaufzeiten</h2>
      <p>
        Alle Torten werden frisch auf Bestellung gefertigt. Es gelten die beim Produkt angegebenen
        Vorlaufzeiten. Wunschtermine sind Montag bis Samstag möglich.
      </p>
      <h2>3. Preise & Zahlung</h2>
      <p>
        Alle Preise inkl. gesetzlicher MwSt. Die Zahlung erfolgt bei Abholung bzw. Lieferung in bar
        oder per Karte. Online-Zahlungsarten werden ergänzt, sobald verfügbar.
      </p>
      <h2>4. Lieferung</h2>
      <p>
        Lieferung im Umkreis von {site.shop.deliveryRadiusKm} km zum ausgewiesenen Pauschalpreis.
        Abholung in der Backstube ist kostenlos.
      </p>
      <h2>5. Widerruf</h2>
      <p>
        Torten sind individuell angefertigte, verderbliche Waren — das gesetzliche Widerrufsrecht
        ist gemäß § 312g Abs. 2 BGB ausgeschlossen. Stornierungen sind bis 72 Stunden vor dem
        Wunschtermin kostenfrei möglich.
      </p>
    </SimplePage>
  ),
});
