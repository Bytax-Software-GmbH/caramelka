/**
 * E-Mail-Texte. Mails an Kundinnen in ihrer Sprache (DE/RU), Mails an die
 * Backstube auf Deutsch. Kein Gedankenstrich im sichtbaren Text (Stilregel).
 */
import { env } from "#/env/server";
import type { EventType, Fulfilment, Locale, OrderKind } from "#/lib/db/schema";
import { formatDate, formatDateTime, formatPrice, formatTime, formatWeight } from "#/lib/format";
import { roundEstimate } from "#/lib/order-request/estimate";
import { site } from "#/lib/site";

export interface OrderMailItem {
  productName: string;
  sizeLabel: string;
  fillingName: string | null;
  weightGrams: number | null;
  inscription: string | null;
  quantity: number;
}

export interface OrderMailData {
  id: number;
  orderNo: string;
  kind: OrderKind;
  locale: Locale;
  desiredDate: string;
  desiredTime: string | null;
  fulfilment: Fulfilment | null;
  street: string | null;
  zip: string | null;
  city: string | null;
  customerName: string;
  email: string;
  phone: string;
  note: string | null;
  decorNote: string | null;
  decorStyles: string[];
  eventType: EventType | null;
  guestCount: number | null;
  inspirationName: string | null;
  deliveryFeeCents: number;
  totalCents: number;
  estimateComplete: boolean;
  finalTotalCents: number | null;
  customerMessage: string | null;
  fileCount: number;
  items: OrderMailItem[];
}

export interface RenderedMail {
  subject: string;
  html: string;
  text: string;
}

