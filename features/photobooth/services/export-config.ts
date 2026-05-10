/**
 * Export Configuration System
 * Manages quality settings and export presets for different use cases
 */

export interface ExportQualityConfig {
  resolution: 'original' | '4k' | '8k' | 'custom';
  format: 'png' | 'jpeg';
  quality: number; // 0.1-1.0 for JPEG fallback
  enableUpscaling: boolean;
  enableHighDPI: boolean;
  customWidth?: number;
  customHeight?: number;
  scalingQuality: 'high' | 'medium' | 'low';
}

export interface ExportPreset {
  name: string;
  description: string;
  config: ExportQualityConfig;
  estimatedProcessingTime: string;
  estimatedFileSize: string;
}

/**
 * Predefined export configurations for different use cases
 */
export const EXPORT_PRESETS: Record<string, ExportPreset> = {
  'print-ready': {
    name: 'Print Ready',
    description: '4K PNG with maximum quality for professional printing',
    config: {
      resolution: '4k',
      format: 'png',
      quality: 1.0,
      enableUpscaling: true,
      enableHighDPI: true,
      scalingQuality: 'high'
    },
    estimatedProcessingTime: '3-6 seconds',
    estimatedFileSize: '8-20 MB'
  },
  'maximum-quality': {
    name: 'Maximum Quality',
    description: '8K PNG with all enhancements for ultimate quality',
    config: {
      resolution: '8k',
      format: 'png',
      quality: 1.0,
      enableUpscaling: true,
      enableHighDPI: true,
      scalingQuality: 'high'
    },
    estimatedProcessingTime: '8-15 seconds',
    estimatedFileSize: '20-50 MB'
  },
  'web-ready': {
    name: 'Web Ready',
    description: 'Original resolution JPEG for web use',
    config: {
      resolution: 'original',
      format: 'jpeg',
      quality: 0.95,
      enableUpscaling: false,
      enableHighDPI: false,
      scalingQuality: 'medium'
    },
    estimatedProcessingTime: '1-2 seconds',
    estimatedFileSize: '2-5 MB'
  },
  'balanced': {
    name: 'Balanced',
    description: '4K JPEG with good quality and reasonable file size',
    config: {
      resolution: '4k',
      format: 'jpeg',
      quality: 0.98,
      enableUpscaling: true,
      enableHighDPI: true,
      scalingQuality: 'medium'
    },
    estimatedProcessingTime: '2-4 seconds',
    estimatedFileSize: '4-10 MB'
  },
  'preview': {
    name: 'Preview',
    description: 'Low resolution for quick previews',
    config: {
      resolution: 'original',
      format: 'jpeg',
      quality: 0.85,
      enableUpscaling: false,
      enableHighDPI: false,
      scalingQuality: 'low'
    },
    estimatedProcessingTime: '< 1 second',
    estimatedFileSize: '0.5-2 MB'
  }
};

/**
 * Default export configuration
 */
export const DEFAULT_EXPORT_CONFIG: ExportQualityConfig = {
  resolution: '4k',
  format: 'png',
  quality: 1.0,
  enableUpscaling: true,
  enableHighDPI: true,
  scalingQuality: 'high'
};

/**
 * Resolution targets for different presets
 */
export const RESOLUTION_TARGETS = {
  '4k': { width: 3840, height: 2160 },
  '8k': { width: 7680, height: 4320 },
  'original': { width: 0, height: 0 }, // Will use source dimensions
  'custom': { width: 0, height: 0 } // Will use custom dimensions
};

/**
 * Current active export configuration
 */
let currentExportConfig: ExportQualityConfig = { ...DEFAULT_EXPORT_CONFIG };

/**
 * Get the current export configuration
 */
export function getCurrentExportConfig(): ExportQualityConfig {
  return { ...currentExportConfig };
}

/**
 * Set the export configuration
 */
export function setExportConfig(config: Partial<ExportQualityConfig>): void {
  currentExportConfig = { ...currentExportConfig, ...config };
}

/**
 * Get export configuration by preset name
 */
export function getExportPreset(presetName: string): ExportPreset | null {
  return EXPORT_PRESETS[presetName] || null;
}

/**
 * Apply a preset configuration
 */
export function applyExportPreset(presetName: string): boolean {
  const preset = getExportPreset(presetName);
  if (preset) {
    currentExportConfig = { ...preset.config };
    return true;
  }
  return false;
}

/**
 * Get target dimensions based on configuration and source dimensions
 */
export function getTargetDimensions(
  sourceWidth: number,
  sourceHeight: number,
  config: ExportQualityConfig
): { width: number; height: number } {
  if (config.resolution === 'original') {
    return { width: sourceWidth, height: sourceHeight };
  }

  if (config.resolution === 'custom' && config.customWidth && config.customHeight) {
    return { width: config.customWidth, height: config.customHeight };
  }

  const target = RESOLUTION_TARGETS[config.resolution as keyof typeof RESOLUTION_TARGETS];
  if (!target || (target.width === 0 && target.height === 0)) {
    return { width: sourceWidth, height: sourceHeight };
  }

  // Calculate dimensions maintaining aspect ratio
  const sourceAspect = sourceWidth / sourceHeight;
  const targetAspect = target.width / target.height;

  let finalWidth: number;
  let finalHeight: number;

  if (sourceAspect > targetAspect) {
    // Source is wider, fit to target width
    finalWidth = target.width;
    finalHeight = target.width / sourceAspect;
  } else {
    // Source is taller, fit to target height
    finalHeight = target.height;
    finalWidth = target.height * sourceAspect;
  }

  return {
    width: Math.round(finalWidth),
    height: Math.round(finalHeight)
  };
}

