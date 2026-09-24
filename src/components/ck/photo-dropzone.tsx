import { ImagePlusIcon, LoaderCircleIcon, XIcon } from "lucide-react";
import { useId, useState } from "react";

import { IconButton } from "#/components/ck/icon-button";
import { cn } from "#/lib/utils";

export interface PhotoPreview {
  id: string;
  name: string;
  previewUrl: string;
}

/**
 * Foto-Upload: Ablagefläche als <label> um ein fokussierbares, visuell
 * verstecktes Datei-Feld (Tastatur, Klick und Drag-and-drop), darunter
 * Vorschaubilder mit Entfernen-Knopf. Meldungen landen in einer
 * höflichen Live-Region.
 */
export function PhotoDropzone({
  photos,
  max,
  busy,
  messages,
  onAdd,
  onRemove,
  labels,
}: {
  photos: PhotoPreview[];
  max: number;
  busy: boolean;
  messages: string[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  labels: {
    title: string;
    hint: string;
    cta: string;
    dragHint: string;
    count: (n: number, max: number) => string;
    processing: string;
    alt: (n: number) => string;
    remove: (n: number) => string;
  };
}) {
  const inputId = useId();
  const hintId = useId();
  const [dragging, setDragging] = useState(false);
  const full = photos.length >= max;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="ck-label text-ink-muted">{labels.title}</span>
        <span className="text-ink-subtle tabular-nums ck-body-sm">
          {labels.count(photos.length, max)}
        </span>
      </div>
      {/* Drag-and-drop ergänzt nur: Tastatur und Klick laufen über das Datei-Feld. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          if (!full) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!full) onAdd([...event.dataTransfer.files]);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-hairline-strong bg-surface px-6 py-8 text-center transition-[border-color,background-color] duration-(--dur-fast) ease-out hover:border-hairline-accent has-focus-visible:shadow-(--focus-ring)",
          dragging && "border-hairline-accent bg-accent-soft",
          full && "pointer-events-none opacity-50",
        )}
      >
        <input
          id={inputId}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={full}
          aria-describedby={hintId}
          onChange={(event) => {
            const files = event.currentTarget.files ? [...event.currentTarget.files] : [];
            // Zurücksetzen, damit dieselbe Datei erneut gewählt werden kann.
            event.currentTarget.value = "";
            onAdd(files);
          }}
        />
        {busy ? (
          <LoaderCircleIcon
            aria-hidden
            strokeWidth={1.5}
            className="size-6 animate-spin text-rosegold-600"
          />
        ) : (
          <ImagePlusIcon aria-hidden strokeWidth={1.5} className="size-6 text-rosegold-600" />
        )}
        <span className="ck-label text-brand">{busy ? labels.processing : labels.cta}</span>
        <span id={hintId} className="text-ink-muted ck-body-sm">
          {labels.hint}
          <span className="hidden md:inline"> {labels.dragHint}</span>
        </span>
      </label>

      <div aria-live="polite" className="flex flex-col gap-1">
        {messages.map((message) => (
          <span key={message} className="text-error ck-body-sm">
            {message}
          </span>
        ))}
      </div>

      {photos.length > 0 && (
        <ul className="grid grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              className="relative aspect-square overflow-hidden rounded-sm border border-hairline bg-sunken"
            >
              <img
                src={photo.previewUrl}
                alt={labels.alt(index + 1)}
                className="size-full object-cover"
              />
              <IconButton
                size="sm"
                variant="filled"
                label={labels.remove(index + 1)}
                className="absolute top-1.5 right-1.5"
                onClick={() => onRemove(photo.id)}
              >
                <XIcon strokeWidth={1.5} />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
