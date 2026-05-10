/**
 * Preview Renderer
 * Fast rendering utilities for UI interactions and real-time previews
 */

import type { EditorSettings, PhotoLayout, PhotoFrameId } from '../types/photobooth.types';
import { renderPreviewPhoto } from '../services/photo-editor.service';
import { cacheManager } from '../services/cache-manager';
import { performanceManager } from '../services/performance-manager';

export interface PreviewOptions {
  sourceImage: string;
  settings: EditorSettings;
  layout: PhotoLayout;
  stripSources?: string[];
  frame?: PhotoFrameId;
  maxCacheAge?: number; // milliseconds
  priority?: 'low' | 'medium' | 'high';
}

export interface PreviewResult {
  dataUrl: string;
  isFromCache: boolean;
  renderTime: number;
  quality: 'preview';
  estimatedFileSize: string;
}

/**
 * Preview cache with TTL support
 */
class PreviewCache {
  private cache = new Map<string, { data: string; timestamp: number; renderTime: number }>();
  private maxAge: number;
  private maxSize: number;

  constructor(maxAge: number = 5 * 60 * 1000, maxSize: number = 50) {
    this.maxAge = maxAge;
    this.maxSize = maxSize;
  }

  get(key: string): { data: string; renderTime: number } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return { data: entry.data, renderTime: entry.renderTime };
  }

  set(key: string, data: string, renderTime: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      renderTime
    });
  }

  /**
   * Evict least recently used entry
   */
  private evictLeastRecentlyUsed(): void {
    if (this.cache.size === 0) return;

    const firstKey = this.cache.keys().next().value;
    if (firstKey === undefined) return;
    
    this.cache.delete(firstKey);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    }
  }
}

// Global preview cache instance
const previewCache = new PreviewCache();

/**
 * Generate cache key for preview
 */
function generatePreviewKey(options: PreviewOptions): string {
  const { sourceImage, settings, layout, stripSources, frame } = options;
  const imageHash = cacheManager.generateImageHash(sourceImage);
  const settingsHash = JSON.stringify(settings);
  const stripHash = stripSources ? stripSources.join(',') : '';
  
  return `preview-${imageHash}-${settingsHash}-${layout}-${stripHash}-${frame || 'default'}`;
}

/**
 * Fast preview rendering with caching
 */
export async function renderFastPreview(options: PreviewOptions): Promise<PreviewResult> {
  const startTime = performance.now();
  const cacheKey = generatePreviewKey(options);
  
  // Check preview cache first
  const cached = previewCache.get(cacheKey);
  if (cached) {
    const renderTime = performance.now() - startTime;
    return {
      dataUrl: cached.data,
      isFromCache: true,
      renderTime: cached.renderTime,
      quality: 'preview',
      estimatedFileSize: estimateDataUrlSize(cached.data)
    };
  }

  // Check main cache
  const imageHash = cacheManager.generateImageHash(options.sourceImage);
  const mainCached = cacheManager.getComposite(imageHash, options.frame || 'default', 'preview');
  if (mainCached) {
    const renderTime = performance.now() - startTime;
    previewCache.set(cacheKey, mainCached, renderTime);
    return {
      dataUrl: mainCached,
      isFromCache: true,
      renderTime,
      quality: 'preview',
      estimatedFileSize: estimateDataUrlSize(mainCached)
    };
  }

  // Render new preview
  try {
    const dataUrl = await renderPreviewPhoto(options);
    const renderTime = performance.now() - startTime;
    
    // Cache the result
    previewCache.set(cacheKey, dataUrl, renderTime);
    
    return {
      dataUrl,
      isFromCache: false,
      renderTime,
      quality: 'preview',
      estimatedFileSize: estimateDataUrlSize(dataUrl)
    };
  } catch (error) {
    console.error('Preview rendering failed:', error);
    throw error;
  }
}

/**
 * Batch preview rendering for multiple frames
 */
export async function renderBatchPreviews(
  baseOptions: Omit<PreviewOptions, 'frame'>,
  frames: PhotoFrameId[]
): Promise<Map<PhotoFrameId, PreviewResult>> {
  const results = new Map<PhotoFrameId, PreviewResult>();
  
  // Render all frames concurrently
  const promises = frames.map(async (frame) => {
    try {
      const result = await renderFastPreview({
        ...baseOptions,
        frame
      });
      return { frame, result };
    } catch (error) {
      console.error(`Failed to render preview for frame ${frame}:`, error);
      return null;
    }
  });

  const settled = await Promise.allSettled(promises);
  
  settled.forEach((promise) => {
    if (promise.status === 'fulfilled' && promise.value) {
      const { frame, result } = promise.value;
      results.set(frame, result);
    }
  });

  return results;
}

/**
 * Progressive preview rendering
 */
