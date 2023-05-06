import {
  DynamicModule,
} from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheModuleOptions } from './cache-module-options';

export class CacheModule {
  static register(options: CacheModuleOptions): DynamicModule {
    return {
      module: CacheModule,
      providers: [CacheService],
      exports: [CacheService],
      global: true,
    };
  }
}
