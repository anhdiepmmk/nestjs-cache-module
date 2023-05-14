import { DynamicModule } from '@nestjs/common';
import { CacheService } from './service/cache.service';
import { CacheModuleOptions } from './cache-module-options';
import {
  CACHE_MANAGER_INSTANCE,
  CACHE_MODULE_OPTIONS,
  DEFAULT_MEMORY_CACHE_MAX,
  DEFAULT_MEMORY_CACHE_TTL_IN_MILLISECONDS,
} from './constants';
import { MemoryCache, MemoryConfig, caching } from 'cache-manager';

const createMemoryCache = async (
  memoryConfig?: MemoryConfig,
): Promise<MemoryCache> => {
  const memoryCache: MemoryCache = await caching('memory', {
    max: DEFAULT_MEMORY_CACHE_MAX,
    ttl: DEFAULT_MEMORY_CACHE_TTL_IN_MILLISECONDS,
    ...(memoryConfig ?? {}),
  });

  return memoryCache;
};

export class CacheModule {
  static register(options?: CacheModuleOptions): DynamicModule {
    return {
      module: CacheModule,
      providers: [
        CacheService,
        {
          provide: CACHE_MODULE_OPTIONS,
          useValue: options ?? {},
        },
        {
          provide: CACHE_MANAGER_INSTANCE,
          useFactory: async () => {
            return createMemoryCache(options?.memoryConfig);
          },
        },
      ],
      exports: [CacheService, CACHE_MANAGER_INSTANCE, CACHE_MODULE_OPTIONS],
      global: true,
    };
  }
}
