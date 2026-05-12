import type {
  EditorSettings,
  PhotoLayout,
  PhotoRecord,
  PhotoFrameId,
} from "@/features/photobooth/types/photobooth.types";
import { createEditorSettings } from "@/features/photobooth/utils/photobooth-presets";
import { drawFrame, getDefaultFrame } from "@/features/photobooth/services/frame-registry";
import { upscaleImage, scaleImageMemoryEfficient, getScalingConfig } from "@/features/photobooth/services/image-scaler";
import { 
  getCurrentExportConfig, 
  getTargetDimensions, 
  getCanvasDimensions,
  estimateProcessingTime 
} from "@/features/photobooth/services/export-config";
import { 
  createHighDPICanvas, 
  createMemoryEfficientCanvas,
  configureCanvasForHighQuality,
  highDPICanvasToDataURL 
} from "@/features/photobooth/utils/canvas-utils";
import { 
  performanceManager, 
  withPerformanceTracking,
  PREVIEW_CONFIG,
  HIGH_QUALITY_CONFIG 
} from "@/features/photobooth/services/performance-manager";
import { 
  cacheManager,
  withCache 
} from "@/features/photobooth/services/cache-manager";

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
  frameId?: PhotoFrameId,
  usePreviewMode?: boolean
): Promise<string> {
  // Determine quality mode outside the async function
  const isPreview = usePreviewMode ?? performanceManager.shouldUsePreviewMode();
  
  return withPerformanceTracking(async () => {
    const image = await loadImage(sourceImage);
    const frame = frameId ?? getDefaultFrame();
    const exportConfig = isPreview ? PREVIEW_CONFIG : getCurrentExportConfig();
    
    // Check cache first (key includes settings so different presets/filters are cached separately)
    const imageHash = cacheManager.generateImageHash(sourceImage);
    const settingsHash = cacheManager.generateImageHash(JSON.stringify(settings));
    const compositeKey = `${imageHash}-${frame}-${settingsHash}`;
    
    const cachedResult = cacheManager.getComposite(compositeKey, frame, isPreview ? 'preview' : 'high');
    if (cachedResult) {
      return cachedResult;
    }

    // Get target dimensions based on export configuration
    const { width: targetPhotoWidth, height: targetPhotoHeight } = getTargetDimensions(
      image.naturalWidth,
      image.naturalHeight,
      exportConfig
    );

    // Upscale image if needed (only for high quality)
    let processedImage = image;
    if (!isPreview && exportConfig.enableUpscaling && 
        (targetPhotoWidth > image.naturalWidth || targetPhotoHeight > image.naturalHeight)) {
      
      // Check scaled image cache
      const scaledCacheKey = `${imageHash}-${targetPhotoWidth}-${targetPhotoHeight}`;
      const cachedScaled = cacheManager.getScaledImage(imageHash, targetPhotoWidth, targetPhotoHeight);
      
      if (cachedScaled) {
        processedImage = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = cachedScaled;
        });
      } else {
        const scalingConfig = getScalingConfig('print', { 
          width: targetPhotoWidth, 
          height: targetPhotoHeight 
        });
        scalingConfig.scalingQuality = exportConfig.scalingQuality;
        
        try {
          const scalingResult = await scaleImageMemoryEfficient(image, scalingConfig);
          const scaledDataUrl = scalingResult.scaledCanvas.toDataURL();
          
          // Cache the scaled image
          cacheManager.setScaledImage(imageHash, targetPhotoWidth, targetPhotoHeight, scaledDataUrl);
          
          // Convert scaled canvas back to image
          processedImage = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = scaledDataUrl;
          });
        } catch (error) {
          console.warn('High-quality scaling failed, using original image:', error);
          // Fallback to original image
        }
      }
    }

    // Frame dimensions (use fixed values for preview, scaled for high quality)
    let framePadding: number;
    let bottomPadding: number;
    
    if (isPreview) {
      // Use fixed small padding for preview
      framePadding = 24;
      bottomPadding = 60;
    } else {
      // Scale padding for high quality
      framePadding = Math.round(24 * (targetPhotoWidth / image.naturalWidth));
      bottomPadding = Math.round(60 * (targetPhotoWidth / image.naturalWidth));
    }
    
    const finalPhotoWidth = processedImage.naturalWidth;
    const finalPhotoHeight = processedImage.naturalHeight;

    // Create canvas (use simple canvas for preview, high-DPI for export)
    const totalWidth = finalPhotoWidth + framePadding * 2;
    const totalHeight = finalPhotoHeight + framePadding + bottomPadding;
    
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    
    let canvasScale = 1;

    if (isPreview) {
      // Simple canvas for preview
      canvas = document.createElement("canvas");
      canvas.width = totalWidth;
      canvas.height = totalHeight;
      ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
    } else {
      // High-DPI canvas for export
      const highDPICanvas = createMemoryEfficientCanvas(
        totalWidth,
        totalHeight,
        exportConfig.enableHighDPI
      );
      canvas = highDPICanvas.canvas;
      ctx = highDPICanvas.context;
      canvasScale = highDPICanvas.scale;
      configureCanvasForHighQuality(ctx);
    }

    // Draw frame using the frame registry
    drawFrame(ctx, canvas.width, canvas.height, frame, false); // Explicitly single frame

    // Create temporary canvas for photo with filters
    const photoCanvas = document.createElement("canvas");
    photoCanvas.width = finalPhotoWidth;
    photoCanvas.height = finalPhotoHeight;
    const photoCtx = photoCanvas.getContext("2d");
    if (!photoCtx) throw new Error("Unable to create photo canvas");

    // Apply filters to photo
    photoCtx.filter = buildCanvasFilter(settings);
    photoCtx.drawImage(processedImage, 0, 0, finalPhotoWidth, finalPhotoHeight);
    photoCtx.filter = "none";

    // Apply vignette to photo
    drawVignette(photoCtx, finalPhotoWidth, finalPhotoHeight, settings.vignette);

    // Draw the processed photo onto the main canvas
    ctx.drawImage(
      photoCanvas, 
      framePadding * canvasScale, 
      framePadding * canvasScale, 
      finalPhotoWidth * canvasScale, 
      finalPhotoHeight * canvasScale
    );

    // Add subtle shadow effect to photo area
    ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      framePadding * canvasScale, 
      framePadding * canvasScale, 
      finalPhotoWidth * canvasScale, 
      finalPhotoHeight * canvasScale
    );

    // Export with configured format and quality
    const result = isPreview 
      ? canvas.toDataURL("image/jpeg", exportConfig.quality)
      : highDPICanvasToDataURL({ canvas, context: ctx, scale: canvasScale, logicalWidth: totalWidth, logicalHeight: totalHeight, actualWidth: canvas.width, actualHeight: canvas.height }, exportConfig.format, exportConfig.quality);

    // Cache the result
    cacheManager.setComposite(compositeKey, frame, isPreview ? 'preview' : 'high', result);

    return result;
  }, `renderSinglePhoto-${isPreview ? 'preview' : 'high'}`);
}

