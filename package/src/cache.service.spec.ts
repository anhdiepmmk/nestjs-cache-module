import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { CacheModule } from './cache.module';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register({
          cacheModulePrefix: 'a-service',
          cacheSeparator: '_',
        }),
      ],
    }).compile();

    cacheService = app.get<CacheService>(CacheService);
  });

  describe('reset', () => {
    it('should clear all', async () => {
      // establish
      await cacheService.set('a-key', 'a value');
      await cacheService.set('b-key', 'b value');
      await cacheService.set('c-key', 'c value');

      // verify
      await expect(cacheService.keys()).resolves.toEqual(
        expect.arrayContaining(['a-key', 'b-key', 'c-key']),
      );

      // reset
      await expect(cacheService.reset()).resolves.toBeUndefined();

      // verify
      await expect(cacheService.keys()).resolves.toEqual([]);
    });
  });
});
