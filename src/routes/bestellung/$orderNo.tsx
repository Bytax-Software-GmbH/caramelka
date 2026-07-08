import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CheckIcon } from "lucide-react";

import { PublicShell } from "#/components/ck/layout";
import { Kicker, pillVariants, SectionTitle } from "#/components/ck/primitives";
import { formatDate, formatPrice } from "#/lib/format";
import { useI18n } from "#/lib/i18n";
import { $getOrderConfirmation } from "#/lib/server/orders";
import { site } from "#/lib/site";

export const Route = createFileRoute("/bestellung/$orderNo")({
  loader: async ({ params }) => {
    const order = await $getOrderConfirmation({ data: params.orderNo });
    if (!order) throw notFound();
    return order;
  },
  head: () => ({
    meta: [
      { title: `Bestellbestätigung | ${site.name}` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { t, locale } = useI18n();
  const order = Route.useLoaderData();

  return (
    <PublicShell>
      <section className="mx-auto max-w-2xl px-5 py-16 md:px-8 md:py-20">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 grid size-14 place-items-center rounded-full bg-caramel text-creme">
            <CheckIcon className="size-6" aria-hidden />
          </div>
          <Kicker className="mb-3">{t.confirmation.kicker}</Kicker>
          <SectionTitle as="h1" className="mb-4">
            {t.confirmation.title}
          </SectionTitle>
          <p className="mx-auto max-w-[46ch] text-[15px] leading-[1.65] text-espresso/70">
            {t.confirmation.text(order.orderNo)}
          </p>
        </div>

        <div className="rounded-md border border-espresso/15 bg-white p-6">
          <h2 className="mb-5 ck-kicker">{t.confirmation.summary}</h2>
          <ul className="mb-5 space-y-3 text-[14px]">
            {order.items.map((item, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <li key={i} className="flex justify-between gap-4">
                <span className="text-espresso/80">
                  {item.quantity} × {item.productName}
                  <span className="block text-[12.5px] text-espresso/55">
                    {item.sizeLabel}
                    {item.fillingName ? ` · ${item.fillingName}` : ""}
                    {item.inscription ? ` · „${item.inscription}“` : ""}
                  </span>
                </span>
                <span className="font-semibold whitespace-nowrap">
                  {formatPrice(item.totalCents, locale)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-espresso/10 pt-4 text-[14px]">
            <div className="flex justify-between">
              <dt className="text-espresso/60">{t.confirmation.date}</dt>
              <dd>{formatDate(order.desiredDate, locale)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-espresso/60">
                {order.fulfilment === "pickup" ? t.confirmation.pickup : t.confirmation.delivery}
              </dt>
              <dd>
                {order.fulfilment === "delivery" ? (order.city ?? "") : site.contact.address.city}
              </dd>
            </div>
            {order.deliveryFeeCents > 0 && (
              <div className="flex justify-between">
                <dt className="text-espresso/60">{t.common.deliveryFee}</dt>
                <dd>{formatPrice(order.deliveryFeeCents, locale)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-espresso/10 pt-3">
              <dt className="font-semibold">{t.confirmation.total}</dt>
              <dd className="ck-display text-[24px]">{formatPrice(order.totalCents, locale)}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <a
            href={site.contact.whatsappLink}
            target="_blank"
            rel="noreferrer"
            className={pillVariants.outline}
          >
            {t.confirmation.whatsapp}
          </a>
          <Link to="/" className={pillVariants.primary}>
            {t.confirmation.backHome}
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
