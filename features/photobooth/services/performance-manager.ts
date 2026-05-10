/**
 * Performance Manager
 * Manages dual-quality rendering system and performance optimization
 */

import type { ExportQualityConfig } from '../types/photobooth.types';

export interface PerformanceConfig {
  enablePreviewMode: boolean;
  maxMemoryUsage: number; // MB
  enableWebWorkers: boolean;
  cacheSize: number; // MB
  workerTimeout: number; // ms
}

export interface PerformanceMetrics {
  memoryUsage: number;
  cacheSize: number;
  activeWorkers: number;
  processingTime: number;
  quality: 'preview' | 'high';
}

export interface PreviewConfig extends ExportQualityConfig {
  resolution: 'original';
  format: 'jpeg';
  quality: 0.85;
  enableUpscaling: false;
  enableHighDPI: false;
  scalingQuality: 'low';
}

export interface HighQualityConfig extends ExportQualityConfig {
  resolution: '4k';
  format: 'png';
  quality: 1.0;
  enableUpscaling: true;
  enableHighDPI: true;
  scalingQuality: 'high';
}

/**
 * Default performance configuration
 */
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  enablePreviewMode: true,
  maxMemoryUsage: 200, // 200MB
  enableWebWorkers: true,
  cacheSize: 100, // 100MB
  workerTimeout: 10000 // 10 seconds
};

/**
 * Preview quality configuration for fast rendering
 */
export const PREVIEW_CONFIG: PreviewConfig = {
  resolution: 'original',
  format: 'jpeg',
  quality: 0.85,
  enableUpscaling: false,
  enableHighDPI: false,
  scalingQuality: 'low'
};

/**
 * High quality configuration for export
 */
export const HIGH_QUALITY_CONFIG: HighQualityConfig = {
  resolution: '4k',
  format: 'png',
  quality: 1.0,
  enableUpscaling: true,
  enableHighDPI: true,
  scalingQuality: 'high'
};

/**
 * Performance Manager Class
 */
export class PerformanceManager {
  public config: PerformanceConfig;
  public metrics: PerformanceMetrics;
  private activeWorkers: Map<string, Worker> = new Map();
  private memoryMonitorInterval?: NodeJS.Timeout;

  constructor(config: PerformanceConfig = DEFAULT_PERFORMANCE_CONFIG) {
    this.config = config;
    this.metrics = {
      memoryUsage: 0,
      cacheSize: 0,
      activeWorkers: 0,
      processingTime: 0,
      quality: 'preview'
    };
    
    this.startMemoryMonitoring();
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if preview mode should be used
   */
  shouldUsePreviewMode(): boolean {
    return this.config.enablePreviewMode && this.metrics.quality === 'preview';
  }

  /**
   * Set rendering quality mode
   */
  setQualityMode(quality: 'preview' | 'high'): void {
    this.metrics.quality = quality;
  }

  /**
   * Get appropriate export configuration based on quality mode
   */
  getExportConfig(): ExportQualityConfig {
    return this.metrics.quality === 'preview' ? PREVIEW_CONFIG : HIGH_QUALITY_CONFIG;
  }

  /**
   * Check if memory usage is within limits
   */
  isMemoryUsageAcceptable(): boolean {
    return this.metrics.memoryUsage <= this.config.maxMemoryUsage;
  }

  /**
   * Get estimated processing time for given operation
   */
  estimateProcessingTime(
    sourceWidth: number,
    sourceHeight: number,
    quality: 'preview' | 'high' = this.metrics.quality
  ): number {
    const pixelCount = sourceWidth * sourceHeight;
    const baseTime = quality === 'preview' ? 0.1 : 1.0; // Base time in seconds
    
    // Adjust for resolution
    const resolutionMultiplier = quality === 'high' ? 16 : 1; // 4K is ~16x pixels
    const time = baseTime * (pixelCount / 1920 / 1080) * resolutionMultiplier;
    
    return Math.min(time, 30); // Cap at 30 seconds
  }

  /**
   * Create a web worker for background processing
   */
  createWorker(workerType: 'scaling' | 'frame' | 'composite', id: string): Worker | null {
    if (!this.config.enableWebWorkers || typeof Worker === 'undefined') {
      return null;
    }

    try {
      let workerScript: string;
      
      switch (workerType) {
        case 'scaling':
          workerScript = this.getScalingWorkerScript();
          break;
        case 'frame':
          workerScript = this.getFrameWorkerScript();
          break;
        case 'composite':
          workerScript = this.getCompositeWorkerScript();
          break;
        default:
          return null;
      }

      const blob = new Blob([workerScript], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      
      // Set up timeout
      const timeout = setTimeout(() => {
        worker.terminate();
        this.activeWorkers.delete(id);
      }, this.config.workerTimeout);

      worker.addEventListener('message', () => {
        clearTimeout(timeout);
      });

      worker.addEventListener('error', () => {
        clearTimeout(timeout);
        this.activeWorkers.delete(id);
      });

      this.activeWorkers.set(id, worker);
      this.metrics.activeWorkers = this.activeWorkers.size;
      
      return worker;
    } catch (error) {
      console.warn('Failed to create web worker:', error);
      return null;
    }
  }

  /**
   * Terminate a web worker
   */
  terminateWorker(id: string): void {
    const worker = this.activeWorkers.get(id);
    if (worker) {
      worker.terminate();
      this.activeWorkers.delete(id);
      this.metrics.activeWorkers = this.activeWorkers.size;
    }
  }

  /**
   * Clean up all workers and resources
   */
  cleanup(): void {
    // Terminate all workers
    for (const [id, worker] of this.activeWorkers) {
      worker.terminate();
    }
    this.activeWorkers.clear();
    this.metrics.activeWorkers = 0;

    // Stop memory monitoring
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
    }
  }

  /**
   * Get device performance level
   */
  getDevicePerformanceLevel(): 'low' | 'medium' | 'high' {
    return getDevicePerformanceLevel();
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.memoryMonitorInterval = setInterval(() => {
      this.updateMemoryMetrics();
    }, 1000); // Update every second
  }

  /**
   * Update memory usage metrics
   */
  private updateMemoryMetrics(): void {
    if (typeof window === 'undefined' || !(performance as any).memory) {
      return;
    }

    const memory = (performance as any).memory;
    this.metrics.memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
    
    // Trigger garbage collection if memory is high
    if (this.metrics.memoryUsage > this.config.maxMemoryUsage * 0.8) {
      this.requestGarbageCollection();
    }
  }

  /**
   * Request garbage collection if available
   */
  private requestGarbageCollection(): void {
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
    }
  }

