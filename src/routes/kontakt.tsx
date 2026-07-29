import { SiInstagram, SiWhatsapp } from "@icons-pack/react-simple-icons";
import { createFileRoute } from "@tanstack/react-router";
import { ClockIcon, MapPinIcon, TruckIcon } from "lucide-react";

import { PublicShell, shell } from "#/components/ck/layout";
import { FramedPhoto } from "#/components/ck/framed-photo";
import { Body, Kicker, pillVariants, SectionTitle } from "#/components/ck/primitives";
import { useI18n } from "#/lib/i18n";
import { site } from "#/lib/site";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/kontakt")({
  head: () => ({
    meta: [
      { title: `Kontakt | ${site.name}` },
      {
        name: "description",
        content: `Caramelka Konditorei erreichen: WhatsApp ${site.contact.whatsapp}, Abholung in ${site.contact.address.city}, Lieferung bis ${site.shop.deliveryRadiusKm} km.`,
      },
    ],
    links: [{ rel: "canonical", href: `${site.url}/kontakt` }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t } = useI18n();
  const { contact } = site;

  return (
    <PublicShell>
      <section className={cn(shell, "grid gap-14 py-16 md:py-24 lg:grid-cols-12 lg:gap-20")}>
        <div className="lg:col-span-6">
          <Kicker className="mb-5">{t.contact.kicker}</Kicker>
          <SectionTitle as="h1" size="xl" className="mb-6 max-w-[12ch]">
            {t.contact.title}
          </SectionTitle>
          <Body size="l" className="mb-10 max-w-[48ch]">
            {t.contact.intro}
          </Body>

          <a
            href={contact.whatsappLink}
            target="_blank"
            rel="noreferrer"
            className={pillVariants.primary}
          >
            <SiWhatsapp className="size-4" aria-hidden /> {t.contact.whatsapp}
          </a>

          <dl className="mt-14 grid gap-10 border-t border-rule pt-10 sm:grid-cols-2">
            <div>
              <dt className="mb-2.5 flex items-center gap-2 ck-kicker">
                <SiWhatsapp className="size-3.5" aria-hidden /> {t.contact.orderLabel}
              </dt>
              <dd className="ck-display text-display-s text-ink">{contact.whatsapp}</dd>
            </div>
            <div>
              <dt className="mb-2.5 flex items-center gap-2 ck-kicker">
                <TruckIcon className="size-3.5" aria-hidden /> {t.contact.pickupLabel}
              </dt>
              <dd className="ck-display text-display-s text-ink">{t.contact.pickupValue}</dd>
            </div>
            <div>
              <dt className="mb-2.5 flex items-center gap-2 ck-kicker">
                <ClockIcon className="size-3.5" aria-hidden /> {t.contact.hoursLabel}
              </dt>
              <dd className="ck-display text-display-s text-ink">{contact.hours}</dd>
            </div>
            <div>
              <dt className="mb-2.5 flex items-center gap-2 ck-kicker">
                <MapPinIcon className="size-3.5" aria-hidden /> {t.contact.addressLabel}
              </dt>
              <dd className="ck-display text-display-s text-ink">
                {contact.address.street}
                <br />
                {contact.address.zip} {contact.address.city}
              </dd>
            </div>
          </dl>

          <a
            href={contact.instagram}
            target="_blank"
            rel="noreferrer"
            className="ck-nav-link mt-12 inline-flex items-center gap-2.5 border-b border-rule-strong pb-1 text-ink-2 transition-colors hover:border-espresso hover:text-ink"
          >
            <SiInstagram className="size-4" aria-hidden /> Instagram
          </a>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <div className="ck-frame">
            <FramedPhoto imageKey="backstube" alt={t.contact.imageAlt} className="aspect-[4/5]" />
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
