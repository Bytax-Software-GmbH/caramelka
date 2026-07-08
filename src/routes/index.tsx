import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { PublicShell } from "#/components/ck/layout";
import { Placeholder } from "#/components/ck/placeholder";
import { Kicker, Ornament, pillVariants, SectionTitle } from "#/components/ck/primitives";
import { ProductCard } from "#/components/ck/product-card";
import { Reveal } from "#/components/ck/reveal";
import { useI18n } from "#/lib/i18n";
import { catalogQueryOptions } from "#/lib/queries";
import { site } from "#/lib/site";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(catalogQueryOptions());
  },
  component: HomePage,
});

function HomePage() {
  return (
    <PublicShell marquee>
      <Hero />
      <Bestsellers />
      <CraftSection />
      <Steps />
      <GalleryTeaser />
    </PublicShell>
  );
}

function Hero() {
  const { t } = useI18n();
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:gap-16 md:px-8 md:py-24">
      <div className="ck-rise">
        <Kicker className="mb-7">{t.hero.kicker}</Kicker>
        <h1 className="mb-8 ck-display text-5xl leading-[1.04] md:text-[72px]">
          {t.hero.titleLead}
          <br />
          <em className="text-caramel-deep italic">{t.hero.titleAccent}</em>
        </h1>
        <p className="mb-10 max-w-[52ch] text-[16px] leading-[1.7] text-pretty text-espresso/70 md:text-[16.5px]">
          {t.hero.text}
        </p>
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
      <div className="flex ck-rise flex-col gap-3.5 [animation-delay:150ms]">
        <div className="ck-frame">
          <Placeholder imageKey="signature-torte" className="aspect-[3/3.5] rounded-[4px]" />
        </div>
        <div className="flex items-center gap-3 text-[12px] tracking-[0.06em] text-espresso/70">
          <span aria-hidden className="h-px w-8 bg-caramel/40" />
          {t.hero.photoCaption}
        </div>
      </div>
    </section>
  );
}

function Bestsellers() {
  const { t } = useI18n();
  const { data } = useSuspenseQuery(catalogQueryOptions());
  const featured = data.products.filter((p) => p.featured).slice(0, 4);
  if (featured.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-5 pb-24 md:px-8">
      <Reveal>
        <div className="mb-10 flex items-baseline justify-between">
          <SectionTitle>{t.home.bestsellers}</SectionTitle>
          <Link
            to="/torten"
            className="border-b border-caramel-deep pb-0.5 text-[12.5px] font-semibold tracking-[0.16em] text-caramel-deep uppercase transition-[color,border-color,letter-spacing] duration-500 ease-[var(--ease-lux)] hover:border-espresso hover:tracking-[0.2em] hover:text-espresso"
          >
            {t.home.viewAll}
          </Link>
        </div>
      </Reveal>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-7">
        {featured.map((p, i) => (
          <Reveal key={p.id} delay={i * 100}>
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** Dunkle Boutique-Sektion aus Direction 1c: Espresso, Gold, Spotlight. */
function CraftSection() {
  const { t } = useI18n();
  return (
    <section className="bg-dark text-cream-on-dark">
      <div
        className="mx-auto max-w-6xl px-5 py-24 text-center md:px-8 md:py-32"
        style={{
          background:
            "radial-gradient(ellipse 620px 420px at 50% 58%, rgba(211,161,94,.14), transparent 70%)",
        }}
      >
        <Reveal>
          <Kicker onDark className="mb-5 tracking-[0.34em]">
            {t.home.craftKicker}
          </Kicker>
          <SectionTitle onDark className="mx-auto mb-6 max-w-[18ch] text-[42px] md:text-[56px]">
            {t.home.craftTitle}
          </SectionTitle>
          <Ornament onDark className="mb-7" />
          <p className="mx-auto mb-12 max-w-[56ch] text-[16px] leading-[1.75] font-light text-pretty text-cream-on-dark/70">
            {t.home.craftText}
          </p>
        </Reveal>
        <Reveal delay={150}>
          <div className="mb-12 flex items-end justify-center gap-6 md:gap-10">
            <Placeholder
              imageKey="praliné"
              onDark
              className="hidden w-[180px] border border-gold/35 md:block md:aspect-[1/1.25]"
            />
            <div className="ck-frame-dark">
              <Placeholder
                imageKey="signature-torte"
                onDark
                className="aspect-[1/1.3] w-[230px] md:w-[260px]"
              />
            </div>
            <Placeholder
              imageKey="éclair"
              onDark
              className="hidden w-[180px] border border-gold/35 md:block md:aspect-[1/1.25]"
            />
          </div>
          <Link to="/fuellungen" className={pillVariants.gold}>
            {t.home.craftCta}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

function Steps() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-6xl px-5 py-24 md:px-8">
      <Reveal>
        <Kicker className="mb-3 text-center">{t.home.stepsKicker}</Kicker>
        <Ornament className="mb-14" />
      </Reveal>
      <div className="grid gap-12 md:grid-cols-3 md:gap-8">
        {t.home.steps.map((step, i) => (
          <Reveal key={step.title} delay={i * 120} className="text-center">
            <div
              aria-hidden
              className="mb-4 ck-display text-[44px] leading-none text-caramel/45 italic"
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <h3 className="mb-3 ck-display text-[27px]">{step.title}</h3>
            <p className="mx-auto max-w-[36ch] text-[14.5px] leading-[1.7] text-pretty text-espresso/65">
              {step.text}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function GalleryTeaser() {
  const { t } = useI18n();
  const keys = ["hochzeit", "bento", "geburtstag", "karamell", "blumen", "kinder"];
  return (
    <section className="border-t border-espresso/10 bg-creme-2/60">
      <div className="mx-auto max-w-6xl px-5 py-24 md:px-8">
        <Reveal>
          <div className="mb-10 flex items-baseline justify-between">
            <div>
              <Kicker className="mb-3">{t.home.galleryKicker}</Kicker>
              <SectionTitle>{t.home.galleryTitle}</SectionTitle>
            </div>
            <Link
              to="/galerie"
              className="border-b border-caramel-deep pb-0.5 text-[12.5px] font-semibold tracking-[0.16em] text-caramel-deep uppercase transition-[color,border-color,letter-spacing] duration-500 ease-[var(--ease-lux)] hover:border-espresso hover:tracking-[0.2em] hover:text-espresso"
            >
              {t.home.galleryCta}
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4">
          {keys.map((key, i) => (
            <Reveal key={key} delay={i * 70}>
              <Placeholder imageKey={key} className="aspect-square rounded-[4px]" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
