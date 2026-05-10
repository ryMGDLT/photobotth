export type PhotoStatus = "draft" | "saved";
export type MediaType = "photo" | "video";

import type { PhotoFrameId } from "./frame.types";

// Re-export for convenience
export type { PhotoFrameId };

export type PhotoStylePreset =
  | "original"
  | "classic"
  | "noir"
  | "warm"
  | "cool"
  | "pop";

export type PhotoLayout = "single" | "strip";

export type CameraPermissionState =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable";

export type CameraFilterPreset =
  | "natural"
  | "golden-hour"
  | "glam"
  | "vhs-pro"
  | "cyber-pop"
  | "vhs-night"
  | "soft-blur"
  | "sepia"
  | "vintage"
  | "bw"
  | "70s"
  | "80s"
  | "polaroid"
  | "cool"
  | "warm"
  | "dramatic"
  | "dreamy"
  | "fade"
  | "matte"
  | "vivid"
  | "muted"
  | "cinema"
  | "sunset"
  | "ocean"
  | "forest"
  | "noir"
  | "grain"
  | "clarendon"
  | "gingham"
  | "moon"
  | "lark"
  | "reyes"
  | "juniper"
  | "valencia"
  | "xpro"
  | "sierra"
  | "willow"
  | "lofi"
  | "inkwell"
  | "nashville"
  | "stinson"
  | "vesper"
  | "earlybird"
  | "brannan"
  | "sutro"
  | "toaster"
  | "walden"
  | "hefe"
  | "mayfair"
  | "hudson";

export type CameraEffectPreset =
  | "none"
  | "vignette"
  | "light-leak"
  | "film-grain"
  | "bokeh"
  | "scratch"
  | "scanlines"
  | "color-splash"
  | "warm-glow"
  | "cool-glow"
  | "retro-border"
  | "double-exposure"
  | "rain"
  | "snow"
  | "sun-flare"
  | "ghost"
  | "glitch"
  | "chromatic"
  | "film-burn"
  | "lens-flare"
  | "dust"
  | "split-tone"
  | "neon-glow"
  | "retro-film"
  | "prism"
  | "halftone"
  | "noise"
  | "film-noir"
  | "vintage-teal"
  | "disco"
  | "sparkle"
  | "heart-frame"
  | "star-burst"
  | "confetti"
  | "butterfly"
  | "crown"
  | "fire"
  | "ice"
  | "rainbow-border"
  | "leaves"
  | "bubbles"
  | "cat-ears"
  | "devil-horns"
  | "angel-halo"
  | "glasses"
  | "mustache"
  | "blush"
  | "tears"
  | "sweat"
  | "angry"
  | "surprised";

export interface EditorSettings {
  preset: PhotoStylePreset;
  brightness: number;
  contrast: number;
  saturation: number;
  vignette: number;
  frame?: PhotoFrameId;
}

export interface PhotoRecord {
  id: string;
  sessionId: string;
  mediaType: MediaType;
  status: PhotoStatus;
  createdAt: string;
  updatedAt: string;
  sourceImage: string;
  renderedImage: string;
  sourceVideo?: string;
  renderedVideo?: string;
  durationMs?: number;
  stripImages?: string[];
  cameraFilter?: CameraFilterPreset;
  settings: EditorSettings;
  layout: PhotoLayout;
  name?: string;
}

export interface SessionGallery {
  version: 2;
  sessionId: string;
  photos: PhotoRecord[];
}

export interface HydratedSessionGallery {
  sessionId: string;
  photos: PhotoRecord[];
}

export interface CreateCaptureInput {
  sessionId: string;
  photos: PhotoRecord[];
  mediaType?: MediaType;
  sourceImage: string;
  sourceVideo?: string;
  renderedVideo?: string;
  durationMs?: number;
  stripImages?: string[];
  cameraFilter?: CameraFilterPreset;
  layout?: PhotoLayout;
  name?: string;
  status?: PhotoStatus;
}

export interface UpdatePhotoEditsInput {
  sessionId: string;
  photos: PhotoRecord[];
  photoId: string;
  settings: EditorSettings;
  layout: PhotoLayout;
  frame?: PhotoFrameId;
}

export interface ChangePhotoStatusInput {
  sessionId: string;
  photos: PhotoRecord[];
  photoId: string;
  status: PhotoStatus;
}

export interface DeletePhotoInput {
  sessionId: string;
  photos: PhotoRecord[];
  photoId: string;
}

export interface DuplicatePhotoInput {
  sessionId: string;
  photos: PhotoRecord[];
  photoId: string;
}
