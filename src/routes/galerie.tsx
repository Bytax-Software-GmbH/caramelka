import { createFileRoute } from "@tanstack/react-router";

import { PublicShell } from "#/components/ck/layout";
import { Placeholder } from "#/components/ck/placeholder";
import { Kicker, SectionTitle } from "#/components/ck/primitives";
import { useI18n } from "#/lib/i18n";
import { site } from "#/lib/site";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/galerie")({
  head: () => ({
    meta: [
      { title: `Galerie | ${site.name}` },
      {
        name: "description",
        content: "Torten aus der Caramelka-Backstube — Hochzeiten, Geburtstage, besondere Momente.",
      },
    ],
  }),
  component: GalleryPage,
});

/** Platzhalter-Motive, bis echte Fotos eingepflegt sind. */
const shots = [
  { key: "hochzeit-dreistoeckig", tall: true },
  { key: "bento-herz", tall: false },
  { key: "karamell-drip", tall: false },
  { key: "blumen-buttercreme", tall: true },
  { key: "kindergeburtstag", tall: false },
  { key: "lambeth-vintage", tall: true },
  { key: "schoko-noir", tall: false },
  { key: "pistazie-himbeer", tall: false },
  { key: "taufe-pastell", tall: true },
  { key: "eclair-selection", tall: false },
  { key: "hochzeit-satin", tall: false },
  { key: "geburtstag-gold", tall: true },
];

function GalleryPage() {
  const { t } = useI18n();
  return (
    <PublicShell>
      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <Kicker className="mb-4">{t.gallery.kicker}</Kicker>
        <SectionTitle as="h1" className="mb-4 text-5xl md:text-[56px]">
          {t.gallery.title}
        </SectionTitle>
        <p className="mb-12 max-w-[60ch] text-[15.5px] leading-[1.65] text-espresso/70">
          {t.gallery.intro}
        </p>

        <div className="columns-2 gap-4 md:columns-3 [&>*]:mb-4">
          {shots.map((shot) => (
            <Placeholder
              key={shot.key}
              imageKey={shot.key}
              className={cn("w-full rounded-[4px]", shot.tall ? "aspect-[3/4]" : "aspect-square")}
            />
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
