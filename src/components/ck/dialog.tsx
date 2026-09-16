import { XIcon } from "lucide-react";
import { useEffect, useId, useRef } from "react";

import { IconButton } from "#/components/ck/icon-button";

/**
 * Modaler Dialog: Scrim, Panel mit 2-px-Roségold-Oberkante, Escape und
 * Klick auf den Scrim schließen. Beim Öffnen wandert der Fokus auf den
 * Schließen-Knopf.
 */
export function Dialog({
  open,
  onClose,
  eyebrow,
  title,
  footer,
  width = 480,
  children,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  children?: React.ReactNode;
}) {
  const uid = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 animate-in cursor-default bg-scrim duration-(--dur-base) fade-in"
      />
      <div
        // Bewusst div + ARIA statt <dialog>: Escape und Fokus werden hier
        // selbst gesteuert, <dialog> ohne showModal() bringt keine Fokusfalle.
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? `${uid}-title` : undefined}
        style={{ maxWidth: width }}
        className="relative flex max-h-[90vh] w-full animate-in flex-col rounded-md border-t-2 border-accent bg-surface shadow-lg duration-(--dur-base) fade-in slide-in-from-bottom-3"
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            {eyebrow && <div className="mb-2 ck-eyebrow text-rosegold-600">{eyebrow}</div>}
            {title && (
              <div id={`${uid}-title`} className="text-xl ck-title tracking-[0.06em] text-ink">
                {title}
              </div>
            )}
          </div>
          <IconButton
            ref={closeRef}
            size="sm"
            label="Schließen"
            onClick={onClose}
            className="-mt-1.5 -mr-1.5 text-ink-muted"
          >
            <XIcon strokeWidth={1.5} />
          </IconButton>
        </div>
        <div className="overflow-auto px-6 py-4 text-ink ck-body">{children}</div>
        {footer && <div className="flex justify-end gap-2.5 px-6 pb-6">{footer}</div>}
      </div>
    </div>
  );
}