const copy = {
  de: {
    kind: { cake: "Torte", dessert: "Desserts", event: "Hochzeit oder Feier" },
    eventType: { wedding: "Hochzeit", banquet: "Bankett oder Feier", other: "Andere Feier" },
    decor: {
      classic: "Klassisch elegant",
      flowers: "Blumen",
      berries: "Beeren und Früchte",
      kids: "Kinder und Figuren",
      minimal: "Schlicht und modern",
    },
    labels: {
      orderNo: "Anfrage",
      kind: "Art",
      date: "Termin",
      eventDate: "Datum der Feier",
      handover: "Übergabe",
      items: "Auswahl",
      decor: "Dekor",
      wishes: "Wünsche",
      photos: "Fotos",
      guests: "Gäste",
      eventType: "Anlass",
      inspiration: "Inspiration",
      note: "Anmerkung",
      estimate: "Schätzung",
      finalPrice: "Endpreis",
      message: "Nachricht von uns",
    },
    pickup: `Abholung in der Backstube, ${site.contact.address.street}, ${site.contact.address.zip} ${site.contact.address.city}`,
    delivery: "Lieferung an",
    filling: "Füllung",
    inscription: "Aufschrift",
    photos: (n: number) => (n === 1 ? "1 Foto erhalten" : `${n} Fotos erhalten`),
    estimate: (price: string, fee: string | null) =>
      fee ? `ca. ${price} inkl. Lieferung ${fee}` : `ca. ${price}`,
    estimateOpen: "Preis folgt mit der Bestätigung",
    greeting: (name: string) => `Hallo ${name},`,
    signoff: ["Herzliche Grüße", "Dein Caramelka-Team"],
    questions: `Fragen? Antworte einfach auf diese E-Mail oder ruf uns an: ${site.contact.phone}.`,
    received: {
      subject: (no: string) => `Deine Anfrage ${no} ist bei uns`,
      intro:
        "danke für deine Anfrage! Wir prüfen Termin, Füllung und Dekor und schicken dir die Bestätigung mit dem Endpreis per E-Mail. Verbindlich wird die Bestellung erst mit dieser Bestätigung.",
      introEvent:
        "danke für deine Anfrage! Hochzeits- und Festtorten besprechen wir gern persönlich. Wir melden uns in Kürze bei dir.",
      estimateNote:
        "Die Schätzung richtet sich nach Gewicht und Füllung. Aufwendiges Dekor kann den Preis erhöhen.",
    },
    confirmed: {
      subject: (no: string) => `Bestätigt: deine Bestellung ${no}`,
      subjectUpdated: (no: string) => `Aktualisiert: deine Bestellung ${no}`,
      subjectOffer: (no: string) => `Dein Angebot: Bestellung ${no}`,
      subjectOfferUpdated: (no: string) => `Neuer Preis: deine Bestellung ${no}`,
      intro: "wir haben deine Bestellung bestätigt und freuen uns darauf!",
      introUpdated: "wir haben deine Bestellung aktualisiert. Hier sind die neuen Angaben:",
      introOffer:
        "wir haben deine Anfrage geprüft. Der Endpreis liegt über der Schätzung aus dem Formular. Darum ist diese E-Mail ein Angebot und noch keine verbindliche Bestätigung:",
      introOfferNoEstimate:
        "wir haben deine Anfrage geprüft. Im Formular stand noch kein Preis. Darum ist diese E-Mail ein Angebot und noch keine verbindliche Bestätigung:",
      introOfferUpdated:
        "wir mussten den Preis deiner Bestellung anpassen. Darum gilt diese E-Mail als neues Angebot:",
      offerDeadline: (until: string) =>
        `Passt dir der Preis nicht? Dann antworte bis ${until} auf diese E-Mail oder ruf uns an, und wir stornieren kostenfrei. Hören wir bis dahin nichts von dir, gilt die Bestellung zu diesem Preis als bestätigt und wir legen los.`,
      payment: "Bezahlt wird bequem bei Abholung bzw. Lieferung, bar oder mit Karte.",
      calendar: "Den Termin findest du als Kalendereintrag im Anhang.",
      terms: `Es gelten unsere AGB: ${site.url}/agb`,
    },
    declined: {
      subject: (no: string) => `Deine Anfrage ${no}`,
      intro: "leider können wir deine Anfrage so nicht annehmen.",
      introCancelled: "leider müssen wir deine Bestellung stornieren.",
      outro: "Antworte gern auf diese E-Mail, dann finden wir gemeinsam eine Lösung.",
    },
  },
  ru: {
    kind: { cake: "Торт", dessert: "Десерты", event: "Свадьба или праздник" },
    eventType: { wedding: "Свадьба", banquet: "Банкет или праздник", other: "Другой праздник" },
    decor: {
      classic: "Классика",
      flowers: "Цветы",
      berries: "Ягоды и фрукты",
      kids: "Детский, с фигурками",
      minimal: "Минимализм",
    },
    labels: {
      orderNo: "Заявка",
      kind: "Вид",
      date: "Дата и время",
      eventDate: "Дата праздника",
      handover: "Получение",
      items: "Выбор",
      decor: "Декор",
      wishes: "Пожелания",
      photos: "Фото",
      guests: "Гостей",
      eventType: "Повод",
      inspiration: "Пример",
      note: "Комментарий",
      estimate: "Предварительно",
      finalPrice: "Итоговая цена",
      message: "Сообщение от нас",
    },
    pickup: `Самовывоз из пекарни, ${site.contact.address.street}, ${site.contact.address.zip} ${site.contact.address.city}`,
    delivery: "Доставка по адресу",
    filling: "Начинка",
    inscription: "Надпись",
    photos: (n: number) => `Получено фото: ${n}`,
    estimate: (price: string, fee: string | null) =>
      fee ? `около ${price}, включая доставку ${fee}` : `около ${price}`,
    estimateOpen: "Цену сообщим в подтверждении",
    greeting: (name: string) => `Здравствуйте, ${name}!`,
    signoff: ["С уважением,", "команда Caramelka"],
    questions: `Вопросы? Просто ответьте на это письмо или позвоните нам: ${site.contact.phone}.`,
    received: {
      subject: (no: string) => `Ваша заявка ${no} получена`,
      intro:
        "спасибо за вашу заявку! Мы проверим дату, начинку и декор и пришлём подтверждение с окончательной ценой по e-mail. Заказ становится обязательным только после этого подтверждения.",
      introEvent:
        "спасибо за вашу заявку! Свадебные и праздничные торты мы обсуждаем лично. Мы скоро свяжемся с вами.",
      estimateNote:
        "Предварительная цена зависит от веса и начинки. Сложный декор может увеличить стоимость.",
    },
    confirmed: {
      subject: (no: string) => `Заказ ${no} подтверждён`,
      subjectUpdated: (no: string) => `Заказ ${no} изменён`,
      subjectOffer: (no: string) => `Предложение по заказу ${no}`,
      subjectOfferUpdated: (no: string) => `Новая цена: заказ ${no}`,
      intro: "мы подтвердили ваш заказ и уже ждём встречи!",
      introUpdated: "мы изменили ваш заказ. Актуальные данные:",
      introOffer:
        "мы проверили вашу заявку. Итоговая цена выше предварительной из формы. Поэтому это письмо является предложением, а не окончательным подтверждением:",
      introOfferNoEstimate:
        "мы проверили вашу заявку. В форме цена ещё не была указана. Поэтому это письмо является предложением, а не окончательным подтверждением:",
      introOfferUpdated:
        "нам пришлось изменить цену вашего заказа. Поэтому это письмо является новым предложением:",
      offerDeadline: (until: string) =>
        `Цена не подходит? Ответьте на это письмо или позвоните нам до ${until}, и мы отменим заказ бесплатно. Если до этого времени мы не получим ответа, заказ считается подтверждённым по этой цене, и мы приступим к работе.`,
      payment: "Оплата при получении, наличными или картой.",
      calendar: "Дата и время заказа во вложении как событие календаря.",
      terms: `Действуют наши условия (AGB): ${site.url}/agb`,
    },
    declined: {
      subject: (no: string) => `Ваша заявка ${no}`,
      intro: "к сожалению, мы не можем принять вашу заявку в таком виде.",
      introCancelled: "к сожалению, нам приходится отменить ваш заказ.",
      outro: "Ответьте на это письмо, и мы вместе найдём решение.",
    },
  },
};

