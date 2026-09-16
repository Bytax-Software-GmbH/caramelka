import {
  ErrorComponent,
  type ErrorComponentProps,
  Link,
  rootRouteId,
  useMatch,
  useRouter,
} from "@tanstack/react-router";

import { Button, buttonVariants } from "#/components/ck/button";
import { Display, Eyebrow, Lede } from "#/components/ck/primitives";

export function DefaultCatchBoundary({ error }: Readonly<ErrorComponentProps>) {
  const router = useRouter();
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  });

  console.error(error);

  return (
    <section className="mx-auto flex max-w-narrow flex-col items-center gap-6 px-6 py-24 text-center">
      <div>
        <Eyebrow dashed>Fehler</Eyebrow>
        <Display as="h1" className="mt-5">
          Etwas ist schiefgelaufen
        </Display>
        <Lede className="mt-4">Bitte versuche es noch einmal.</Lede>
      </div>
      <div className="w-full overflow-auto rounded-md border border-hairline bg-surface p-4 text-left ck-body-sm">
        <ErrorComponent error={error} />
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button
          onClick={() => {
            router.invalidate();
          }}
        >
          Erneut versuchen
        </Button>
        {isRoot ? (
          <Link to="/" className={buttonVariants({ variant: "secondary" })}>
            Zur Startseite
          </Link>
        ) : (
          <Link
            to="/"
            className={buttonVariants({ variant: "secondary" })}
            onClick={(e) => {
              e.preventDefault();
              window.history.back();
            }}
          >
            Zurück
          </Link>
        )}
      </div>
    </section>
  );
}