  /**
   * Get scaling worker script
   */
  private getScalingWorkerScript(): string {
    return `
      self.addEventListener('message', function(e) {
        const { type, data } = e.data;
        
        if (type === 'scale') {
          try {
            // Import scaling logic here
            // This is a simplified version - full implementation would include Lanczos algorithm
            self.postMessage({
              type: 'result',
              data: { success: true, result: 'scaled-image-data' }
            });
          } catch (error) {
            self.postMessage({
              type: 'error',
              data: { error: error.message }
            });
          }
        }
      });
    `;
  }

  /**
   * Get frame worker script
   */
  private getFrameWorkerScript(): string {
    return `
      self.addEventListener('message', function(e) {
        const { type, data } = e.data;
        
        if (type === 'render-frame') {
          try {
            // Frame rendering logic
            self.postMessage({
              type: 'result',
              data: { success: true, result: 'frame-data' }
            });
          } catch (error) {
            self.postMessage({
              type: 'error',
              data: { error: error.message }
            });
          }
        }
      });
    `;
  }

  /**
   * Get composite worker script
   */
  private getCompositeWorkerScript(): string {
    return `
      self.addEventListener('message', function(e) {
        const { type, data } = e.data;
        
        if (type === 'composite') {
          try {
            // Composite rendering logic
            self.postMessage({
              type: 'result',
              data: { success: true, result: 'composite-data' }
            });
          } catch (error) {
            self.postMessage({
              type: 'error',
              data: { error: error.message }
            });
          }
        }
      });
    `;
  }
}

/**
 * Global performance manager instance
 */
export const performanceManager = new PerformanceManager();

/**
 * Performance monitoring utilities
 */
export function withPerformanceTracking<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const startTime = performance.now();
  
  return operation().then(result => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`Performance: ${operationName} took ${duration.toFixed(2)}ms`);
    
    // Update metrics
    performanceManager.metrics.processingTime = duration;
    
    return result;
  }).catch(error => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.error(`Performance: ${operationName} failed after ${duration.toFixed(2)}ms`, error);
    
    throw error;
  });
}

/**
 * Check if device supports high-performance operations
 */
export function getDevicePerformanceLevel(): 'low' | 'medium' | 'high' {
  if (typeof window === 'undefined') return 'medium';
  
  const memory = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const connection = (navigator as any).connection;
  
  // Calculate performance score
  let score = 0;
  score += Math.min(memory / 8, 1) * 40; // Memory up to 8GB
  score += Math.min(cores / 8, 1) * 40;  // Cores up to 8
  score += (connection?.effectiveType === '4g' ? 20 : 
           connection?.effectiveType === '3g' ? 10 : 5);
  
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

/**
 * Adjust performance settings based on device capabilities
 */
export function optimizePerformanceForDevice(): void {
  const deviceLevel = getDevicePerformanceLevel();
  
  switch (deviceLevel) {
    case 'low':
      performanceManager.setQualityMode('preview');
      // Reduce cache size for low-end devices
      performanceManager.config.cacheSize = 50;
      performanceManager.config.maxMemoryUsage = 100;
      break;
    case 'medium':
      performanceManager.setQualityMode('preview');
      break;
    case 'high':
      // Can handle high quality for preview
      break;
  }
}
