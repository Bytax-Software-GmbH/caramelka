import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCwIcon } from "lucide-react";
import { toast } from "sonner";

import { AdminPanel } from "#/components/ck/admin";
import { Badge, type BadgeTone } from "#/components/ck/badge";
import { Button } from "#/components/ck/button";
import type { EmailKind, EmailStatus } from "#/lib/db/schema/caramelka.schema";
import { $adminResendEmail } from "#/lib/server/admin";

import { formatDateTime } from "./format";

const EMAIL_KIND_LABEL: Record<EmailKind, string> = {
  request_received: "Eingangsbestätigung an die Kundin",
  staff_new_request: "Info an das Team",
  order_confirmed: "Bestätigung",
  order_declined: "Absage",
  test: "Test-Mail",
};

const EMAIL_STATUS: Record<EmailStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Wartet", tone: "warning" },
  sending: { label: "Wird gesendet", tone: "info" },
  sent: { label: "Gesendet", tone: "success" },
  failed: { label: "Fehlgeschlagen", tone: "error" },
};

export interface OrderEmail {
  id: number;
  kind: EmailKind;
  recipient: string;
  status: EmailStatus;
  attempts: number;
  lastError: string | null;
  nextAttemptAt: Date;
  sentAt: Date | null;
  createdAt: Date;
}

/** E-Mail-Verlauf einer Bestellung, neueste zuerst, mit erneutem Versand. */
export function OrderEmailLog({
  emails,
  mailConfigured,
}: {
  emails: OrderEmail[];
  mailConfigured: boolean;
}) {
  const queryClient = useQueryClient();
  const resend = useMutation({
    mutationFn: (id: number) => $adminResendEmail({ data: { id } }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      if (!result.ok) {
        toast.error(
          result.code === "MAIL_NOT_CONFIGURED"
            ? "SMTP ist nicht eingerichtet."
            : "E-Mail nicht gefunden.",
        );
        return;
      }
      const description = result.lastError ?? undefined;
      if (result.status === "sent") toast.success("E-Mail gesendet");
      else if (result.status === "failed") toast.error("Versand fehlgeschlagen", { description });
      else toast.info("E-Mail wartet auf den nächsten Versuch", { description });
    },
    onError: () => toast.error("Erneutes Senden fehlgeschlagen"),
  });

  return (
    <AdminPanel title="E-Mail-Verlauf">
      {emails.length === 0 ? (
        <p className="text-ink-muted ck-body-sm">
          Zu dieser Bestellung gibt es noch keine E-Mails.
        </p>
      ) : (
        <ul className="divide-y divide-hairline ck-body-sm">
          {emails.map((email) => {
            const status = EMAIL_STATUS[email.status];
            const busy = resend.isPending && resend.variables === email.id;
            return (
              <li
                key={email.id}
                className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1 basis-56">
                  <p className="text-ink">{EMAIL_KIND_LABEL[email.kind]}</p>
                  <p className="break-all text-ink-muted">an {email.recipient}</p>
                  {email.lastError && email.status !== "sent" && (
                    <p className="mt-1 break-words text-error">{email.lastError}</p>
                  )}
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-right">
                    <Badge tone={status.tone}>{status.label}</Badge>
                    <p className="mt-1.5 whitespace-nowrap text-ink-muted">
                      {email.sentAt
                        ? formatDateTime(email.sentAt)
                        : `angelegt ${formatDateTime(email.createdAt)}`}
                    </p>
                    {email.attempts > 0 && (email.status !== "sent" || email.attempts > 1) && (
                      <p className="whitespace-nowrap text-ink-muted">
                        {email.attempts === 1 ? "1 Versuch" : `${email.attempts} Versuche`}
                      </p>
                    )}
                    {email.status === "pending" && email.attempts > 0 && (
                      <p className="whitespace-nowrap text-ink-muted">
                        nächster Versuch {formatDateTime(email.nextAttemptAt)}
                      </p>
                    )}
                  </div>
                  {email.status !== "sending" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<RotateCwIcon strokeWidth={1.5} />}
                      disabled={!mailConfigured || resend.isPending}
                      title={mailConfigured ? undefined : "SMTP ist nicht eingerichtet"}
                      onClick={() => resend.mutate(email.id)}
                    >
                      {busy ? "Sendet …" : "Erneut senden"}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AdminPanel>
  );
}
