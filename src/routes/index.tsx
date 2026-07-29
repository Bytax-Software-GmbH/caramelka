import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { PublicShell, shell } from "#/components/ck/layout";
import { MagneticCarousel } from "#/components/ck/magnetic-carousel";
import { FramedPhoto } from "#/components/ck/framed-photo";
import { LineReveal } from "#/components/ck/line-reveal";
import { Body, Kicker, pillVariants, SectionTitle, TextLink } from "#/components/ck/primitives";
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
    <PublicShell marquee>
      <Hero />
      <Bestsellers />
      <CraftSection />
      <Steps />
      <GalleryBand />
    </PublicShell>
  );
}

/**
 * Sektion 1: asymmetrischer Split. Textspalte trägt die Aussage, das
 * gerahmte Porträt steht bewusst tiefer und schmaler als die halbe Breite.
 */
function Hero() {
  const { t } = useI18n();
  return (
    <section
      className={cn(
        shell,
        "grid items-center gap-14 pt-14 pb-20 md:pt-20 md:pb-28 lg:grid-cols-12 lg:gap-16",
      )}
    >
      <div className="lg:col-span-7 lg:col-start-1">
        <div className="ck-rise">
          <Kicker className="mb-8">{t.hero.kicker}</Kicker>
        </div>
        <h1 className="mb-8 ck-display text-display-xl text-ink">
          <LineReveal delay={0.1}>{t.hero.titleLead}</LineReveal>
          <LineReveal delay={0.22} className="ck-display-italic text-ink-3">
            {t.hero.titleAccent}
          </LineReveal>
        </h1>
        <div className="ck-rise [animation-delay:420ms]">
          <Body size="l" className="mb-10 max-w-[46ch]">
            {t.hero.text}
          </Body>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/torten" className={pillVariants.primary}>
              {t.hero.ctaPrimary}
            </Link>
            <a
              href={site.contact.whatsappLink}
              target="_blank"
              rel="noreferrer"
              className={pillVariants.outline}
            >
              {t.hero.ctaSecondary}
            </a>
          </div>
        </div>
      </div>
      <div className="lg:col-span-5 lg:col-start-8 lg:justify-self-end">
        <div className="ck-frame">
          <FramedPhoto
            imageKey="signature-torte"
            alt={t.hero.heroImageAlt}
            curtain={false}
            priority
            className="aspect-[4/5]"
          />
        </div>
      </div>
    </section>
  );
}

/** Sektion 2: Produktraster, vier Spalten, keine Container. */
function Bestsellers() {
  const { t } = useI18n();
  const { data } = useSuspenseQuery(catalogQueryOptions());
  const featured = data.products.filter((p) => p.featured).slice(0, 4);
  if (featured.length === 0) return null;

  return (
    <section className={cn(shell, "pb-28 md:pb-36")}>
      <Reveal>
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6 border-b border-rule pb-6">
          <SectionTitle>{t.home.bestsellers}</SectionTitle>
          <Link to="/torten">
            <TextLink>{t.home.viewAll}</TextLink>
          </Link>
        </div>
      </Reveal>
      <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4 md:gap-x-8">
        {featured.map((product, index) => (
          <Reveal key={product.id} delay={index * 90}>
            <ProductCard product={product} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/**
 * Sektion 3: Manifest mit Triptychon. Zentrierter Text, darunter drei
 * gerahmte Aufnahmen auf verschobenen Höhen. Bleibt im hellen Theme.
 */
function CraftSection() {
  const { t } = useI18n();
  return (
    <section className="border-y border-rule bg-creme-2">
      <div className={cn(shell, "py-24 md:py-32")}>
        <Reveal className="mx-auto max-w-[52ch] text-center">
          <Kicker className="mb-5">{t.home.craftKicker}</Kicker>
          <SectionTitle className="mb-6">{t.home.craftTitle}</SectionTitle>
          <Body size="l" className="mx-auto">
            {t.home.craftText}
          </Body>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 items-start gap-6 sm:grid-cols-3 md:mt-20 md:gap-8">
          <div className="ck-frame sm:mt-16">
            <FramedPhoto
              imageKey="praliné"
              alt={t.home.craftShotAlts[0]}
              className="aspect-[3/4]"
            />
          </div>
          <div className="ck-frame">
            <FramedPhoto
              imageKey="hochzeit-grande"
              alt={t.home.craftShotAlts[1]}
              delay={0.12}
              className="aspect-[3/4.4]"
            />
          </div>
          <div className="ck-frame sm:mt-24">
            <FramedPhoto
              imageKey="éclair"
              alt={t.home.craftShotAlts[2]}
              delay={0.24}
              className="aspect-[3/4]"
            />
          </div>
        </div>

        <Reveal delay={220} className="mt-16 text-center md:mt-20">
          <Link to="/fuellungen" className={pillVariants.outline}>
            {t.home.craftCta}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/**
 * Sektion 4: redaktionelles Register. Jeder Schritt ist eine Zeile über die
 * volle Breite, oben von einer Haarlinie abgesetzt, Verb und Erklärung auf
 * gemeinsamer Schriftlinie in ungleichen Spalten.
 *
 * Keine Nummerierung: die Lesereihenfolge trägt die Abfolge. Keine Karten,
 * keine gleichen Drittel, keine senkrechten Trenner, die sich mit dem
 * Reveal-Hintergrund schlagen.
 */
function Steps() {
  const { t } = useI18n();
  return (
    <section className={cn(shell, "py-24 md:py-28")}>
      <Reveal>
        <SectionTitle className="mb-12 max-w-[14ch] md:mb-16">{t.home.stepsTitle}</SectionTitle>
      </Reveal>
      {t.home.steps.map((step, index) => (
        <Reveal key={step.title} delay={index * 110}>
          <div className="grid items-baseline gap-y-3 border-t border-rule py-8 md:grid-cols-12 md:gap-x-8 md:py-10">
            <h3 className="ck-display text-display-m text-ink md:col-span-4">{step.title}</h3>
            <Body size="l" className="max-w-[46ch] md:col-span-6 md:col-start-6">
              {step.text}
            </Body>
          </div>
        </Reveal>
      ))}
    </section>
  );
}

/**
 * Sektion 5: Magnetband. Die Streifen wachsen zum Cursor hin, ein Klick
 * öffnet die Aufnahme groß. Ersetzt das frühere Quadratraster, das keinen
 * Klickpfad hatte.
 */
function GalleryBand() {
  const { t } = useI18n();
  return (
    <section className="overflow-x-clip border-t border-rule bg-creme-2 pt-20 pb-28 md:pt-24 md:pb-32">
      <div className={cn(shell, "mb-10 flex flex-wrap items-end justify-between gap-6")}>
        <SectionTitle>{t.home.galleryTitle}</SectionTitle>
        <Link to="/galerie">
          <TextLink>{t.home.galleryCta}</TextLink>
        </Link>
      </div>
      <MagneticCarousel shots={t.home.galleryShots.slice(0, 8)} />
    </section>
  );
}
