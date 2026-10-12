import { useSuspenseQuery } from "@tanstack/react-query";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import * as z from "zod";

import { PublicShell, shell } from "#/components/ck/layout";
import { PageHead } from "#/components/ck/primitives";
import { OrderWizard } from "#/components/order-request/order-wizard";
import {
  kindParamSchema,
  type Prefill,
  type StepKey,
  stepKeySchema,
} from "#/components/order-request/state";
import { useI18n } from "#/lib/i18n";
import { orderRequestOptionsQueryOptions } from "#/lib/queries";
import { site } from "#/lib/site";
import { cn } from "#/lib/utils";

const searchSchema = z.object({
  schritt: stepKeySchema.optional().catch(undefined),
  art: kindParamSchema.optional().catch(undefined),
  produkt: z.string().max(80).optional().catch(undefined),
  fuellung: z.string().max(80).optional().catch(undefined),
});

export const Route = createFileRoute("/bestellen")({
  validateSearch: searchSchema,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(orderRequestOptionsQueryOptions());
  },
  head: () => ({
    meta: [
      { title: `Torte anfragen | ${site.name}` },
      {
        name: "description",
        content:
          "Torte, Desserts oder Hochzeitstorte online anfragen: Füllung, Gewicht, Termin und Wunschfoto. Caramelka bestätigt per E-Mail mit dem Endpreis.",
      },
    ],
    links: [{ rel: "canonical", href: `${site.url}/bestellen` }],
  }),
  component: OrderRequestPage,
});

function WizardSkeleton() {
  return (
    <div aria-hidden className="grid gap-12 lg:grid-cols-[1fr_360px] lg:gap-16">
      <div className="h-[520px] rounded-md border border-hairline bg-surface" />
      <div className="hidden h-[320px] rounded-md border border-hairline bg-surface lg:block" />
    </div>
  );
}

/**
 * Anfrage-Formular. Der Wizard läuft nur im Browser (Kalender, Fotos und
 * Entwurf brauchen ihn ohnehin); Kopf und Ladefläche rendert der Server.
 */
function OrderRequestPage() {
  const { t } = useI18n();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: options } = useSuspenseQuery(orderRequestOptionsQueryOptions());
  // Vorbelegung aus dem Link nur einmal übernehmen; danach verschwindet sie aus der URL.
  const [prefill] = useState<Prefill>(() => ({
    art: search.art,
    produkt: search.produkt,
    fuellung: search.fuellung,
  }));

  const onNavigate = useCallback(
    (schritt: StepKey, mode: "push" | "replace") => {
      void navigate({ search: { schritt }, replace: mode === "replace", resetScroll: false });
    },
    [navigate],
  );

  const onSuccess = useCallback(
    (orderNo: string) => {
      void navigate({ to: "/bestellung/$orderNo", params: { orderNo }, replace: true });
    },
    [navigate],
  );

  return (
    <PublicShell>
      <section className={cn(shell, "pt-14 pb-20")}>
        <PageHead
          eyebrow={t.orderForm.page.kicker}
          title={t.orderForm.page.title}
          lede={t.orderForm.page.lede}
        />
        <div className="mt-12">
          <ClientOnly fallback={<WizardSkeleton />}>
            <OrderWizard
              options={options}
              prefill={prefill}
              step={search.schritt}
              hasPrefillParams={Boolean(search.art || search.produkt || search.fuellung)}
              onNavigate={onNavigate}
              onSuccess={onSuccess}
            />
          </ClientOnly>
        </div>
      </section>
    </PublicShell>
  );
}
