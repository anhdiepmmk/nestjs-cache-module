import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '../cache.service';
import { Injectable } from '@nestjs/common';
import { CacheWrap } from './cache-wrap.decorator';
import { CacheModule } from '../cache.module';
import _ from 'lodash';

@Injectable()
class UserService {
  @CacheWrap({
    debug: true,
    keyOrGenerator: (functionArgs): string => {
      const formattedKey: string = _.kebabCase(functionArgs[0] as string);
      return `users:${formattedKey}`;
    },
  })
  async getUserById(userId: string) {
    if (userId === 'b user id') {
      throw new Error('simulate error');
    }
    return {
      name: 'bob',
    };
  }
}

describe('CacheWrapDecorator', () => {
  let userService: UserService;
  let cacheService: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register({
          cacheModulePrefix: 'test-module',
          memoryConfig: {
            ttl: 15 * 60 * 1000,
            max: 100,
          },
        }),
      ],
      providers: [UserService],
    }).compile();

    userService = module.get<UserService>(UserService);
    cacheService = module.get<CacheService>(CacheService);
  });

  it('when cache key is not exist should not hit cache', async () => {
    jest.spyOn(cacheService, 'wrap');
    jest.spyOn(userService, 'getUserById');

    await expect(cacheService.get('users:a-user-id')).resolves.toBeUndefined();

    // not hit cache
    await expect(userService.getUserById('a user id')).resolves.toEqual({
      name: 'bob',
    });

    expect(userService.getUserById).toHaveBeenCalledTimes(1);

    expect(cacheService.wrap).toHaveBeenCalled();
    expect(cacheService.wrap).toHaveBeenCalledWith(
      'users:a-user-id',
      expect.any(Function),
      undefined,
    );
  });

  it('when cache key is exist should hit cache', async () => {
    jest.spyOn(cacheService, 'wrap');
    jest.spyOn(userService, 'getUserById');

    // prove cache do not exist
    await expect(cacheService.get('users:a-user-id')).resolves.toBeUndefined();

    // not hit cache
    await expect(userService.getUserById('a user id')).resolves.toEqual({
      name: 'bob',
    });

    // prove cache exist after ran function
    await expect(cacheService.get('users:a-user-id')).resolves.toEqual({
      name: 'bob',
    });

    // hit cache
    await expect(userService.getUserById('a user id')).resolves.toEqual({
      name: 'bob',
    });

    expect(userService.getUserById).toHaveBeenCalledTimes(2);

    expect(cacheService.wrap).toHaveBeenCalled();
    expect(cacheService.wrap).toHaveBeenCalledWith(
      'users:a-user-id',
      expect.any(Function),
      undefined,
    );
  });

  it('when wrapped function throw an error should throw throw as usual', async () => {
    jest.spyOn(cacheService, 'wrap');
    jest.spyOn(userService, 'getUserById');

    await expect(cacheService.get('users:b-user-id')).resolves.toBeUndefined();

    await expect(userService.getUserById('b user id')).rejects.toThrowError(
      new Error('simulate error'),
    );

    await expect(cacheService.get('users:b-user-id')).resolves.toBeUndefined();

    expect(userService.getUserById).toHaveBeenCalledTimes(1);

    expect(cacheService.wrap).toHaveBeenCalled();
    expect(cacheService.wrap).toHaveBeenCalledWith(
      'users:b-user-id',
      expect.any(Function),
      undefined,
    );
  });
});
