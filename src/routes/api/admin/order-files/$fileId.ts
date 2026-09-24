import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";

import { _getUser } from "#/lib/auth/functions";
import { db } from "#/lib/db";
import { orderFiles } from "#/lib/db/schema";
import { readStoredFile } from "#/lib/server/uploads.server";

const notFound = () => new Response("Not found", { status: 404 });

/** Kundenfotos nur für eingeloggte Admins, nie gecacht. Suche nur über die ID. */
export const Route = createFileRoute("/api/admin/order-files/$fileId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const user = await _getUser();
        if (!user) return new Response("Unauthorized", { status: 401 });

        const id = Number(params.fileId);
        if (!Number.isInteger(id) || id <= 0) return notFound();
        const [file] = await db.select().from(orderFiles).where(eq(orderFiles.id, id)).limit(1);
        if (!file) return notFound();

        try {
          const buffer = await readStoredFile(file.storageKey);
          const name = `${file.originalName.replace(/\.[^.]+$/, "")}.webp`;
          return new Response(new Uint8Array(buffer), {
            headers: {
              "Content-Type": file.mime,
              "Cache-Control": "private, no-store",
              "X-Content-Type-Options": "nosniff",
              "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(name)}`,
            },
          });
        } catch {
          return notFound();
        }
      },
    },
  },
});
