jest.mock('cache-manager');
jest.mock('cache-manager-ioredis-yet');

const IORedis = require('ioredis');

import * as cacheManager from 'cache-manager';
import * as cacheManagerIOredisYet from 'cache-manager-ioredis-yet';
import { createMock } from '@golevelup/ts-jest';
import { memoryStore, MemoryStore, MemoryCache } from 'cache-manager';

import * as cacheModuleProviderUtility from './cache-module-provider.utility';
import { RedisStore, RedisCache } from 'cache-manager-ioredis-yet';
import { CacheEngine } from '../types';

describe('cache-module-provider.utility', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createDefaultMemoryCacheEngine', () => {
    it('should create default memory cache engine with default options', async () => {
      jest
        .spyOn(cacheManager, 'memoryStore')
        .mockReturnValue(createMock<MemoryStore>());

      const mockMemoryCache = createMock<MemoryCache>();

      jest.spyOn(cacheManager, 'caching').mockResolvedValue(mockMemoryCache);

      jest
        .spyOn(cacheManager, 'memoryStore')
        .mockReturnValue(createMock<MemoryStore>());

      const memoryCache: MemoryCache =
        await cacheModuleProviderUtility.createDefaultMemoryCacheEngine();

      expect(memoryCache).toBe(mockMemoryCache);

      expect(memoryStore).toHaveBeenCalled();
      expect(memoryStore).toHaveBeenCalledWith({ max: 100, ttl: 900000 });
    });

    it('should create default memory cache engine override options', async () => {
      const mockMemoryStore = createMock<MemoryStore>();

      jest.spyOn(cacheManager, 'memoryStore').mockReturnValue(mockMemoryStore);

      const mockMemoryCache = createMock<MemoryCache>();

      jest.spyOn(cacheManager, 'caching').mockResolvedValue(mockMemoryCache);

      const memoryCache: MemoryCache =
        await cacheModuleProviderUtility.createDefaultMemoryCacheEngine({
          ttl: 10 * 60 * 1000,
          max: 1000,
          allowStale: true,
        });

      expect(memoryCache).toBe(mockMemoryCache);

      expect(cacheManager.memoryStore).toHaveBeenCalled();
      expect(cacheManager.memoryStore).toHaveBeenCalledWith({
        allowStale: true,
        max: 1000,
        ttl: 600000,
      });

      expect(cacheManager.caching).toHaveBeenCalled();
      expect(cacheManager.caching).toHaveBeenCalledWith(mockMemoryStore);
    });
  });

  describe('createCacheEngineFactory', () => {
    describe('memory', () => {
      it('should create memory cache engine', async () => {
        const mockMemoryStore = createMock<MemoryStore>();

        jest
          .spyOn(cacheManager, 'memoryStore')
          .mockReturnValue(mockMemoryStore);

        const mockMemoryCache = createMock<MemoryCache>();

        jest.spyOn(cacheManager, 'caching').mockResolvedValue(mockMemoryCache);

        await expect(
          cacheModuleProviderUtility.createCacheEngineFactory({
            name: 'a memory cache engine name',
            type: 'memory',
            config: {
              ttl: 5 * 60 * 1000,
              max: 1000,
            },
          }),
        ).resolves.toBe(mockMemoryCache);

        expect(cacheManager.memoryStore).toHaveBeenCalled();
        expect(cacheManager.memoryStore).toHaveBeenCalledWith({
          max: 1000,
          ttl: 300000,
        });

        expect(cacheManager.caching).toHaveBeenCalled();
        expect(cacheManager.caching).toHaveBeenCalledWith(mockMemoryStore);
      });

      it('should not throw if failed to create memory cache engine', async () => {
        const mockMemoryStore = createMock<MemoryStore>();

        jest
          .spyOn(cacheManager, 'memoryStore')
          .mockReturnValue(mockMemoryStore);

        jest
          .spyOn(cacheManager, 'caching')
          .mockRejectedValue(new Error('an caching error'));

        await expect(
          cacheModuleProviderUtility.createCacheEngineFactory({
            name: 'a memory cache engine name',
            type: 'memory',
            config: {
              ttl: 5 * 60 * 1000,
              max: 1000,
            },
          }),
        ).resolves.toBeUndefined();

        expect(cacheManager.memoryStore).toHaveBeenCalled();
        expect(cacheManager.memoryStore).toHaveBeenCalledWith({
          max: 1000,
          ttl: 300000,
        });

        expect(cacheManager.caching).toHaveBeenCalled();
        expect(cacheManager.caching).toHaveBeenCalledWith(mockMemoryStore);
      });
    });

    describe('ioredis', () => {
      it('should create ioredis cache engine', async () => {
        const mockRedisStore = createMock<RedisStore>();

        jest
          .spyOn(cacheManagerIOredisYet, 'redisStore')
          .mockResolvedValue(mockRedisStore);

        const mockRedisCache = createMock<RedisCache>();

        jest.spyOn(cacheManager, 'caching').mockResolvedValue(mockRedisCache);

        await expect(
          cacheModuleProviderUtility.createCacheEngineFactory({
            name: 'a ioredis cache engine name',
            type: 'ioredis',
            config: {
              db: 0,
              host: 'localhost',
              port: 6378,
            },
          }),
        ).resolves.toBe(mockRedisCache);

        expect(cacheManagerIOredisYet.redisStore).toHaveBeenCalled();
        expect(cacheManagerIOredisYet.redisStore).toHaveBeenCalledWith({
          db: 0,
          host: 'localhost',
          port: 6378,
        });

        expect(cacheManager.caching).toHaveBeenCalled();
        expect(cacheManager.caching).toHaveBeenCalledWith(mockRedisStore);
      });

      it('should not throw if failed to create ioredis cache engine', async () => {
        const mockRedisStore = createMock<RedisStore>();

        jest
          .spyOn(cacheManagerIOredisYet, 'redisStore')
          .mockResolvedValue(mockRedisStore);

        jest
          .spyOn(cacheManager, 'caching')
          .mockRejectedValue(new Error('an caching error'));

        await expect(
          cacheModuleProviderUtility.createCacheEngineFactory({
            name: 'a ioredis cache engine name',
            type: 'ioredis',
            config: {
              db: 0,
              host: 'localhost',
              port: 6378,
            },
          }),
        ).resolves.toBeUndefined();

        expect(cacheManagerIOredisYet.redisStore).toHaveBeenCalled();
        expect(cacheManagerIOredisYet.redisStore).toHaveBeenCalledWith({
          db: 0,
          host: 'localhost',
          port: 6378,
        });

        expect(cacheManager.caching).toHaveBeenCalled();
        expect(cacheManager.caching).toHaveBeenCalledWith(mockRedisStore);
      });
    });

    describe('ioredis-instance', () => {
      it('should create ioredis cache engine with an exist ioredis instance', async () => {
        const mockRedisStore = createMock<RedisStore>();

        jest
          .spyOn(cacheManagerIOredisYet, 'redisInsStore')
          .mockReturnValue(mockRedisStore);

        const mockRedisCache = createMock<RedisCache>();

        jest.spyOn(cacheManager, 'caching').mockResolvedValue(mockRedisCache);

        const mockIoRedisInstance = createMock<typeof IORedis>();

        await expect(
          cacheModuleProviderUtility.createCacheEngineFactory({
            name: 'a ioredis cache engine name',
            type: 'ioredis-instance',
            config: {
              ioredisInstance: mockIoRedisInstance,
              options: {
                ttl: 10 * 60 * 1000,
              },
            },
          }),
        ).resolves.toBe(mockRedisCache);

        expect(cacheManagerIOredisYet.redisInsStore).toHaveBeenCalled();
        expect(cacheManagerIOredisYet.redisInsStore).toHaveBeenCalledWith(
          mockIoRedisInstance,
          {
            ttl: 10 * 60 * 1000,
          },
        );

        expect(cacheManager.caching).toHaveBeenCalled();
        expect(cacheManager.caching).toHaveBeenCalledWith(mockRedisStore);
      });

      it('should not throw if failed to create cache engine', async () => {
        const mockRedisStore = createMock<RedisStore>();

        jest
          .spyOn(cacheManagerIOredisYet, 'redisInsStore')
          .mockReturnValue(mockRedisStore);

        jest
          .spyOn(cacheManager, 'caching')
          .mockRejectedValue(new Error('an caching error'));

        const mockIoRedisInstance = createMock<typeof IORedis>();

        await expect(
          cacheModuleProviderUtility.createCacheEngineFactory({
            name: 'a ioredis cache engine name',
            type: 'ioredis-instance',
            config: {
              ioredisInstance: mockIoRedisInstance,
              options: {
                ttl: 10 * 60 * 1000,
              },
            },
          }),
        ).resolves.toBeUndefined();

        expect(cacheManagerIOredisYet.redisInsStore).toHaveBeenCalled();
        expect(cacheManagerIOredisYet.redisInsStore).toHaveBeenCalledWith(
          mockIoRedisInstance,
          {
            ttl: 10 * 60 * 1000,
          },
        );

        expect(cacheManager.caching).toHaveBeenCalled();
        expect(cacheManager.caching).toHaveBeenCalledWith(mockRedisStore);
      });
    });
  });

  describe('createCacheEngines', () => {
    describe('when `options.cacheEngineCreationConfigs` is provided', () => {
      it('should return cache engines based on `cacheEngineCreationConfigs`', async () => {
        const mockMemoryCacheEngine = createMock<MemoryCache>();
        const mockRedisCacheEngine = createMock<RedisCache>();

        jest.spyOn(
          cacheModuleProviderUtility,
          'createDefaultMemoryCacheEngine',
        );

        jest
          .spyOn(cacheModuleProviderUtility, 'createCacheEngineFactory')
          .mockResolvedValueOnce(mockMemoryCacheEngine)
          .mockResolvedValueOnce(mockRedisCacheEngine);

        const cacheEngines: CacheEngine[] =
          await cacheModuleProviderUtility.createCacheEngines({
            cacheEngineCreationConfigs: [
              {
                name: 'a name',
                type: 'memory',
              },
              {
                name: 'b name',
                type: 'ioredis',
                config: {
                  db: 0,
                  host: 'localhost',
                  port: 6378,
                },
              },
            ],
          });

        expect(cacheEngines).toEqual(
          expect.arrayContaining([mockMemoryCacheEngine, mockRedisCacheEngine]),
        );

        expect(cacheEngines.length).toEqual(2);

        expect(
          cacheModuleProviderUtility.createDefaultMemoryCacheEngine,
        ).not.toHaveBeenCalled();

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenCalled();

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toBeCalledTimes(2);

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenNthCalledWith(1, { name: 'a name', type: 'memory' });

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenNthCalledWith(2, {
          config: { db: 0, host: 'localhost', port: 6378 },
          name: 'b name',
          type: 'ioredis',
        });
      });

      it('when one of cache engines failed to create should return the other cache engines based on `cacheEngineCreationConfigs`', async () => {
        const mockMemoryCacheEngine = createMock<MemoryCache>();

        jest.spyOn(
          cacheModuleProviderUtility,
          'createDefaultMemoryCacheEngine',
        );

        jest
          .spyOn(cacheModuleProviderUtility, 'createCacheEngineFactory')
          .mockResolvedValueOnce(mockMemoryCacheEngine)
          .mockResolvedValueOnce(undefined); // try catch inside `createCacheEngineFactory`

        const cacheEngines: CacheEngine[] =
          await cacheModuleProviderUtility.createCacheEngines({
            cacheEngineCreationConfigs: [
              {
                name: 'a name',
                type: 'memory',
              },
              {
                name: 'b name',
                type: 'ioredis',
                config: {
                  db: 0,
                  host: 'localhost',
                  port: 6378,
                },
              },
            ],
          });

        expect(cacheEngines).toEqual([mockMemoryCacheEngine]);

        expect(cacheEngines.length).toEqual(1);

        expect(
          cacheModuleProviderUtility.createDefaultMemoryCacheEngine,
        ).not.toHaveBeenCalled();

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenCalled();

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toBeCalledTimes(2);

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenNthCalledWith(1, { name: 'a name', type: 'memory' });

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenNthCalledWith(2, {
          config: { db: 0, host: 'localhost', port: 6378 },
          name: 'b name',
          type: 'ioredis',
        });
      });

      it('when all of cache engines failed to create should return default memory cache engine', async () => {
        const mockDefaultMemoryCacheEngine = createMock<MemoryCache>();

        jest
          .spyOn(cacheModuleProviderUtility, 'createDefaultMemoryCacheEngine')
          .mockResolvedValue(mockDefaultMemoryCacheEngine);

        jest
          .spyOn(cacheModuleProviderUtility, 'createCacheEngineFactory')
          .mockResolvedValueOnce(undefined) // try catch inside `createCacheEngineFactory`
          .mockResolvedValueOnce(undefined); // try catch inside `createCacheEngineFactory`

        const cacheEngines: CacheEngine[] =
          await cacheModuleProviderUtility.createCacheEngines({
            cacheEngineCreationConfigs: [
              {
                name: 'a name',
                type: 'memory',
              },
              {
                name: 'b name',
                type: 'ioredis',
                config: {
                  db: 0,
                  host: 'localhost',
                  port: 6378,
                },
              },
            ],
          });

        expect(cacheEngines).toEqual([mockDefaultMemoryCacheEngine]);

        expect(cacheEngines.length).toEqual(1);

        expect(
          cacheModuleProviderUtility.createDefaultMemoryCacheEngine,
        ).toHaveBeenCalled();

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenCalled();

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toBeCalledTimes(2);

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenNthCalledWith(1, { name: 'a name', type: 'memory' });

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenNthCalledWith(2, {
          config: { db: 0, host: 'localhost', port: 6378 },
          name: 'b name',
          type: 'ioredis',
        });
      });
    });

    describe('when `options.shouldSetupDefaultMemoryCacheEngineAsFallback` is provided', () => {
      it('when `shouldSetupDefaultMemoryCacheEngineAsFallback = true` should create default memory cache engine', async () => {
        const mockDefaultMemoryCacheEngine = createMock<MemoryCache>();

        jest
          .spyOn(cacheModuleProviderUtility, 'createDefaultMemoryCacheEngine')
          .mockResolvedValue(mockDefaultMemoryCacheEngine);

        jest
          .spyOn(cacheModuleProviderUtility, 'createCacheEngineFactory')
          .mockResolvedValueOnce(undefined); // due to try catch inside

        await expect(
          cacheModuleProviderUtility.createCacheEngines({
            shouldSetupDefaultMemoryCacheEngineAsFallback: true,
            createCacheEngine: async () => {
              throw new Error('an error');
            },
            cacheEngineCreationConfigs: [
              {
                name: 'a name',
                type: 'memory',
                config: {
                  ttl: 5 * 60 * 100,
                },
              },
            ],
          }),
        ).resolves.toEqual([mockDefaultMemoryCacheEngine]);

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenCalled();

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenCalledTimes(1);

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenNthCalledWith(1, {
          config: { ttl: 30000 },
          name: 'a name',
          type: 'memory',
        });

        expect(
          cacheModuleProviderUtility.createDefaultMemoryCacheEngine,
        ).toHaveBeenCalled();
      });

      it('when `shouldSetupDefaultMemoryCacheEngineAsFallback = false` should not create default memory cache engine', async () => {
        jest.spyOn(
          cacheModuleProviderUtility,
          'createDefaultMemoryCacheEngine',
        );

        jest
          .spyOn(cacheModuleProviderUtility, 'createCacheEngineFactory')
          .mockResolvedValueOnce(undefined); // due to try catch inside

        await expect(
          cacheModuleProviderUtility.createCacheEngines({
            shouldSetupDefaultMemoryCacheEngineAsFallback: false,
            createCacheEngine: async () => {
              throw new Error('an error');
            },
            cacheEngineCreationConfigs: [
              {
                name: 'a name',
                type: 'memory',
                config: {
                  ttl: 5 * 60 * 100,
                },
              },
            ],
          }),
        ).rejects.toThrowError(new Error('Cache engines has not setup'));

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenCalled();

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenCalledTimes(1);

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenNthCalledWith(1, {
          config: { ttl: 30000 },
          name: 'a name',
          type: 'memory',
        });

        expect(
          cacheModuleProviderUtility.createDefaultMemoryCacheEngine,
        ).not.toHaveBeenCalled();
      });
    });

    describe('when `options.shouldAlwaysSetupDefaultMemoryCacheEngine` is provided', () => {
      it('when `options.shouldAlwaysSetupDefaultMemoryCacheEngine` is true should return cache engines including default memory cache engines', async () => {
        const mockMemoryCacheEngine = createMock<MemoryCache>();
        const mockDefaultMemoryCacheEngine = createMock<MemoryCache>();
        const mocRedisCacheEngine = createMock<RedisCache>();

        jest
          .spyOn(cacheModuleProviderUtility, 'createDefaultMemoryCacheEngine')
          .mockResolvedValue(mockDefaultMemoryCacheEngine);

        jest
          .spyOn(cacheModuleProviderUtility, 'createCacheEngineFactory')
          .mockResolvedValueOnce(mockMemoryCacheEngine);

        const cacheEngines: CacheEngine[] =
          await cacheModuleProviderUtility.createCacheEngines({
            shouldAlwaysSetupDefaultMemoryCacheEngine: true,
            createCacheEngine: async () => {
              return [mocRedisCacheEngine];
            },
            cacheEngineCreationConfigs: [
              {
                name: 'a name',
                type: 'memory',
                config: {
                  ttl: 5 * 60 * 100,
                },
              },
            ],
          });

        expect(cacheEngines).toEqual(
          expect.arrayContaining([
            mockMemoryCacheEngine,
            mocRedisCacheEngine,
            mockDefaultMemoryCacheEngine,
          ]),
        );

        expect(cacheEngines.length).toEqual(3);

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenCalled();

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenCalledTimes(1);

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenNthCalledWith(1, {
          config: { ttl: 30000 },
          name: 'a name',
          type: 'memory',
        });

        expect(
          cacheModuleProviderUtility.createDefaultMemoryCacheEngine,
        ).toHaveBeenCalled();
      });
    });

    describe('when `options.createCacheEngines` and `options.cacheEngineCreationConfigs` creator function is provided', () => {
      it('when `createCacheEngines` creator function and one of cache engines create based on `cacheEngineCreationConfigs` throw an error should return cache engines created based on `cacheEngineCreationConfigs`', async () => {
        const mockMemoryCacheEngine = createMock<MemoryCache>();

        jest.spyOn(
          cacheModuleProviderUtility,
          'createDefaultMemoryCacheEngine',
        );

        jest
          .spyOn(cacheModuleProviderUtility, 'createCacheEngineFactory')
          .mockResolvedValueOnce(undefined) // this due to try catch inside
          .mockResolvedValueOnce(mockMemoryCacheEngine);

        const cacheEngines: CacheEngine[] =
          await cacheModuleProviderUtility.createCacheEngines({
            createCacheEngine: async () => {
              throw new Error('an error');
            },
            cacheEngineCreationConfigs: [
              {
                name: 'a name',
                type: 'memory',
                config: {
                  ttl: 5 * 60 * 100,
                },
              },
              {
                name: 'b name',
                type: 'memory',
                config: {
                  ttl: 10 * 60 * 100,
                },
              },
            ],
          });

        expect(cacheEngines).toEqual(
          expect.arrayContaining([mockMemoryCacheEngine]),
        );

        expect(cacheEngines.length).toEqual(1);

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenCalled();

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenCalledTimes(2);

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenNthCalledWith(1, {
          config: { ttl: 30000 },
          name: 'a name',
          type: 'memory',
        });

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenNthCalledWith(2, {
          config: { ttl: 60000 },
          name: 'b name',
          type: 'memory',
        });

        expect(
          cacheModuleProviderUtility.createDefaultMemoryCacheEngine,
        ).not.toHaveBeenCalled();
      });

      it('when `createCacheEngines` creator function and all of cache engines create based on `cacheEngineCreationConfigs` throw an error should return default memory cache engine', async () => {
        const mockMemoryCacheEngine = createMock<MemoryCache>();

        jest
          .spyOn(cacheModuleProviderUtility, 'createDefaultMemoryCacheEngine')
          .mockResolvedValue(mockMemoryCacheEngine);

        jest
          .spyOn(cacheModuleProviderUtility, 'createCacheEngineFactory')
          .mockResolvedValue(undefined); // this due to try catch inside

        const cacheEngines: CacheEngine[] =
          await cacheModuleProviderUtility.createCacheEngines({
            createCacheEngine: async () => {
              throw new Error('an error');
            },
            cacheEngineCreationConfigs: [
              {
                name: 'a name',
                type: 'memory',
                config: {
                  ttl: 10 * 60 * 100,
                },
              },
            ],
          });

        expect(cacheEngines).toEqual(
          expect.arrayContaining([mockMemoryCacheEngine]),
        );

        expect(cacheEngines.length).toEqual(1);

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenCalled();

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenCalledTimes(1);

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenNthCalledWith(1, {
          config: { ttl: 60000 },
          name: 'a name',
          type: 'memory',
        });

        expect(
          cacheModuleProviderUtility.createDefaultMemoryCacheEngine,
        ).toHaveBeenCalled();
      });

      it('when `createCacheEngines` throw an error should return cache engines create based on `cacheEngineCreationConfigs` as normal', async () => {
        const mockMemoryCacheEngine = createMock<MemoryCache>();

        jest.spyOn(
          cacheModuleProviderUtility,
          'createDefaultMemoryCacheEngine',
        );

        jest
          .spyOn(cacheModuleProviderUtility, 'createCacheEngineFactory')
          .mockResolvedValue(mockMemoryCacheEngine);

        const cacheEngines: CacheEngine[] =
          await cacheModuleProviderUtility.createCacheEngines({
            createCacheEngine: async () => {
              throw new Error('an error');
            },
            cacheEngineCreationConfigs: [
              {
                name: 'a name',
                type: 'memory',
                config: {
                  ttl: 10 * 60 * 100,
                },
              },
            ],
          });

        expect(cacheEngines).toEqual(
          expect.arrayContaining([mockMemoryCacheEngine]),
        );

        expect(cacheEngines.length).toEqual(1);

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenCalled();

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenCalledTimes(1);

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenNthCalledWith(1, {
          config: { ttl: 60000 },
          name: 'a name',
          type: 'memory',
        });

        expect(
          cacheModuleProviderUtility.createDefaultMemoryCacheEngine,
        ).not.toHaveBeenCalled();
      });

      it('should return cache engines returned from `createCacheEngines` creator function and create based on `cacheEngineCreationConfigs`', async () => {
        const mockMemoryCacheEngine = createMock<MemoryCache>();
        const mockRedisCacheEngine = createMock<RedisCache>();

        const mockMemoryCacheEngine2 = createMock<MemoryCache>();

        jest.spyOn(
          cacheModuleProviderUtility,
          'createDefaultMemoryCacheEngine',
        );

        jest
          .spyOn(cacheModuleProviderUtility, 'createCacheEngineFactory')
          .mockResolvedValue(mockMemoryCacheEngine2);

        const cacheEngines: CacheEngine[] =
          await cacheModuleProviderUtility.createCacheEngines({
            createCacheEngine: async () => {
              return [mockMemoryCacheEngine, mockRedisCacheEngine];
            },
            cacheEngineCreationConfigs: [
              {
                name: 'a name',
                type: 'memory',
                config: {
                  ttl: 10 * 60 * 100,
                },
              },
            ],
          });

        expect(cacheEngines).toEqual(
          expect.arrayContaining([
            mockMemoryCacheEngine,
            mockRedisCacheEngine,
            mockMemoryCacheEngine2,
          ]),
        );

        expect(cacheEngines.length).toEqual(3);

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenCalled();

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenCalledTimes(1);

        expect(
          cacheModuleProviderUtility.createCacheEngineFactory,
        ).toHaveBeenNthCalledWith(1, {
          config: { ttl: 60000 },
          name: 'a name',
          type: 'memory',
        });

        expect(
          cacheModuleProviderUtility.createDefaultMemoryCacheEngine,
        ).not.toHaveBeenCalled();
      });
    });

    describe('when `options.createCacheEngines` creator function is provided', () => {
      it('should return cache engines returned from `createCacheEngines` creator function', async () => {
        const mockMemoryCacheEngine = createMock<MemoryCache>();
        const mockRedisCacheEngine = createMock<RedisCache>();

        jest.spyOn(
          cacheModuleProviderUtility,
          'createDefaultMemoryCacheEngine',
        );

        const cacheEngines: CacheEngine[] =
          await cacheModuleProviderUtility.createCacheEngines({
            createCacheEngine: async () => {
              return [mockMemoryCacheEngine, mockRedisCacheEngine];
            },
          });

        expect(cacheEngines).toEqual(
          expect.arrayContaining([mockMemoryCacheEngine, mockRedisCacheEngine]),
        );

        expect(cacheEngines.length).toEqual(2);

        expect(
          cacheModuleProviderUtility.createDefaultMemoryCacheEngine,
        ).not.toHaveBeenCalled();
      });

      it('should return default memory cache engines if provided `createCacheEngines` creator function throw an error', async () => {
        const mockDefaultMemoryCacheEngine = createMock<MemoryCache>();

        jest
          .spyOn(cacheModuleProviderUtility, 'createDefaultMemoryCacheEngine')
          .mockResolvedValue(mockDefaultMemoryCacheEngine);

        const cacheEngines: CacheEngine[] =
          await cacheModuleProviderUtility.createCacheEngines({
            createCacheEngine: async () => {
              throw new Error('an error');
            },
          });

        expect(cacheEngines).toEqual([mockDefaultMemoryCacheEngine]);

        expect(cacheEngines.length).toEqual(1);

        expect(
          cacheModuleProviderUtility.createDefaultMemoryCacheEngine,
        ).toHaveBeenCalled();
      });
    });

    it('when `options` is not provided should return memory cache engine as default cache engine', async () => {
      const mockDefaultMemoryCacheEngine = createMock<MemoryCache>();

      jest
        .spyOn(cacheModuleProviderUtility, 'createDefaultMemoryCacheEngine')
        .mockResolvedValue(mockDefaultMemoryCacheEngine);

      const cacheEngines: CacheEngine[] =
        await cacheModuleProviderUtility.createCacheEngines();

      expect(cacheEngines).toEqual([mockDefaultMemoryCacheEngine]);
      expect(cacheEngines.length).toEqual(1);
    });
  });
});
