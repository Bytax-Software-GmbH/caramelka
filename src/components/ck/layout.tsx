import { Link } from "@tanstack/react-router";
import { MenuIcon, ShoppingBagIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { Logo } from "#/components/ck/logo";
import { Ornament } from "#/components/ck/primitives";
import { useCart } from "#/lib/cart";
import { useI18n } from "#/lib/i18n";
import { site } from "#/lib/site";
import { cn } from "#/lib/utils";

function LocaleSwitch({ onDark = false }: { onDark?: boolean }) {
  const { locale, setLocale } = useI18n();
  const active = onDark ? "text-gold" : "text-espresso";
  const inactive = onDark
    ? "text-cream-on-dark/50 hover:text-cream-on-dark"
    : "text-espresso/45 hover:text-espresso";
  return (
    <div
      className="flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.1em]"
      aria-label="Sprache / Язык"
    >
      <button
        type="button"
        onClick={() => setLocale("de")}
        className={cn("transition-colors", locale === "de" ? active : inactive)}
        aria-pressed={locale === "de"}
      >
        DE
      </button>
      <span className={onDark ? "text-cream-on-dark/30" : "text-espresso/25"}>/</span>
      <button
        type="button"
        onClick={() => setLocale("ru")}
        className={cn("transition-colors", locale === "ru" ? active : inactive)}
        aria-pressed={locale === "ru"}
      >
        RU
      </button>
    </div>
  );
}

function CartButton() {
  const { count } = useCart();
  const { t } = useI18n();
  return (
    <Link
      to="/warenkorb"
      aria-label={t.nav.warenkorb}
      className="relative grid size-10 place-items-center rounded-full border border-espresso/25 text-espresso transition-colors hover:border-espresso hover:bg-espresso/5"
    >
      <ShoppingBagIcon className="size-[18px]" aria-hidden />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 grid min-w-[18px] place-items-center rounded-full bg-caramel px-1 text-[10.5px] leading-[18px] font-bold text-creme">
          {count}
        </span>
      )}
    </Link>
  );
}

const navItems = [
  { to: "/torten", key: "torten" },
  { to: "/fuellungen", key: "fuellungen" },
  { to: "/galerie", key: "galerie" },
  { to: "/kontakt", key: "kontakt" },
] as const;

export function Header() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-espresso/12 bg-creme/90 backdrop-blur-md">
      <div
        aria-hidden
        className="h-[2px] bg-gradient-to-r from-transparent via-gold/70 to-transparent"
      />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 md:px-8">
        <Link to="/" aria-label="Caramelka — Startseite" onClick={() => setOpen(false)}>
          <Logo size="sm" />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Hauptnavigation">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="ck-underline ck-nav-link text-espresso/80 transition-colors duration-300 hover:text-caramel-deep [&.active]:text-caramel-deep"
            >
              {t.nav[item.key]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <LocaleSwitch />
          </div>
          <a
            href={site.contact.whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full border border-espresso px-5 py-2.5 text-[11.5px] font-semibold tracking-[0.12em] text-espresso uppercase transition-[background-color,color,transform] duration-500 ease-[var(--ease-lux)] hover:bg-espresso hover:text-creme active:scale-[0.96] md:inline-flex"
          >
            {t.nav.whatsapp}
          </a>
          <CartButton />
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full border border-espresso/25 text-espresso lg:hidden"
            aria-expanded={open}
            aria-label="Menü"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <XIcon className="size-[18px]" /> : <MenuIcon className="size-[18px]" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="border-t border-espresso/12 bg-creme px-5 py-4 lg:hidden"
          aria-label="Mobile Navigation"
        >
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="ck-nav-link text-[15px] text-espresso"
              >
                {t.nav[item.key]}
              </Link>
            ))}
            <div className="flex items-center justify-between pt-2">
              <LocaleSwitch />
              <a
                href={site.contact.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="ck-nav-link text-caramel-deep"
              >
                {t.nav.whatsapp}
              </a>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

/** Laufband-Streifen aus Direction 1a. */
export function Marquee() {
  const { t } = useI18n();
  const items = [...t.marquee, ...t.marquee];
  return (
    <div className="overflow-hidden border-b border-espresso/12 bg-creme-2">
      <div className="flex w-max ck-marquee py-2.5">
        {[0, 1].map((half) => (
          <div
            key={half}
            aria-hidden={half === 1}
            className="flex gap-9 pr-9 text-[11px] font-medium tracking-[0.22em] whitespace-nowrap text-caramel-deep uppercase"
          >
            {items.map((item, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <span key={i} className="flex items-center gap-9">
                {item}{" "}
                <span aria-hidden className="text-[8px] text-gold">
                  ✦
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Dunkler Espresso-Footer mit Gold-Akzenten (Mix aus 1a-Inhalt + 1c-Farbwelt). */
export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="bg-dark text-cream-on-dark">
      <Ornament onDark className="pt-12" />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3 md:px-8">
        <div>
          <div className="mb-3 ck-kicker text-gold">{t.footer.order}</div>
          <a
            href={site.contact.whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="ck-display text-[22px] hover:text-gold"
          >
            WhatsApp {site.contact.whatsapp}
          </a>
        </div>
        <div>
          <div className="mb-3 ck-kicker text-gold">{t.footer.pickupDelivery}</div>
          <div className="ck-display text-[22px]">{t.footer.pickupDeliveryValue}</div>
        </div>
        <div>
          <div className="mb-3 ck-kicker text-gold">{t.footer.hours}</div>
          <div className="ck-display text-[22px]">{site.contact.hours}</div>
        </div>
      </div>
      <div className="border-t border-gold/25">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-6 md:flex-row md:px-8">
          <Logo size="sm" onDark />
          <p className="text-[13px] text-cream-on-dark/60">{t.footer.claim}</p>
          <nav
            className="flex gap-6 text-[11.5px] tracking-[0.14em] text-cream-on-dark/60 uppercase"
            aria-label={t.footer.legal}
          >
            <Link to="/impressum" className="hover:text-gold">
              {t.footer.impressum}
            </Link>
            <Link to="/datenschutz" className="hover:text-gold">
              {t.footer.datenschutz}
            </Link>
            <Link to="/agb" className="hover:text-gold">
              {t.footer.agb}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

/** Öffentliches Seiten-Shell: Header + Inhalt + Footer. */
export function PublicShell({
  children,
  marquee = false,
}: {
  children: React.ReactNode;
  marquee?: boolean;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <div aria-hidden className="ck-grain" />
      <Header />
      {marquee && <Marquee />}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