type Copy = (typeof copy)["de"];

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Row = [label: string, value: string];

function isDecorStyle(value: string): value is keyof Copy["decor"] {
  return value in copy.de.decor;
}

function itemLines(order: OrderMailData, c: Copy): string[] {
  return order.items.map((item) => {
    const parts =
      item.weightGrams === null
        ? [`${item.quantity} × ${item.productName}, ${item.sizeLabel}`]
        : [`${item.productName}, ${formatWeight(item.weightGrams, order.locale)}`];
    if (item.fillingName) parts.push(`${c.filling}: ${item.fillingName}`);
    if (item.inscription) {
      const [open, close] = order.locale === "ru" ? ["«", "»"] : ["„", "“"];
      parts.push(`${c.inscription}: ${open}${item.inscription}${close}`);
    }
    return parts.join(" · ");
  });
}

function scheduleText(order: OrderMailData): string {
  const date = formatDate(order.desiredDate, order.locale);
  return order.desiredTime ? `${date}, ${formatTime(order.desiredTime, order.locale)}` : date;
}

function handoverText(order: OrderMailData, c: Copy): string | null {
  if (order.fulfilment === "pickup") return c.pickup;
  if (order.fulfilment === "delivery") {
    return `${c.delivery} ${order.street ?? ""}, ${order.zip ?? ""} ${order.city ?? ""}`.trim();
  }
  return null;
}

function estimateText(order: OrderMailData, c: Copy): string {
  if (!order.estimateComplete) return c.estimateOpen;
  const fee = order.deliveryFeeCents > 0 ? formatPrice(order.deliveryFeeCents, order.locale) : null;
  return c.estimate(formatPrice(roundEstimate(order.totalCents), order.locale), fee);
}

