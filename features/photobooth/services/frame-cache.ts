import type {
  TextureOptions,
  PolkaDotOptions,
  BorderPatternOptions,
} from "@/features/photobooth/services/frame-drawing-utils";

interface CacheEntry {
  pattern: CanvasPattern | null;
  timestamp: number;
  size: number;
}

interface CacheKey {
  type: 'texture' | 'polkaDot' | 'borderPattern';
  options: string; // Stringified options for unique identification
}

/**
 * Frame Pattern Cache System
 * 
 * Provides pre-rendering and caching for complex frame patterns
 * to improve performance and reduce redundant rendering operations.
 */
export class FramePatternCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxCacheSize = 50;
  private readonly maxAge = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval to remove old patterns
    this.startCleanup();
  }

  /**
   * Generates a unique cache key from pattern type and options
   */
  private generateKey(type: CacheKey['type'], options: any): string {
    return `${type}:${JSON.stringify(options)}`;
  }

  /**
   * Creates a texture pattern using canvas
   */
  public generateTexturePattern(
    textureType: 'mottled' | 'grain',
    options: TextureOptions,
    patternSize: number = 256
  ): CanvasPattern | null {
    const key = this.generateKey('texture', { type: textureType, ...options });
    
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && this.isValidEntry(cached)) {
      return cached.pattern;
    }

    // Generate new pattern
    const canvas = document.createElement('canvas');
    canvas.width = patternSize;
    canvas.height = patternSize;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;

    // Import drawing functions dynamically to avoid circular dependencies
    import('./frame-drawing-utils').then(({ drawMottledTexture, drawGrainTexture }) => {
      if (textureType === 'mottled') {
        drawMottledTexture(ctx, 0, 0, patternSize, patternSize, options);
      } else if (textureType === 'grain') {
        drawGrainTexture(ctx, 0, 0, patternSize, patternSize, options);
      }
    });

    const pattern = ctx.createPattern(canvas, 'repeat');
    
    // Cache the pattern
    this.cache.set(key, {
      pattern,
      timestamp: Date.now(),
      size: patternSize * patternSize * 4, // Approximate memory size
    });

    // Enforce cache size limit
    this.enforceCacheLimit();

    return pattern;
  }

  /**
   * Creates a polka dot pattern using canvas
   */
  public generatePolkaDotPattern(
    options: PolkaDotOptions,
    patternSize: number = 256
  ): CanvasPattern | null {
    const key = this.generateKey('polkaDot', options);
    
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && this.isValidEntry(cached)) {
      return cached.pattern;
    }

    // Generate new pattern
    const canvas = document.createElement('canvas');
    canvas.width = patternSize;
    canvas.height = patternSize;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;

    // Import drawing functions dynamically
    import('./frame-drawing-utils').then(({ drawPolkaDotPattern }) => {
      drawPolkaDotPattern(ctx, 0, 0, patternSize, patternSize, options);
    });

    const pattern = ctx.createPattern(canvas, 'repeat');
    
    // Cache the pattern
    this.cache.set(key, {
      pattern,
      timestamp: Date.now(),
      size: patternSize * patternSize * 4,
    });

    this.enforceCacheLimit();

    return pattern;
  }

  /**
   * Creates a border pattern (hearts, scallops, etc.)
   */
  public generateBorderPattern(
    options: BorderPatternOptions,
    patternSize: number = 256
  ): ImageData | null {
    const key = this.generateKey('borderPattern', options);
    
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && this.isValidEntry(cached)) {
      // Convert stored pattern back to ImageData if needed
      return this.patternToImageData(cached.pattern);
    }

    // Generate new pattern
    const canvas = document.createElement('canvas');
    canvas.width = patternSize;
    canvas.height = options.size * 2; // Height based on element size
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;

    // Import drawing functions dynamically
    import('./frame-drawing-utils').then(({ drawPatternedBorder }) => {
      drawPatternedBorder(ctx, 0, options.size, patternSize, options.size, options);
    });

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Cache the pattern (store as pattern for consistency)
    const pattern = ctx.createPattern(canvas, 'repeat-x');
    this.cache.set(key, {
      pattern,
      timestamp: Date.now(),
      size: patternSize * options.size * 2 * 4,
    });

    this.enforceCacheLimit();

    return imageData;
  }

  /**
   * Gets a cached pattern by key
   */
  public getCachedPattern(key: string): CanvasPattern | null {
    const entry = this.cache.get(key);
    if (entry && this.isValidEntry(entry)) {
      return entry.pattern;
    }
    return null;
  }

  /**
   * Checks if a cache entry is still valid (not too old)
   */
  private isValidEntry(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.maxAge;
  }

  /**
   * Enforces cache size limit using LRU eviction
   */
  private enforceCacheLimit(): void {
    if (this.cache.size <= this.maxCacheSize) return;

    // Sort entries by timestamp (oldest first)
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    // Remove oldest entries until under limit
    const toRemove = entries.slice(0, this.cache.size - this.maxCacheSize);
    toRemove.forEach(([key]) => this.cache.delete(key));
  }

  /**
   * Cleanup old entries periodically
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > this.maxAge) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Cleanup every minute
  }

  /**
   * Convert pattern back to ImageData (for border patterns)
   */
  private patternToImageData(pattern: CanvasPattern | null): ImageData | null {
    // This is a simplified conversion - in practice, we'd need to store
    // the original ImageData for border patterns
    return null;
  }

  /**
   * Clear all cached patterns
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getStats(): {
    size: number;
    totalMemory: number;
    oldestEntry: number | null;
  } {
    let totalMemory = 0;
    let oldestTimestamp = Date.now();

    for (const entry of this.cache.values()) {
      totalMemory += entry.size;
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    }

    return {
      size: this.cache.size,
      totalMemory,
      oldestEntry: this.cache.size > 0 ? oldestTimestamp : null,
    };
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clearCache();
  }
}

// Global cache instance
let globalCache: FramePatternCache | null = null;

/**
 * Get or create the global frame pattern cache
 */
export function getFramePatternCache(): FramePatternCache {
  if (!globalCache) {
    globalCache = new FramePatternCache();
  }
  return globalCache;
}

/**
 * Cleanup global cache (call when app unmounts)
 */
export function cleanupFramePatternCache(): void {
  if (globalCache) {
    globalCache.dispose();
    globalCache = null;
  }
}

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupFramePatternCache);
}
