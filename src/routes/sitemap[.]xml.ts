import { createFileRoute } from "@tanstack/react-router";

import { listForSitemap } from "#/lib/db/queries";
import { site } from "#/lib/site";

function url(loc: string, lastmod?: Date, priority = 0.6) {
  return `  <url><loc>${site.url}${loc}</loc>${
    lastmod ? `<lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>` : ""
  }<priority>${priority}</priority></url>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const products = await listForSitemap();
        const entries: string[] = [
          url("/", undefined, 1),
          url("/torten", undefined, 0.9),
          url("/fuellungen", undefined, 0.7),
          url("/galerie", undefined, 0.6),
          url("/kontakt", undefined, 0.6),
        ];
        for (const p of products) entries.push(url(`/torten/${p.slug}`, p.updatedAt, 0.8));

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;
        return new Response(xml, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
          },
        });
      },
    },
  },
});
