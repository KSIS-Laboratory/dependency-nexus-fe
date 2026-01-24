/**
 * Frontend caching utilities for vulnerability scanning
 * Provides in-memory caching with TTL and request deduplication
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

// Default cache TTL: 5 minutes
const DEFAULT_TTL_MS = 5 * 60 * 1000;

// Request deduplication window: 10 seconds
const DEDUP_WINDOW_MS = 10 * 1000;

class ScanCacheManager {
  private readonly cache: Map<string, CacheEntry<any>> = new Map();
  private readonly pendingRequests: Map<string, PendingRequest<any>> = new Map();

  /**
   * Generate a cache key for vulnerability scan
   */
  private generateKey(repositoryId: string, packagesHash?: string): string {
    return `vuln-scan:${repositoryId}:${packagesHash || "latest"}`;
  }

  /**
   * Generate a hash from packages list for cache key
   */
  hashPackages(packages: Array<{ name: string; version?: string; ecosystem: string }>): string {
    const sorted = [...packages].sort((a, b) => 
      `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`)
    );
    return btoa(JSON.stringify(sorted)).slice(0, 32);
  }

  /**
   * Get cached scan result
   */
  get<T>(repositoryId: string, packagesHash?: string): T | null {
    const key = this.generateKey(repositoryId, packagesHash);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      console.log(`[ScanCache] Cache expired for ${repositoryId}`);
      return null;
    }

    console.log(`[ScanCache] Cache hit for ${repositoryId} (age: ${Math.round((Date.now() - entry.timestamp) / 1000)}s)`);
    return entry.data as T;
  }

  /**
   * Set cached scan result
   */
  set<T>(repositoryId: string, data: T, packagesHash?: string, ttlMs: number = DEFAULT_TTL_MS): void {
    const key = this.generateKey(repositoryId, packagesHash);
    const now = Date.now();

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttlMs,
    });

    console.log(`[ScanCache] Cached result for ${repositoryId} (TTL: ${ttlMs / 1000}s)`);
  }

  /**
   * Invalidate cache for a repository
   */
  invalidate(repositoryId: string): void {
    const prefix = `vuln-scan:${repositoryId}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
    console.log(`[ScanCache] Invalidated cache for ${repositoryId}`);
  }

  /**
   * Deduplicate requests - if same request is in-flight, return the existing promise
   */
  deduplicateRequest<T>(
    repositoryId: string,
    packagesHash: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const key = this.generateKey(repositoryId, packagesHash);
    const pending = this.pendingRequests.get(key);

    // If there's a pending request within dedup window, return it
    if (pending && Date.now() - pending.timestamp < DEDUP_WINDOW_MS) {
      console.log(`[ScanCache] Deduplicating request for ${repositoryId}`);
      return pending.promise;
    }

    // Create new request
    const promise = requestFn().finally(() => {
      // Clean up pending request after completion
      setTimeout(() => {
        const current = this.pendingRequests.get(key);
        if (current?.promise === promise) {
          this.pendingRequests.delete(key);
        }
      }, 100);
    });

    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    console.log("[ScanCache] Cache cleared");
  }
}

// Export singleton instance
export const scanCache = new ScanCacheManager();

/**
 * Optimistic update helper
 * Returns immediately with cached data while fetching fresh data
 */
export async function withOptimisticUpdate<T>(
  repositoryId: string,
  packagesHash: string,
  fetchFn: () => Promise<T>,
  onUpdate: (data: T, fromCache: boolean) => void
): Promise<T> {
  // Check cache first
  const cached = scanCache.get<T>(repositoryId, packagesHash);
  
  if (cached) {
    // Return cached immediately
    onUpdate(cached, true);
    
    // Fetch fresh in background (stale-while-revalidate pattern)
    fetchFn()
      .then((fresh) => {
        scanCache.set(repositoryId, fresh, packagesHash);
        onUpdate(fresh, false);
      })
      .catch((err) => {
        console.warn("[OptimisticUpdate] Background refresh failed:", err);
      });
    
    return cached;
  }

  // No cache, fetch fresh
  const fresh = await fetchFn();
  scanCache.set(repositoryId, fresh, packagesHash);
  onUpdate(fresh, false);
  return fresh;
}
