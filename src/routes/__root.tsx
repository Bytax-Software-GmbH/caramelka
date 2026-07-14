import { a11yDevtoolsPlugin } from "@tanstack/devtools-a11y/react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useEffect } from "react";

import { ThemeParamSync } from "#/components/ck/theme-preview";
import { Toaster } from "#/components/ui/sonner";
import type { AuthQueryResult } from "#/lib/auth/queries";
import { CartProvider } from "#/lib/cart";
import { $getLocale, I18nProvider, useI18n } from "#/lib/i18n";
import { site } from "#/lib/site";

import appCss from "#/styles.css?url";

interface MyRouterContext {
  queryClient: QueryClient;
  user: AuthQueryResult;
}

const bakeryJsonLd = {
  "@context": "https://schema.org",
  "@type": "Bakery",
  name: site.name,
  alternateName: site.nameCyrillic,
  url: site.url,
  description: site.description,
  telephone: site.contact.whatsapp,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.contact.address.street,
    postalCode: site.contact.address.zip,
    addressLocality: site.contact.address.city,
    addressCountry: "DE",
  },
  servesCuisine: "Torten, Patisserie",
  priceRange: "€€",
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
  loader: () => $getLocale(),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `${site.name} — ${site.tagline}` },
      { name: "description", content: site.description },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: site.name },
      { property: "og:locale", content: site.locale },
      { property: "og:title", content: `${site.name} — ${site.tagline}` },
      { property: "og:description", content: site.description },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#FBF8F2" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(bakeryJsonLd),
      },
    ],
  }),
  shellComponent: RootDocument,
});

function HtmlLangSync() {
  const { locale } = useI18n();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}

function RootDocument({ children }: { readonly children: React.ReactNode }) {
  const initialLocale = Route.useLoaderData();

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <I18nProvider initialLocale={initialLocale}>
          <CartProvider>
            <HtmlLangSync />
            <ThemeParamSync />
            {children}
            <Toaster richColors />
          </CartProvider>
        </I18nProvider>

        <TanStackDevtools
          plugins={[
            { name: "TanStack Query", render: <ReactQueryDevtoolsPanel /> },
            { name: "TanStack Router", render: <TanStackRouterDevtoolsPanel /> },
            a11yDevtoolsPlugin(),
          ]}
        />

        <Scripts />
      </body>
    </html>
  );
}