export async function renderProgressivePreview(
  options: PreviewOptions,
  onProgress?: (progress: number, stage: string) => void
): Promise<PreviewResult> {
  onProgress?.(0.1, 'Initializing');
  
  // Try to get cached version first
  const cacheKey = generatePreviewKey(options);
  const cached = previewCache.get(cacheKey);
  if (cached) {
    onProgress?.(1.0, 'Complete');
    return {
      dataUrl: cached.data,
      isFromCache: true,
      renderTime: cached.renderTime,
      quality: 'preview',
      estimatedFileSize: estimateDataUrlSize(cached.data)
    };
  }

  onProgress?.(0.2, 'Loading image');
  
  // Load image first to show quick feedback
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = options.sourceImage;
  });

  onProgress?.(0.4, 'Creating preview');
  
  // Create a very quick low-quality preview first
  const quickCanvas = document.createElement('canvas');
  const quickSize = Math.min(image.naturalWidth, image.naturalHeight, 400);
  quickCanvas.width = quickSize;
  quickCanvas.height = quickSize;
  
  const quickCtx = quickCanvas.getContext('2d')!;
  quickCtx.imageSmoothingEnabled = true;
  quickCtx.imageSmoothingQuality = 'low';
  
  // Scale image to fit
  const scale = Math.min(quickSize / image.naturalWidth, quickSize / image.naturalHeight);
  const scaledWidth = image.naturalWidth * scale;
  const scaledHeight = image.naturalHeight * scale;
  const x = (quickSize - scaledWidth) / 2;
  const y = (quickSize - scaledHeight) / 2;
  
  quickCtx.drawImage(image, x, y, scaledWidth, scaledHeight);
  
  const quickPreview = quickCanvas.toDataURL('image/jpeg', 0.7);
  
  onProgress?.(0.6, 'Rendering full preview');
  
  // Now render the full preview
  const fullResult = await renderFastPreview(options);
  
  onProgress?.(1.0, 'Complete');
  
  return fullResult;
}

/**
 * Preload previews for common frames
 */
export async function preloadPreviews(
  baseOptions: Omit<PreviewOptions, 'frame'>,
  frames: PhotoFrameId[]
): Promise<void> {
  // Don't block the main thread, use requestIdleCallback if available
  const preload = () => {
    frames.forEach((frame, index) => {
      setTimeout(() => {
        renderFastPreview({
          ...baseOptions,
          frame
        }).catch(error => {
          console.warn(`Failed to preload preview for frame ${frame}:`, error);
        });
      }, index * 100); // Stagger preloads
    });
  };

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(preload);
  } else {
    setTimeout(preload, 100);
  }
}

/**
 * Estimate Data URL file size
 */
function estimateDataUrlSize(dataUrl: string): string {
  const base64 = dataUrl.split(',')[1] || '';
  const sizeBytes = base64.length * 0.75; // Base64 is ~33% larger than binary
  const sizeKB = sizeBytes / 1024;
  const sizeMB = sizeKB / 1024;
  
  if (sizeMB >= 1) {
    return `${sizeMB.toFixed(1)} MB`;
  } else if (sizeKB >= 1) {
    return `${sizeKB.toFixed(0)} KB`;
  } else {
    return `${Math.round(sizeBytes)} B`;
  }
}

/**
 * Cleanup expired preview cache entries
 */
export function cleanupPreviewCache(): void {
  previewCache.cleanup();
}

/**
 * Get preview cache statistics
 */
export function getPreviewCacheStats(): {
  size: number;
  maxSize: number;
  hitRate: number;
  oldestEntry: number;
  newestEntry: number;
} {
  return {
    size: previewCache['cache'].size,
    maxSize: previewCache['maxSize'],
    hitRate: 0, // Would need tracking implementation
    oldestEntry: 0, // Would need tracking implementation
    newestEntry: 0  // Would need tracking implementation
  };
}

/**
 * Adaptive quality preview based on device performance
 */
export async function renderAdaptivePreview(
  options: PreviewOptions,
  onProgress?: (progress: number, stage: string) => void
): Promise<PreviewResult> {
  const deviceLevel = performanceManager.getDevicePerformanceLevel();
  
  // Adjust rendering strategy based on device performance
  switch (deviceLevel) {
    case 'low':
      // Use very fast preview for low-end devices
      return renderFastPreview({
        ...options,
        priority: 'low'
      });
      
    case 'medium':
      // Use progressive rendering for medium devices
      return renderProgressivePreview(options, onProgress);
      
    case 'high':
      // Can afford to render full preview quickly
      return renderFastPreview({
        ...options,
        priority: 'high'
      });
      
    default:
      return renderFastPreview(options);
  }
}

/**
 * Preview renderer utilities for React components
 */
export const previewUtils = {
  /**
   * Debounced preview rendering for slider inputs
   */
  debouncePreview: (
    renderFn: (options: PreviewOptions) => Promise<PreviewResult>,
    delay: number = 300
  ) => {
    let timeoutId: NodeJS.Timeout;
    let lastPromise: Promise<PreviewResult> | null = null;
    
    return (options: PreviewOptions): Promise<PreviewResult> => {
      // Cancel previous render
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Create new promise
      const promise = new Promise<PreviewResult>((resolve, reject) => {
        timeoutId = setTimeout(async () => {
          try {
            const result = await renderFn(options);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, delay);
      });
      
      lastPromise = promise;
      return promise;
    };
  },
  
  /**
   * Throttled preview rendering for continuous updates
   */
  throttlePreview: (
    renderFn: (options: PreviewOptions) => Promise<PreviewResult>,
    interval: number = 100
  ) => {
    let lastCall = 0;
    let lastPromise: Promise<PreviewResult> | null = null;
    
    return (options: PreviewOptions): Promise<PreviewResult> => {
      const now = Date.now();
      
      if (now - lastCall >= interval) {
        lastCall = now;
        lastPromise = renderFn(options);
        return lastPromise;
      }
      
      return lastPromise || renderFn(options);
    };
  }
};
