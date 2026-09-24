import { useMutation, useQuery } from "@tanstack/react-query";
import { SendIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminField, AdminNotice, AdminPanel } from "#/components/ck/admin";
import { Badge } from "#/components/ck/badge";
import { Button } from "#/components/ck/button";
import { Input } from "#/components/ck/input";
import { $adminGetMailStatus, $adminSendTestEmail } from "#/lib/server/admin";
import { cn } from "#/lib/utils";

function useMailStatus() {
  return useQuery({
    queryKey: ["admin", "mail"],
    queryFn: ({ signal }) => $adminGetMailStatus({ signal }),
    staleTime: 60_000,
  });
}

/** Hinweis oben auf der Seite, solange kein SMTP eingerichtet ist. */
export function MailNotConfiguredNotice({ className }: { className?: string }) {
  const { data: mail } = useMailStatus();
  if (!mail || mail.configured) return null;
  return (
    <AdminNotice title="E-Mail-Versand ist nicht eingerichtet" className={className}>
      Anfragen kommen an, aber weder die Kundinnen noch das Team bekommen E-Mails. Details unten im
      Bereich E-Mail-Versand.
    </AdminNotice>
  );
}

/** SMTP-Status und Test-Mail, um den Versand nach einem Deploy zu prüfen. */
export function MailPanel({ className }: { className?: string }) {
  const { data: mail } = useMailStatus();
  const [recipient, setRecipient] = useState("");

  const test = useMutation({
    mutationFn: (to: string) => $adminSendTestEmail({ data: { to } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(
          result.code === "MAIL_NOT_CONFIGURED"
            ? "SMTP ist nicht eingerichtet."
            : "Test-Mail nicht gefunden.",
        );
        return;
      }
      if (result.status === "sent") toast.success("Test-Mail verschickt");
      else if (result.status === "failed") toast.error("Test-Mail fehlgeschlagen");
      else toast.info("Test-Mail wartet auf den nächsten Versuch");
    },
    onError: () => toast.error("Test-Mail konnte nicht angelegt werden"),
  });
  const last = test.data?.ok ? test.data : undefined;

  return (
    <AdminPanel title="E-Mail-Versand" className={className}>
      {!mail ? (
        <p className="text-ink-muted ck-body-sm">Laden …</p>
      ) : (
        <>
          <Badge tone={mail.configured ? "success" : "warning"} dot>
            {mail.configured ? "SMTP eingerichtet" : "Nicht eingerichtet"}
          </Badge>
          {mail.configured ? (
            <dl className="mt-4 grid gap-3 ck-body-sm sm:grid-cols-2">
              <AdminField label="Absender">{mail.from}</AdminField>
              <AdminField label="Neue Anfragen an">{mail.staffRecipients.join(", ")}</AdminField>
            </dl>
          ) : (
            <p className="mt-3 text-ink-muted ck-body-sm">
              Ohne SMTP verschickt die Website keine E-Mails. SMTP_HOST sowie Zugangsdaten
              (SMTP_USER, SMTP_PASS) in der Server-Umgebung setzen und die App neu starten. Nicht
              verschickte Mails lassen sich danach in der jeweiligen Bestellung erneut senden.
            </p>
          )}
        </>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const to = recipient.trim();
          if (to) test.mutate(to);
        }}
        className="mt-5 flex flex-wrap items-end gap-3"
      >
        <Input
          label="Test-Mail an"
          type="email"
          autoComplete="email"
          placeholder="name@beispiel.de"
          required
          value={recipient}
          onChange={(event) => setRecipient(event.target.value)}
          className="min-w-0 flex-1 basis-60"
        />
        <Button
          type="submit"
          variant="secondary"
          icon={<SendIcon strokeWidth={1.5} />}
          disabled={!mail?.configured || test.isPending}
        >
          {test.isPending ? "Wird gesendet …" : "Test-Mail senden"}
        </Button>
      </form>
      <div aria-live="polite">
        {last && (
          <p
            className={cn(
              "mt-3 ck-body-sm",
              last.status === "sent"
                ? "text-success"
                : last.status === "failed"
                  ? "text-error"
                  : "text-warning",
            )}
          >
            {last.status === "sent"
              ? "Gesendet. Bitte im Postfach prüfen, auch im Spam-Ordner."
              : last.status === "failed"
                ? "Fehlgeschlagen."
                : "Noch nicht gesendet, der nächste Versuch folgt automatisch."}
            {last.lastError && <span className="block break-words">{last.lastError}</span>}
          </p>
        )}
      </div>
    </AdminPanel>
  );
}
