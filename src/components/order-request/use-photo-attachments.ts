import { useEffect, useRef, useState } from "react";

import { compressImage } from "#/lib/image-compress";
import { site } from "#/lib/site";

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface Attachment {
  id: string;
  file: File;
  name: string;
  previewUrl: string;
}

export type PhotoMessage =
  | { type: "type"; name: string }
  | { type: "size"; name: string }
  | { type: "decode"; name: string }
  | { type: "count" };

/**
 * Fotos fürs Anfrage-Formular: prüft Typ und Anzahl, verkleinert im
 * Browser und verwaltet die Vorschau-URLs (werden beim Entfernen und
 * beim Verlassen der Seite wieder freigegeben).
 */
export function usePhotoAttachments() {
  const [photos, setPhotos] = useState<Attachment[]>([]);
  const [messages, setMessages] = useState<PhotoMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const objectUrls = useRef(new Set<string>());

  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  async function add(files: File[]) {
    const { maxFiles, maxBytes } = site.shop.upload;
    const nextMessages: PhotoMessage[] = [];
    const room = Math.max(0, maxFiles - photos.length);
    if (files.length > room) nextMessages.push({ type: "count" });

    setBusy(true);
    const accepted: Attachment[] = [];
    for (const file of files.slice(0, room)) {
      if (!ACCEPTED_TYPES.has(file.type)) {
        nextMessages.push({ type: "type", name: file.name });
        continue;
      }
      try {
        const prepared = await compressImage(file);
        if (prepared.size > maxBytes) {
          nextMessages.push({ type: "size", name: file.name });
          continue;
        }
        const previewUrl = URL.createObjectURL(prepared);
        objectUrls.current.add(previewUrl);
        accepted.push({ id: crypto.randomUUID(), file: prepared, name: file.name, previewUrl });
      } catch {
        nextMessages.push({ type: "decode", name: file.name });
      }
    }
    setPhotos((current) => [...current, ...accepted].slice(0, maxFiles));
    setMessages(nextMessages);
    setBusy(false);
  }

  function remove(id: string) {
    setPhotos((current) => {
      const photo = current.find((p) => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.previewUrl);
        objectUrls.current.delete(photo.previewUrl);
      }
      return current.filter((p) => p.id !== id);
    });
    setMessages([]);
  }

  return { photos, messages, busy, add, remove };
}
