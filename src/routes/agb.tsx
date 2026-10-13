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
      <h2>1. Geltungsbereich und Vertragsschluss</h2>
      <p>
        Diese AGB gelten für alle Bestellungen über {site.name} ({site.domain}). Das Absenden des
        Anfrage-Formulars ist eine unverbindliche Anfrage. Ein Vertrag kommt erst zustande, wenn wir
        die Bestellung per E-Mail bestätigen. Die Bestätigung nennt Termin, Übergabe und Endpreis.
        Liegt der Endpreis über der im Formular gezeigten Schätzung oder stand dort noch kein Preis,
        ist unsere E-Mail ein Angebot: Du kannst es bis zu der darin genannten Frist kostenfrei
        ablehnen, per Antwort auf die E-Mail oder telefonisch. Darauf weisen wir in der E-Mail
        ausdrücklich hin. Lehnst du bis dahin nicht ab, gilt das Angebot als angenommen und die
        Bestellung als bestätigt.
      </p>
      <h2>2. Bestellung & Vorlaufzeiten</h2>
      <p>
        Alle Torten werden frisch auf Bestellung gefertigt. Es gelten die im Formular angezeigten
        Vorlaufzeiten. Abholung und Lieferung sind Montag bis Samstag möglich; Hochzeits- und
        Festtorten besprechen wir persönlich.
      </p>
      <h2>3. Preise & Zahlung</h2>
      <p>
        Alle Preise inkl. gesetzlicher MwSt. Im Formular angezeigte Preise sind Schätzungen (Gewicht
        mal Preis je kg bzw. Preis der Größe, zuzüglich Lieferung). Verbindlich ist der Endpreis aus
        unserer Bestätigung; aufwendiges Dekor kann ihn erhöhen. Die Zahlung erfolgt bei Abholung
        bzw. Lieferung in bar oder per Karte.
      </p>
      <h2>4. Lieferung</h2>
      <p>
        Lieferung im Umkreis von {site.shop.deliveryRadiusKm} km zum ausgewiesenen Pauschalpreis.
        Abholung in der Backstube ist kostenlos.
      </p>
      <h2>5. Widerruf</h2>
      <p>
        Torten sind individuell angefertigte, verderbliche Waren. Das gesetzliche Widerrufsrecht ist
        gemäß § 312g Abs. 2 BGB ausgeschlossen. Stornierungen sind bis 72 Stunden vor dem
        Wunschtermin kostenfrei möglich.
      </p>
      <h2>6. Fotos</h2>
      <p>
        Hochgeladene Fotos nutzen wir ausschließlich als Vorlage für deine Bestellung. Bitte lade
        nur Fotos hoch, die du dafür verwenden darfst.
      </p>
    </SimplePage>
  ),
});
