import { SiInstagram, SiWhatsapp } from "@icons-pack/react-simple-icons";
import { createFileRoute } from "@tanstack/react-router";
import { ClockIcon, MapPinIcon, TruckIcon } from "lucide-react";

import { PublicShell } from "#/components/ck/layout";
import { Placeholder } from "#/components/ck/placeholder";
import { Kicker, pillVariants, SectionTitle } from "#/components/ck/primitives";
import { useI18n } from "#/lib/i18n";
import { site } from "#/lib/site";

export const Route = createFileRoute("/kontakt")({
  head: () => ({
    meta: [
      { title: `Kontakt | ${site.name}` },
      {
        name: "description",
        content: `Caramelka Konditorei erreichen: WhatsApp ${site.contact.whatsapp}, Abholung in ${site.contact.address.city}, Lieferung bis ${site.shop.deliveryRadiusKm} km.`,
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t } = useI18n();
  const { contact } = site;

  return (
    <PublicShell>
      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <div className="grid gap-12 md:grid-cols-[1fr_0.9fr] md:gap-16">
          <div>
            <Kicker className="mb-4">{t.contact.kicker}</Kicker>
            <SectionTitle as="h1" className="mb-4 text-5xl md:text-[56px]">
              {t.contact.title}
            </SectionTitle>
            <p className="mb-9 max-w-[52ch] text-[15.5px] leading-[1.65] text-espresso/70">
              {t.contact.intro}
            </p>

            <a
              href={contact.whatsappLink}
              target="_blank"
              rel="noreferrer"
              className={pillVariants.primary}
            >
              <SiWhatsapp className="size-4" aria-hidden /> {t.contact.whatsapp}
            </a>

            <dl className="mt-12 grid gap-8 sm:grid-cols-2">
              <div>
                <dt className="mb-2 flex items-center gap-2 ck-kicker">
                  <SiWhatsapp className="size-3.5" aria-hidden /> {t.contact.orderLabel}
                </dt>
                <dd className="ck-display text-[22px]">{contact.whatsapp}</dd>
              </div>
              <div>
                <dt className="mb-2 flex items-center gap-2 ck-kicker">
                  <TruckIcon className="size-3.5" aria-hidden /> {t.contact.pickupLabel}
                </dt>
                <dd className="ck-display text-[22px]">{t.contact.pickupValue}</dd>
              </div>
              <div>
                <dt className="mb-2 flex items-center gap-2 ck-kicker">
                  <ClockIcon className="size-3.5" aria-hidden /> {t.contact.hoursLabel}
                </dt>
                <dd className="ck-display text-[22px]">{contact.hours}</dd>
              </div>
              <div>
                <dt className="mb-2 flex items-center gap-2 ck-kicker">
                  <MapPinIcon className="size-3.5" aria-hidden /> {t.contact.addressLabel}
                </dt>
                <dd className="ck-display text-[22px]">
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
              className="mt-10 inline-flex items-center gap-2.5 text-[13px] font-semibold tracking-[0.14em] text-caramel-deep uppercase hover:text-espresso"
            >
              <SiInstagram className="size-4" aria-hidden /> Instagram
            </a>
          </div>

          <div className="flex flex-col gap-3.5">
            <div className="ck-frame">
              <Placeholder imageKey="backstube" className="aspect-[3/3.4] rounded-[4px]" />
            </div>
            <div className="text-[12px] tracking-[0.06em] text-espresso/70">
              {t.contact.addressLabel} · {contact.address.city}
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
