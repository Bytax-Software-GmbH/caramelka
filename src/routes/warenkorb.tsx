import { createFileRoute, redirect } from "@tanstack/react-router";

/** Früher der Warenkorb; bestellt wird jetzt über das Anfrage-Formular. */
export const Route = createFileRoute("/warenkorb")({
  beforeLoad: () => {
    throw redirect({ to: "/bestellen", statusCode: 301 });
  },
});
