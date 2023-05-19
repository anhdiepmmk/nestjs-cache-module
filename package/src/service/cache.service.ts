import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CACHE_MODULE_OPTIONS,
  CACHE_MANAGER_INSTANCE,
  DEFAULT_CACHE_SEPARATOR,
  CACHE_ENGINES,
} from '../constants';
import { CacheModuleOptions } from '../cache-module-options';
import { filterArrayByPattern } from '../utility/array.utility';
import _ from 'lodash';
import { CacheEngine, CacheManager } from '../types';

@Injectable()
export class CacheService {
  private readonly logger: Logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER_INSTANCE)
    private readonly cacheManagerInstance: CacheManager,
    @Inject(CACHE_ENGINES)
    private readonly cacheEngines: CacheEngine[],
    @Inject(CACHE_MODULE_OPTIONS)
    private readonly options: CacheModuleOptions,
  ) {}

  private getModulePrefix(): string {
    if (!this.options.cacheModulePrefix) {
      return '';
    }

    const separator: string =
      this.options.cacheSeparator ?? DEFAULT_CACHE_SEPARATOR;

    return `${this.options.cacheModulePrefix}${separator}`;
  }

  /**
   * Reset
   */
  async reset(): Promise<void> {
    await this.cacheManagerInstance.reset();
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

    const isPattern: boolean = _.includes(keyOrPattern, '*');

    let keysToDelete: string[] = [keyOrPattern];

    if (isPattern) {
      keysToDelete = await this.keys(keyOrPattern);
    }

    const modulePrefix: string = this.getModulePrefix();

    await this.cacheManagerInstance.mdel(
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
      actualPattern = `${modulePrefix}*`;
    }

    const totalKeysWithPrefix: Array<string[]> = await Promise.all(
      this.cacheEngines.map(async (cacheEngine: CacheEngine) => {
        try {
          return await cacheEngine.store.keys(actualPattern);
        } catch (error) {
          this.logger.error({
            message: 'Store keys error',
            actualPattern,
            cacheEngine,
            error,
          });
        }
        return [];
      }),
    );

    const keysWithPrefix: string[] = _.uniq(_.flatMap(totalKeysWithPrefix));

    // ensure filter key by pattern (in case of using memory cache store the memoryCache.store.keys(pattern) will always return all keys even specific pattern)
    const filteredKeysWithPrefix: string[] = filterArrayByPattern(
      actualPattern,
      keysWithPrefix,
    );

    const regex = new RegExp(`^${modulePrefix}`);

    const keysWithoutPrefix: string[] = filteredKeysWithPrefix.map(
      (keyWithPrefix) => {
        if (!modulePrefix) {
          return keyWithPrefix;
        }

        return keyWithPrefix.replace(regex, '');
      },
    );

    return keysWithoutPrefix;
  }

  /**
   * Get data by key
   * @param key key to get data
   */
  async get<T>(key: string): Promise<T> {
    const actualKey: string = `${this.getModulePrefix()}${key}`;
    return this.cacheManagerInstance.get<T>(actualKey);
  }

  /**
   * Set data by key
   * @param key key to store data
   * @param value data to store
   * @param ttl time to live in milliseconds
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const actualKey: string = `${this.getModulePrefix()}${key}`;
    await this.cacheManagerInstance.set(actualKey, value, ttl);
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
    return this.cacheManagerInstance.wrap(actualKey, fn, ttl);
  }
}
