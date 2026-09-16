import { SiInstagram, SiWhatsapp } from "@icons-pack/react-simple-icons";
import { Link } from "@tanstack/react-router";
import { MenuIcon, ShoppingBagIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { BagDrawer } from "#/components/ck/bag-drawer";
import { IconButton, iconButtonVariants } from "#/components/ck/icon-button";
import { Logo, LogoLockup } from "#/components/ck/logo";
import { useBagDrawer } from "#/lib/bag-drawer";
import { useCart } from "#/lib/cart";
import { useI18n } from "#/lib/i18n";
import { site } from "#/lib/site";
import { cn } from "#/lib/utils";

/** Einheitliche Seitenbreite: Container 1200 mit 24-px-Gutter. */
export const shell = "mx-auto w-full max-w-page px-6";

const navItems = [
  { to: "/torten", key: "torten" },
  { to: "/fuellungen", key: "fuellungen" },
  { to: "/galerie", key: "galerie" },
  { to: "/kontakt", key: "kontakt" },
] as const;

const navLink =
  "ck-label border-b border-transparent pb-0.5 text-rosegold-300 transition-colors duration-(--dur-fast) ease-out hover:text-cream-100 [&.active]:border-rosegold-500 [&.active]:text-rosegold-500";

function LocaleSwitch({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  return (
    <div className={cn("flex items-center gap-2 ck-label", className)} aria-label="Sprache / Язык">
      {(["de", "ru"] as const).map((l, index) => (
        <span key={l} className="flex items-center gap-2">
          {index > 0 && (
            <span aria-hidden className="text-rosegold-500/50">
              /
            </span>
          )}
          <button
            type="button"
            onClick={() => setLocale(l)}
            aria-pressed={locale === l}
            className={cn(
              "transition-colors duration-(--dur-fast) ease-out",
              locale === l ? "text-rosegold-500" : "text-rosegold-300 hover:text-cream-100",
            )}
          >
            {l.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}

/**
 * Klebender Header auf Burgund, drei Spalten: Navigation / Wortmarke /
 * Aktionen. Auf jeder Seite gleich; auf der Startseite geht er nahtlos in
 * den Hero über.
 */
export function Header() {
  const { t } = useI18n();
  const { count } = useCart();
  const { openBag } = useBagDrawer();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline-inverse bg-inverse">
      <div className={cn(shell, "grid h-[72px] grid-cols-[1fr_auto_1fr] items-center gap-4")}>
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Hauptnavigation">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className={navLink}>
              {t.nav[item.key]}
            </Link>
          ))}
        </nav>
        <div className="lg:hidden">
          <IconButton
            variant="inverse"
            label={open ? t.nav.close : t.nav.menu}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <XIcon strokeWidth={1.5} /> : <MenuIcon strokeWidth={1.5} />}
          </IconButton>
        </div>

        <Link
          to="/"
          aria-label="Caramelka Lily, Startseite"
          className="justify-self-center"
          onClick={() => setOpen(false)}
        >
          <Logo size="sm" onDark />
        </Link>

        <div className="flex items-center justify-end gap-1">
          <LocaleSwitch className="mr-3 hidden sm:flex" />
          <a
            href={site.contact.whatsappLink}
            target="_blank"
            rel="noreferrer"
            aria-label={t.nav.whatsapp}
            title={t.nav.whatsapp}
            className={iconButtonVariants({ variant: "inverse" })}
          >
            <SiWhatsapp className="size-[18px]" />
          </a>
          <IconButton variant="inverse" label={t.nav.warenkorb} badge={count} onClick={openBag}>
            <ShoppingBagIcon strokeWidth={1.5} />
          </IconButton>
        </div>
      </div>

      {open && (
        <nav
          className={cn(shell, "border-t border-hairline-inverse py-4 lg:hidden")}
          aria-label="Mobile Navigation"
        >
          <div className="flex flex-col">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(navLink, "border-b-0 py-3 text-sm")}
              >
                {t.nav[item.key]}
              </Link>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-hairline-inverse pt-4">
              <LocaleSwitch />
              <a
                href={site.contact.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className={cn(navLink, "border-b-0")}
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

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="ck-eyebrow text-rosegold-400">{title}</div>
      <div className="mt-4 flex flex-col gap-2.5 text-cream-300 ck-body-sm">{children}</div>
    </div>
  );
}

const footerLink =
  "transition-colors duration-(--dur-fast) ease-out hover:text-cream-100 hover:underline underline-offset-[3px]";

/** Tiefes Burgund als Abschluss der Seite. */
export function Footer() {
  const { t } = useI18n();
  const { contact } = site;
  return (
    <footer className="mt-auto bg-inverse-deep text-on-inverse">
      <div
        className={cn(
          shell,
          "grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:pb-10",
        )}
      >
        <div>
          <LogoLockup className="w-[180px]" />
          <p className="mt-5 max-w-[300px] text-cream-300 ck-body-sm">{t.footer.claim}</p>
          <div className="mt-4 flex gap-1">
            <a
              href={contact.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label={t.footer.instagram}
              title={t.footer.instagram}
              className={iconButtonVariants({ variant: "inverse", size: "sm" })}
            >
              <SiInstagram className="size-4" />
            </a>
            <a
              href={contact.whatsappLink}
              target="_blank"
              rel="noreferrer"
              aria-label={t.nav.whatsapp}
              title={t.nav.whatsapp}
              className={iconButtonVariants({ variant: "inverse", size: "sm" })}
            >
              <SiWhatsapp className="size-4" />
            </a>
          </div>
        </div>

        <FooterColumn title={t.footer.order}>
          <a href={contact.whatsappLink} target="_blank" rel="noreferrer" className={footerLink}>
            WhatsApp {contact.whatsapp}
          </a>
          <span>{contact.hours}</span>
        </FooterColumn>

        <FooterColumn title={t.footer.assortment}>
          {navItems.slice(0, 3).map((item) => (
            <Link key={item.to} to={item.to} className={footerLink}>
              {t.nav[item.key]}
            </Link>
          ))}
        </FooterColumn>

        <FooterColumn title={t.footer.contact}>
          <span>
            {contact.address.street}
            <br />
            {contact.address.zip} {contact.address.city}
          </span>
          <span>{t.footer.pickupDeliveryValue}</span>
          <Link to="/kontakt" className={footerLink}>
            {t.nav.kontakt}
          </Link>
        </FooterColumn>
      </div>

      <div className="border-t border-hairline-inverse">
        <div
          className={cn(
            shell,
            "flex flex-col items-center justify-between gap-4 py-5 ck-eyebrow tracking-label text-on-inverse-muted md:flex-row",
          )}
        >
          <span>
            © {new Date().getFullYear()} {site.name} · {contact.address.city}
          </span>
          <span className="hidden md:inline">— {site.tagline} —</span>
          <nav className="flex gap-4" aria-label={t.footer.legal}>
            <Link to="/impressum" className={footerLink}>
              {t.footer.impressum}
            </Link>
            <Link to="/datenschutz" className={footerLink}>
              {t.footer.datenschutz}
            </Link>
            <Link to="/agb" className={footerLink}>
              {t.footer.agb}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

/** Öffentliches Seiten-Shell: Header, Inhalt, Footer, Warenkorb-Drawer. */
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <BagDrawer />
    </div>
  );
}