async function renderStripPhoto(
  sourceImages: string[],
  settings: EditorSettings,
  frameId?: PhotoFrameId,
  usePreviewMode?: boolean
): Promise<string> {
  // Determine quality mode outside the async function
  const isPreview = usePreviewMode ?? performanceManager.shouldUsePreviewMode();
  
  return withPerformanceTracking(async () => {
    const images = await Promise.all(sourceImages.map((source) => loadImage(source)));
    const frame = frameId ?? getDefaultFrame();
    const exportConfig = isPreview ? PREVIEW_CONFIG : getCurrentExportConfig();

  // Check cache first for strip photos (key includes settings so different presets are cached separately)
  const imageHash = cacheManager.generateImageHash(sourceImages.join('|'));
  const settingsHash = cacheManager.generateImageHash(JSON.stringify(settings));
  const compositeKey = `${imageHash}-${frame}-${settingsHash}`;
  const cachedResult = cacheManager.getComposite(compositeKey, frame, isPreview ? 'preview' : 'high');
  if (cachedResult) {
    return cachedResult;
  }

  // Calculate target dimensions for strip photos
  const firstImage = images[0];
  const { width: targetPhotoWidth, height: targetPhotoHeight } = getTargetDimensions(
    firstImage.naturalWidth,
    firstImage.naturalHeight,
    exportConfig
  );

  // Scale strip dimensions proportionally
  const stripScale = 0.85;
  const stripWidth = targetPhotoWidth * stripScale;
  const stripHeight = targetPhotoHeight * stripScale * 3 + 84; // 3 photos + footer

  // Create canvas (simple for preview, high-DPI for export)
  const footerHeight = isPreview ? 84 : Math.round(84 * (targetPhotoWidth / firstImage.naturalWidth));
  const totalWidth = stripWidth + 48; // 24 * 2
  const totalHeight = stripHeight + 48; // 24 * 2
  
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let scale = 1;
  
  if (isPreview) {
    // Simple canvas for preview
    canvas = document.createElement("canvas");
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';
    scale = 1;
  } else {
    // High-DPI canvas for export
    const highDPICanvas = createMemoryEfficientCanvas(
      totalWidth,
      totalHeight,
      exportConfig.enableHighDPI
    );
    canvas = highDPICanvas.canvas;
    ctx = highDPICanvas.context;
    configureCanvasForHighQuality(ctx);
    scale = highDPICanvas.scale;
  }

  // Draw frame using the frame registry (strip version)
  drawFrame(ctx, canvas.width, canvas.height, frame, true);

  // Process and upscale images if needed (only for high quality)
  let processedImages = images;
  if (!isPreview && exportConfig.enableUpscaling && 
      (targetPhotoWidth > firstImage.naturalWidth || targetPhotoHeight > firstImage.naturalHeight)) {
    
    processedImages = await Promise.all(images.map(async (image) => {
      const scalingConfig = getScalingConfig('print', { 
        width: targetPhotoWidth, 
        height: targetPhotoHeight 
      });
      scalingConfig.scalingQuality = exportConfig.scalingQuality;
      
      try {
        const scalingResult = await scaleImageMemoryEfficient(image, scalingConfig);
        // Convert scaled canvas back to image
        return await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = scalingResult.scaledCanvas.toDataURL();
        });
      } catch (error) {
        console.warn('High-quality scaling failed for strip image, using original:', error);
        return image; // Fallback to original image
      }
    }));
  }

  // Strip layout dimensions
  const framePadding = 24;
  const innerWidth = stripWidth;
  const innerHeight = stripHeight - footerHeight;
  const slotHeight = innerHeight / 3;
  const gap = 6;

  // Render each image with filters and vignette applied individually
  processedImages.forEach((image, index) => {
    const imageScale = Math.max(innerWidth / image.naturalWidth, slotHeight / image.naturalHeight);
    const drawnWidth = image.naturalWidth * imageScale;
    const drawnHeight = image.naturalHeight * imageScale;
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

    // Draw the processed image to main canvas (accounting for DPI scaling)
    ctx.drawImage(
      tempCanvas, 
      x * scale, 
      y * scale, 
      innerWidth * scale, 
      slotHeight * scale
    );
  });

  // Export with configured format and quality
  const result = isPreview 
    ? canvas.toDataURL("image/jpeg", exportConfig.quality)
    : highDPICanvasToDataURL({ canvas, context: ctx, scale, logicalWidth: totalWidth, logicalHeight: totalHeight, actualWidth: canvas.width, actualHeight: canvas.height }, exportConfig.format, exportConfig.quality);

  // Cache the result
  cacheManager.setComposite(compositeKey, frame, isPreview ? 'preview' : 'high', result);

  return result;
  }, `renderStripPhoto-${isPreview ? 'preview' : 'high'}`);
}

