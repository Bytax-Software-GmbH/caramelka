import { createFileRoute } from "@tanstack/react-router";

import { SimplePage } from "#/components/ck/simple-page";
import { site } from "#/lib/site";

export const Route = createFileRoute("/impressum")({
  head: () => ({
    meta: [{ title: `Impressum | ${site.name}` }, { name: "robots", content: "noindex, follow" }],
  }),
  component: () => (
    <SimplePage kicker="Rechtliches" title="Impressum">
      {/* TODO: echte Betreiberdaten vor Launch eintragen. */}
      <p>Angaben gemäß § 5 DDG</p>
      <p>
        Caramelka Konditorei
        <br />
        {site.contact.address.street}
        <br />
        {site.contact.address.zip} {site.contact.address.city}
      </p>
      <p>
        Telefon/WhatsApp: {site.contact.whatsapp}
        <br />
        E-Mail: {site.contact.email}
      </p>
      <p>Umsatzsteuer-ID: folgt</p>
    </SimplePage>
  ),
});
