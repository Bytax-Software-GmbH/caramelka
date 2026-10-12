import { ClientOnly, createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MailIcon, PhoneIcon } from "lucide-react";
import { useState } from "react";

import { buttonVariants } from "#/components/ck/button";
import { PublicShell, shell } from "#/components/ck/layout";
import { Eyebrow, PageHead, Price } from "#/components/ck/primitives";
import { loadConfirmation } from "#/components/order-request/confirmation";
import { formatDate, formatPrice, formatTime } from "#/lib/format";
import { useI18n } from "#/lib/i18n";
import { site } from "#/lib/site";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/bestellung/$orderNo")({
  beforeLoad: ({ params }) => {
    if (!/^CK-[A-Z2-9]{5}$/.test(params.orderNo)) throw notFound();
  },
  head: () => ({
    meta: [
      { title: `Anfrage eingegangen | ${site.name}` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ConfirmationPage,
});

/**
 * Danke-Seite nach dem Absenden. Die Zusammenfassung kommt aus dem
 * sessionStorage des absendenden Browsers; die Seite lädt bewusst keine
 * Bestelldaten über die öffentlich erratbare Nummer.
 */
function ConfirmationPage() {
  const { t } = useI18n();
  const { orderNo } = Route.useParams();
  const c = t.confirmation;

  return (
    <PublicShell>
      <section className={cn(shell, "max-w-narrow pt-16 pb-20")}>
        <PageHead
          seal
          eyebrow={c.kicker}
          title={c.title}
          lede={`${c.requestNo(orderNo)}. ${c.text}`}
        />
        <ClientOnly fallback={<NextSteps kind={null} />}>
          <StoredSummary orderNo={orderNo} />
        </ClientOnly>

        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <p className="text-ink-muted ck-body-sm">{c.questions}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={site.contact.phoneLink} className={buttonVariants({ variant: "secondary" })}>
              <PhoneIcon aria-hidden strokeWidth={1.5} /> {c.call}
            </a>
            <a
              href={`mailto:${site.contact.email}?subject=${encodeURIComponent(c.emailSubject(orderNo))}`}
              className={buttonVariants({ variant: "secondary" })}
            >
              <MailIcon aria-hidden strokeWidth={1.5} /> {c.writeEmail}
            </a>
          </div>
          <Link to="/" className={cn(buttonVariants({ variant: "link" }), "mt-4")}>
            {c.backHome}
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}

function NextSteps({ kind }: { kind: "cake" | "dessert" | "event" | null }) {
  const { t } = useI18n();
  const c = t.confirmation;
  const steps = kind === "event" ? c.nextEvent : c.next;
  return (
    <div className="mt-10 rounded-md border border-hairline bg-surface p-6">
      <Eyebrow>{c.nextTitle}</Eyebrow>
      <ol className="mt-4 flex flex-col gap-3">
        {steps.map((text, index) => (
          <li key={text} className="flex items-start gap-3 ck-body-sm">
            <span
              aria-hidden
              className="grid size-6 shrink-0 place-items-center rounded-full border border-hairline-accent text-[11px] text-brand"
            >
              {index + 1}
            </span>
            <span className="pt-0.5 text-ink">{text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StoredSummary({ orderNo }: { orderNo: string }) {
  const { t, locale } = useI18n();
  const f = t.orderForm;
  const [data] = useState(() => loadConfirmation(orderNo));
  if (!data) return <NextSteps kind={null} />;

  const lines = locale === "ru" ? data.lines.ru : data.lines.de;
  return (
    <>
      <NextSteps kind={data.kind} />
      <div className="mt-6 rounded-md border border-t-2 border-hairline border-t-accent bg-surface p-6">
        <Eyebrow>{t.confirmation.summary}</Eyebrow>
        <dl className="mt-5 flex flex-col gap-4 ck-body-sm">
          <div>
            <dt className="ck-eyebrow text-ink-subtle">{f.summary.kind}</dt>
            <dd className="mt-0.5 text-ink">
              {f.kind[data.kind].title}
              {lines.length > 0 && (
                <ul className="mt-1 flex flex-col gap-1">
                  {lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </dd>
          </div>
          <div>
            <dt className="ck-eyebrow text-ink-subtle">{f.summary.date}</dt>
            <dd className="mt-0.5 text-ink">
              {formatDate(data.date, locale)}
              {data.time && `, ${formatTime(data.time, locale)}`}
              {data.fulfilment && (
                <span className="block text-ink-muted">
                  {data.fulfilment === "pickup" ? f.summary.pickup : f.summary.delivery}
                </span>
              )}
            </dd>
          </div>
          {data.photoCount > 0 && (
            <div>
              <dt className="ck-eyebrow text-ink-subtle">{f.summary.photosLabel}</dt>
              <dd className="mt-0.5 text-ink">{f.summary.photos(data.photoCount)}</dd>
            </div>
          )}
        </dl>
        <div className="mt-5 border-t border-hairline pt-4">
          {data.kind === "event" ? (
            <p className="text-ink-muted ck-body-sm">{f.summary.eventPrice}</p>
          ) : data.estimateCents !== null ? (
            <div className="flex items-baseline justify-between gap-4">
              <span className="ck-label">{f.summary.estimate}</span>
              <Price className="text-2xl">
                {f.summary.estimateValue(formatPrice(data.estimateCents, locale))}
              </Price>
            </div>
          ) : (
            <p className="text-ink-muted ck-body-sm">{f.summary.priceLater}</p>
          )}
        </div>
      </div>
    </>
  );
}
