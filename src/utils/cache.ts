type CacheEntry<T> = {
  data: T;
  expiry: number;
};

export class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private pending: Map<string, Promise<any>> = new Map();

  constructor() {}

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Request Coalescing (Single-Flight)
   * Ensures only one active fetch for a specific key
   */
  async getOrFetch<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds: number): Promise<T> {
    // 1. Check valid cache
    const cached = this.get<T>(key);
    if (cached) return cached;

    // 2. Check for pending request
    const pending = this.pending.get(key);
    if (pending) return pending;

    // 3. Start new fetch
    const promise = fetchFn().then(data => {
      this.set(key, data, ttlSeconds);
      this.pending.delete(key);
      return data;
    }).catch(err => {
      this.pending.delete(key);
      throw err;
    });

    this.pending.set(key, promise);
    return promise;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const apiCache = new SimpleCache();
export const authCache = new SimpleCache();
