import type {
  EditorSettings,
  PhotoLayout,
  PhotoRecord,
} from "@/features/photobooth/types/photobooth.types";
import { createEditorSettings } from "@/features/photobooth/utils/photobooth-presets";

const STRIP_FRAME_COLOR = "#fffaf0"; // Polaroid cream color

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load photo for editing."));
    image.src = source;
  });
}

function buildCanvasFilter(settings: EditorSettings): string {
  return [
    `brightness(${settings.brightness}%)`,
    `contrast(${settings.contrast}%)`,
    `saturate(${settings.saturation}%)`,
  ].join(" ");
}

function drawRetroFinish(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  context.save();

  for (let line = 0; line < height; line += 4) {
    context.fillStyle = "rgba(33, 22, 58, 0.045)";
    context.fillRect(0, line, width, 2);
  }

  const grainCount = Math.floor((width * height) / 1800);
  for (let index = 0; index < grainCount; index += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const alpha = Math.random() * 0.08;
    context.fillStyle = `rgba(255, 248, 220, ${alpha})`;
    context.fillRect(x, y, 1.5, 1.5);
  }

  context.strokeStyle = "rgba(255, 246, 235, 0.75)";
  context.lineWidth = Math.max(10, width * 0.018);
  context.strokeRect(0, 0, width, height);
  context.restore();
}

function drawVignette(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  vignette: number,
): void {
  if (vignette <= 0) {
    return;
  }

  const maxRadius = Math.max(width, height) * 0.7;
  const gradient = context.createRadialGradient(
    width / 2,
    height / 2,
    maxRadius * 0.25,
    width / 2,
    height / 2,
    maxRadius,
  );

  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, `rgba(0, 0, 0, ${clamp(vignette / 100, 0, 0.6)})`);

  context.save();
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.restore();
}

const POLAROID_FRAME_COLOR = "#fffaf0";

async function renderSinglePhoto(
  sourceImage: string,
  settings: EditorSettings,
): Promise<string> {
  const image = await loadImage(sourceImage);

  // Polaroid frame dimensions
  const framePadding = 24;
  const bottomPadding = 100; // Larger bottom for watermark
  const photoWidth = image.naturalWidth;
  const photoHeight = image.naturalHeight;

  const canvas = document.createElement("canvas");
  canvas.width = photoWidth + framePadding * 2;
  canvas.height = photoHeight + framePadding + bottomPadding;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas rendering is unavailable in this browser.");
  }

  // Fill with Polaroid frame color
  context.fillStyle = POLAROID_FRAME_COLOR;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Create temporary canvas for photo with filters
  const photoCanvas = document.createElement("canvas");
  photoCanvas.width = photoWidth;
  photoCanvas.height = photoHeight;
  const photoCtx = photoCanvas.getContext("2d");
  if (!photoCtx) throw new Error("Unable to create photo canvas");

  // Apply filters to photo
  photoCtx.filter = buildCanvasFilter(settings);
  photoCtx.drawImage(image, 0, 0, photoWidth, photoHeight);
  photoCtx.filter = "none";

  // Apply vignette to photo
  drawVignette(photoCtx, photoWidth, photoHeight, settings.vignette);

  // Draw the processed photo onto the main canvas
  context.drawImage(photoCanvas, framePadding, framePadding, photoWidth, photoHeight);

  // Add subtle shadow effect to photo area
  context.strokeStyle = "rgba(0, 0, 0, 0.08)";
  context.lineWidth = 1;
  context.strokeRect(framePadding, framePadding, photoWidth, photoHeight);

  // Add FLASHFRAME watermark - proportional to image width
  const fontSize = Math.max(54, Math.floor(canvas.width * 0.13)); // 13% of width, min 54px
  context.fillStyle = "#4a445e";
  context.font = `700 ${fontSize}px var(--font-geist-sans), sans-serif`;
  context.textAlign = "center";
  context.fillText("FLASHFRAME", canvas.width / 2, canvas.height - Math.floor(bottomPadding / 2.5));

  return canvas.toDataURL("image/jpeg", 0.92);
}

async function renderStripPhoto(
  sourceImages: string[],
  settings: EditorSettings,
): Promise<string> {
  const images = await Promise.all(sourceImages.map((source) => loadImage(source)));
  const framePadding = 22;
  const innerWidth = 340;
  const slotHeight = 220;
  const gap = 16;
  const footerHeight = 84;
  const canvas = document.createElement("canvas");
  canvas.width = innerWidth + framePadding * 2;
  canvas.height =
    framePadding * 2 + slotHeight * images.length + gap * (images.length - 1) + footerHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas rendering is unavailable in this browser.");
  }

  context.fillStyle = STRIP_FRAME_COLOR;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Render each image with filters and vignette applied individually
  images.forEach((image, index) => {
    const scale = Math.max(innerWidth / image.naturalWidth, slotHeight / image.naturalHeight);
    const drawnWidth = image.naturalWidth * scale;
    const drawnHeight = image.naturalHeight * scale;
    const x = framePadding + (innerWidth - drawnWidth) / 2;
    const y = framePadding + index * (slotHeight + gap) + (slotHeight - drawnHeight) / 2;

    // Create a temporary canvas for each image to apply effects individually
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = innerWidth;
    tempCanvas.height = slotHeight;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Apply filters
    tempCtx.filter = buildCanvasFilter(settings);
    tempCtx.drawImage(image, (innerWidth - drawnWidth) / 2, (slotHeight - drawnHeight) / 2, drawnWidth, drawnHeight);
    tempCtx.filter = "none";

    // Apply vignette to individual photo
    drawVignette(tempCtx, innerWidth, slotHeight, settings.vignette);

    // Draw the processed image to main canvas
    context.drawImage(tempCanvas, x, y, innerWidth, slotHeight);
  });

  // Add FLASHFRAME watermark - proportional to image width
  const fontSize = Math.max(32, Math.floor(canvas.width * 0.10)); // 10% of width, min 32px
  context.fillStyle = "#4a445e";
  context.font = `700 ${fontSize}px var(--font-geist-sans), sans-serif`;
  context.textAlign = "center";
  context.fillText("FLASHFRAME", canvas.width / 2, canvas.height - Math.floor(footerHeight / 2.5));

  return canvas.toDataURL("image/jpeg", 0.92);
}

export async function renderPhotoDataUrl(options: {
  sourceImage: string;
  settings: EditorSettings;
  layout: PhotoLayout;
  stripSources?: string[];
}): Promise<string> {
  if (options.layout === "strip") {
    const stripSources =
      options.stripSources && options.stripSources.length > 0
        ? options.stripSources.slice(0, 3)
        : [options.sourceImage];
    return renderStripPhoto(stripSources, options.settings);
  }

  return renderSinglePhoto(options.sourceImage, options.settings);
}

export function getDefaultEditorSettings(): EditorSettings {
  return createEditorSettings("original");
}

export function getStripSources(
  selectedPhotoId: string,
  photos: PhotoRecord[],
): string[] {
  const selectedPhoto = photos.find((photo) => photo.id === selectedPhotoId);
  const additionalPhotos = photos
    .filter((photo) => photo.id !== selectedPhotoId)
    .slice(0, 2)
    .map((photo) => photo.sourceImage);

  if (!selectedPhoto) {
    return additionalPhotos;
  }

  if (selectedPhoto.stripImages && selectedPhoto.stripImages.length === 3) {
    return selectedPhoto.stripImages;
  }

  return [selectedPhoto.sourceImage, ...additionalPhotos].slice(0, 3);
}
