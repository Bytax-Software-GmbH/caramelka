import { PublicShell, shell } from "#/components/ck/layout";
import { PageHead } from "#/components/ck/primitives";
import { cn } from "#/lib/utils";

/** Schmale Text-Seite (Rechtliches etc.), 720 breit. */
export function SimplePage({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <PublicShell>
      <section className={cn(shell, "max-w-narrow pt-14 pb-20")}>
        <PageHead eyebrow={kicker} title={title} />
        <div className="ck-prose mt-10 border-t border-hairline pt-8">{children}</div>
      </section>
    </PublicShell>
  );
}