/** Gemeinsame Zusammenfassung für Kundin und Backstube. */
function summaryRows(
  order: OrderMailData,
  c: Copy,
  options: { price: "estimate" | "final" | "offer" },
): Row[] {
  const rows: Row[] = [
    [c.labels.orderNo, order.orderNo],
    [c.labels.kind, c.kind[order.kind]],
    [order.kind === "event" ? c.labels.eventDate : c.labels.date, scheduleText(order)],
  ];
  const handover = handoverText(order, c);
  if (handover) rows.push([c.labels.handover, handover]);
  if (order.kind === "event") {
    if (order.eventType) rows.push([c.labels.eventType, c.eventType[order.eventType]]);
    if (order.guestCount) rows.push([c.labels.guests, String(order.guestCount)]);
  }
  for (const line of itemLines(order, c)) rows.push([c.labels.items, line]);
  if (order.inspirationName) rows.push([c.labels.inspiration, order.inspirationName]);
  const decor = [
    ...order.decorStyles.filter(isDecorStyle).map((style) => c.decor[style]),
    order.decorNote ?? "",
  ]
    .filter(Boolean)
    .join(" · ");
  if (decor) rows.push([order.kind === "event" ? c.labels.wishes : c.labels.decor, decor]);
  if (order.fileCount > 0) rows.push([c.labels.photos, c.photos(order.fileCount)]);
  if (order.note) rows.push([c.labels.note, order.note]);
  if (order.kind !== "event") {
    if (options.price !== "estimate" && order.finalTotalCents !== null) {
      // Angebot: Schätzung und Endpreis nebeneinander, damit die Abweichung sichtbar ist.
      if (options.price === "offer" && order.estimateComplete) {
        rows.push([c.labels.estimate, estimateText(order, c)]);
      }
      rows.push([c.labels.finalPrice, formatPrice(order.finalTotalCents, order.locale)]);
    } else {
      rows.push([c.labels.estimate, estimateText(order, c)]);
    }
  }
  return rows;
}

function rowsHtml(rows: Row[]): string {
  return rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#7a625b;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:6px 0;vertical-align:top">${escapeHtml(value)}</td></tr>`,
    )
    .join("");
}

