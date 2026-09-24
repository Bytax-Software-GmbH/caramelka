import { queryOptions } from "@tanstack/react-query";

import { $getCatalog, $getFillings, $getProduct } from "#/lib/server/catalog";
import { $getOrderRequestOptions } from "#/lib/server/orders";

export const catalogQueryOptions = () =>
  queryOptions({
    queryKey: ["catalog"],
    queryFn: ({ signal }) => $getCatalog({ signal }),
    staleTime: 1000 * 60 * 5,
  });

export const productQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: ({ signal }) => $getProduct({ data: slug, signal }),
    staleTime: 1000 * 60 * 5,
  });

export const fillingsQueryOptions = () =>
  queryOptions({
    queryKey: ["fillings"],
    queryFn: ({ signal }) => $getFillings({ signal }),
    staleTime: 1000 * 60 * 5,
  });

export const orderRequestOptionsQueryOptions = () =>
  queryOptions({
    queryKey: ["order-request-options"],
    queryFn: ({ signal }) => $getOrderRequestOptions({ signal }),
    staleTime: 1000 * 60 * 5,
  });
