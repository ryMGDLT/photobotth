/**
 * Cache Manager
 * Multi-level caching system for frames, scaled images, and composite renders
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  size: number; // bytes
  accessCount: number;
  lastAccessed: number;
}

export interface CacheConfig {
  maxSize: number; // MB
  maxEntries: number;
  ttl: number; // milliseconds
  enableLRU: boolean;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number; // MB
  hitRate: number;
  missRate: number;
  oldestEntry: number;
  newestEntry: number;
}

/**
 * Generic LRU Cache implementation
 */
class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private maxEntries: number;
  private currentSize = 0;

  constructor(config: CacheConfig) {
    this.maxSize = config.maxSize * 1024 * 1024; // Convert MB to bytes
    this.maxEntries = config.maxEntries;
  }

  /**
   * Get item from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Update access tracking
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  /**
   * Set item in cache
   */
  set(key: string, data: T, size: number): void {
    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.delete(key);
    }

    // Check if we need to evict entries
    while (this.shouldEvict(size)) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      size,
      accessCount: 1,
      lastAccessed: Date.now()
    };

    this.cache.set(key, entry);
    this.currentSize += size;
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.currentSize -= entry.size;
    this.cache.delete(key);
    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    if (this.cache.size === 0) {
      return {
        totalEntries: 0,
        totalSize: 0,
        hitRate: 0,
        missRate: 0,
        oldestEntry: 0,
        newestEntry: 0
      };
    }

    const entries = Array.from(this.cache.values());
    const now = Date.now();
    const totalSize = this.currentSize / 1024 / 1024; // Convert to MB
    const oldestEntry = Math.min(...entries.map(e => e.timestamp));
    const newestEntry = Math.max(...entries.map(e => e.timestamp));
    
    // Calculate hit/miss rates (simplified - would need tracking in real implementation)
    const totalAccesses = entries.reduce((sum, e) => sum + e.accessCount, 0);
    const hitRate = totalAccesses > 0 ? (totalAccesses - entries.length) / totalAccesses : 0;
    const missRate = 1 - hitRate;

    return {
      totalEntries: this.cache.size,
      totalSize,
      hitRate,
      missRate,
      oldestEntry,
      newestEntry
    };
  }

  /**
   * Check if we should evict entries
   */
  private shouldEvict(newEntrySize: number): boolean {
    return (
      this.cache.size >= this.maxEntries ||
      this.currentSize + newEntrySize > this.maxSize
    );
  }

  /**
   * Evict least recently used entry
   */
  private evictLeastRecentlyUsed(): void {
    if (this.cache.size === 0) return;

    const firstKey = this.cache.keys().next().value;
    if (firstKey === undefined) return;
    
    const firstEntry = this.cache.get(firstKey);
    
    if (firstEntry) {
      this.currentSize -= firstEntry.size;
    }
    
    this.cache.delete(firstKey);
  }
}

/**
 * Cache Manager for different types of data
 */
