/**
 * High-Quality Image Scaler
 * Implements Lanczos algorithm for superior upscaling quality
 */

export interface ScalingConfig {
  targetWidth: number;
  targetHeight: number;
  quality: 'high' | 'medium' | 'low';
  scalingQuality?: 'high' | 'medium' | 'low';
  preserveAspectRatio: boolean;
}

export interface ScalingResult {
  scaledCanvas: HTMLCanvasElement;
  actualWidth: number;
  actualHeight: number;
  scalingFactor: number;
}

/**
 * Lanczos kernel function for high-quality scaling
 */
function lanczosKernel(x: number, radius: number = 3): number {
  if (x === 0) return 1;
  if (Math.abs(x) >= radius) return 0;
  
  const px = Math.PI * x;
  return (Math.sin(px) / px) * (Math.sin(px / radius) / (px / radius));
}

/**
 * Calculate optimal scaling factor to reach target resolution
 */
function calculateScalingFactor(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  preserveAspectRatio: boolean
): { width: number; height: number; factor: number } {
  if (!preserveAspectRatio) {
    return {
      width: targetWidth,
      height: targetHeight,
      factor: Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight)
    };
  }

  const sourceAspect = sourceWidth / sourceHeight;
  const targetAspect = targetWidth / targetHeight;
  
  let finalWidth: number;
  let finalHeight: number;
  
  if (sourceAspect > targetAspect) {
    // Source is wider, fit to target width
    finalWidth = targetWidth;
    finalHeight = targetWidth / sourceAspect;
  } else {
    // Source is taller, fit to target height
    finalHeight = targetHeight;
    finalWidth = targetHeight * sourceAspect;
  }
  
  const factor = Math.max(finalWidth / sourceWidth, finalHeight / sourceHeight);
  
  return {
    width: Math.round(finalWidth),
    height: Math.round(finalHeight),
    factor
  };
}

/**
 * High-quality image upscaling using Lanczos resampling
 */
