/**
 * High-DPI Canvas Utilities
 * Provides utilities for creating and managing high-resolution canvases
 */

export interface CanvasConfig {
  width: number;
  height: number;
  enableHighDPI: boolean;
  devicePixelRatio?: number;
}

export interface HighDPICanvas {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  scale: number;
  logicalWidth: number;
  logicalHeight: number;
  actualWidth: number;
  actualHeight: number;
}

/**
 * Get the device pixel ratio for the current display
 */
export function getDevicePixelRatio(): number {
  if (typeof window === 'undefined') return 1;
  return window.devicePixelRatio || 1;
}

/**
 * Create a high-DPI canvas with proper scaling
 */
export function createHighDPICanvas(config: CanvasConfig): HighDPICanvas {
  const dpr = config.devicePixelRatio || getDevicePixelRatio();
  const scale = config.enableHighDPI ? Math.max(1, dpr) : 1;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;

  if (!context) {
    throw new Error('Failed to get 2D context from canvas');
  }

  // Set actual canvas dimensions (pixels)
  canvas.width = Math.round(config.width * scale);
  canvas.height = Math.round(config.height * scale);

  // Scale the context to match device pixel ratio
  context.scale(scale, scale);

  // Enable high-quality rendering
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  // Set canvas CSS dimensions (logical size)
  canvas.style.width = `${config.width}px`;
  canvas.style.height = `${config.height}px`;

  return {
    canvas,
    context,
    scale,
    logicalWidth: config.width,
    logicalHeight: config.height,
    actualWidth: canvas.width,
    actualHeight: canvas.height
  };
}

/**
 * Configure a canvas for high-quality rendering
 */
export function configureCanvasForHighQuality(
  context: CanvasRenderingContext2D,
  enableAntialiasing: boolean = true
): void {
  // Image smoothing settings
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  // Text rendering settings
  context.textBaseline = 'middle';
  context.textAlign = 'center';

  // Antialiasing
  if (enableAntialiasing) {
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
  }
}

/**
 * Draw an image on a high-DPI canvas with proper scaling
 */
export function drawImageOnHighDPICanvas(
  highDPICanvas: HighDPICanvas,
  image: HTMLImageElement | HTMLCanvasElement,
  sx: number = 0,
  sy: number = 0,
  sWidth?: number,
  sHeight?: number,
  dx: number = 0,
  dy: number = 0,
  dWidth?: number,
  dHeight?: number
): void {
  const { context } = highDPICanvas;

  // Use source dimensions if not specified
  const sourceWidth = sWidth || (image instanceof HTMLImageElement ? image.naturalWidth : image.width);
  const sourceHeight = sHeight || (image instanceof HTMLImageElement ? image.naturalHeight : image.height);
  const destWidth = dWidth || sourceWidth;
  const destHeight = dHeight || sourceHeight;

  context.drawImage(
    image,
    sx, sy, sourceWidth, sourceHeight,
    dx, dy, destWidth, destHeight
  );
}

/**
 * Create a canvas from an image with high-DPI support
 */
export function createCanvasFromImage(
  image: HTMLImageElement,
  enableHighDPI: boolean = true
): HighDPICanvas {
  return createHighDPICanvas({
    width: image.naturalWidth,
    height: image.naturalHeight,
    enableHighDPI
  });
}

/**
 * Convert a high-DPI canvas to a data URL with optimal quality
 */
export function highDPICanvasToDataURL(
  highDPICanvas: HighDPICanvas,
  format: 'png' | 'jpeg' = 'png',
  quality: number = 1.0
): string {
  const { canvas } = highDPICanvas;
  
  if (format === 'jpeg') {
    return canvas.toDataURL('image/jpeg', quality);
  } else {
    return canvas.toDataURL('image/png');
  }
}

/**
 * Get memory usage estimate for a canvas
 */
export function estimateCanvasMemoryUsage(canvas: HTMLCanvasElement): number {
  // Rough estimate: width * height * 4 bytes (RGBA) per pixel
  return (canvas.width * canvas.height * 4) / (1024 * 1024); // Return in MB
}

/**
 * Check if canvas dimensions are safe for browser memory
 */
