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
      <h2>Anfrage-Formular und Bestellung</h2>
      <p>
        Für deine Anfrage und die Abwicklung der Bestellung verarbeiten wir Name, Telefon, E-Mail,
        ggf. Lieferadresse, Wunschtermin, deine Auswahl und Anmerkungen (Art. 6 Abs. 1 lit. b
        DSGVO). Bestätigte Bestellungen bewahren wir nach den gesetzlichen Fristen auf (§ 147 AO, §
        257 HGB); nicht zustande gekommene Anfragen löschen wir früher.
      </p>
      <h2>Fotos</h2>
      <p>
        Wunschfotos, die du hochlädst, speichern wir auf unserem eigenen Server in der EU. Kamera-
        und Standortdaten (EXIF/GPS) entfernen wir beim Hochladen. Die Fotos sieht nur unser Team,
        und wir löschen sie, sobald sie für die Bestellung nicht mehr gebraucht werden. Bitte lade
        keine Fotos anderer Personen ohne deren Einverständnis hoch.
      </p>
      {/* TODO: Löschfrist für Fotos und den E-Mail-Anbieter (inkl. AVV) eintragen. */}
      <h2>E-Mail</h2>
      <p>
        Eingangs- und Bestellbestätigungen verschicken wir per E-Mail über unseren E-Mail-Anbieter,
        mit dem ein Vertrag zur Auftragsverarbeitung besteht.
      </p>
      <h2>Spam-Schutz</h2>
      <p>
        Das Formular schützen wir ohne Captcha und ohne Cookies: über ein verstecktes Feld, eine
        Mindest-Ausfüllzeit und eine Begrenzung der Anfragen pro IP-Adresse. Die IP-Adresse wird
        dafür nur kurz im Arbeitsspeicher gehalten und nicht gespeichert (Art. 6 Abs. 1 lit. f
        DSGVO).
      </p>
      <h2>Cookies und Speicher im Browser</h2>
      <p>
        Wir verwenden nur technisch notwendige Speicher: ein Cookie für die Spracheinstellung und
        einen Entwurf des Formulars im Sitzungsspeicher deines Browsers, der beim Schließen des Tabs
        verschwindet. Es findet kein Tracking statt.
      </p>
      <h2>Deine Rechte</h2>
      <p>
        Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch (Art. 15
        bis 21 DSGVO). Du kannst dich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren,
        zum Beispiel beim Bayerischen Landesamt für Datenschutzaufsicht (BayLDA).
      </p>
    </SimplePage>
  ),
});
