import { createFileRoute, Link } from "@tanstack/react-router";

import { buttonVariants } from "#/components/ck/button";
import { PublicShell, shell } from "#/components/ck/layout";
import { MasonryGallery } from "#/components/ck/masonry-gallery";
import { Display, PageHead, SectionRule } from "#/components/ck/primitives";
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
      <section className={cn(shell, "pt-14 pb-12 lg:pt-16")}>
        <PageHead eyebrow={t.gallery.kicker} title={t.gallery.title} lede={t.gallery.intro} />
      </section>

      {/* Mosaik. Das Magnetband bleibt der Startseite vorbehalten, damit
          dieselben Aufnahmen nicht zweimal auf einer Seite stehen. */}
      <section className={cn(shell, "pb-20")}>
        <MasonryGallery shots={t.home.galleryShots} />
      </section>

      <section className={cn(shell, "pb-20 lg:pb-24")}>
        <Reveal className="text-center">
          <SectionRule>{t.gallery.kicker}</SectionRule>
          <Display as="h2" className="mx-auto mt-8 max-w-[18ch]">
            {t.gallery.ctaTitle}
          </Display>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/bestellen" className={buttonVariants({ size: "lg" })}>
              {t.hero.ctaSecondary}
            </Link>
            <Link to="/torten" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              {t.hero.ctaPrimary}
            </Link>
          </div>
        </Reveal>
      </section>
    </PublicShell>
  );
}
