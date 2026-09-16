import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { buttonVariants } from "#/components/ck/button";
import { PublicShell, shell } from "#/components/ck/layout";
import { MagneticCarousel } from "#/components/ck/magnetic-carousel";
import { Placeholder } from "#/components/ck/placeholder";
import {
  Body,
  Eyebrow,
  Heading,
  Lede,
  SectionRule,
  textLinkClass,
} from "#/components/ck/primitives";
import { ProductCard } from "#/components/ck/product-card";
import { Reveal } from "#/components/ck/reveal";
import { useI18n } from "#/lib/i18n";
import { catalogQueryOptions } from "#/lib/queries";
import { site } from "#/lib/site";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(catalogQueryOptions());
  },
  head: () => ({
    links: [{ rel: "canonical", href: `${site.url}/` }],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <PublicShell>
      <Hero />
      <Bestsellers />
      <Craft />
      <Steps />
      <GalleryBand />
    </PublicShell>
  );
}

/**
 * Burgund-Hero, eins mit dem Header: links die Aussage in Cinzel-Kapitalen
 * und kursiver Cormorant, rechts das Foto 4:5 mit Roségold-Haarlinie.
 */
function Hero() {
  const { t } = useI18n();
  return (
    <section className="bg-inverse text-on-inverse">
      <div
        className={cn(
          shell,
          "grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-20",
        )}
      >
        <div className="ck-rise">
          <Eyebrow tone="inverse" dashed>
            {t.hero.kicker}
          </Eyebrow>
          <h1 className="mt-5 ck-display text-rosegold-300">
            {t.hero.titleLead}
            <br />
            {t.hero.titleAccent}
          </h1>
          <Lede tone="inverse" className="mt-6 max-w-[460px]">
            {t.hero.text}
          </Lede>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/torten" className={buttonVariants({ variant: "inverse-solid", size: "lg" })}>
              {t.hero.ctaPrimary}
            </Link>
            <a
              href={site.contact.whatsappLink}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "inverse", size: "lg" })}
            >
              {t.hero.ctaSecondary}
            </a>
          </div>
        </div>
        <div className="ck-rise ck-frame-inverse [animation-delay:120ms]">
          <div className="relative aspect-[4/5] overflow-hidden">
            <Placeholder imageKey="signature-torte" alt={t.hero.heroImageAlt} priority />
            <div aria-hidden className="absolute inset-0 ck-protect" />
            <Eyebrow tone="inverse" dashed className="absolute bottom-4 left-5">
              {site.tagline}
            </Eyebrow>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Drei Bestseller als Karten unter dem flankierten Sektionswort. */
function Bestsellers() {
  const { t, pickL } = useI18n();
  const { data } = useSuspenseQuery(catalogQueryOptions());
  const featured = data.products.filter((p) => p.featured).slice(0, 3);
  if (featured.length === 0) return null;

  const categoryName = (id: number) => {
    const category = data.categories.find((c) => c.id === id);
    return category ? pickL(category.nameDe, category.nameRu) : undefined;
  };

  return (
    <section className={cn(shell, "py-16 lg:py-20")}>
      <Reveal>
        <SectionRule>{t.home.bestsellers}</SectionRule>
      </Reveal>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((product, index) => (
          <Reveal key={product.id} delay={index * 90} className="h-full">
            <ProductCard product={product} eyebrow={categoryName(product.categoryId)} />
          </Reveal>
        ))}
      </div>
      <div className="mt-10 text-center">
        <Link to="/torten" className={buttonVariants({ variant: "secondary" })}>
          {t.home.viewAll}
        </Link>
      </div>
    </section>
  );
}

/** Handwerk: Foto 5:4 links, Überschrift in der Serif rechts. */
function Craft() {
  const { t } = useI18n();
  return (
    <section
      className={cn(shell, "grid items-center gap-12 pb-16 lg:grid-cols-2 lg:gap-16 lg:pb-20")}
    >
      <Reveal className="ck-frame">
        <div className="relative aspect-[5/4] overflow-hidden">
          <Placeholder imageKey="hochzeit-grande" alt={t.home.craftShotAlts[1] ?? ""} />
          <div aria-hidden className="absolute inset-0 ck-protect" />
        </div>
      </Reveal>
      <Reveal delay={120}>
        <Eyebrow dashed>{t.home.craftKicker}</Eyebrow>
        <Heading className="mt-4">{t.home.craftTitle}</Heading>
        <Body tone="muted" className="mt-4 max-w-[52ch]">
          {t.home.craftText}
        </Body>
        <div className="mt-8">
          <Link to="/fuellungen" className={buttonVariants({ variant: "secondary" })}>
            {t.home.craftCta}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

/** Burgund-Band mit den drei Schritten, jeder mit kurzer Roségold-Linie. */
function Steps() {
  const { t } = useI18n();
  return (
    <section className="bg-inverse text-on-inverse">
      <div className={cn(shell, "py-16 lg:py-20")}>
        <Reveal>
          <SectionRule inverse>{t.home.stepsTitle}</SectionRule>
        </Reveal>
        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-12">
          {t.home.steps.map((step, index) => (
            <Reveal key={step.title} delay={index * 110}>
              <div className="ck-title text-rosegold-300">{step.title}</div>
              <div aria-hidden className="my-4 h-px w-12 bg-rosegold-600" />
              <Body tone="inverse">{step.text}</Body>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Magnetband: die Streifen wachsen zum Cursor hin, ein Klick öffnet groß. */
function GalleryBand() {
  const { t } = useI18n();
  return (
    <section className="overflow-x-clip py-16 lg:py-20">
      <div className={shell}>
        <Reveal>
          <SectionRule>{t.home.galleryTitle}</SectionRule>
        </Reveal>
      </div>
      <MagneticCarousel shots={t.home.galleryShots.slice(0, 8)} />
      <div className="text-center">
        <Link to="/galerie" className={textLinkClass()}>
          {t.home.galleryCta}
        </Link>
      </div>
    </section>
  );
}
