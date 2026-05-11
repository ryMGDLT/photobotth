import { sessionGallerySchema } from "@/features/photobooth/schemas/photobooth.schema";
import type {
  ChangePhotoStatusInput,
  CreateCaptureInput,
  DeletePhotoInput,
  DuplicatePhotoInput,
  EditorSettings,
  HydratedSessionGallery,
  PhotoLayout,
  PhotoRecord,
  SessionGallery,
  UpdatePhotoEditsInput,
} from "@/features/photobooth/types/photobooth.types";
import {
  createPhotoId,
  createPhotoName,
  createSessionId,
  getPhotoById,
  isSameSession,
  SESSION_ID_KEY,
  sortPhotosByNewest,
} from "@/features/photobooth/utils/photobooth-helpers";
import {
  getDefaultEditorSettings,
  getStripSources,
  renderPhotoDataUrl,
  renderHighQualityPhoto,
} from "@/features/photobooth/services/photo-editor.service";
import { 
  getCurrentExportConfig, 
  applyExportPreset,
  estimateFileSize,
  estimateProcessingTime 
} from "@/features/photobooth/services/export-config";

const DATABASE_NAME = "flashframe-photobooth";
const DATABASE_VERSION = 1;
const GALLERY_STORE = "session-galleries";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Storage is only available in the browser."));
      return;
    }
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(GALLERY_STORE)) {
        database.createObjectStore(GALLERY_STORE, { keyPath: "sessionId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new Error("Unable to open local photo storage for this session."));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase();

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(GALLERY_STORE, mode);
    const store = transaction.objectStore(GALLERY_STORE);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new Error("A browser storage request failed for this session."));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(new Error("Unable to complete the browser storage transaction."));
    };
  });
}

async function getAllGalleries(): Promise<SessionGallery[]> {
  const allRecords = await withStore("readonly", (store) => store.getAll());
  const parsedRecords = sessionGallerySchema.array().safeParse(allRecords);
  return parsedRecords.success ? parsedRecords.data : [];
}

async function getGalleryBySessionId(sessionId: string): Promise<SessionGallery | null> {
  const record = await withStore("readonly", (store) => store.get(sessionId));
  const parsedRecord = sessionGallerySchema.safeParse(record);
  return parsedRecord.success ? parsedRecord.data : null;
}

async function saveGallery(gallery: SessionGallery): Promise<void> {
  await withStore("readwrite", (store) => store.put(gallery));
}

async function deleteGallery(sessionId: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(sessionId));
}

function getOrCreateSessionId(storage: Storage): string {
  const existingSessionId = storage.getItem(SESSION_ID_KEY);
  if (existingSessionId) {
    return existingSessionId;
  }

  const sessionId = createSessionId();
  storage.setItem(SESSION_ID_KEY, sessionId);
  return sessionId;
}

function toSessionGallery(sessionId: string, photos: PhotoRecord[]): SessionGallery {
  return {
    version: 2,
    sessionId,
    photos: sortPhotosByNewest(photos),
  };
}

async function persistPhotos(sessionId: string, photos: PhotoRecord[]): Promise<PhotoRecord[]> {
  const nextGallery = toSessionGallery(sessionId, photos);
  await saveGallery(nextGallery);
  return nextGallery.photos;
}

export async function clearExpiredSessionData(currentSessionId?: string): Promise<void> {
  if (typeof window === "undefined") return;
  const galleries = await getAllGalleries();
  const activeSessionId = currentSessionId ?? window.sessionStorage.getItem(SESSION_ID_KEY);

  await Promise.all(
    galleries
      .filter((gallery) => !activeSessionId || !isSameSession(gallery.sessionId, activeSessionId))
      .map((gallery) => deleteGallery(gallery.sessionId)),
  );
}

export async function hydrateSessionGallery(): Promise<HydratedSessionGallery> {
  if (typeof window === "undefined") return { sessionId: "", photos: [] };
  const sessionId = getOrCreateSessionId(window.sessionStorage);
  await clearExpiredSessionData(sessionId);
  const gallery = await getGalleryBySessionId(sessionId);

  if (!gallery) {
    return { sessionId, photos: [] };
  }

  return { sessionId, photos: sortPhotosByNewest(gallery.photos) };
}

