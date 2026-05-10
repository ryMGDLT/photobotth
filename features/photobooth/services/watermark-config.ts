import type { WatermarkConfig } from "./frame-registry";

/**
 * Watermark Configuration System
 * 
 * This file contains the default watermark settings and provides
 * functions to customize watermarks for different use cases.
 */

export const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
  type: 'text',
  content: 'FLASHFRAME',
  fontSize: undefined, // Uses automatic sizing
  opacity: 1,
};

export const LARGE_WATERMARK_CONFIG: WatermarkConfig = {
  type: 'text',
  content: 'FLASHFRAME',
  fontSize: 120, // Large fixed size
  opacity: 1,
};

export const SUBTLE_WATERMARK_CONFIG: WatermarkConfig = {
  type: 'text',
  content: 'FLASHFRAME',
  fontSize: undefined,
  opacity: 0.6,
};

/**
 * Create a custom image watermark configuration
 */
export function createImageWatermarkConfig(
  imageUrl: string,
  scale: number = 0.3,
  opacity: number = 1
): WatermarkConfig {
  return {
    type: 'image',
    imageUrl,
    scale,
    opacity,
  };
}

/**
 * Create a custom text watermark configuration
 */
export function createTextWatermarkConfig(
  text: string,
  fontSize?: number,
  opacity: number = 1
): WatermarkConfig {
  return {
    type: 'text',
    content: text,
    fontSize,
    opacity,
  };
}

/**
 * Preset watermark configurations for different brands/styles
 */
export const WATERMARK_PRESETS: Record<string, WatermarkConfig> = {
  // Default FLASHFRAME branding
  flashframe: DEFAULT_WATERMARK_CONFIG,
  
  // Large, prominent watermark
  large: LARGE_WATERMARK_CONFIG,
  
  // Subtle, minimal watermark
  subtle: SUBTLE_WATERMARK_CONFIG,
  
  // Example with a different text
  customText: createTextWatermarkConfig(
    'YOUR BRAND',
    undefined, // Auto-size
    0.8
  ),
};

export type WatermarkPreset = keyof typeof WATERMARK_PRESETS;

/**
 * Get watermark configuration by preset name
 */
export function getWatermarkConfig(preset: WatermarkPreset): WatermarkConfig {
  return WATERMARK_PRESETS[preset];
}

/**
 * Current active watermark preset (can be changed at runtime)
 */
let currentWatermarkPreset: WatermarkPreset = 'flashframe';

/**
 * Set the active watermark preset
 */
export function setWatermarkPreset(preset: WatermarkPreset): void {
  currentWatermarkPreset = preset;
}

/**
 * Get the current watermark configuration
 */
export function getCurrentWatermarkConfig(): WatermarkConfig {
  return WATERMARK_PRESETS[currentWatermarkPreset];
}

/**
 * Get the current watermark preset name
 */
export function getCurrentWatermarkPreset(): WatermarkPreset {
  return currentWatermarkPreset;
}

/**
 * Pre-load watermark image for faster rendering
 */
export function preloadWatermarkImage(imageUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Image loading not available in server environment'));
      return;
    }
    
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageUrl;
  });
}

/**
 * Initialize and activate custom watermark
 */
export async function initializeCustomWatermark(imageUrl: string = '/brand-logo.png'): Promise<void> {
  try {
    // Pre-load the image
    await preloadWatermarkImage(imageUrl);
    
    // Update the custom brand config
    WATERMARK_PRESETS.customBrand = createImageWatermarkConfig(imageUrl, 0.375, 1);
    
    // Set as active watermark
    setWatermarkPreset('customBrand');
    
  } catch (error) {
    // Fall back to default text watermark
    setWatermarkPreset('flashframe');
  }
}

/**
 * Auto-initialize custom watermark if image exists
 */
export function autoInitializeWatermark(): void {
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  // Try to load the default brand logo
  initializeCustomWatermark('/brand-logo.png').catch(() => {
    // Expected when no brand logo is present — fall back to default text watermark
  });
}
