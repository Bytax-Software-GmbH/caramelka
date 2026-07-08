import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PublicShell } from "#/components/ck/layout";
import { Kicker, pillVariants, SectionTitle } from "#/components/ck/primitives";
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

const inputCls =
  "w-full rounded-md border border-espresso/25 bg-white px-4 py-3 text-[14.5px] placeholder:text-espresso/35 focus:border-caramel focus:outline-none";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold tracking-[0.12em] text-espresso/70 uppercase">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-[12.5px] text-destructive">{error}</span>}
    </label>
  );
}

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
        <section className="mx-auto max-w-3xl px-5 py-20 text-center md:px-8">
          <p className="mb-7 text-espresso/60">{t.cart.empty}</p>
          <Link to="/torten" className={pillVariants.primary}>
            {t.cart.emptyCta}
          </Link>
        </section>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <Kicker className="mb-4">{site.name}</Kicker>
        <SectionTitle as="h1" className="mb-10 text-5xl">
          {t.checkout.title}
        </SectionTitle>

        <form onSubmit={submit} className="grid gap-12 lg:grid-cols-[1fr_380px]" noValidate>
          <div className="space-y-10">
            {/* Abholung / Lieferung */}
            <fieldset>
              <legend className="mb-4 ck-kicker">{t.checkout.fulfilment}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    { value: "pickup", label: t.checkout.pickup, hint: t.checkout.pickupHint },
                    {
                      value: "delivery",
                      label: t.checkout.delivery,
                      hint: t.checkout.deliveryHint(
                        formatPrice(site.shop.deliveryFeeCents, locale),
                        site.shop.deliveryRadiusKm,
                      ),
                    },
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.value}
                    aria-label={opt.label}
                    className={cn(
                      "cursor-pointer rounded-md border px-5 py-4 transition-colors",
                      fulfilment === opt.value
                        ? "border-espresso bg-espresso/[0.04]"
                        : "border-espresso/20 hover:border-espresso/50",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="fulfilment"
                        checked={fulfilment === opt.value}
                        onChange={() => setFulfilment(opt.value)}
                        className="accent-caramel"
                      />
                      <span>
                        <span className="block text-[15px] font-semibold">{opt.label}</span>
                        <span className="block text-[13px] text-espresso/55">{opt.hint}</span>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Wunschtermin */}
            <fieldset>
              <legend className="mb-4 ck-kicker">{t.checkout.date}</legend>
              <Field label={t.checkout.date} error={errors.date}>
                <input
                  type="date"
                  required
                  min={minDateIso}
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                  className={cn(inputCls, "max-w-xs")}
                />
              </Field>
              <p className="mt-2 text-[13px] text-espresso/55">
                {t.checkout.dateHint(formatDate(minDateIso, locale))}
              </p>
            </fieldset>

            {/* Kontaktdaten */}
            <fieldset>
              <legend className="mb-4 ck-kicker">{t.checkout.contactData}</legend>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t.checkout.name} error={errors.name}>
                  <input
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label={t.checkout.phone} error={errors.phone}>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label={t.checkout.email} error={errors.email}>
                    <input
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>
            </fieldset>

            {/* Lieferadresse */}
            {fulfilment === "delivery" && (
              <fieldset>
                <legend className="mb-4 ck-kicker">{t.checkout.address}</legend>
                <div className="grid gap-5 sm:grid-cols-[1fr_140px_1fr]">
                  <Field label={t.checkout.street} error={errors.street}>
                    <input
                      type="text"
                      autoComplete="street-address"
                      value={form.street}
                      onChange={(e) => set("street", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label={t.checkout.zip} error={errors.zip}>
                    <input
                      type="text"
                      autoComplete="postal-code"
                      value={form.zip}
                      onChange={(e) => set("zip", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label={t.checkout.city} error={errors.city}>
                    <input
                      type="text"
                      autoComplete="address-level2"
                      value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                </div>
              </fieldset>
            )}

            {/* Anmerkung */}
            <Field label={t.checkout.note}>
              <textarea
                rows={3}
                value={form.note}
                onChange={(e) => set("note", e.target.value)}
                placeholder={t.checkout.notePlaceholder}
                className={inputCls}
              />
            </Field>
          </div>

          {/* Zusammenfassung */}
          <aside className="h-fit rounded-md border border-espresso/15 bg-white p-6 lg:sticky lg:top-24">
            <h2 className="mb-5 ck-kicker">{t.confirmation.summary}</h2>
            <ul className="mb-5 space-y-3 text-[13.5px]">
              {cart.items.map((item) => (
                <li key={item.key} className="flex justify-between gap-4">
                  <span className="text-espresso/75">
                    {item.quantity} × {pickL(item.nameDe, item.nameRu)}
                    <span className="block text-[12px] text-espresso/70">
                      {pickL(item.sizeLabelDe, item.sizeLabelRu)}
                      {item.fillingNameDe
                        ? ` · ${pickL(item.fillingNameDe, item.fillingNameRu ?? item.fillingNameDe)}`
                        : ""}
                    </span>
                  </span>
                  <span className="font-semibold whitespace-nowrap">
                    {formatPrice(item.unitPriceCents * item.quantity, locale)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-espresso/10 pt-4 text-[14px]">
              <div className="flex justify-between">
                <dt className="text-espresso/60">{t.cart.subtotal}</dt>
                <dd>{formatPrice(cart.subtotalCents, locale)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-espresso/60">{t.common.deliveryFee}</dt>
                <dd>
                  {deliveryFeeCents === 0 ? t.common.free : formatPrice(deliveryFeeCents, locale)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-espresso/10 pt-3">
                <dt className="font-semibold">{t.common.total}</dt>
                <dd className="ck-display text-[24px]">{formatPrice(totalCents, locale)}</dd>
              </div>
            </dl>

            <div className="mt-5 rounded-md bg-creme-2/80 px-4 py-3 text-[12.5px] leading-relaxed text-espresso/70">
              <span className="mb-1 block ck-kicker text-[10px]">{t.checkout.payment}</span>
              {t.checkout.paymentNote}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={cn(pillVariants.caramel, "mt-6 w-full")}
            >
              {submitting ? t.checkout.submitting : t.checkout.submit}
            </button>
            <p className="mt-3 text-center text-[11.5px] text-espresso/70">
              <Link to="/agb" className="underline hover:text-espresso">
                {t.checkout.legalNote}
              </Link>
            </p>
          </aside>
        </form>
      </section>
    </PublicShell>
  );
}
