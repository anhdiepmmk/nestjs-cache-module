import { DynamicModule } from '@nestjs/common';
import { CacheService } from './service/cache.service';
import { CacheModuleOptions } from './cache-module-options';
import _ from 'lodash';
import {
  CACHE_ENGINES,
  CACHE_MANAGER_INSTANCE,
  CACHE_MODULE_OPTIONS,
} from './constants';
import { multiCaching } from 'cache-manager';
import { createCacheEngines } from './utility/cache-module-provider.utility';
import { CacheEngine, CacheManager } from './types';

export class CacheModule {
  static async registerAsync(
    options?: CacheModuleOptions,
  ): Promise<DynamicModule> {
    return {
      module: CacheModule,
      providers: [
        CacheService,
        {
          provide: CACHE_MODULE_OPTIONS,
          useValue: options ?? {},
        },
        {
          provide: CACHE_ENGINES,
          useFactory: async (): Promise<CacheEngine[]> => {
            const cacheEngines: CacheEngine[] = await createCacheEngines(
              options,
            );

            return cacheEngines;
          },
        },
        {
          inject: [CACHE_ENGINES],
          provide: CACHE_MANAGER_INSTANCE,
          useFactory: async (
            cacheEngines: CacheEngine[],
          ): Promise<CacheManager> => {
            return multiCaching(cacheEngines);
          },
        },
      ],
      exports: [
        CacheService,
        CACHE_ENGINES,
        CACHE_MANAGER_INSTANCE,
        CACHE_MODULE_OPTIONS,
      ],
      global: true,
    };
  }
}
