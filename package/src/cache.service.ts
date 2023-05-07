import { Inject, Injectable } from '@nestjs/common';
import { MemoryCache } from 'cache-manager';
import { CACHE_MODULE_OPTIONS, CACHE_MANAGER_INSTANCE } from './constants';
import { CacheModuleOptions } from './cache-module-options';

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER_INSTANCE)
    private readonly memoryCache: MemoryCache,
    @Inject(CACHE_MODULE_OPTIONS)
    private readonly options: CacheModuleOptions,
  ) {}

  private getModulePrefix(): string {
    if (!this.options.cacheModulePrefix) {
      return '';
    }

    const separator: string = this.options.cacheSeparator ?? ':';

    return `${this.options.cacheModulePrefix}${separator}`;
  }

  /**
   * Reset
   */
  async reset(): Promise<void> {
    await this.memoryCache.store.reset();
  }

  /**
   * Del by key
   * @param key key to del
   */
  async del(key: string): Promise<void> {
    const actualKey: string = `${this.getModulePrefix()}${key}`;
    await this.memoryCache.store.del(actualKey);
  }

  /**
   * Search related keys by pattern
   * @param pattern pattern to search keys
   * @returns keys related to provided pattern
   */
  async keys(pattern?: string): Promise<string[]> {
    let actualPattern: string;

    if (pattern) {
      actualPattern = `${this.getModulePrefix()}${pattern}`;
    } else {
      actualPattern = this.getModulePrefix();
    }

    return this.memoryCache.store.keys(pattern);
  }

  /**
   * Get data by key
   * @param key key to get data
   */
  async get<T>(key: string): Promise<T> {
    const actualKey: string = `${this.getModulePrefix()}${key}`;
    return this.memoryCache.get<T>(actualKey);
  }

  /**
   * Set data by key
   * @param key key to store data
   * @param value data to store
   * @param ttl time to live in milliseconds
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const actualKey: string = `${this.getModulePrefix()}${key}`;
    await this.memoryCache.set(actualKey, value, ttl);
  }

  /**
   * Wrap function in cache
   * @param key key to store data return from wrapped function
   * @param fn function to wrap, the return data after execute function will be using to store in cache
   * @param ttl time to live in milliseconds
   * @returns
   */
  async wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    const actualKey: string = `${this.getModulePrefix()}${key}`;
    return this.memoryCache.wrap(actualKey, fn, ttl);
  }
}
