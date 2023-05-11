import { Inject, Injectable, Logger } from '@nestjs/common';
import { MemoryCache } from 'cache-manager';
import { CACHE_MODULE_OPTIONS, CACHE_MANAGER_INSTANCE } from './constants';
import { CacheModuleOptions } from './cache-module-options';
import _ from 'lodash';

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
   * Del by key or pattern
   * eg1: post-service:posts:123
   * eg2: post-service:posts:*
   * eg3: post-service:posts:*:author
   * eg4: post-service:posts:abc*:author
   * @param key key or pattern to del
   */
  async del(keyOrPattern: string): Promise<void> {
    // TODO: keyOrPattern should be an string or array

    const isPattern: boolean =
      _.includes(keyOrPattern, ':*') ||
      _.includes(keyOrPattern, '*:') ||
      keyOrPattern === '*';

    let keysToDelete: string[] = [keyOrPattern];

    if (isPattern) {
      keysToDelete = await this.keys(keyOrPattern);
    }

    const modulePrefix: string = this.getModulePrefix();

    await this.memoryCache.store.mdel(
      ..._.map(keysToDelete, (keysToDelete) => {
        return `${modulePrefix}${keysToDelete}`;
      }),
    );
  }

  /**
   * Search related keys by pattern
   * @param pattern pattern to search keys
   * @returns keys related to provided pattern
   */
  async keys(pattern?: string): Promise<string[]> {
    let actualPattern: string;

    const modulePrefix: string = this.getModulePrefix();

    if (pattern) {
      actualPattern = `${modulePrefix}${pattern}`;
    } else {
      actualPattern = modulePrefix;
    }

    const regex = new RegExp(`^${modulePrefix}`);

    const keysWithPrefix = await this.memoryCache.store.keys(pattern);

    const keysWithoutPrefix: string[] = keysWithPrefix.map((keyWithPrefix) => {
      if (!modulePrefix) {
        return keyWithPrefix;
      }

      return keyWithPrefix.replace(regex, '');
    });

    return keysWithoutPrefix;
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
