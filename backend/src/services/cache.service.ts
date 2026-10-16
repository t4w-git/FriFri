import { logger } from '../logger.js';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class CacheService {
  private store = new Map<string, CacheEntry<unknown>>();

  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() > entry.expiresAt;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (this.isExpired(entry)) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = (options?.ttl || 3600) * 1000;
    this.store.set(key, { value, expiresAt: Date.now() + ttl });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async deleteMany(keys: string[]): Promise<void> {
    keys.forEach(k => this.store.delete(k));
  }

  async clear(): Promise<void> {
    this.store.clear();
    logger.info('Cache cleared');
  }

  async getKeys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return [...this.store.keys()].filter(k => regex.test(k));
  }

  async setWithPattern<T>(
    key: string,
    value: T,
    invalidationPattern: string,
    options?: CacheOptions
  ): Promise<void> {
    await this.set(key, value, options);
    const patternKey = `pattern:${invalidationPattern}`;
    const existingKeys = (await this.get<string[]>(patternKey)) || [];
    if (!existingKeys.includes(key)) {
      existingKeys.push(key);
      await this.set(patternKey, existingKeys, { ttl: 86400 });
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.getKeys(pattern);
    await this.deleteMany(keys);
    await this.delete(`pattern:${pattern}`);
  }
}

export const cacheService = new CacheService();
