import { createFileRoute, Link } from "@tanstack/react-router";

import { PublicShell, shell } from "#/components/ck/layout";
import { MasonryGallery } from "#/components/ck/masonry-gallery";
import { Body, Kicker, pillVariants, SectionTitle } from "#/components/ck/primitives";
import { Reveal } from "#/components/ck/reveal";
import { useI18n } from "#/lib/i18n";
import { site } from "#/lib/site";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/galerie")({
  head: () => ({
    meta: [
      { title: `Galerie | ${site.name}` },
      {
        name: "description",
        content: "Torten aus der Caramelka-Backstube: Hochzeiten, Geburtstage, besondere Momente.",
      },
    ],
    links: [{ rel: "canonical", href: `${site.url}/galerie` }],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const { t } = useI18n();

  return (
    <PublicShell>
      {/* Kopf: gestapelter Text, keine Spalten. */}
      <section className={cn(shell, "pt-16 pb-14 md:pt-20 md:pb-16")}>
        <Kicker className="mb-5">{t.gallery.kicker}</Kicker>
        <SectionTitle as="h1" size="xl" className="mb-6 max-w-[16ch]">
          {t.gallery.title}
        </SectionTitle>
        <Body size="l" className="max-w-[54ch]">
          {t.gallery.intro}
        </Body>
      </section>

      {/* Mosaik. Das Magnetband bleibt der Startseite vorbehalten, damit
          dieselben Aufnahmen nicht zweimal auf einer Seite stehen. */}
      <section className={cn(shell, "pb-24 md:pb-32")}>
        <MasonryGallery shots={t.home.galleryShots} />
      </section>

      {/* Abschluss: ein einziger Handlungspfad zurück ins Sortiment. */}
      <section className={cn(shell, "py-24 text-center md:py-32")}>
        <Reveal>
          <SectionTitle className="mx-auto mb-8 max-w-[18ch]">{t.gallery.ctaTitle}</SectionTitle>
          <Link to="/torten" className={pillVariants.primary}>
            {t.hero.ctaPrimary}
          </Link>
        </Reveal>
      </section>
    </PublicShell>
  );
}
