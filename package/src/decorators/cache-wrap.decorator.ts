import { Inject, Logger } from '@nestjs/common';
import { CacheService } from '../cache.service';
import { CACHE_MODULE_OPTIONS, DEFAULT_CLASS_NAME } from '../constants';
import { CacheModuleOptions } from '../cache-module-options';
import { CacheWrapOptions } from './types';
import { translateKeyOrGeneratorToString } from './cache.utils';
import _ from 'lodash';

export function CacheWrap({
  keyOrGenerator,
  debug,
  ttlInMilliseconds,
  functionArgsSerializer,
}: CacheWrapOptions) {
  const logger: Logger = new Logger('Cache Wrap Decorator');

  const injectorCacheService = Inject(CacheService);
  const injectorModuleOptions = Inject(CACHE_MODULE_OPTIONS);

  return function (
    target: any,
    functionName: string,
    propertyDescriptor: PropertyDescriptor,
  ) {
    injectorCacheService(target, 'injectedCacheService');
    injectorModuleOptions(target, 'injectedModuleOptions');

    const originalMethod = propertyDescriptor.value;

    propertyDescriptor.value = async function (...functionArgs: any[]) {
      const injectedCacheService: CacheService = (this as any)
        .injectedCacheService;

      const injectedModuleOptions: CacheModuleOptions = (this as any)
        .injectedModuleOptions;

      const className = target.constructor.name || DEFAULT_CLASS_NAME;

      const keyToCache: string = translateKeyOrGeneratorToString({
        keyOrGenerator,
        className,
        functionName,
        functionArgs,
        functionArgsSerializer,
        cacheSeparator: injectedModuleOptions.cacheSeparator,
      });

      if (debug) {
        const allKeys: string[] = await injectedCacheService.keys('*');

        logger.debug({
          message: `Before called ${className}:${functionName}`,
          keyToCache,
          allKeys,
          ttlInMilliseconds,
          functionArgs,
        });
      }

      let result: unknown;
      let error: unknown;
      let didCacheHit: boolean = true;

      try {
        result = await injectedCacheService.wrap(
          keyToCache,
          () => {
            didCacheHit = false;
            return originalMethod.apply(this, functionArgs);
          },
          ttlInMilliseconds,
        );
      } catch (err) {
        error = err;
        throw err;
      } finally {
        if (debug) {
          const allKeys: string[] = await injectedCacheService.keys('*');

          logger.debug({
            message: `After called ${className}:${functionName}`,
            keyToCache,
            didCacheHit,
            allKeys,
            ttlInMilliseconds,
            functionArgs,
            result,
            error: error
              ? {
                  message: _.get(error, 'message'),
                  stack: _.get(error, 'stack'),
                }
              : undefined,
          });
        }
      }

      return result;
    };
  };
}
