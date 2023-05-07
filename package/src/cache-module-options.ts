import { MemoryConfig } from 'cache-manager';

export type CacheModuleOptions = {
  memoryConfig?: MemoryConfig;
  cacheModulePrefix?: string;
  cacheSeparator?: string;
  //   type: 'memory' | 'redis'
};
