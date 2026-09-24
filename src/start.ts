import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";

/**
 * Muss explizit hier stehen: Sobald es eine start.ts gibt, entfällt der
 * eingebaute CSRF-Schutz von TanStack Start für Server-Funktionen.
 */
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

/** 3 Fotos à 6 MB plus Formulardaten; größere Bodies gar nicht erst lesen. */
const MAX_BODY_BYTES = 25 * 1024 * 1024;

const bodyLimitMiddleware = createMiddleware().server(({ next, request }) => {
  if (request.method === "POST") {
    const header = request.headers.get("content-length");
    const isMultipart = request.headers.get("content-type")?.includes("multipart/") ?? false;
    const tooLarge = header === null ? isMultipart : Number(header) > MAX_BODY_BYTES;
    if (tooLarge) return new Response("Payload Too Large", { status: 413 });
  }
  return next();
});

let outboxBooted = false;

/** Startet den E-Mail-Worker mit der ersten Anfrage (z. B. dem Healthcheck). */
const outboxBootMiddleware = createMiddleware().server(async ({ next }) => {
  if (!outboxBooted) {
    outboxBooted = true;
    const { ensureOutboxWorker } = await import("#/lib/server/mail/outbox.server");
    ensureOutboxWorker();
  }
  return next();
});

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, bodyLimitMiddleware, outboxBootMiddleware],
}));
