import { Link, type LinkProps } from "@tanstack/react-router";
import { ArrowLeftIcon, TriangleAlertIcon } from "lucide-react";

import { Eyebrow, textLinkClass } from "#/components/ck/primitives";
import { cn } from "#/lib/utils";

/**
 * Bausteine für die Admin-Seiten: Titelzeile, Panel, Tabelle, Leerzustand.
 * Gleiche Sprache wie der Shop (Haarlinien, Creme-Flächen, Cinzel-Titel),
 * nur dichter gesetzt.
 */

export function AdminHeading({
  title,
  eyebrow,
  actions,
}: {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className={cn("ck-title text-brand", eyebrow && "mt-2")}>{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function AdminPanel({
  title,
  className,
  children,
}: {
  title?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-md border border-hairline bg-surface p-5", className)}>
      {title && <h2 className="mb-4 ck-eyebrow text-rosegold-600">{title}</h2>}
      {children}
    </section>
  );
}

export function AdminTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border border-hairline bg-surface">
      <table className="w-full text-left text-ink ck-body-sm">{children}</table>
    </div>
  );
}

export const adminTh = "px-4 py-3 ck-eyebrow tracking-label font-normal text-ink-muted";
export const adminTd = "px-4 py-3 align-top";
export const adminTr =
  "border-b border-hairline last:border-0 transition-colors duration-(--dur-fast) ease-out hover:bg-sunken/60";
export const adminTheadTr = "border-b border-hairline";

export function AdminEmpty({ children }: { children: React.ReactNode }) {
  return <p className="py-12 text-center ck-lede text-ink-muted">{children}</p>;
}

export function AdminBack({ children, ...props }: LinkProps & { children: React.ReactNode }) {
  return (
    <Link {...props} className={textLinkClass()}>
      <ArrowLeftIcon aria-hidden strokeWidth={1.5} className="size-3.5" />
      {children}
    </Link>
  );
}

/** Definitionsliste in Panels: gedämpfter Begriff, Wert in Kakao. */
export function AdminField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="ck-eyebrow tracking-label text-ink-subtle">{label}</dt>
      <dd className="mt-1 text-ink">{children}</dd>
    </div>
  );
}

/** Hinweisband über dem Inhalt, z. B. wenn der E-Mail-Versand nicht eingerichtet ist. */
export function AdminNotice({
  title,
  className,
  children,
}: {
  title: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-md border border-l-2 border-hairline border-l-warning bg-warning-bg px-4 py-3 text-ink ck-body-sm",
        className,
      )}
    >
      <TriangleAlertIcon
        aria-hidden
        strokeWidth={1.5}
        className="mt-0.5 size-4 shrink-0 text-warning"
      />
      <div>
        <p className="font-medium">{title}</p>
        {children && <div className="mt-0.5 text-ink-muted">{children}</div>}
      </div>
    </div>
  );
}
