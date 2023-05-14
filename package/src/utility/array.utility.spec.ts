import * as arrayUtility from './array.utility';

describe('array.utility', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('filterArrayByPattern', () => {
    it('should return all elements', () => {
      expect(
        arrayUtility.filterArrayByPattern('*', [
          'users:1',
          'users:2',
          'posts:1',
        ]),
      ).toEqual(['users:1', 'users:2', 'posts:1']);
    });

    it('should return all related elements', () => {
      expect(
        arrayUtility.filterArrayByPattern('users:*', [
          'users:1',
          'users:2',
          'posts:1',
        ]),
      ).toEqual(['users:1', 'users:2']);

      expect(
        arrayUtility.filterArrayByPattern('posts:*', [
          'users:1',
          'users:2',
          'posts:1',
        ]),
      ).toEqual(['posts:1']);
    });

    it('should return element', () => {
      expect(
        arrayUtility.filterArrayByPattern('users:1', [
          'users:1',
          'users:2',
          'posts:1',
          'posts:2',
        ]),
      ).toEqual(['users:1']);

      expect(
        arrayUtility.filterArrayByPattern('posts:1', [
          'users:1',
          'users:2',
          'posts:1',
          'posts:2',
        ]),
      ).toEqual(['posts:1']);
    });

    it('when provided pattern is `*:1` should return all related elements', () => {
      expect(
        arrayUtility.filterArrayByPattern('*:1', [
          'users:1',
          'users:2',
          'posts:1',
          'posts:2',
        ]),
      ).toEqual(['users:1', 'posts:1']);
    });

    it('when provided pattern is `*1*` should return all related elements', () => {
      expect(
        arrayUtility.filterArrayByPattern('*1*', [
          'users:1',
          'users:2',
          'users:1:posts',
          'users:2:posts',
          'posts:1',
          'posts:2',
          'posts:1:author',
          'posts:2:author',
        ]),
      ).toEqual(['users:1', 'users:1:posts', 'posts:1', 'posts:1:author']);
    });

    it('when provided pattern is `users:*` should return all related elements', () => {
      expect(
        arrayUtility.filterArrayByPattern('users:*', [
          'users:1',
          'users:2',
          'users:1:posts',
          'users:2:posts',
          'posts:1',
          'posts:2',
          'posts:1:author',
          'posts:2:author',
        ]),
      ).toEqual(['users:1', 'users:2', 'users:1:posts', 'users:2:posts']);
    });

    it('when provided pattern is `posts:*` should return all related elements', () => {
      expect(
        arrayUtility.filterArrayByPattern('posts:*', [
          'users:1',
          'users:2',
          'users:1:posts',
          'users:2:posts',
          'posts:1',
          'posts:2',
          'posts:1:author',
          'posts:2:author',
        ]),
      ).toEqual(['posts:1', 'posts:2', 'posts:1:author', 'posts:2:author']);
    });

    it('when provided pattern is `users:*:posts` should return all related elements', () => {
      expect(
        arrayUtility.filterArrayByPattern('users:*:posts', [
          'users:1',
          'users:2',
          'users:1:posts',
          'users:2:posts',
          'posts:1',
          'posts:2',
          'posts:1:author',
          'posts:2:author',
        ]),
      ).toEqual(['users:1:posts', 'users:2:posts']);
    });

    it('when provided pattern is `users:*:*` should return all related elements', () => {
      expect(
        arrayUtility.filterArrayByPattern('users:*:*', [
          'users:1',
          'users:2',
          'users:1:posts',
          'users:2:posts',
          'users:1:photos',
          'users:2:photos',
          'posts:1',
          'posts:2',
          'posts:1:author',
          'posts:2:author',
        ]),
      ).toEqual([
        'users:1:posts',
        'users:2:posts',
        'users:1:photos',
        'users:2:photos',
      ]);
    });

    it('when provided pattern is `posts:*:*` should return all related elements', () => {
      expect(
        arrayUtility.filterArrayByPattern('posts:*:*', [
          'users:1',
          'users:2',
          'users:1:posts',
          'users:2:posts',
          'users:1:photos',
          'users:2:photos',
          'posts:1',
          'posts:2',
          'posts:1:author',
          'posts:2:author',
          'posts:1:photos',
          'posts:2:photos',
        ]),
      ).toEqual([
        'posts:1:author',
        'posts:2:author',
        'posts:1:photos',
        'posts:2:photos',
      ]);
    });
  });
});
