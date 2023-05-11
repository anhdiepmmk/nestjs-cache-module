import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '../cache.service';
import { Injectable, Logger } from '@nestjs/common';
import { CacheWrap } from './cache-wrap.decorator';
import { CacheModule } from '../cache.module';
import * as cacheUtils from './cache.utils';
import _ from 'lodash';
import jsonStableStringify from 'json-stable-stringify';
import { CacheDel } from './cache-del.decorator';

@Injectable()
class UserService {
  private mockUsers = [
    {
      id: 'a user id',
      name: 'bob',
    },
    {
      id: 'a1 user id',
      name: 'alice',
    },
    {
      id: 'a2 user id',
      name: 'son of the bob',
    },
  ];

  @CacheWrap({
    debug: true,
    keyOrGenerator: (functionArgs): string => {
      const formattedUserId: string = _.kebabCase(functionArgs[0] as string);
      return `users:${formattedUserId}`;
    },
  })
  async getUserById(userId: string) {
    const user = this.mockUsers.find((user) => user.id === userId);

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    return user;
  }

  @CacheDel({
    debug: true,
    keyOrGenerator: (functionArgs): string => {
      const formattedUserId: string = _.kebabCase(functionArgs[0] as string);
      return `users:${formattedUserId}`;
    },
  })
  async deleteUserById(userId: string) {
    const user = this.mockUsers.find((user) => user.id === userId);

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    this.mockUsers = this.mockUsers.filter((user) => user.id !== userId);
  }

  @CacheDel({
    keyOrGenerator: `users:*`,
  })
  async deleteAllUser() {
    this.mockUsers = [];
  }
}

@Injectable()
class PostService {
  @CacheWrap({
    debug: true,
    ttlInMilliseconds: 5 * 60 * 1000,
  })
  async getFeaturedPosts() {
    return [
      {
        id: 'a id',
        title: 'a title',
        desc: 'a desc',
        thumb: 'https://abc.def/a.jpg',
      },
      {
        id: 'b id',
        title: 'b title',
        desc: 'b desc',
        thumb: 'https://abc.def/b.jpg',
      },
    ];
  }
}

// a hack that make PostService constructor name undefined (the actual value is: 'PostService')
Object.defineProperty(PostService, 'name', { value: undefined });