/**
 * Get device pixel ratio for high-DPI rendering
 */
export function getDevicePixelRatio(): number {
  if (typeof window === 'undefined') return 1;
  return window.devicePixelRatio || 1;
}

/**
 * Calculate canvas dimensions with high-DPI support
 */
export function getCanvasDimensions(
  logicalWidth: number,
  logicalHeight: number,
  enableHighDPI: boolean
): { canvasWidth: number; canvasHeight: number; scale: number } {
  if (!enableHighDPI) {
    return {
      canvasWidth: logicalWidth,
      canvasHeight: logicalHeight,
      scale: 1
    };
  }

  const dpr = getDevicePixelRatio();
  const scale = Math.max(1, dpr);

  return {
    canvasWidth: Math.round(logicalWidth * scale),
    canvasHeight: Math.round(logicalHeight * scale),
    scale
  };
}

/**
 * Estimate processing time based on configuration
 */
export function estimateProcessingTime(
  sourceWidth: number,
  sourceHeight: number,
  config: ExportQualityConfig
): number {
  let baseTime = 1; // Base time in seconds

  // Factor in resolution
  const { width: targetWidth, height: targetHeight } = getTargetDimensions(
    sourceWidth,
    sourceHeight,
    config
  );
  
  const pixelCount = targetWidth * targetHeight;
  const sourcePixelCount = sourceWidth * sourceHeight;
  const scaleFactor = pixelCount / sourcePixelCount;

  baseTime *= Math.max(1, scaleFactor);

  // Factor in format
  if (config.format === 'png') {
    baseTime *= 1.5; // PNG takes longer to encode
  }

  // Factor in scaling quality
  if (config.scalingQuality === 'high') {
    baseTime *= 2;
  } else if (config.scalingQuality === 'medium') {
    baseTime *= 1.3;
  }

  // Factor in upscaling
  if (config.enableUpscaling && scaleFactor > 1) {
    baseTime *= 1.5;
  }

  return Math.round(baseTime * 10) / 10; // Round to 1 decimal place
}

/**
 * Estimate file size based on configuration
 */
export function estimateFileSize(
  sourceWidth: number,
  sourceHeight: number,
  config: ExportQualityConfig
): string {
  const { width: targetWidth, height: targetHeight } = getTargetDimensions(
    sourceWidth,
    sourceHeight,
    config
  );
  
  const megapixels = (targetWidth * targetHeight) / 1000000;
  
  let baseSizeMB = megapixels * 2; // Base estimate: 2MB per megapixel

  // Adjust for format
  if (config.format === 'png') {
    baseSizeMB *= 2.5; // PNG is typically larger
  } else {
    baseSizeMB *= config.quality; // Adjust for JPEG quality
  }

  // Adjust for scaling quality (affects compression efficiency)
  if (config.scalingQuality === 'high') {
    baseSizeMB *= 1.2; // Higher quality = larger files
  }

  const sizeMB = Math.round(baseSizeMB * 10) / 10;
  
  if (sizeMB < 1) {
    return `${Math.round(sizeMB * 1024)} KB`;
  } else {
    return `${sizeMB} MB`;
  }
}

/**
 * Validate export configuration
 */
export function validateExportConfig(config: ExportQualityConfig): string[] {
  const errors: string[] = [];

  if (config.quality < 0.1 || config.quality > 1.0) {
    errors.push('Quality must be between 0.1 and 1.0');
  }

  if (config.resolution === 'custom') {
    if (!config.customWidth || config.customWidth < 1) {
      errors.push('Custom width must be specified and greater than 0');
    }
    if (!config.customHeight || config.customHeight < 1) {
      errors.push('Custom height must be specified and greater than 0');
    }
    if (config.customWidth! > 16384 || config.customHeight! > 16384) {
      errors.push('Custom dimensions exceed maximum supported size (16384x16384)');
    }
  }

  return errors;
}

/**
 * Get all available presets
 */
export function getAllExportPresets(): ExportPreset[] {
  return Object.values(EXPORT_PRESETS);
}

/**
 * Check if browser supports required features for the configuration
 */
export function checkBrowserSupport(config: ExportQualityConfig): {
  supported: boolean;
  missingFeatures: string[];
} {
  const missingFeatures: string[] = [];

  if (typeof window === 'undefined') {
    missingFeatures.push('Browser environment required');
  }

  // Check for canvas support
  if (!document.createElement('canvas').getContext) {
    missingFeatures.push('Canvas not supported');
  }

  // Check for high-DPI support if needed
  if (config.enableHighDPI && getDevicePixelRatio() <= 1) {
    missingFeatures.push('High-DPI display not available');
  }

  // Check memory constraints for large resolutions
  if (config.resolution === '8k') {
    // Rough memory check
    const canvas = document.createElement('canvas');
    try {
      canvas.width = 7680;
      canvas.height = 4320;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        missingFeatures.push('Insufficient memory for 8K rendering');
      }
    } catch (error) {
      missingFeatures.push('Insufficient memory for 8K rendering');
    }
  }

  return {
    supported: missingFeatures.length === 0,
    missingFeatures
  };
}
