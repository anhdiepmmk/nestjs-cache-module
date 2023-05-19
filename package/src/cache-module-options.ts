import { Cache, Config, MemoryConfig } from 'cache-manager';
import { RedisClusterConfig } from 'cache-manager-ioredis-yet';
import Redis, { Cluster, RedisOptions } from 'ioredis';

export type RedisStoreConfig = (
  | RedisOptions
  | {
      clusterConfig: RedisClusterConfig;
    }
) &
  Config;

export type CacheEngineCreationConfig =
  | { name: string; type: 'ioredis'; config?: RedisStoreConfig }
  | {
      name: string;
      type: 'ioredis-instance';
      config: {
        ioredisInstance: Redis | Cluster;
        options?: Config;
      };
    }
  | { name: string; type: 'memory'; config?: MemoryConfig };

export type CacheModuleOptions = {
  cacheModulePrefix?: string;
  cacheSeparator?: string;
  createCacheEngine?: () => Promise<Cache | Cache[]>;
  cacheEngineCreationConfigs?: CacheEngineCreationConfig[];
  defaultMemoryCacheEngineCreationConfig?: MemoryConfig;
  // shouldThrowAnErrorIfCacheEngineSetupFails?: boolean;
  shouldAlwaysSetupDefaultMemoryCacheEngine?: boolean;
  shouldSetupDefaultMemoryCacheEngineAsFallback?: boolean;
};
