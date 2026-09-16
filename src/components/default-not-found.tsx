import { Link, useLocation } from "@tanstack/react-router";

import { Button, buttonVariants } from "#/components/ck/button";
import { PublicShell } from "#/components/ck/layout";
import { PageHead } from "#/components/ck/primitives";

/**
 * 404 mit dem Seitenkopf aller Unterseiten: Monogramm als Siegel, Cinzel-
 * Titel. Unter /app rendert die Admin-Shell drumherum, sonst das Shop-Shell.
 */
export function DefaultNotFound() {
  const { pathname } = useLocation();
  const inAdmin = pathname.startsWith("/app");

  const body = (
    <section className="mx-auto max-w-narrow px-6 py-24 text-center">
      <PageHead
        seal
        eyebrow="Seite nicht gefunden"
        title="404"
        lede="Diese Seite gibt es nicht oder nicht mehr."
      />
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={() => window.history.back()}>
          Zurück
        </Button>
        <Link to={inAdmin ? "/app" : "/"} className={buttonVariants()}>
          {inAdmin ? "Zum Admin" : "Zur Startseite"}
        </Link>
      </div>
    </section>
  );

  return inAdmin ? body : <PublicShell>{body}</PublicShell>;
}