export class CacheManager {
  private frameCache: LRUCache<ImageData>;
  private scaledImageCache: LRUCache<string>; // Data URLs
  private compositeCache: LRUCache<string>; // Data URLs
  private config: CacheConfig;
  private hitCount = 0;
  private missCount = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 100, // 100MB default
      maxEntries: 1000,
      ttl: 30 * 60 * 1000, // 30 minutes
      enableLRU: true,
      ...config
    };

    this.frameCache = new LRUCache<ImageData>(this.config);
    this.scaledImageCache = new LRUCache<string>(this.config);
    this.compositeCache = new LRUCache<string>(this.config);

    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Get cached frame background
   */
  getFrame(frameId: string, width: number, height: number): ImageData | null {
    const key = `frame-${frameId}-${width}-${height}`;
    const result = this.frameCache.get(key);
    
    if (result) {
      this.hitCount++;
      return result;
    } else {
      this.missCount++;
      return null;
    }
  }

  /**
   * Cache frame background
   */
  setFrame(frameId: string, width: number, height: number, imageData: ImageData): void {
    const key = `frame-${frameId}-${width}-${height}`;
    const size = imageData.width * imageData.height * 4; // 4 bytes per pixel (RGBA)
    this.frameCache.set(key, imageData, size);
  }

  /**
   * Get cached scaled image
   */
  getScaledImage(sourceHash: string, width: number, height: number): string | null {
    const key = `scaled-${sourceHash}-${width}-${height}`;
    const result = this.scaledImageCache.get(key);
    
    if (result) {
      this.hitCount++;
      return result;
    } else {
      this.missCount++;
      return null;
    }
  }

  /**
   * Cache scaled image
   */
  setScaledImage(sourceHash: string, width: number, height: number, dataUrl: string): void {
    const key = `scaled-${sourceHash}-${width}-${height}`;
    const size = this.estimateDataURLSize(dataUrl);
    this.scaledImageCache.set(key, dataUrl, size);
  }

  /**
   * Get cached composite render
   */
  getComposite(photoId: string, frameId: string, quality: string): string | null {
    const key = `composite-${photoId}-${frameId}-${quality}`;
    const result = this.compositeCache.get(key);
    
    if (result) {
      this.hitCount++;
      return result;
    } else {
      this.missCount++;
      return null;
    }
  }

  /**
   * Cache composite render
   */
  setComposite(photoId: string, frameId: string, quality: string, dataUrl: string): void {
    const key = `composite-${photoId}-${frameId}-${quality}`;
    const size = this.estimateDataURLSize(dataUrl);
    this.compositeCache.set(key, dataUrl, size);
  }

  /**
   * Generate hash for image source.
   * Uses FNV-1a (53-bit via two 32-bit halves) to avoid the high collision
   * rate of the previous 32-bit djb2 implementation, which caused different
   * EditorSettings JSON strings (e.g. preset:"noir" vs preset:"warm") to
   * collide and return stale cached renders.
   */
  generateImageHash(source: string): string {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < source.length; i++) {
      const char = source.charCodeAt(i);
      h1 = Math.imul(h1 ^ char, 2654435761);
      h2 = Math.imul(h2 ^ char, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats(): {
    frame: CacheStats;
    scaledImage: CacheStats;
    composite: CacheStats;
    overall: {
      hitRate: number;
      missRate: number;
      totalSize: number;
    };
  } {
    const frameStats = this.frameCache.getStats();
    const scaledImageStats = this.scaledImageCache.getStats();
    const compositeStats = this.compositeCache.getStats();
    
    const totalAccesses = this.hitCount + this.missCount;
    const hitRate = totalAccesses > 0 ? this.hitCount / totalAccesses : 0;
    const missRate = 1 - hitRate;

    return {
      frame: frameStats,
      scaledImage: scaledImageStats,
      composite: compositeStats,
      overall: {
        hitRate,
        missRate,
        totalSize: frameStats.totalSize + scaledImageStats.totalSize + compositeStats.totalSize
      }
    };
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.frameCache.clear();
    this.scaledImageCache.clear();
    this.compositeCache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    const cutoff = now - this.config.ttl;

    [this.frameCache, this.scaledImageCache, this.compositeCache].forEach(cache => {
      for (const key of Array.from((cache as any).cache.keys())) {
        const entry = (cache as any).cache.get(key);
        if (entry && entry.timestamp < cutoff) {
          (cache as any).cache.delete(key);
        }
      }
    });
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clearAll();
  }

  /**
   * Estimate Data URL size in bytes
   */
  private estimateDataURLSize(dataUrl: string): number {
    // Remove the data URL prefix and estimate
    const base64 = dataUrl.split(',')[1] || '';
    return base64.length * 0.75; // Base64 is ~33% larger than binary
  }

  /**
   * Cleanup interval for expired entries
   */
  private cleanupInterval?: NodeJS.Timeout;

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.clearExpired();
    }, this.config.ttl / 2); // Clean up twice per TTL period
  }
}

/**
 * Global cache manager instance
 */
export const cacheManager = new CacheManager();

/**
 * Cache utilities
 */
export function withCache<T>(
  cache: LRUCache<T>,
  key: string,
  factory: () => T,
  sizeEstimator: (data: T) => number
): T {
  const cached = cache.get(key);
  if (cached) return cached;

  const data = factory();
  const size = sizeEstimator(data);
  cache.set(key, data, size);
  return data;
}

/**
 * Memory-aware caching wrapper
 */
export function cacheWithMemoryLimit<T>(
  cache: LRUCache<T>,
  key: string,
  factory: () => Promise<T>,
  sizeEstimator: (data: T) => number,
  maxSize: number // MB
): Promise<T> {
  return new Promise((resolve, reject) => {
    // Check if we have enough memory
    const stats = cache.getStats();
    if (stats.totalSize >= maxSize) {
      // Clear some space
      cache.clear();
    }

    // Try to get from cache first
    const cached = cache.get(key);
    if (cached) {
      resolve(cached);
      return;
    }

    // Create new data
    factory()
      .then(data => {
        const size = sizeEstimator(data);
        cache.set(key, data, size);
        resolve(data);
      })
      .catch(reject);
  });
}
