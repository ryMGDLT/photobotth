import type {
  EditorSettings,
  PhotoStylePreset,
} from "@/features/photobooth/types/photobooth.types";

const baseSettings: EditorSettings = {
  preset: "original",
  brightness: 100,
  contrast: 100,
  saturation: 100,
  vignette: 0,
};

export const stylePresetSettings: Record<PhotoStylePreset, EditorSettings> = {
  original: baseSettings,
  classic: {
    preset: "classic",
    brightness: 106,
    contrast: 93,
    saturation: 88,
    vignette: 18,
  },
  noir: {
    preset: "noir",
    brightness: 94,
    contrast: 124,
    saturation: 0,
    vignette: 28,
  },
  warm: {
    preset: "warm",
    brightness: 108,
    contrast: 101,
    saturation: 116,
    vignette: 8,
  },
  cool: {
    preset: "cool",
    brightness: 102,
    contrast: 108,
    saturation: 96,
    vignette: 12,
  },
  pop: {
    preset: "pop",
    brightness: 109,
    contrast: 118,
    saturation: 140,
    vignette: 10,
  },
};

export function createEditorSettings(
  preset: PhotoStylePreset = "original",
): EditorSettings {
  return { ...stylePresetSettings[preset] };
}
