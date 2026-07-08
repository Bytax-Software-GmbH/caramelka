import { PublicShell } from "#/components/ck/layout";
import { Kicker, SectionTitle } from "#/components/ck/primitives";

/** Schmale Text-Seite (Rechtliches etc.). */
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
      <section className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-16">
        <Kicker className="mb-4">{kicker}</Kicker>
        <SectionTitle as="h1" className="mb-8">
          {title}
        </SectionTitle>
        <div className="space-y-4 text-[15px] leading-[1.7] text-espresso/80 [&_h2]:mt-8 [&_h2]:ck-display [&_h2]:text-[24px] [&_h2]:text-espresso">
          {children}
        </div>
      </section>
    </PublicShell>
  );
}
