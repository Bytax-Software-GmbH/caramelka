import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "#/components/ck/button";
import { Input, Textarea } from "#/components/ck/input";
import { PublicShell, shell } from "#/components/ck/layout";
import { Eyebrow, Lede, PageHead, Price } from "#/components/ck/primitives";
import { Radio } from "#/components/ck/radio";
import { useCart } from "#/lib/cart";
import { earliestDate, formatDate, formatPrice, toIsoDate } from "#/lib/format";
import { useI18n } from "#/lib/i18n";
import { $placeOrder } from "#/lib/server/orders";
import { site } from "#/lib/site";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/kasse")({
  head: () => ({
    meta: [{ title: `Bestellung | ${site.name}` }, { name: "robots", content: "noindex, follow" }],
  }),
  component: CheckoutPage,
});

const legendClass = "mb-4 ck-eyebrow text-rosegold-600";

/**
 * Kasse: Formular links in Gruppen mit Eyebrow-Legende, rechts die klebende
 * Zusammenfassung mit Roségold-Oberkante und dem einen Primär-Button.
 */
function CheckoutPage() {
  const { t, locale, pickL } = useI18n();
  const cart = useCart();
  const navigate = useNavigate();

  const [fulfilment, setFulfilment] = useState<"pickup" | "delivery">("pickup");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    zip: "",
    city: "",
    note: "",
    date: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const leadHours = Math.max(cart.maxLeadTimeHours, site.shop.defaultLeadTimeHours);
  const minDateIso = useMemo(
    () => toIsoDate(earliestDate(leadHours, site.shop.closedWeekdays)),
    [leadHours],
  );

  const deliveryFeeCents = fulfilment === "delivery" ? site.shop.deliveryFeeCents : 0;
  const totalCents = cart.subtotalCents + deliveryFeeCents;

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = t.checkout.errors.name;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = t.checkout.errors.email;
    if (form.phone.trim().length < 5) e.phone = t.checkout.errors.phone;
    if (fulfilment === "delivery") {
      if (!form.street.trim()) e.street = t.checkout.errors.street;
      if (!form.zip.trim()) e.zip = t.checkout.errors.zip;
      if (!form.city.trim()) e.city = t.checkout.errors.city;
    }
    const day = form.date ? new Date(`${form.date}T12:00:00`).getDay() : -1;
    if (!form.date || form.date < minDateIso || site.shop.closedWeekdays.includes(day)) {
      e.date = t.checkout.errors.date;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (cart.items.length === 0 || !validate()) return;
    setSubmitting(true);
    try {
      const result = await $placeOrder({
        data: {
          items: cart.items.map((i) => ({
            productId: i.productId,
            sizeId: i.sizeId,
            fillingId: i.fillingId,
            inscription: i.inscription,
            quantity: i.quantity,
          })),
          fulfilment,
          desiredDate: form.date,
          customerName: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          street: form.street.trim() || undefined,
          zip: form.zip.trim() || undefined,
          city: form.city.trim() || undefined,
          note: form.note.trim() || undefined,
          locale,
        },
      });
      cart.clear();
      void navigate({ to: "/bestellung/$orderNo", params: { orderNo: result.orderNo } });
    } catch {
      toast.error(t.checkout.errors.generic);
      setSubmitting(false);
    }
  }

  if (cart.items.length === 0) {
    return (
      <PublicShell>
        <section className={cn(shell, "max-w-narrow py-20 text-center")}>
          <Lede>{t.cart.empty}</Lede>
          <Link to="/torten" className={cn(buttonVariants({ variant: "secondary" }), "mt-6")}>
            {t.cart.emptyCta}
          </Link>
        </section>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <section className={cn(shell, "pt-14 pb-20")}>
        <PageHead eyebrow={t.bag.items(cart.count)} title={t.checkout.title} />

        <form
          onSubmit={submit}
          className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16"
          noValidate
        >
          <div className="flex flex-col gap-10">
            {/* Abholung / Lieferung */}
            <fieldset>
              <legend className={legendClass}>{t.checkout.fulfilment}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <Radio
                  card
                  name="fulfilment"
                  label={t.checkout.pickup}
                  description={t.checkout.pickupHint}
                  meta={t.common.free}
                  checked={fulfilment === "pickup"}
                  onChange={() => setFulfilment("pickup")}
                />
                <Radio
                  card
                  name="fulfilment"
                  label={t.checkout.delivery}
                  description={t.checkout.deliveryHint(
                    formatPrice(site.shop.deliveryFeeCents, locale),
                    site.shop.deliveryRadiusKm,
                  )}
                  meta={formatPrice(site.shop.deliveryFeeCents, locale)}
                  checked={fulfilment === "delivery"}
                  onChange={() => setFulfilment("delivery")}
                />
              </div>
            </fieldset>

            {/* Wunschtermin */}
            <fieldset>
              <legend className={legendClass}>{t.checkout.date}</legend>
              <Input
                className="max-w-xs"
                aria-label={t.checkout.date}
                type="date"
                required
                min={minDateIso}
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                error={errors.date}
                hint={t.checkout.dateHint(formatDate(minDateIso, locale))}
              />
            </fieldset>

            {/* Kontaktdaten */}
            <fieldset>
              <legend className={legendClass}>{t.checkout.contactData}</legend>
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label={t.checkout.name}
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  error={errors.name}
                />
                <Input
                  label={t.checkout.phone}
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  error={errors.phone}
                />
                <Input
                  className="sm:col-span-2"
                  label={t.checkout.email}
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  error={errors.email}
                />
              </div>
            </fieldset>

            {/* Lieferadresse */}
            {fulfilment === "delivery" && (
              <fieldset>
                <legend className={legendClass}>{t.checkout.address}</legend>
                <div className="grid gap-5 sm:grid-cols-[1fr_140px_1fr]">
                  <Input
                    label={t.checkout.street}
                    type="text"
                    autoComplete="street-address"
                    value={form.street}
                    onChange={(e) => set("street", e.target.value)}
                    error={errors.street}
                  />
                  <Input
                    label={t.checkout.zip}
                    type="text"
                    autoComplete="postal-code"
                    value={form.zip}
                    onChange={(e) => set("zip", e.target.value)}
                    error={errors.zip}
                  />
                  <Input
                    label={t.checkout.city}
                    type="text"
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    error={errors.city}
                  />
                </div>
              </fieldset>
            )}

            {/* Anmerkung */}
            <Textarea
              label={t.checkout.note}
              rows={3}
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder={t.checkout.notePlaceholder}
            />
          </div>

          {/* Zusammenfassung */}
          <aside className="h-fit rounded-md border border-t-2 border-hairline border-t-accent bg-surface p-6 lg:sticky lg:top-24">
            <Eyebrow>{t.confirmation.summary}</Eyebrow>
            <ul className="mt-5 flex flex-col gap-3 ck-body-sm">
              {cart.items.map((item) => (
                <li key={item.key} className="flex justify-between gap-4">
                  <span className="text-ink">
                    {item.quantity} × {pickL(item.nameDe, item.nameRu)}
                    <span className="block text-ink-muted">
                      {pickL(item.sizeLabelDe, item.sizeLabelRu)}
                      {item.fillingNameDe
                        ? ` · ${pickL(item.fillingNameDe, item.fillingNameRu ?? item.fillingNameDe)}`
                        : ""}
                    </span>
                  </span>
                  <Price className="text-md whitespace-nowrap">
                    {formatPrice(item.unitPriceCents * item.quantity, locale)}
                  </Price>
                </li>
              ))}
            </ul>
            <dl className="mt-5 flex flex-col gap-2 border-t border-hairline pt-4 ck-body-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">{t.cart.subtotal}</dt>
                <dd>{formatPrice(cart.subtotalCents, locale)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">{t.common.deliveryFee}</dt>
                <dd>
                  {deliveryFeeCents === 0 ? t.common.free : formatPrice(deliveryFeeCents, locale)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-hairline pt-3">
                <dt className="ck-label">{t.common.total}</dt>
                <dd>
                  <Price className="text-2xl">{formatPrice(totalCents, locale)}</Price>
                </dd>
              </div>
            </dl>

            <div className="mt-5 rounded-sm bg-sunken px-4 py-3 text-ink-muted ck-body-sm">
              <span className="mb-1 block ck-eyebrow text-rosegold-600">{t.checkout.payment}</span>
              {t.checkout.paymentNote}
            </div>

            <Button type="submit" size="lg" block disabled={submitting} className="mt-6">
              {submitting ? t.checkout.submitting : t.checkout.submit}
            </Button>
            <p className="mt-3 text-center text-ink-muted ck-body-sm">
              <Link to="/agb" className="border-b border-hairline-accent text-brand">
                {t.checkout.legalNote}
              </Link>
            </p>
          </aside>
        </form>
      </section>
    </PublicShell>
  );
}