describe('CacheDelDecorator', () => {
  let userService: UserService;
  let postService: PostService;
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
      providers: [UserService, PostService],
    }).compile();

    module.useLogger(new Logger());

    userService = module.get<UserService>(UserService);
    postService = module.get<PostService>(PostService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should delete cache properly', async () => {
    jest.spyOn(cacheService, 'wrap');
    jest.spyOn(cacheService, 'del');
    jest.spyOn(cacheService, 'get');

    jest.spyOn(userService, 'getUserById');
    jest.spyOn(userService, 'deleteUserById');

    const key: string = 'users:a-user-id';

    // 1. cache do not exist
    await expect(cacheService.get(key)).resolves.toBeUndefined();

    // 2. calling get user by id
    await expect(userService.getUserById('a user id')).resolves.toEqual({
      id: 'a user id',
      name: 'bob',
    });

    // 3. after called get user by id the cache have been initialled
    await expect(cacheService.get(key)).resolves.toEqual({
      id: 'a user id',
      name: 'bob',
    });

    // 4. delete user by id `a user id`
    await expect(
      userService.deleteUserById('a user id'),
    ).resolves.toBeUndefined();

    // 5. after deleted user `a user id` the cache have been gone
    await expect(cacheService.get(key)).resolves.toBeUndefined();

    // 6. verify function `deleteUserById' work properly
    await expect(userService.getUserById('a user id')).rejects.toThrowError(
      new Error('User a user id not found'),
    );

    // 7. ensure cache have been deleted after calling getUserById which is throw before
    await expect(cacheService.get(key)).resolves.toBeUndefined();

    expect(cacheService.del).toHaveBeenCalled();
    expect(cacheService.del).toHaveBeenCalledTimes(1);
    expect(cacheService.del).toHaveBeenNthCalledWith(1, 'users:a-user-id');

    expect(cacheService.wrap).toHaveBeenCalled();
    expect(cacheService.wrap).toHaveBeenCalledTimes(2);
    expect(cacheService.wrap).toHaveBeenNthCalledWith(
      1,
      'users:a-user-id',
      expect.any(Function),
      undefined,
    );
    expect(cacheService.wrap).toHaveBeenNthCalledWith(
      2,
      'users:a-user-id',
      expect.any(Function),
      undefined,
    );

    expect(cacheService.get).toHaveBeenCalled();
    expect(cacheService.get).toHaveBeenCalledTimes(4);
    expect(cacheService.get).toHaveBeenNthCalledWith(1, 'users:a-user-id');
    expect(cacheService.get).toHaveBeenNthCalledWith(2, 'users:a-user-id');
    expect(cacheService.get).toHaveBeenNthCalledWith(3, 'users:a-user-id');
    expect(cacheService.get).toHaveBeenNthCalledWith(4, 'users:a-user-id');

    expect(userService.getUserById).toHaveBeenCalled();
    expect(userService.getUserById).toHaveBeenCalledTimes(2);
    expect(userService.getUserById).toHaveBeenNthCalledWith(1, 'a user id');
    expect(userService.getUserById).toHaveBeenNthCalledWith(2, 'a user id');

    expect(userService.deleteUserById).toHaveBeenCalled();
    expect(userService.deleteUserById).toHaveBeenCalledTimes(1);
    expect(userService.deleteUserById).toHaveBeenNthCalledWith(1, 'a user id');
  });

  it('when cache do not exist should invoke delete cache and not throw anything', async () => {
    jest.spyOn(cacheService, 'del');
    jest.spyOn(cacheService, 'get');

    jest.spyOn(userService, 'getUserById');
    jest.spyOn(userService, 'deleteUserById');

    const key: string = 'users:a-user-id';

    // 1. cache do not exist
    await expect(cacheService.get(key)).resolves.toBeUndefined();

    // 2 delete user by id `a user id`
    await expect(
      userService.deleteUserById('a user id'),
    ).resolves.toBeUndefined();

    // 3. ensure cache still not exist
    await expect(cacheService.get(key)).resolves.toBeUndefined();

    expect(cacheService.del).toHaveBeenCalled();
    expect(cacheService.del).toHaveBeenCalledTimes(1);
    expect(cacheService.del).toHaveBeenNthCalledWith(1, 'users:a-user-id');

    expect(cacheService.get).toHaveBeenCalled();
    expect(cacheService.get).toHaveBeenCalledTimes(2);
    expect(cacheService.get).toHaveBeenNthCalledWith(1, 'users:a-user-id');
    expect(cacheService.get).toHaveBeenNthCalledWith(2, 'users:a-user-id');

    expect(userService.getUserById).not.toHaveBeenCalled();

    expect(userService.deleteUserById).toHaveBeenCalled();
    expect(userService.deleteUserById).toHaveBeenCalledTimes(1);
    expect(userService.deleteUserById).toHaveBeenNthCalledWith(1, 'a user id');
  });

  it('when decorated function throw an error should delete cache as usual', async () => {
    jest.spyOn(cacheService, 'del');
    jest.spyOn(cacheService, 'get');

    jest.spyOn(userService, 'getUserById');
    jest.spyOn(userService, 'deleteUserById');

    const key: string = 'users:b-user-id';

    // 1. cache do not exist
    await expect(cacheService.get(key)).resolves.toBeUndefined();

    // 2 delete non exist user `b user id`
    await expect(userService.deleteUserById('b user id')).rejects.toThrowError(
      new Error('User b user id not found'),
    );

    // 3. ensure cache still not exist
    await expect(cacheService.get(key)).resolves.toBeUndefined();

    expect(cacheService.del).toHaveBeenCalled();
    expect(cacheService.del).toHaveBeenCalledTimes(1);
    expect(cacheService.del).toHaveBeenNthCalledWith(1, 'users:b-user-id');

    expect(cacheService.get).toHaveBeenCalled();
    expect(cacheService.get).toHaveBeenCalledTimes(2);
    expect(cacheService.get).toHaveBeenNthCalledWith(1, 'users:b-user-id');
    expect(cacheService.get).toHaveBeenNthCalledWith(2, 'users:b-user-id');

    expect(userService.getUserById).not.toHaveBeenCalled();

    expect(userService.deleteUserById).toHaveBeenCalled();
    expect(userService.deleteUserById).toHaveBeenCalledTimes(1);
    expect(userService.deleteUserById).toHaveBeenNthCalledWith(1, 'b user id');
  });

  it('when cache key to delete is pattern should delete all related cache', async () => {
    jest.spyOn(cacheService, 'del');
    jest.spyOn(cacheService, 'keys');

    jest.spyOn(userService, 'getUserById');
    jest.spyOn(userService, 'deleteAllUser');

    // 1. init cache
    await expect(userService.getUserById('a user id')).resolves.toEqual({
      id: 'a user id',
      name: 'bob',
    });

    await expect(userService.getUserById('a1 user id')).resolves.toEqual({
      id: 'a1 user id',
      name: 'alice',
    });

    await expect(cacheService.keys()).resolves.toEqual([
      'users:a-1-user-id',
      'users:a-user-id',
    ]);

    // 2. delete all user
    await expect(userService.deleteAllUser()).resolves.toBeUndefined();

    expect(cacheService.keys).toHaveBeenCalled();

    expect(cacheService.keys).toHaveBeenCalled();

    expect(cacheService.del).toHaveBeenCalled();
    expect(cacheService.del).toHaveBeenCalledTimes(1);
    expect(cacheService.del).toHaveBeenNthCalledWith(1, 'users:*');

    expect(userService.deleteAllUser).toHaveBeenCalled();
    expect(userService.deleteAllUser).toHaveBeenCalledTimes(1);
  });
});
