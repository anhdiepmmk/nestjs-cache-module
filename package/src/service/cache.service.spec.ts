import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { CacheModule } from '../cache.module';
import { CACHE_ENGINES, CACHE_MANAGER_INSTANCE } from '../constants';
import { CacheEngine, CacheManager } from '../types';

describe('CacheService', () => {
  let cacheService: CacheService;
  let cacheManager: CacheManager;
  let cacheEngines: CacheEngine[];

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.registerAsync({
          cacheModulePrefix: 'a-service',
          cacheSeparator: '_',
        }),
      ],
    }).compile();

    cacheService = app.get<CacheService>(CacheService);
    cacheManager = app.get<CacheManager>(CACHE_MANAGER_INSTANCE);
    cacheEngines = app.get<CacheEngine[]>(CACHE_ENGINES);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('wrap', () => {
    it('should set cache by using returned value from wrapped function', async () => {
      jest.spyOn(cacheManager, 'wrap');
      const fn = jest.fn(async () => {
        return 'a value';
      });

      await expect(cacheService.wrap('a-key', fn)).resolves.toEqual('a value');

      await expect(cacheService.get('a-key')).resolves.toEqual('a value');

      await expect(cacheService.keys()).resolves.toEqual(['a-key']);

      expect(cacheManager.wrap).toHaveBeenCalled();
      expect(cacheManager.wrap).toHaveBeenCalledTimes(1);
      expect(cacheManager.wrap).toHaveBeenCalledWith(
        'a-service_a-key',
        fn,
        undefined,
      );

      expect(fn).toHaveBeenCalled();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('when wrapped function throw an error should not set cache', async () => {
      jest.spyOn(cacheManager, 'wrap');
      const fn = jest.fn(async () => {
        throw new Error('an error');
      });

      await expect(cacheService.wrap('a-key', fn)).rejects.toThrowError(
        new Error('an error'),
      );

      await expect(cacheService.get('a-key')).resolves.toBeUndefined();

      await expect(cacheService.keys()).resolves.toEqual([]);

      expect(cacheManager.wrap).toHaveBeenCalled();
      expect(cacheManager.wrap).toHaveBeenCalledTimes(1);
      expect(cacheManager.wrap).toHaveBeenCalledWith(
        'a-service_a-key',
        fn,
        undefined,
      );

      expect(fn).toHaveBeenCalled();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should set cache with ttl by using returned value from wrapped function', async () => {
      jest.spyOn(cacheManager, 'wrap');

      const fn = jest.fn(async () => {
        return 'a value';
      });

      await expect(cacheService.wrap('a-key', fn, 10 * 1000)).resolves.toEqual(
        'a value',
      );

      await expect(cacheService.get('a-key')).resolves.toEqual('a value');

      await expect(cacheService.keys()).resolves.toEqual(['a-key']);

      expect(cacheManager.wrap).toHaveBeenCalled();
      expect(cacheManager.wrap).toHaveBeenCalledTimes(1);
      expect(cacheManager.wrap).toHaveBeenCalledWith(
        'a-service_a-key',
        fn,
        10 * 1000,
      );

      expect(fn).toHaveBeenCalled();
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('set', () => {
    it('should set', async () => {
      jest.spyOn(cacheManager, 'set');

      await expect(
        cacheService.set('a-key', 'a value'),
      ).resolves.toBeUndefined();

      await expect(cacheService.keys()).resolves.toEqual(['a-key']);

      expect(cacheManager.set).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledTimes(1);
      expect(cacheManager.set).toHaveBeenCalledWith(
        'a-service_a-key',
        'a value',
        undefined,
      );
    });

    it('should set with ttl', async () => {
      jest.spyOn(cacheManager, 'set');

      await expect(
        cacheService.set(
          'a-key',
          'a value',
          10 * 1000, // 10s
        ),
      ).resolves.toBeUndefined();

      await expect(cacheService.keys()).resolves.toEqual(['a-key']);

      expect(cacheManager.set).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledTimes(1);
      expect(cacheManager.set).toHaveBeenCalledWith(
        'a-service_a-key',
        'a value',
        10 * 1000,
      );
    });
  });

  describe('get', () => {
    it('should return cached value', async () => {
      jest.spyOn(cacheManager, 'get');

      cacheService.set('b-key', 'b cache value');

      await expect(cacheService.get('b-key')).resolves.toEqual('b cache value');

      expect(cacheManager.get).toHaveBeenCalled();
      expect(cacheManager.get).toHaveBeenCalledTimes(1);
      expect(cacheManager.get).toHaveBeenCalledWith('a-service_b-key');
    });

    it('should return undefined when cache key do not exist', async () => {
      jest.spyOn(cacheManager, 'get');

      await expect(cacheService.get('a-key')).resolves.toBeUndefined();

      expect(cacheManager.get).toHaveBeenCalled();
      expect(cacheManager.get).toHaveBeenCalledTimes(1);
      expect(cacheManager.get).toHaveBeenCalledWith('a-service_a-key');
    });

    it('should set with ttl', async () => {
      jest.spyOn(cacheManager, 'set');

      await expect(
        cacheService.set(
          'a-key',
          'a value',
          10 * 1000, // 10s
        ),
      ).resolves.toBeUndefined();

      await expect(cacheService.keys()).resolves.toEqual(['a-key']);

      expect(cacheManager.set).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledTimes(1);
      expect(cacheManager.set).toHaveBeenCalledWith(
        'a-service_a-key',
        'a value',
        10 * 1000,
      );
    });
  });

  describe('reset', () => {
    it('should clear all', async () => {
      jest.spyOn(cacheManager, 'reset');

      // establish
      await cacheService.set('a-key', 'a value');
      await cacheService.set('b-key', 'b value');
      await cacheService.set('c-key', 'c value');

      // verify
      await expect(cacheService.keys()).resolves.toEqual([
        'c-key',
        'b-key',
        'a-key',
      ]);

      // reset
      await expect(cacheService.reset()).resolves.toBeUndefined();

      // verify
      await expect(cacheService.keys()).resolves.toEqual([]);

      expect(cacheManager.reset).toHaveBeenCalled();
      expect(cacheManager.reset).toHaveBeenCalledTimes(1);
    });
  });

  describe('del', () => {
    beforeEach(() => {
      jest
        .spyOn(Promise, 'allSettled')
        .mockImplementation(async (promises: Iterable<unknown>) => {
          const results: PromiseSettledResult<unknown>[] = [];
          for (let promise of promises) {
            try {
              const result = await promise;
              results.push({
                status: 'fulfilled',
                value: result,
              });
            } catch (error) {
              results.push({
                status: 'rejected',
                reason: (error as Error)?.message ?? 'Unknown error',
              });
            }
          }
          return results;
        });
    });

    it('should del by key', async () => {
      jest.spyOn(cacheManager, 'del');

      // establish
      await cacheService.set('users-1', {
        id: 1,
        name: 'a user name',
      });

      await cacheService.set('users-2', {
        id: 2,
        name: 'b user name',
      });

      await cacheService.set('users-3', {
        id: 2,
        name: 'c user name',
      });

      // verify
      await expect(cacheService.keys()).resolves.toEqual(
        expect.arrayContaining(['users-1', 'users-2', 'users-3']),
      );

      // reset
      await expect(cacheService.del('users-1')).resolves.toBeUndefined();

      // verify
      await expect(cacheService.keys()).resolves.toEqual(
        expect.arrayContaining(['users-2', 'users-3']),
      );

      expect(cacheManager.del).toHaveBeenCalled();
      expect(cacheManager.del).toHaveBeenCalledTimes(1);
      expect(cacheManager.del).toHaveBeenCalledWith('a-service_users-1');
    });

    it('when provided a pattern should del all related key', async () => {
      jest.spyOn(cacheManager, 'del');

      // establish
      await cacheService.set('posts-1', {
        id: 1,
        title: 'a title',
      });

      await cacheService.set('users-1', {
        id: 1,
        name: 'a user name',
      });

      await cacheService.set('users-2', {
        id: 2,
        name: 'b user name',
      });

      await cacheService.set('users-3', {
        id: 3,
        name: 'c user name',
      });

      // verify
      await expect(cacheService.keys()).resolves.toEqual([
        'users-3',
        'users-2',
        'users-1',
        'posts-1',
      ]);

      // del by pattern
      await expect(cacheService.del('users-*')).resolves.toBeUndefined();

      // verify
      await expect(cacheService.keys()).resolves.toEqual(['posts-1']);

      expect(cacheManager.del).toHaveBeenCalled();
      expect(cacheManager.del).toHaveBeenCalledTimes(3);
      expect(cacheManager.del).toHaveBeenNthCalledWith(1, 'a-service_users-3');
      expect(cacheManager.del).toHaveBeenNthCalledWith(2, 'a-service_users-2');
      expect(cacheManager.del).toHaveBeenNthCalledWith(3, 'a-service_users-1');
    });

    it('when key or pattern is `*` should del all key', async () => {
      jest.spyOn(cacheManager, 'del');

      // establish
      await cacheService.set('posts-1', {
        id: 1,
        title: 'a title',
      });

      await cacheService.set('users-1', {
        id: 1,
        name: 'a user name',
      });

      await cacheService.set('users-2', {
        id: 2,
        name: 'b user name',
      });

      await cacheService.set('users-3', {
        id: 3,
        name: 'c user name',
      });

      // verify
      await expect(cacheService.keys()).resolves.toEqual([
        'users-3',
        'users-2',
        'users-1',
        'posts-1',
      ]);

      // del by pattern
      await expect(cacheService.del('*')).resolves.toBeUndefined();

      // verify
      await expect(cacheService.keys()).resolves.toEqual([]);

      expect(cacheManager.del).toHaveBeenCalled();
      expect(cacheManager.del).toHaveBeenCalledTimes(4);
      expect(cacheManager.del).toHaveBeenNthCalledWith(1, 'a-service_users-3');
      expect(cacheManager.del).toHaveBeenNthCalledWith(2, 'a-service_users-2');
      expect(cacheManager.del).toHaveBeenNthCalledWith(3, 'a-service_users-1');
      expect(cacheManager.del).toHaveBeenNthCalledWith(4, 'a-service_posts-1');
    });

    it('when key or pattern is `posts-*` should del all key', async () => {
      jest.spyOn(cacheManager, 'del');

      // establish
      await cacheService.set('posts-1', {
        id: 1,
        title: 'a title',
      });

      await cacheService.set('users-1', {
        id: 1,
        name: 'a user name',
      });

      await cacheService.set('users-2', {
        id: 2,
        name: 'b user name',
      });

      await cacheService.set('users-3', {
        id: 3,
        name: 'c user name',
      });

      // verify
      await expect(cacheService.keys()).resolves.toEqual([
        'users-3',
        'users-2',
        'users-1',
        'posts-1',
      ]);

      // del by pattern
      await expect(cacheService.del('posts-*')).resolves.toBeUndefined();

      // verify
      await expect(cacheService.keys()).resolves.toEqual([
        'users-3',
        'users-2',
        'users-1',
      ]);

      expect(cacheManager.del).toHaveBeenCalled();
      expect(cacheManager.del).toHaveBeenCalledTimes(1);
      expect(cacheManager.del).toHaveBeenCalledWith('a-service_posts-1');
    });
  });

  describe('keys', () => {
    it('when key or pattern is not provided should return all keys', async () => {
      jest.spyOn(cacheEngines[0].store, 'keys');

      // establish
      await cacheService.set('posts-1', {
        id: 1,
        title: 'a title',
      });

      await cacheService.set('users-1', {
        id: 1,
        name: 'a user name',
      });

      await cacheService.set('users-2', {
        id: 2,
        name: 'b user name',
      });

      await cacheService.set('users-3', {
        id: 3,
        name: 'c user name',
      });

      // verify
      await expect(cacheService.keys()).resolves.toEqual([
        'users-3',
        'users-2',
        'users-1',
        'posts-1',
      ]);

      expect(cacheEngines[0].store.keys).toHaveBeenCalled();
      expect(cacheEngines[0].store.keys).toHaveBeenCalledTimes(1);
      expect(cacheEngines[0].store.keys).toHaveBeenCalledWith('a-service_*');
    });

    it('when key or pattern is `*` should return all keys', async () => {
      jest.spyOn(cacheEngines[0].store, 'keys');

      // establish
      await cacheService.set('posts-1', {
        id: 1,
        title: 'a title',
      });

      await cacheService.set('users-1', {
        id: 1,
        name: 'a user name',
      });

      await cacheService.set('users-2', {
        id: 2,
        name: 'b user name',
      });

      await cacheService.set('users-3', {
        id: 3,
        name: 'c user name',
      });

      // verify
      await expect(cacheService.keys('*')).resolves.toEqual([
        'users-3',
        'users-2',
        'users-1',
        'posts-1',
      ]);

      expect(cacheEngines[0].store.keys).toHaveBeenCalled();
      expect(cacheEngines[0].store.keys).toHaveBeenCalledTimes(1);
      expect(cacheEngines[0].store.keys).toHaveBeenCalledWith('a-service_*');
    });

    it('when key or pattern is `users-*` should return all related keys', async () => {
      jest.spyOn(cacheEngines[0].store, 'keys');

      // establish
      await cacheService.set('posts-1', {
        id: 1,
        title: 'a title',
      });

      await cacheService.set('users-1', {
        id: 1,
        name: 'a user name',
      });

      await cacheService.set('users-2', {
        id: 2,
        name: 'b user name',
      });

      await cacheService.set('users-3', {
        id: 3,
        name: 'c user name',
      });

      // verify
      await expect(cacheService.keys('users-*')).resolves.toEqual([
        'users-3',
        'users-2',
        'users-1',
      ]);

      expect(cacheEngines[0].store.keys).toHaveBeenCalled();
      expect(cacheEngines[0].store.keys).toHaveBeenCalledTimes(1);
      expect(cacheEngines[0].store.keys).toHaveBeenCalledWith(
        'a-service_users-*',
      );
    });

    it('when key or pattern is `posts-*` should return all related keys', async () => {
      jest.spyOn(cacheEngines[0].store, 'keys');

      // establish
      await cacheService.set('posts-1', {
        id: 1,
        title: 'a title',
      });

      await cacheService.set('posts-1-author', {
        id: 2,
        title: 'b user name',
      });

      await cacheService.set('users-1', {
        id: 1,
        name: 'a user name',
      });

      await cacheService.set('users-2', {
        id: 2,
        name: 'b user name',
      });

      await cacheService.set('users-3', {
        id: 3,
        name: 'c user name',
      });

      // verify
      await expect(cacheService.keys('posts-*')).resolves.toEqual([
        'posts-1-author',
        'posts-1',
      ]);

      expect(cacheEngines[0].store.keys).toHaveBeenCalled();
      expect(cacheEngines[0].store.keys).toHaveBeenCalledTimes(1);
      expect(cacheEngines[0].store.keys).toHaveBeenCalledWith(
        'a-service_posts-*',
      );
    });

    it('when key or pattern is `posts-*-author` should return all related keys', async () => {
      jest.spyOn(cacheEngines[0].store, 'keys');

      // establish
      await cacheService.set('posts-1', {
        id: 1,
        title: 'a title',
      });

      await cacheService.set('posts-1-author', {
        id: 2,
        title: 'b user name',
      });

      await cacheService.set('posts-2', {
        id: 2,
        title: 'b title',
      });

      await cacheService.set('posts-2-author', {
        id: 3,
        title: 'c user name',
      });

      await cacheService.set('users-1', {
        id: 1,
        name: 'a user name',
      });

      await cacheService.set('users-2', {
        id: 2,
        name: 'b user name',
      });

      await cacheService.set('users-3', {
        id: 3,
        name: 'c user name',
      });

      // verify
      await expect(cacheService.keys('posts-*-author')).resolves.toEqual([
        'posts-2-author',
        'posts-1-author',
      ]);

      expect(cacheEngines[0].store.keys).toHaveBeenCalled();
      expect(cacheEngines[0].store.keys).toHaveBeenCalledTimes(1);
      expect(cacheEngines[0].store.keys).toHaveBeenCalledWith(
        'a-service_posts-*-author',
      );
    });

    it('when key or pattern is `*2` should return all related keys', async () => {
      jest.spyOn(cacheEngines[0].store, 'keys');

      // establish
      await cacheService.set('posts-1', {
        id: 1,
        title: 'a title',
      });

      await cacheService.set('posts-1-author', {
        id: 2,
        title: 'b user name',
      });

      await cacheService.set('posts-2', {
        id: 2,
        title: 'b title',
      });

      await cacheService.set('posts-2-author', {
        id: 3,
        title: 'c user name',
      });

      await cacheService.set('users-1', {
        id: 1,
        name: 'a user name',
      });

      await cacheService.set('users-2', {
        id: 2,
        name: 'b user name',
      });

      await cacheService.set('users-3', {
        id: 3,
        name: 'c user name',
      });

      // verify
      await expect(cacheService.keys('*2')).resolves.toEqual([
        'users-2',
        'posts-2',
      ]);

      expect(cacheEngines[0].store.keys).toHaveBeenCalled();
      expect(cacheEngines[0].store.keys).toHaveBeenCalledTimes(1);
      expect(cacheEngines[0].store.keys).toHaveBeenCalledWith('a-service_*2');
    });

    it('when key or pattern is `*2*` should return all related keys', async () => {
      jest.spyOn(cacheEngines[0].store, 'keys');

      // establish
      await cacheService.set('posts-1', {
        id: 1,
        title: 'a title',
      });

      await cacheService.set('posts-1-author', {
        id: 2,
        title: 'b user name',
      });

      await cacheService.set('posts-2', {
        id: 2,
        title: 'b title',
      });

      await cacheService.set('posts-2-author', {
        id: 3,
        title: 'c user name',
      });

      await cacheService.set('users-1', {
        id: 1,
        name: 'a user name',
      });

      await cacheService.set('users-2', {
        id: 2,
        name: 'b user name',
      });

      await cacheService.set('users-3', {
        id: 3,
        name: 'c user name',
      });

      // verify
      await expect(cacheService.keys('*2*')).resolves.toEqual([
        'users-2',
        'posts-2-author',
        'posts-2',
      ]);

      expect(cacheEngines[0].store.keys).toHaveBeenCalled();
      expect(cacheEngines[0].store.keys).toHaveBeenCalledTimes(1);
      expect(cacheEngines[0].store.keys).toHaveBeenCalledWith('a-service_*2*');
    });

    it('when key or pattern is `posts-2*` should return all related keys', async () => {
      jest.spyOn(cacheEngines[0].store, 'keys');

      // establish
      await cacheService.set('posts-1', {
        id: 1,
        title: 'a title',
      });

      await cacheService.set('posts-1-author', {
        id: 2,
        title: 'b user name',
      });

      await cacheService.set('posts-2', {
        id: 2,
        title: 'b title',
      });

      await cacheService.set('posts-2-author', {
        id: 3,
        title: 'c user name',
      });

      await cacheService.set('users-1', {
        id: 1,
        name: 'a user name',
      });

      await cacheService.set('users-2', {
        id: 2,
        name: 'b user name',
      });

      await cacheService.set('users-3', {
        id: 3,
        name: 'c user name',
      });

      // verify
      await expect(cacheService.keys('posts-2*')).resolves.toEqual([
        'posts-2-author',
        'posts-2',
      ]);

      expect(cacheEngines[0].store.keys).toHaveBeenCalled();
      expect(cacheEngines[0].store.keys).toHaveBeenCalledTimes(1);
      expect(cacheEngines[0].store.keys).toHaveBeenCalledWith(
        'a-service_posts-2*',
      );
    });
  });
});
