import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '../cache.service';
import { Injectable, Logger } from '@nestjs/common';
import { CacheWrap } from './cache-wrap.decorator';
import { CacheModule } from '../cache.module';
import * as cacheUtils from './cache.utils';
import _ from 'lodash';
import jsonStableStringify from 'json-stable-stringify';

@Injectable()
class UserService {
  private readonly mockUsers = [
    {
      id: 'a user id',
      name: 'bob',
    },
  ];

  @CacheWrap({
    debug: true,
    keyOrGenerator: (functionArgs): string => {
      const formattedKey: string = _.kebabCase(functionArgs[0] as string);
      return `users:${formattedKey}`;
    },
  })
  async getUserById(userId: string) {
    const user = this.mockUsers.find((user) => user.id === userId);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  @CacheWrap()
  async getUserPhotosByUserId(userId: string) {
    return [
      'https://example.com/a.jpg',
      'https://example.com/b.jpg',
      'https://example.com/c.jpg',
    ];
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

describe('CacheWrapDecorator', () => {
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

  it('when cache options is not provided should using default options and working properly as usual', async () => {
    jest.spyOn(cacheService, 'wrap');
    jest.spyOn(userService, 'getUserPhotosByUserId');
    jest.spyOn(userService, 'getUserById');

    const postfix: string = Buffer.from(
      jsonStableStringify(['a user id']),
    ).toString('base64');

    const key: string = `UserService:getUserPhotosByUserId:${postfix}`;

    await expect(cacheService.get(key)).resolves.toBeUndefined();

    // not hit cache
    await expect(
      userService.getUserPhotosByUserId('a user id'),
    ).resolves.toEqual([
      'https://example.com/a.jpg',
      'https://example.com/b.jpg',
      'https://example.com/c.jpg',
    ]);

    expect(userService.getUserById).toHaveBeenCalledTimes(0);
    expect(userService.getUserPhotosByUserId).toHaveBeenCalledTimes(1);

    expect(cacheService.wrap).toHaveBeenCalled();
    expect(cacheService.wrap).toHaveBeenCalledWith(
      key,
      expect.any(Function),
      undefined,
    );
  });

  it('when cache key is not provided and cannot recognize class name should using `UnknownClassName` as default class name', async () => {
    jest.spyOn(cacheService, 'wrap');
    jest.spyOn(postService, 'getFeaturedPosts');

    const key: string = `UnknownClassName:getFeaturedPosts:EmptyArgs`;

    await expect(cacheService.get(key)).resolves.toBeUndefined();

    // not hit cache
    await expect(postService.getFeaturedPosts()).resolves.toEqual([
      {
        desc: 'a desc',
        id: 'a id',
        thumb: 'https://abc.def/a.jpg',
        title: 'a title',
      },
      {
        desc: 'b desc',
        id: 'b id',
        thumb: 'https://abc.def/b.jpg',
        title: 'b title',
      },
    ]);

    expect(postService.getFeaturedPosts).toHaveBeenCalled();
    expect(postService.getFeaturedPosts).toHaveBeenCalledTimes(1);

    expect(cacheService.wrap).toHaveBeenCalled();
    expect(cacheService.wrap).toHaveBeenCalledWith(
      key,
      expect.any(Function),
      5 * 60 * 1000,
    );
  });

  it('when cache key is not exist should not hit cache', async () => {
    jest.spyOn(cacheService, 'wrap');
    jest.spyOn(userService, 'getUserById');

    await expect(cacheService.get('users:a-user-id')).resolves.toBeUndefined();

    // not hit cache
    await expect(userService.getUserById('a user id')).resolves.toEqual({
      id: 'a user id',
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
      id: 'a user id',
      name: 'bob',
    });

    // prove cache exist after ran function
    await expect(cacheService.get('users:a-user-id')).resolves.toEqual({
      id: 'a user id',
      name: 'bob',
    });

    // hit cache
    await expect(userService.getUserById('a user id')).resolves.toEqual({
      id: 'a user id',
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

  it('when wrapped function throw an error should throw as usual', async () => {
    jest.spyOn(cacheService, 'wrap');
    jest.spyOn(userService, 'getUserById');
    jest.spyOn(cacheUtils, 'translateKeyOrGeneratorToString');

    // prove cache do not exist
    await expect(cacheService.get('users:b-user-id')).resolves.toBeUndefined();

    await expect(userService.getUserById('b user id')).rejects.toThrowError(
      new Error('User not found'),
    );

    // cache still not exist due to getUserById throw error
    await expect(cacheService.get('users:b-user-id')).resolves.toBeUndefined();

    expect(userService.getUserById).toHaveBeenCalledTimes(1);

    expect(cacheService.wrap).toHaveBeenCalled();
    expect(cacheService.wrap).toHaveBeenCalledWith(
      'users:b-user-id',
      expect.any(Function),
      undefined,
    );

    expect(cacheUtils.translateKeyOrGeneratorToString).toHaveBeenCalled();
    expect(cacheUtils.translateKeyOrGeneratorToString).toHaveBeenCalledTimes(1);
    expect(cacheUtils.translateKeyOrGeneratorToString).toHaveBeenCalledWith({
      cacheSeparator: undefined,
      className: 'UserService',
      functionArgs: ['b user id'],
      functionArgsSerializer: undefined,
      functionName: 'getUserById',
      keyOrGenerator: expect.any(Function),
    });
  });
});