export function upscaleImage(
  sourceImage: HTMLImageElement,
  config: ScalingConfig
): Promise<ScalingResult> {
  return new Promise((resolve, reject) => {
    try {
      const { width: targetWidth, height: targetHeight, factor } = calculateScalingFactor(
        sourceImage.naturalWidth,
        sourceImage.naturalHeight,
        config.targetWidth,
        config.targetHeight,
        config.preserveAspectRatio
      );

      // If no scaling needed, return original
      if (factor <= 1) {
        const canvas = document.createElement('canvas');
        canvas.width = sourceImage.naturalWidth;
        canvas.height = sourceImage.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(sourceImage, 0, 0);
        
        resolve({
          scaledCanvas: canvas,
          actualWidth: sourceImage.naturalWidth,
          actualHeight: sourceImage.naturalHeight,
          scalingFactor: 1
        });
        return;
      }

      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = targetWidth;
      scaledCanvas.height = targetHeight;
      const scaledCtx = scaledCanvas.getContext('2d')!;

      // Get image data for processing
      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = sourceImage.naturalWidth;
      sourceCanvas.height = sourceImage.naturalHeight;
      const sourceCtx = sourceCanvas.getContext('2d')!;
      sourceCtx.drawImage(sourceImage, 0, 0);
      
      const sourceData = sourceCtx.getImageData(0, 0, sourceImage.naturalWidth, sourceImage.naturalHeight);
      const targetData = scaledCtx.createImageData(targetWidth, targetHeight);

      // Choose kernel radius based on quality setting
      const kernelRadius = config.quality === 'high' ? 3 : config.quality === 'medium' ? 2 : 1;
      
      // Process each pixel
      for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
          // Map target pixel to source coordinates
          const sourceX = (x + 0.5) / factor - 0.5;
          const sourceY = (y + 0.5) / factor - 0.5;
          
          // Calculate contribution from surrounding pixels
          let r = 0, g = 0, b = 0, a = 0;
          let totalWeight = 0;
          
          const startX = Math.floor(sourceX - kernelRadius);
          const endX = Math.ceil(sourceX + kernelRadius);
          const startY = Math.floor(sourceY - kernelRadius);
          const endY = Math.ceil(sourceY + kernelRadius);
          
          for (let sy = startY; sy <= endY; sy++) {
            for (let sx = startX; sx <= endX; sx++) {
              if (sx >= 0 && sx < sourceImage.naturalWidth && 
                  sy >= 0 && sy < sourceImage.naturalHeight) {
                
                const weight = lanczosKernel(sx - sourceX, kernelRadius) * 
                              lanczosKernel(sy - sourceY, kernelRadius);
                
                if (weight > 0) {
                  const sourceIndex = (sy * sourceImage.naturalWidth + sx) * 4;
                  r += sourceData.data[sourceIndex] * weight;
                  g += sourceData.data[sourceIndex + 1] * weight;
                  b += sourceData.data[sourceIndex + 2] * weight;
                  a += sourceData.data[sourceIndex + 3] * weight;
                  totalWeight += weight;
                }
              }
            }
          }
          
          // Set target pixel
          const targetIndex = (y * targetWidth + x) * 4;
          targetData.data[targetIndex] = Math.round(r / totalWeight);
          targetData.data[targetIndex + 1] = Math.round(g / totalWeight);
          targetData.data[targetIndex + 2] = Math.round(b / totalWeight);
          targetData.data[targetIndex + 3] = Math.round(a / totalWeight);
        }
        
        // Progress reporting for large images
        if (y % Math.floor(targetHeight / 10) === 0) {
          // Could emit progress events here
        }
      }

      scaledCtx.putImageData(targetData, 0, 0);

      resolve({
        scaledCanvas,
        actualWidth: targetWidth,
        actualHeight: targetHeight,
        scalingFactor: factor
      });

    } catch (error) {
      reject(new Error(`Image scaling failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}

/**
 * Fast fallback scaling using browser's built-in scaling
 */
export function fastScaleImage(
  sourceImage: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
): ScalingResult {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d')!;
  
  // Use high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  ctx.drawImage(sourceImage, 0, 0, targetWidth, targetHeight);
  
  return {
    scaledCanvas: canvas,
    actualWidth: targetWidth,
    actualHeight: targetHeight,
    scalingFactor: Math.max(targetWidth / sourceImage.naturalWidth, targetHeight / sourceImage.naturalHeight)
  };
}

/**
 * Memory-efficient scaling for large images
 */
export async function scaleImageMemoryEfficient(
  sourceImage: HTMLImageElement,
  config: ScalingConfig
): Promise<ScalingResult> {
  // For very large targets, use progressive scaling
  const maxDimension = Math.max(config.targetWidth, config.targetHeight);
  const sourceMaxDimension = Math.max(sourceImage.naturalWidth, sourceImage.naturalHeight);
  
  if (maxDimension / sourceMaxDimension > 4) {
    // Scale in multiple steps to reduce memory usage
    const intermediateFactor = Math.sqrt(4); // 2x scaling per step
    
    let currentImage = sourceImage;
    let currentFactor = 1;
    
    while (currentFactor * intermediateFactor < maxDimension / sourceMaxDimension) {
      const intermediateWidth = Math.round(currentImage.naturalWidth * intermediateFactor);
      const intermediateHeight = Math.round(currentImage.naturalHeight * intermediateFactor);
      
      const intermediateResult = fastScaleImage(currentImage, intermediateWidth, intermediateHeight);
      
      // Convert canvas back to image for next iteration
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.src = intermediateResult.scaledCanvas.toDataURL();
      });
      
      currentImage = img;
      currentFactor *= intermediateFactor;
    }
    
    // Final scaling to target
    return upscaleImage(currentImage, config);
  }
  
  // For moderate scaling, use direct Lanczos
  return upscaleImage(sourceImage, config);
}

/**
 * Get recommended scaling configuration based on target use case
 */
export function getScalingConfig(
  useCase: 'print' | 'web' | 'preview',
  targetResolution?: { width: number; height: number }
): ScalingConfig {
  switch (useCase) {
    case 'print':
      return {
        targetWidth: targetResolution?.width || 3840,
        targetHeight: targetResolution?.height || 2160,
        quality: 'high',
        preserveAspectRatio: true
      };
    case 'web':
      return {
        targetWidth: targetResolution?.width || 1920,
        targetHeight: targetResolution?.height || 1080,
        quality: 'medium',
        preserveAspectRatio: true
      };
    case 'preview':
      return {
        targetWidth: targetResolution?.width || 800,
        targetHeight: targetResolution?.height || 600,
        quality: 'low',
        preserveAspectRatio: true
      };
  }
}
