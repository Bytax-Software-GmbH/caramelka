import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_BASE_URL: z.url().default("http://localhost:3000"),
    /**
     * Schaltet die Farb-Vorschau (`?primary=…`, das schwebende Panel und die
     * seitenweite Persistenz) auch außerhalb der Entwicklung frei.
     *
     * Gedacht für die Demo-Instanz, damit der Kunde Paletten auf der echten
     * URL testen kann. Ist der Schalter an, kann jeder Besucher die Seite über
     * URL-Parameter umfärben. Das ist für eine Demo in Ordnung, vor dem Launch
     * gehört der Wert auf `false`.
     *
     * Bewusst nachsichtig geparst statt über `z.stringbool()`: das wirft bei
     * leerem String, bei Anführungszeichen im Wert und bei führendem
     * Leerzeichen. Da t3-env beim Import validiert, würde ein versehentlich
     * leer gesetzter Wert im Deployment den Serverstart abbrechen und damit
     * die ganze Seite abschalten. Ein Demo-Schalter darf das nicht können.
     */
    VITE_ENABLE_THEME_PREVIEW: z
      .string()
      .optional()
      .transform((value) => ["true", "1", "yes", "on"].includes(value?.trim().toLowerCase() ?? "")),
  },
  runtimeEnv: import.meta.env,
});
