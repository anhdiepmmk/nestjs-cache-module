import {
  MemoryConfig,
  MemoryCache,
  MemoryStore,
  memoryStore,
  caching,
} from 'cache-manager';
import {
  DEFAULT_MEMORY_CACHE_MAX,
  DEFAULT_MEMORY_CACHE_TTL_IN_MILLISECONDS,
} from '../constants';
import { Logger } from '@nestjs/common';
import {
  RedisStore,
  redisStore,
  redisInsStore,
} from 'cache-manager-ioredis-yet';
import _ from 'lodash';
import {
  CacheEngineCreationConfig,
  CacheModuleOptions,
} from '../cache-module-options';
import { CacheEngine } from '../types';

export const createDefaultMemoryCacheEngine = async (
  memoryConfig?: MemoryConfig,
): Promise<MemoryCache> => {
  const mStore: MemoryStore = memoryStore({
    max: DEFAULT_MEMORY_CACHE_MAX,
    ttl: DEFAULT_MEMORY_CACHE_TTL_IN_MILLISECONDS,
    ...(memoryConfig ?? {}),
  });

  const memoryCacheEngine: MemoryCache = await caching(mStore);

  return memoryCacheEngine;
};

export const createCacheEngineFactory = async (
  cacheEngineCreationConfig: CacheEngineCreationConfig,
): Promise<CacheEngine | undefined> => {
  try {
    if (cacheEngineCreationConfig.type === 'memory') {
      const mStore: MemoryStore = memoryStore(cacheEngineCreationConfig.config);

      return await caching(mStore);
    }

    if (cacheEngineCreationConfig.type === 'ioredis') {
      const rStore: RedisStore = await redisStore(
        cacheEngineCreationConfig.config,
      );

      return await caching(rStore);
    }

    if (cacheEngineCreationConfig.type === 'ioredis-instance') {
      const rInsStore: RedisStore = redisInsStore(
        cacheEngineCreationConfig.config.ioredisInstance,
        cacheEngineCreationConfig.config.options,
      );

      return await caching(rInsStore);
    }
  } catch (error) {
    Logger.error({
      message:
        'Create Cache Engine Error from `options.cacheEngineCreationConfig`',
      cacheEngineCreationConfig,
      error: {
        message: _.get(error, 'message'),
        stack: _.get(error, 'stack'),
      },
    });
  }

  return undefined;
};

export const createCacheEngines = async (
  options?: CacheModuleOptions,
): Promise<CacheEngine[]> => {
  const totalCacheEngines: CacheEngine[] = [];

  if (options?.createCacheEngine) {
    const createCacheEngine: () => Promise<CacheEngine | CacheEngine[]> =
      options.createCacheEngine;

    try {
      const cacheEngines: CacheEngine | CacheEngine[] =
        await createCacheEngine();

      totalCacheEngines.push(..._.concat(cacheEngines));
    } catch (error) {
      Logger.error({
        message: 'Create Cache Engine Error from `options.createCacheEngine`',
        createCacheEngine: options.createCacheEngine,
        error: {
          message: _.get(error, 'message'),
          stack: _.get(error, 'stack'),
        },
      });
    }
  }

  if (options?.cacheEngineCreationConfigs) {
    const promises: Promise<CacheEngine | undefined>[] =
      options.cacheEngineCreationConfigs.map(
        async (cacheEngineCreationConfig): Promise<CacheEngine | undefined> =>
          createCacheEngineFactory(cacheEngineCreationConfig),
      );

    const cacheEngines: (CacheEngine | undefined)[] = await Promise.all(
      promises,
    );
    const compactedCacheEngines: CacheEngine[] = _.compact(cacheEngines);

    totalCacheEngines.push(...compactedCacheEngines);
  }

  const shouldAlwaysSetupDefaultMemoryCacheEngine =
    options?.shouldAlwaysSetupDefaultMemoryCacheEngine ?? false;

  const shouldSetupDefaultMemoryCacheEngineAsFallback =
    options?.shouldSetupDefaultMemoryCacheEngineAsFallback ?? true;

  const hasNotSetupCacheEngines: boolean =
    _.isEmpty(totalCacheEngines) &&
    shouldSetupDefaultMemoryCacheEngineAsFallback;

  if (hasNotSetupCacheEngines || shouldAlwaysSetupDefaultMemoryCacheEngine) {
    const defaultMemoryCacheEngine: MemoryCache =
      await createDefaultMemoryCacheEngine(
        options?.defaultMemoryCacheEngineCreationConfig,
      );

    totalCacheEngines.push(defaultMemoryCacheEngine);
  }

  if (_.isEmpty(totalCacheEngines)) {
    throw new Error('Cache engines has not setup');
  }

  return totalCacheEngines;
};
