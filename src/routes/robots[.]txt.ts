import { createFileRoute } from "@tanstack/react-router";

import { site } from "#/lib/site";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () => {
        const body = `User-agent: *
Allow: /
Disallow: /app
Disallow: /login
Disallow: /signup
Disallow: /api/

Sitemap: ${site.url}/sitemap.xml
`;
        return new Response(body, {
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      },
    },
  },
});
