import { createFileRoute, redirect } from "@tanstack/react-router";

/** Früher die Kasse; bestellt wird jetzt über das Anfrage-Formular. */
export const Route = createFileRoute("/kasse")({
  beforeLoad: () => {
    throw redirect({ to: "/bestellen", statusCode: 301 });
  },
});
