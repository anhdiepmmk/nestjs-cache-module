import { Inject, Logger } from '@nestjs/common';
import { CacheService } from '../cache.service';
import {
  CACHE_MODULE_OPTIONS,
  DEFAULT_CACHE_SEPARATOR,
  DEFAULT_CLASS_NAME,
} from '../constants';
import { CacheModuleOptions } from '../cache-module-options';
import _ from 'lodash';
import { translateKeyOrGeneratorToString } from './cache.utils';
import { CacheDelOptions } from './types';

export function CacheDel({
  keyOrGenerator,
  debug,
  functionArgsSerializer,
}: CacheDelOptions) {
  const logger: Logger = new Logger('Cache Del Decorator');

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

      const className: string = _.get(
        target,
        'constructor.name',
        DEFAULT_CLASS_NAME,
      );

      const keyOrPatternToDelete: string = translateKeyOrGeneratorToString({
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
          keyOrPatternToDelete,
          allKeys,
          functionArgs,
        });
      }

      let result: unknown;
      let error: unknown;

      try {
        result = await originalMethod.apply(this, functionArgs);
      } catch (err) {
        error = err;
        throw err;
      } finally {
        await injectedCacheService.del(keyOrPatternToDelete);

        if (debug) {
          const allKeys: string[] = await injectedCacheService.keys('*');

          logger.debug({
            message: `After called ${className}:${functionName}`,
            keyOrPatternToDelete,
            allKeys,
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
