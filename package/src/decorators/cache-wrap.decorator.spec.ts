import { Controller, Get } from '@nestjs/common';
import * as cacheWrapDecorator from './cache-wrap.decorator';
import { CacheWrap } from './cache-wrap.decorator';

describe('cache-wrap.decorator', () => {
  it('aaa', () => {
    cacheWrapDecorator.CacheWrap({
      debug: true,
    });
  });
});