export async function renderPhotoDataUrl(options: {
  sourceImage: string;
  settings: EditorSettings;
  layout: PhotoLayout;
  stripSources?: string[];
  frame?: PhotoFrameId;
  usePreviewMode?: boolean;
}): Promise<string> {
  if (options.layout === "strip") {
    const stripSources =
      options.stripSources && options.stripSources.length > 0
        ? options.stripSources.slice(0, 3)
        : [options.sourceImage, options.sourceImage, options.sourceImage]; // Ensure 3 images for strip
    return renderStripPhoto(stripSources, options.settings, options.frame, options.usePreviewMode);
  }

  return renderSinglePhoto(options.sourceImage, options.settings, options.frame, options.usePreviewMode);
}

/**
 * Fast preview rendering for UI interactions
 */
export async function renderPreviewPhoto(options: {
  sourceImage: string;
  settings: EditorSettings;
  layout: PhotoLayout;
  stripSources?: string[];
  frame?: PhotoFrameId;
}): Promise<string> {
  return renderPhotoDataUrl({
    ...options,
    usePreviewMode: true
  });
}

/**
 * High-quality export with custom configuration
 */
export async function renderHighQualityPhoto(options: {
  sourceImage: string;
  settings: EditorSettings;
  layout: PhotoLayout;
  stripSources?: string[];
  frame?: PhotoFrameId;
  exportConfig?: Partial<import("./export-config").ExportQualityConfig>;
  onProgress?: (progress: number) => void;
}): Promise<string> {
  // Apply custom export config if provided
  if (options.exportConfig) {
    const { setExportConfig } = await import("./export-config");
    setExportConfig(options.exportConfig);
  }

  // Estimate processing time for progress reporting
  const image = await loadImage(options.sourceImage);
  const { estimateProcessingTime } = await import("./export-config");
  const estimatedTime = estimateProcessingTime(
    image.naturalWidth,
    image.naturalHeight,
    getCurrentExportConfig()
  );

  if (options.onProgress) {
    options.onProgress(0.1); // Initial loading
  }

  const result = await renderPhotoDataUrl({
    sourceImage: options.sourceImage,
    settings: options.settings,
    layout: options.layout,
    stripSources: options.stripSources,
    frame: options.frame,
  });

  if (options.onProgress) {
    options.onProgress(1.0); // Complete
  }

  return result;
}

export function getDefaultEditorSettings(): EditorSettings {
  return {
    ...createEditorSettings("original"),
    frame: getDefaultFrame(),
  };
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
