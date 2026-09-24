/**
 * Nur im Browser: Fotos vor dem Upload verkleinern (JPEG, längste Kante
 * 2560 px). Spart mobiles Datenvolumen, entfernt nebenbei Kamera- und
 * GPS-Daten und hält Handyfotos unter dem 6-MB-Limit. Der Server kodiert
 * trotzdem neu; das hier ist nur die Vorstufe.
 */
const MAX_EDGE_PX = 2560;
const JPEG_QUALITY = 0.85;

export class ImageDecodeError extends Error {
  constructor(readonly fileName: string) {
    super(`Bild nicht lesbar: ${fileName}`);
    this.name = "ImageDecodeError";
  }
}

export async function compressImage(file: File): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ImageDecodeError(file.name);
  }

  const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return file;
  }
  // Weißer Grund, damit transparente PNGs nicht schwarz werden.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
  });
  if (!blob || (blob.size >= file.size && file.type === "image/jpeg")) return file;
  const baseName = file.name.replace(/\.[^.]+$/, "") || "foto";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}
