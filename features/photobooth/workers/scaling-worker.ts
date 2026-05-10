/**
 * Scaling Worker
 * Handles image upscaling in background thread
 */

// Worker message types
interface ScaleMessage {
  type: 'scale';
  data: {
    imageUrl: string;
    targetWidth: number;
    targetHeight: number;
    quality: 'high' | 'medium' | 'low';
    preserveAspectRatio: boolean;
  };
}

interface ProgressMessage {
  type: 'progress';
  data: {
    progress: number;
    stage: string;
  };
}

interface ResultMessage {
  type: 'result';
  data: {
    success: boolean;
    result?: string; // Data URL
    error?: string;
  };
}

type WorkerMessage = ScaleMessage | ProgressMessage | ResultMessage;

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
 * Fast image scaling using browser's built-in scaling
 */
function fastScale(
  imageData: ImageData,
  targetWidth: number,
  targetHeight: number
): ImageData {
  // Create temporary canvas for scaling
  const sourceCanvas = new OffscreenCanvas(imageData.width, imageData.height);
  const sourceCtx = sourceCanvas.getContext('2d')!;
  sourceCtx.putImageData(imageData, 0, 0);
  
  const targetCanvas = new OffscreenCanvas(targetWidth, targetHeight);
  const targetCtx = targetCanvas.getContext('2d')!;
  
  // Use high-quality image smoothing
  targetCtx.imageSmoothingEnabled = true;
  targetCtx.imageSmoothingQuality = 'high';
  
  targetCtx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
  
  return targetCtx.getImageData(0, 0, targetWidth, targetHeight);
}

/**
 * High-quality Lanczos scaling
 */
function lanczosScale(
  imageData: ImageData,
  targetWidth: number,
  targetHeight: number,
  quality: 'high' | 'medium' | 'low'
): ImageData {
  const sourceWidth = imageData.width;
  const sourceHeight = imageData.height;
  const sourceData = imageData.data;
  
  const targetData = new ImageData(targetWidth, targetHeight);
  
  // Choose kernel radius based on quality
  const kernelRadius = quality === 'high' ? 3 : quality === 'medium' ? 2 : 1;
  
  // Calculate scaling factors
  const scaleX = sourceWidth / targetWidth;
  const scaleY = sourceHeight / targetHeight;
  
  // Process each pixel
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      // Map target pixel to source coordinates
      const sourceX = (x + 0.5) * scaleX - 0.5;
      const sourceY = (y + 0.5) * scaleY - 0.5;
      
      // Calculate contribution from surrounding pixels
      let r = 0, g = 0, b = 0, a = 0;
      let totalWeight = 0;
      
      const startX = Math.floor(sourceX - kernelRadius);
      const endX = Math.ceil(sourceX + kernelRadius);
      const startY = Math.floor(sourceY - kernelRadius);
      const endY = Math.ceil(sourceY + kernelRadius);
      
      for (let sy = startY; sy <= endY; sy++) {
        for (let sx = startX; sx <= endX; sx++) {
          if (sx >= 0 && sx < sourceWidth && sy >= 0 && sy < sourceHeight) {
            const weight = lanczosKernel(sx - sourceX, kernelRadius) * 
                          lanczosKernel(sy - sourceY, kernelRadius);
            
            if (weight > 0) {
              const sourceIndex = (sy * sourceWidth + sx) * 4;
              r += sourceData[sourceIndex] * weight;
              g += sourceData[sourceIndex + 1] * weight;
              b += sourceData[sourceIndex + 2] * weight;
              a += sourceData[sourceIndex + 3] * weight;
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
    
    // Send progress update
    if (y % Math.floor(targetHeight / 10) === 0) {
      const progress = (y / targetHeight) * 0.8; // 80% for scaling
      self.postMessage({
        type: 'progress',
        data: { progress, stage: 'upscaling' }
      } as ProgressMessage);
    }
  }
  
  return targetData;
}

/**
 * Main scaling function
 */
async function scaleImage(
  imageUrl: string,
  targetWidth: number,
  targetHeight: number,
  quality: 'high' | 'medium' | 'low',
  preserveAspectRatio: boolean
): Promise<string> {
  // Load image
  const response = await fetch(imageUrl);
  const imageBlob = await response.blob();
  const imageBitmap = await createImageBitmap(imageBlob);
  
  let finalWidth = targetWidth;
  let finalHeight = targetHeight;
  
  // Calculate dimensions preserving aspect ratio if requested
  if (preserveAspectRatio) {
    const sourceAspect = imageBitmap.width / imageBitmap.height;
    const targetAspect = targetWidth / targetHeight;
    
    if (sourceAspect > targetAspect) {
      // Source is wider, fit to target width
      finalHeight = targetWidth / sourceAspect;
    } else {
      // Source is taller, fit to target height
      finalWidth = targetHeight * sourceAspect;
    }
    
    finalWidth = Math.round(finalWidth);
    finalHeight = Math.round(finalHeight);
  }
  
  // Get source image data
  const sourceCanvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
  const sourceCtx = sourceCanvas.getContext('2d')!;
  sourceCtx.drawImage(imageBitmap, 0, 0);
  const sourceImageData = sourceCtx.getImageData(0, 0, imageBitmap.width, imageBitmap.height);
  
  // Check if scaling is needed
  if (finalWidth === imageBitmap.width && finalHeight === imageBitmap.height) {
    // No scaling needed, return original
    const resultCanvas = new OffscreenCanvas(finalWidth, finalHeight);
    const resultCtx = resultCanvas.getContext('2d')!;
    resultCtx.drawImage(imageBitmap, 0, 0);
    
    self.postMessage({
      type: 'progress',
      data: { progress: 1.0, stage: 'complete' }
    } as ProgressMessage);
    
    return resultCanvas.convertToBlob({ type: 'image/png' }).then(blob => 
      URL.createObjectURL(blob)
    );
  }
  
  // Perform scaling
  let scaledImageData: ImageData;
  
  if (quality === 'low') {
    // Use fast scaling for low quality
    scaledImageData = fastScale(sourceImageData, finalWidth, finalHeight);
  } else {
    // Use Lanczos scaling for medium/high quality
    scaledImageData = lanczosScale(sourceImageData, finalWidth, finalHeight, quality);
  }
  
  // Convert to result
  const resultCanvas = new OffscreenCanvas(finalWidth, finalHeight);
  const resultCtx = resultCanvas.getContext('2d')!;
  resultCtx.putImageData(scaledImageData, 0, 0);
  
  self.postMessage({
    type: 'progress',
    data: { progress: 0.9, stage: 'finalizing' }
  } as ProgressMessage);
  
  // Convert to blob and return URL
  const resultBlob = await resultCanvas.convertToBlob({ type: 'image/png' });
  return URL.createObjectURL(resultBlob);
}

/**
 * Worker message handler
 */
self.addEventListener('message', async (e: MessageEvent<WorkerMessage>) => {
  const { type, data } = e.data;
  
  try {
    if (type === 'scale') {
      const { imageUrl, targetWidth, targetHeight, quality, preserveAspectRatio } = data;
      
      self.postMessage({
        type: 'progress',
        data: { progress: 0.1, stage: 'loading' }
      } as ProgressMessage);
      
      const result = await scaleImage(
        imageUrl,
        targetWidth,
        targetHeight,
        quality,
        preserveAspectRatio
      );
      
      self.postMessage({
        type: 'result',
        data: { success: true, result }
      } as ResultMessage);
    }
  } catch (error) {
    self.postMessage({
      type: 'result',
      data: { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    } as ResultMessage);
  }
});

// Export for TypeScript
export {};
