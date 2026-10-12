/** Kundenfotos: prüfen, neu kodieren (ohne EXIF/GPS) und außerhalb von `public` ablegen. */
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { env } from "#/env/server";
import { site } from "#/lib/site";

// Kleiner Server: kein Bild-Cache, ein Thread reicht für Formular-Uploads.
sharp.cache(false);
sharp.concurrency(1);

const MAX_EDGE_PX = 2400;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export class UploadError extends Error {
  constructor(readonly index: number) {
    super(`Ungültiges Bild (#${index + 1})`);
    this.name = "UploadError";
  }
}

/** Echten Typ an den ersten Bytes erkennen, nie der Endung oder dem Browser glauben. */
export function isSupportedImage(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true; // JPEG
  if (buf.subarray(0, 8).equals(PNG_MAGIC)) return true;
  return (
    buf.subarray(0, 4).toString("latin1") === "RIFF" &&
    buf.subarray(8, 12).toString("latin1") === "WEBP"
  );
}

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  originalName: string;
}

/** Prüfen, nach EXIF drehen, verkleinern und als WebP ohne Metadaten neu kodieren. */
export async function processImage(file: File, index: number): Promise<ProcessedImage> {
  if (file.size === 0 || file.size > site.shop.upload.maxBytes) throw new UploadError(index);
  const input = Buffer.from(await file.arrayBuffer());
  if (!isSupportedImage(input)) throw new UploadError(index);
  try {
    const { data, info } = await sharp(input, { failOn: "error", limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: MAX_EDGE_PX, height: MAX_EDGE_PX, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });
    return {
      buffer: data,
      width: info.width,
      height: info.height,
      originalName: file.name.slice(0, 200) || `foto-${index + 1}`,
    };
  } catch {
    throw new UploadError(index);
  }
}

function absolutePath(storageKey: string): string {
  return path.join(path.resolve(env.UPLOAD_DIR), storageKey);
}

/** Legt das Bild unter orders/JJJJ/MM/<uuid>.webp ab und gibt den Schlüssel zurück. */
export async function storeImage(image: ProcessedImage): Promise<string> {
  const now = new Date();
  const key = path.posix.join(
    "orders",
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, "0"),
    `${randomUUID()}.webp`,
  );
  const target = absolutePath(key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, image.buffer, { flag: "wx" });
  return key;
}

/** Schlüssel kommen nur aus der Datenbank, nie aus der Anfrage. */
export function readStoredFile(storageKey: string): Promise<Buffer> {
  return readFile(absolutePath(storageKey));
}

export async function removeStoredFiles(storageKeys: string[]): Promise<void> {
  await Promise.all(storageKeys.map((key) => rm(absolutePath(key), { force: true })));
}
