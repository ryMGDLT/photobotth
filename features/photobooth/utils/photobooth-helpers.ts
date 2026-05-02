import type {
  MediaType,
  PhotoRecord,
  PhotoStatus,
} from "@/features/photobooth/types/photobooth.types";

export const SESSION_ID_KEY = "flashframe.session-id";
export const ACTIVE_MEDIA_ID_KEY = "flashframe.active-media-id";
export const COUNTDOWN_SECONDS = 3;

export function createSessionId(): string {
  return `session-${crypto.randomUUID()}`;
}

export function createPhotoId(): string {
  return `photo-${crypto.randomUUID()}`;
}

export function createPhotoName(
  status: PhotoStatus,
  index: number,
  mediaType: MediaType = "photo",
): string {
  const paddedIndex = `${index}`.padStart(2, "0");
  const label = mediaType === "video" ? "Clip" : "Shot";
  return `${status === "saved" ? "Saved" : "Draft"} ${label} ${paddedIndex}`;
}

export function sortPhotosByNewest(photos: PhotoRecord[]): PhotoRecord[] {
  return [...photos].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export function getPhotoById(
  photos: PhotoRecord[],
  photoId: string,
): PhotoRecord | undefined {
  return photos.find((photo) => photo.id === photoId);
}

export function isSameSession(sessionId: string, expectedSessionId: string): boolean {
  return sessionId === expectedSessionId;
}

export function getStoredActiveMediaId(storage: Storage): string | null {
  return storage.getItem(ACTIVE_MEDIA_ID_KEY);
}

export function setStoredActiveMediaId(
  storage: Storage,
  photoId: string | null,
): void {
  if (!photoId) {
    storage.removeItem(ACTIVE_MEDIA_ID_KEY);
    return;
  }

  storage.setItem(ACTIVE_MEDIA_ID_KEY, photoId);
}
