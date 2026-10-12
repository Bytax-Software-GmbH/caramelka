/** Öffentliches Anfrage-Formular: Optionen laden und Anfrage absenden. */
import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";

import { loadOrderRequestOptions, submitOrderRequest } from "./order-requests.server";

export const $getOrderRequestOptions = createServerFn({ method: "GET" }).handler(() =>
  loadOrderRequestOptions(),
);

/** FormData: `payload` (JSON, siehe order-request/schema.ts) + bis zu 3 `photos`. */
export const $submitOrderRequest = createServerFn({ method: "POST" })
  .validator((data: FormData) => {
    if (!(data instanceof FormData)) throw new Error("FormData erwartet");
    return data;
  })
  .handler(({ data }) =>
    submitOrderRequest(data, getRequestIP({ xForwardedFor: true }) ?? "unbekannt"),
  );