export async function createCapture(
  input: CreateCaptureInput,
): Promise<HydratedSessionGallery> {
  const now = new Date().toISOString();
  const settings = getDefaultEditorSettings();
  const nextPhoto: PhotoRecord = {
    id: createPhotoId(),
    sessionId: input.sessionId,
    mediaType: input.mediaType ?? "photo",
    status: input.status ?? "draft",
    createdAt: now,
    updatedAt: now,
    sourceImage: input.sourceImage,
    renderedImage: input.sourceImage,
    sourceVideo: input.sourceVideo,
    renderedVideo: input.renderedVideo,
    durationMs: input.durationMs,
    stripImages: input.stripImages,
    cameraFilter: input.cameraFilter,
    settings,
    layout: input.layout ?? "single",
    name:
      input.name ??
      createPhotoName(
        input.status ?? "draft",
        input.photos.length + 1,
        input.mediaType ?? "photo",
      ),
  };

  const photos = await persistPhotos(input.sessionId, [nextPhoto, ...input.photos]);
  return { sessionId: input.sessionId, photos };
}

export async function updatePhotoEdits(
  input: UpdatePhotoEditsInput,
): Promise<HydratedSessionGallery> {
  const targetPhoto = getPhotoById(input.photos, input.photoId);
  if (!targetPhoto) {
    return { sessionId: input.sessionId, photos: input.photos };
  }

  const renderedImage = await renderPhotoDataUrl({
    sourceImage: targetPhoto.sourceImage,
    settings: input.settings,
    layout: input.layout,
    stripSources:
      input.layout === "strip" ? getStripSources(targetPhoto.id, input.photos) : undefined,
    frame: input.frame ?? input.settings.frame,
  });

  const updatedPhotos = input.photos.map((photo) =>
    photo.id === input.photoId
      ? {
          ...photo,
          renderedImage,
          settings: input.settings,
          layout: input.layout,
          updatedAt: new Date().toISOString(),
        }
      : photo,
  );

  const photos = await persistPhotos(input.sessionId, updatedPhotos);
  return { sessionId: input.sessionId, photos };
}

export async function changePhotoStatus(
  input: ChangePhotoStatusInput,
): Promise<HydratedSessionGallery> {
  const updatedPhotos = input.photos.map((photo) =>
    photo.id === input.photoId
      ? {
          ...photo,
          status: input.status,
          name:
            photo.name ??
            createPhotoName(input.status, input.photos.length, photo.mediaType),
          updatedAt: new Date().toISOString(),
        }
      : photo,
  );

  const photos = await persistPhotos(input.sessionId, updatedPhotos);
  return { sessionId: input.sessionId, photos };
}

export async function deletePhoto(
  input: DeletePhotoInput,
): Promise<HydratedSessionGallery> {
  const updatedPhotos = input.photos.filter((photo) => photo.id !== input.photoId);
  const photos = await persistPhotos(input.sessionId, updatedPhotos);
  return { sessionId: input.sessionId, photos };
}

export async function duplicatePhoto(
  input: DuplicatePhotoInput,
): Promise<HydratedSessionGallery> {
  const targetPhoto = getPhotoById(input.photos, input.photoId);
  if (!targetPhoto) {
    return { sessionId: input.sessionId, photos: input.photos };
  }

  const now = new Date().toISOString();
  const duplicatedPhoto: PhotoRecord = {
    ...targetPhoto,
    id: createPhotoId(),
    status: "draft",
    createdAt: now,
    updatedAt: now,
    name: `${targetPhoto.name ?? "Photo"} Copy`,
  };

  const photos = await persistPhotos(input.sessionId, [duplicatedPhoto, ...input.photos]);
  return { sessionId: input.sessionId, photos };
}

export function getEmptyEditorState(): {
  layout: PhotoLayout;
  settings: EditorSettings;
} {
  return {
    layout: "single",
    settings: getDefaultEditorSettings(),
  };
}

