import { Link } from "@tanstack/react-router";
import { MenuIcon, ShoppingBagIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { Logo } from "#/components/ck/logo";
import { useCart } from "#/lib/cart";
import { useI18n } from "#/lib/i18n";
import { site } from "#/lib/site";
import { cn } from "#/lib/utils";

/** Einheitliche Seitenbreite. Eine Regel, überall dieselbe. */
export const shell = "mx-auto w-full max-w-7xl px-6 md:px-10";

function LocaleSwitch({ onDark = false }: { onDark?: boolean }) {
  const { locale, setLocale } = useI18n();
  const active = onDark ? "text-cream-on-dark" : "text-ink";
  const inactive = onDark
    ? "text-ink-2-on-dark hover:text-cream-on-dark"
    : "text-ink-3 hover:text-ink";
  return (
    <div
      className="flex items-center gap-2 text-[0.75rem] font-semibold tracking-[0.12em]"
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
      <span aria-hidden className={onDark ? "text-ink-2-on-dark/50" : "text-rule-strong"}>
        /
      </span>
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
      className="relative grid size-10 place-items-center rounded-full border border-rule-strong text-ink transition-colors duration-300 hover:border-espresso hover:bg-espresso hover:text-creme"
    >
      <ShoppingBagIcon className="size-[18px]" aria-hidden />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 grid min-w-[18px] place-items-center rounded-full bg-espresso px-1 text-[0.65rem] leading-[18px] font-bold text-creme">
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
    <header className="sticky top-0 z-40 border-b border-rule bg-creme/85 backdrop-blur-md">
      <div className={cn(shell, "flex h-[72px] items-center justify-between gap-6")}>
        <Link to="/" aria-label="Caramelka, Startseite" onClick={() => setOpen(false)}>
          <Logo size="sm" />
        </Link>

        <nav className="hidden items-center gap-9 lg:flex" aria-label="Hauptnavigation">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="ck-underline ck-nav-link text-ink-2 transition-colors duration-300 hover:text-ink [&.active]:text-ink"
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
            className="hidden rounded-full border border-rule-strong px-6 py-2.5 text-[0.72rem] font-semibold tracking-[0.14em] text-ink uppercase transition-[background-color,color,transform] duration-500 ease-[var(--ease-lux)] hover:bg-espresso hover:text-creme active:scale-[0.97] md:inline-flex"
          >
            {t.nav.whatsapp}
          </a>
          <CartButton />
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full border border-rule-strong text-ink lg:hidden"
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
          className={cn(shell, "border-t border-rule bg-creme py-5 lg:hidden")}
          aria-label="Mobile Navigation"
        >
          <div className="flex flex-col gap-5">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="ck-nav-link text-[0.95rem] text-ink"
              >
                {t.nav[item.key]}
              </Link>
            ))}
            <div className="flex items-center justify-between border-t border-rule pt-4">
              <LocaleSwitch />
              <a
                href={site.contact.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="ck-nav-link text-ink-2"
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

/** Laufband-Streifen. Genau eines pro Seite. */
export function Marquee() {
  const { t } = useI18n();
  const items = [...t.marquee, ...t.marquee, ...t.marquee];
  return (
    <div className="ck-marquee-host overflow-hidden border-b border-rule bg-creme-2">
      <div className="flex w-max ck-marquee py-3">
        {[0, 1].map((half) => (
          <div
            key={half}
            aria-hidden={half === 1}
            className="flex gap-16 pr-16 text-[0.6875rem] font-medium tracking-[0.24em] whitespace-nowrap text-ink-3 uppercase"
          >
            {items.map((item, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <span key={index}>{item}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Abschluss-Block in Graphit. Einziger dunkler Bereich der Seite und
 * bewusst terminal: er beendet das Dokument, er unterbricht es nicht.
 */
export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-auto bg-dark text-cream-on-dark">
      <div className={cn(shell, "grid gap-12 py-20 md:grid-cols-3 md:py-24")}>
        <div>
          <div className="mb-4 ck-kicker text-ink-2-on-dark">{t.footer.order}</div>
          <a
            href={site.contact.whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="ck-display text-display-m transition-colors hover:text-gold"
          >
            WhatsApp {site.contact.whatsapp}
          </a>
        </div>
        <div>
          <div className="mb-4 ck-kicker text-ink-2-on-dark">{t.footer.pickupDelivery}</div>
          <div className="ck-display text-display-m">{t.footer.pickupDeliveryValue}</div>
        </div>
        <div>
          <div className="mb-4 ck-kicker text-ink-2-on-dark">{t.footer.hours}</div>
          <div className="ck-display text-display-m">{site.contact.hours}</div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div
          className={cn(
            shell,
            "flex flex-col items-center justify-between gap-5 py-7 md:flex-row",
          )}
        >
          <Logo size="sm" onDark />
          <p className="text-body-s text-ink-2-on-dark">{t.footer.claim}</p>
          <nav
            className="flex gap-7 text-[0.7rem] tracking-[0.16em] text-ink-2-on-dark uppercase"
            aria-label={t.footer.legal}
          >
            <Link to="/impressum" className="transition-colors hover:text-cream-on-dark">
              {t.footer.impressum}
            </Link>
            <Link to="/datenschutz" className="transition-colors hover:text-cream-on-dark">
              {t.footer.datenschutz}
            </Link>
            <Link to="/agb" className="transition-colors hover:text-cream-on-dark">
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
    <div className="flex min-h-[100dvh] flex-col">
      <div aria-hidden className="ck-grain" />
      <Header />
      {marquee && <Marquee />}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
