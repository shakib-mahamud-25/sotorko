/**
 * Strips ALL metadata (including EXIF GPS tags) from an image by
 * redrawing it onto a <canvas> and re-exporting. Canvas re-encoding
 * does not carry EXIF data through — this is a deliberate property
 * we rely on, not an incidental one, per PRD §6 "Photo(s) for
 * moderators only" and Technical Architecture §11 "Remove EXIF
 * metadata... automatically."
 *
 * This runs BEFORE upload, entirely in the browser. The metadata
 * never leaves the user's device, which is a stronger privacy
 * property than stripping it server-side after upload.
 *
 * Also downscales to a max dimension and re-compresses as JPEG to
 * keep uploads reasonable on low-bandwidth connections (Architecture
 * §12 "usable on slower mobile networks").
 */

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB input cap, pre-processing
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export class ImageProcessingError extends Error {}

export function validatePhotoFile(file: File): void {
  if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp|heic)$/i)) {
    throw new ImageProcessingError(
      `${file.name}: unsupported file type. Use JPEG, PNG, WebP, or HEIC.`
    );
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ImageProcessingError(`${file.name}: file too large (max 8MB).`);
  }
}

export async function stripMetadataAndCompress(file: File): Promise<File> {
  validatePhotoFile(file);

  const bitmap = await createImageBitmap(file);

  let { width, height } = bitmap;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new ImageProcessingError("Could not process image in this browser.");
  }

  // Drawing to canvas discards all EXIF/metadata by construction —
  // only pixel data is retained.
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );

  if (!blob) {
    throw new ImageProcessingError("Could not process image in this browser.");
  }

  const cleanName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], cleanName, { type: "image/jpeg" });
}

export async function processPhotos(
  files: File[],
  onProgress?: (completed: number, total: number) => void
): Promise<{ processed: File[]; errors: string[] }> {
  const processed: File[] = [];
  const errors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      processed.push(await stripMetadataAndCompress(files[i]));
    } catch (err) {
      errors.push(err instanceof Error ? err.message : `${files[i].name}: processing failed.`);
    }
    onProgress?.(i + 1, files.length);
  }

  return { processed, errors };
}