/**
 * Robustly triggers a browser download for a photo or video.
 * Uses Blobs and temporary DOM attachment to ensure the 'download' attribute
 * and file extensions are honored by all modern browsers.
 */
export async function downloadPhoto(photo: PhotoRecord): Promise<void> {
  if (typeof window === "undefined") return;

  const isVideo = photo.mediaType === "video" && photo.renderedVideo;
  const exportConfig = getCurrentExportConfig();
  
  // Determine file extension based on export configuration
  const extension = isVideo ? "webm" : exportConfig.format;
  
  // For photos, re-render with current export configuration
  let sourceUrl: string;
  if (!isVideo) {
    try {
      // Use high-quality export with current configuration
      sourceUrl = await renderHighQualityPhoto({
        sourceImage: photo.sourceImage,
        settings: photo.settings,
        layout: photo.layout,
        stripSources: photo.layout === "strip" ? getStripSources(photo.id, [photo]) : undefined,
        frame: photo.settings.frame,
      });
    } catch (error) {
      console.warn("High-quality export failed, falling back to cached image:", error);
      sourceUrl = photo.renderedImage;
    }
  } else {
    sourceUrl = photo.renderedVideo!;
  }

  // Sanitize filename: prevent path traversal, remove special chars, normalize
  const rawName = photo.name || `flashframe-${photo.mediaType}-${photo.id.slice(-6)}`;
  const baseName = rawName
    .trim()
    .toLowerCase()
    // Remove path traversal characters and special symbols
    .replace(/[\\/:*?"<>|]/g, "")
    // Replace whitespace and consecutive dashes with single dash
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    // Remove any non-alphanumeric except dashes and dots
    .replace(/[^a-z0-9\-.]/g, "")
    // Limit length to prevent issues
    .slice(0, 100);

  // Add quality indicator to filename for non-default configs
  const qualitySuffix = exportConfig.resolution !== '4k' || exportConfig.format !== 'png' 
    ? `-${exportConfig.resolution}-${exportConfig.format}` 
    : '';
    
  const fileName = baseName.endsWith(`.${extension}`)
    ? baseName.replace(`.${extension}`, `${qualitySuffix}.${extension}`)
    : `${baseName || "flashframe-photo"}${qualitySuffix}.${extension}`;

  try {
    let downloadUrl = sourceUrl;
    let shouldRevoke = false;

    // For Data URLs, convert to Blob without fetch (avoids CSP connect-src restriction)
    if (sourceUrl.startsWith("data:")) {
      const [header, base64] = sourceUrl.split(",");
      const mimeType = header.split(":")[1].split(";")[0];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      downloadUrl = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
      shouldRevoke = true;
    }

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    
    // Must append to body for some browsers to honor the download attribute
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (shouldRevoke) {
      // Small delay to ensure the browser has started the download
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
    }
  } catch (error) {
    console.error("FlashFrame: Download failed", error);
    throw new Error("Unable to prepare the file for download.");
  }
}

/**
 * Download photo with specific export preset
 */
export async function downloadPhotoWithPreset(
  photo: PhotoRecord, 
  presetName: string
): Promise<void> {
  // Apply the preset temporarily
  const originalConfig = getCurrentExportConfig();
  
  try {
    applyExportPreset(presetName);
    await downloadPhoto(photo);
  } finally {
    // Restore original configuration
    const { setExportConfig } = await import("./export-config");
    setExportConfig(originalConfig);
  }
}

/**
 * Get export information for a photo (file size, processing time, etc.)
 */
export function getPhotoExportInfo(photo: PhotoRecord): {
  estimatedFileSize: string;
  estimatedProcessingTime: string;
  currentConfig: import("./export-config").ExportQualityConfig;
} {
  // Create a temporary image to get dimensions
  const img = new Image();
  img.src = photo.sourceImage;
  
  const width = img.naturalWidth || 1920; // Fallback dimensions
  const height = img.naturalHeight || 1080;
  
  return {
    estimatedFileSize: estimateFileSize(width, height, getCurrentExportConfig()),
    estimatedProcessingTime: `${estimateProcessingTime(width, height, getCurrentExportConfig())} seconds`,
    currentConfig: getCurrentExportConfig()
  };
}
