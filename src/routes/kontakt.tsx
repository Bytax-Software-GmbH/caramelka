import { SiInstagram } from "@icons-pack/react-simple-icons";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon, TruckIcon } from "lucide-react";

import { buttonVariants } from "#/components/ck/button";
import { PublicShell, shell } from "#/components/ck/layout";
import { Placeholder } from "#/components/ck/placeholder";
import { PageHead, textLinkClass } from "#/components/ck/primitives";
import { useI18n } from "#/lib/i18n";
import { site } from "#/lib/site";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/kontakt")({
  head: () => ({
    meta: [
      { title: `Kontakt | ${site.name}` },
      {
        name: "description",
        content: `Caramelka Konditorei erreichen: Torte online anfragen, Telefon ${site.contact.phone}, Abholung in ${site.contact.address.city}, Lieferung bis ${site.shop.deliveryRadiusKm} km.`,
      },
    ],
    links: [{ rel: "canonical", href: `${site.url}/kontakt` }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t } = useI18n();
  const { contact } = site;

  const entries = [
    { icon: PhoneIcon, label: t.contact.phoneLabel, value: contact.phone, href: contact.phoneLink },
    {
      icon: MailIcon,
      label: t.contact.emailLabel,
      value: contact.email,
      href: `mailto:${contact.email}`,
    },
    { icon: TruckIcon, label: t.contact.pickupLabel, value: t.contact.pickupValue },
    { icon: ClockIcon, label: t.contact.hoursLabel, value: t.contact.hoursValue },
    {
      icon: MapPinIcon,
      label: t.contact.addressLabel,
      value: `${contact.address.street}, ${contact.address.zip} ${contact.address.city}`,
    },
  ];

  return (
    <PublicShell>
      <section className={cn(shell, "pt-14 pb-12 lg:pt-16")}>
        <PageHead eyebrow={t.contact.kicker} title={t.contact.title} lede={t.contact.intro} />
      </section>

      <section className={cn(shell, "grid gap-12 pb-20 lg:grid-cols-12 lg:gap-16 lg:pb-24")}>
        <div className="lg:col-span-6">
          <div className="flex flex-wrap gap-3">
            <Link to="/bestellen" className={buttonVariants({ size: "lg" })}>
              {t.contact.requestCta}
            </Link>
            <a
              href={contact.phoneLink}
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              <PhoneIcon aria-hidden strokeWidth={1.5} /> {t.contact.call}
            </a>
            <a
              href={`mailto:${contact.email}`}
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              <MailIcon aria-hidden strokeWidth={1.5} /> {t.contact.writeEmail}
            </a>
          </div>

          <dl className="mt-10 grid gap-8 border-t border-hairline pt-8 sm:grid-cols-2">
            {entries.map(({ icon: Icon, label, value, href }) => (
              <div key={label}>
                <dt className="flex items-center gap-2 ck-eyebrow text-rosegold-600">
                  <Icon className="size-3.5" strokeWidth={1.5} aria-hidden /> {label}
                </dt>
                <dd className="mt-2.5 text-ink ck-subheading">
                  {href ? (
                    <a href={href} className="border-b border-hairline-accent">
                      {value}
                    </a>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <a
            href={contact.instagram}
            target="_blank"
            rel="noreferrer"
            className={cn(textLinkClass(), "mt-10")}
          >
            <SiInstagram className="size-4" aria-hidden /> Instagram
          </a>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <div className="ck-frame">
            <div className="aspect-[4/5] overflow-hidden">
              <Placeholder imageKey="backstube" alt={t.contact.imageAlt} />
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
