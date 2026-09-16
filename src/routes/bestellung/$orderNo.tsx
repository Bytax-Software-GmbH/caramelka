import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { buttonVariants } from "#/components/ck/button";
import { PublicShell, shell } from "#/components/ck/layout";
import { Eyebrow, PageHead, Price } from "#/components/ck/primitives";
import { formatDate, formatPrice } from "#/lib/format";
import { useI18n } from "#/lib/i18n";
import { $getOrderConfirmation } from "#/lib/server/orders";
import { site } from "#/lib/site";
import { cn } from "#/lib/utils";

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

/** Bestätigung: Monogramm als Siegel, dann die Zusammenfassung. */
function ConfirmationPage() {
  const { t, locale } = useI18n();
  const order = Route.useLoaderData();

  return (
    <PublicShell>
      <section className={cn(shell, "max-w-narrow pt-16 pb-20")}>
        <PageHead
          seal
          eyebrow={t.confirmation.kicker}
          title={t.confirmation.title}
          lede={t.confirmation.text(order.orderNo)}
        />

        <div className="mt-10 rounded-md border border-t-2 border-hairline border-t-accent bg-surface p-6">
          <Eyebrow>{t.confirmation.summary}</Eyebrow>
          <ul className="mt-5 flex flex-col gap-3 ck-body-sm">
            {order.items.map((item, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <li key={i} className="flex justify-between gap-4">
                <span className="text-ink">
                  {item.quantity} × {item.productName}
                  <span className="block text-ink-muted">
                    {item.sizeLabel}
                    {item.fillingName ? ` · ${item.fillingName}` : ""}
                    {item.inscription ? ` · „${item.inscription}“` : ""}
                  </span>
                </span>
                <Price className="text-md whitespace-nowrap">
                  {formatPrice(item.totalCents, locale)}
                </Price>
              </li>
            ))}
          </ul>
          <dl className="mt-5 flex flex-col gap-2 border-t border-hairline pt-4 ck-body-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">{t.confirmation.date}</dt>
              <dd>{formatDate(order.desiredDate, locale)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">
                {order.fulfilment === "pickup" ? t.confirmation.pickup : t.confirmation.delivery}
              </dt>
              <dd>
                {order.fulfilment === "delivery" ? (order.city ?? "") : site.contact.address.city}
              </dd>
            </div>
            {order.deliveryFeeCents > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-muted">{t.common.deliveryFee}</dt>
                <dd>{formatPrice(order.deliveryFeeCents, locale)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-hairline pt-3">
              <dt className="ck-label">{t.confirmation.total}</dt>
              <dd>
                <Price className="text-2xl">{formatPrice(order.totalCents, locale)}</Price>
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <a
            href={site.contact.whatsappLink}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "secondary" })}
          >
            {t.confirmation.whatsapp}
          </a>
          <Link to="/" className={buttonVariants()}>
            {t.confirmation.backHome}
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