function paragraphsHtml(paragraphs: string[]): string {
  return paragraphs
    .map((p) => `<p style="margin:0 0 14px">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function layout(locale: Locale, title: string, body: string): string {
  const footer = [
    site.name,
    `${site.contact.address.street}, ${site.contact.address.zip} ${site.contact.address.city}`,
    `${site.contact.phone} · ${site.contact.email}`,
  ]
    .map(escapeHtml)
    .join("<br>");
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head><body style="margin:0;padding:0;background:#fbf6f0;color:#3e2b27;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf6f0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fdfaf6;border:1px solid #e3d3c2"><tr><td style="background:#5c1216;padding:22px 28px;text-align:center;font-family:Georgia,serif;letter-spacing:.24em;font-size:18px;color:#ecc3a7">CARAMELKA</td></tr><tr><td style="padding:28px">${body}</td></tr><tr><td style="padding:18px 28px;border-top:1px solid #e3d3c2;font-size:12px;color:#7a625b">${footer}</td></tr></table></td></tr></table></body></html>`;
}

/** Baut HTML und Text aus denselben Absätzen und Zeilen. */
function compose(input: {
  locale: Locale;
  subject: string;
  before: string[];
  rows: Row[];
  after: string[];
}): RenderedMail {
  const table = `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:6px 0 18px;border-top:1px solid #e3d3c2;border-bottom:1px solid #e3d3c2">${rowsHtml(input.rows)}</table>`;
  const html = layout(
    input.locale,
    input.subject,
    paragraphsHtml(input.before) + table + paragraphsHtml(input.after),
  );
  const text = [
    input.before.join("\n\n"),
    input.rows.map(([label, value]) => `${label}: ${value}`).join("\n"),
    input.after.join("\n\n"),
  ]
    .filter(Boolean)
    .join("\n\n");
  return { subject: input.subject, html, text };
}

/** An die Kundin: Anfrage ist angekommen. */
export function requestReceivedMail(order: OrderMailData): RenderedMail {
  const c = copy[order.locale];
  const isEvent = order.kind === "event";
  return compose({
    locale: order.locale,
    subject: c.received.subject(order.orderNo),
    before: [c.greeting(order.customerName), isEvent ? c.received.introEvent : c.received.intro],
    rows: summaryRows(order, c, { price: "estimate" }),
    after: [...(isEvent ? [] : [c.received.estimateNote]), c.questions, c.signoff.join("\n")],
  });
}

/** An die Backstube: neue Anfrage mit allen Angaben und Link in den Admin. */
export function staffNewRequestMail(order: OrderMailData): RenderedMail {
  const c = copy.de;
  const when = scheduleText({ ...order, locale: "de" });
  const rows = summaryRows({ ...order, locale: "de" }, c, { price: "estimate" });
  rows.push(
    ["Name", order.customerName],
    ["Telefon", order.phone],
    ["E-Mail", order.email],
    ["Sprache", order.locale === "ru" ? "Russisch" : "Deutsch"],
  );
  return compose({
    locale: "de",
    subject: `Neue Anfrage ${order.orderNo}: ${c.kind[order.kind]}, ${when}`,
    before: [
      `Neue Anfrage über die Website. Antworten auf diese E-Mail gehen direkt an ${order.customerName}.`,
    ],
    rows,
    after: [`Im Admin öffnen: ${env.VITE_BASE_URL}/app/bestellungen/${order.id}`],
  });
}

/**
 * An die Kundin: verbindliche Bestätigung mit Endpreis (Phase 2). Mit
 * `offerUntil` wird daraus ein Angebot mit Antwortfrist, weil der Endpreis
 * über der Schätzung liegt oder es keine gab (siehe order-request/offer.ts).
 */
export function orderConfirmedMail(
  order: OrderMailData,
  options: { updated: boolean; offerUntil: Date | null },
): RenderedMail {
  const c = copy[order.locale];
  const isEvent = order.kind === "event";
  const offer = options.offerUntil !== null;
  const subject = offer
    ? options.updated
      ? c.confirmed.subjectOfferUpdated(order.orderNo)
      : c.confirmed.subjectOffer(order.orderNo)
    : options.updated
      ? c.confirmed.subjectUpdated(order.orderNo)
      : c.confirmed.subject(order.orderNo);
  const intro = offer
    ? options.updated
      ? c.confirmed.introOfferUpdated
      : order.estimateComplete
        ? c.confirmed.introOffer
        : c.confirmed.introOfferNoEstimate
    : options.updated
      ? c.confirmed.introUpdated
      : c.confirmed.intro;
  return compose({
    locale: order.locale,
    subject,
    before: [
      c.greeting(order.customerName),
      intro,
      ...(order.customerMessage ? [`${c.labels.message}:\n${order.customerMessage}`] : []),
    ],
    rows: summaryRows(order, c, { price: offer ? "offer" : "final" }),
    after: [
      ...(options.offerUntil
        ? [c.confirmed.offerDeadline(formatDateTime(options.offerUntil, order.locale))]
        : []),
      ...(isEvent ? [] : [c.confirmed.payment]),
      c.confirmed.calendar,
      c.confirmed.terms,
      c.questions,
      c.signoff.join("\n"),
    ],
  });
}

/** An die Kundin: Absage einer Anfrage bzw. Storno einer bestätigten Bestellung (Phase 2). */
export function orderDeclinedMail(
  order: OrderMailData,
  options: { wasConfirmed: boolean },
): RenderedMail {
  const c = copy[order.locale];
  return compose({
    locale: order.locale,
    subject: c.declined.subject(order.orderNo),
    before: [
      c.greeting(order.customerName),
      options.wasConfirmed ? c.declined.introCancelled : c.declined.intro,
      ...(order.customerMessage ? [order.customerMessage] : []),
    ],
    rows: summaryRows(order, c, { price: "estimate" }).slice(0, 3),
    after: [c.declined.outro, c.signoff.join("\n")],
  });
}

/** Test-Mail aus dem Admin, um SMTP nach einem Deploy zu prüfen. */
export function testMail(): RenderedMail {
  return compose({
    locale: "de",
    subject: "Caramelka: Test-Mail",
    before: ["Diese Test-Mail kam an. Der Versand über SMTP funktioniert."],
    rows: [["Absender-Server", env.SMTP_HOST ?? "nicht konfiguriert"]],
    after: [],
  });
}