export function isCanvasSizeSafe(width: number, height: number): boolean {
  const maxSafePixels = 16777216; // 4096x4096 (conservative limit)
  const pixelCount = width * height;
  
  return pixelCount <= maxSafePixels;
}

/**
 * Get maximum safe canvas dimensions for the current browser
 */
export function getMaximumSafeCanvasDimensions(): { width: number; height: number } {
  // Conservative estimates for most browsers
  const maxPixels = 16777216; // 4096x4096
  const maxWidth = 16384;
  const maxHeight = 16384;
  
  return {
    width: Math.min(maxWidth, Math.sqrt(maxPixels)),
    height: Math.min(maxHeight, Math.sqrt(maxPixels))
  };
}

/**
 * Optimize canvas dimensions for memory and performance
 */
export function optimizeCanvasDimensions(
  requestedWidth: number,
  requestedHeight: number,
  enableHighDPI: boolean = true
): { width: number; height: number; scale: number; optimized: boolean } {
  const dpr = enableHighDPI ? getDevicePixelRatio() : 1;
  const scale = Math.max(1, dpr);
  
  let finalWidth = requestedWidth;
  let finalHeight = requestedHeight;
  let optimized = false;

  // Check if dimensions are safe
  if (!isCanvasSizeSafe(requestedWidth * scale, requestedHeight * scale)) {
    const maxSafe = getMaximumSafeCanvasDimensions();
    const maxSafePixels = maxSafe.width * maxSafe.height;
    const requestedPixels = requestedWidth * requestedHeight * scale * scale;
    
    if (requestedPixels > maxSafePixels) {
      // Scale down to fit within safe limits
      const scaleFactor = Math.sqrt(maxSafePixels / requestedPixels);
      finalWidth = Math.round(requestedWidth * scaleFactor);
      finalHeight = Math.round(requestedHeight * scaleFactor);
      optimized = true;
    }
  }

  return {
    width: finalWidth,
    height: finalHeight,
    scale,
    optimized
  };
}

/**
 * Create a memory-efficient canvas for large images
 */
export function createMemoryEfficientCanvas(
  width: number,
  height: number,
  enableHighDPI: boolean = true
): HighDPICanvas {
  const optimized = optimizeCanvasDimensions(width, height, enableHighDPI);
  
  if (optimized.optimized) {
    console.warn(`Canvas dimensions optimized from ${width}x${height} to ${optimized.width}x${optimized.height} for memory safety`);
  }

  return createHighDPICanvas({
    width: optimized.width,
    height: optimized.height,
    enableHighDPI,
    devicePixelRatio: optimized.scale
  });
}

/**
 * Apply high-quality rendering settings to a canvas context
 */
export function applyHighQualityRenderingSettings(context: CanvasRenderingContext2D): void {
  // Enable high-quality image smoothing
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  
  // Set composite operation for better blending
  context.globalCompositeOperation = 'source-over';
  
  // Enable sub-pixel rendering
  context.imageSmoothingEnabled = true;
}

/**
 * Create a temporary canvas for image processing
 */
export function createTemporaryCanvas(
  width: number,
  height: number
): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to create 2D context for temporary canvas');
  }
  
  applyHighQualityRenderingSettings(context);
  
  return { canvas, context };
}

/**
 * Clone a canvas with high-DPI support
 */
export function cloneCanvas(
  sourceCanvas: HTMLCanvasElement,
  enableHighDPI: boolean = true
): HighDPICanvas {
  const cloned = createHighDPICanvas({
    width: sourceCanvas.width,
    height: sourceCanvas.height,
    enableHighDPI
  });
  
  cloned.context.drawImage(sourceCanvas, 0, 0);
  
  return cloned;
}

/**
 * Get canvas information for debugging
 */
export function getCanvasInfo(canvas: HTMLCanvasElement): {
  width: number;
  height: number;
  memoryUsageMB: number;
  devicePixelRatio: number;
  isHighDPI: boolean;
} {
  const dpr = getDevicePixelRatio();
  const memoryUsage = estimateCanvasMemoryUsage(canvas);
  
  return {
    width: canvas.width,
    height: canvas.height,
    memoryUsageMB: Math.round(memoryUsage * 100) / 100,
    devicePixelRatio: dpr,
    isHighDPI: dpr > 1
  };
}
