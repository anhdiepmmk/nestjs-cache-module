declare module 'cache-manager-mongodb' {
  export type MongoClientOptions = {
    poolSize?: number;
    ssl?: boolean;
    sslValidate?: boolean;
    sslCA?: Buffer | string;
    sslCert?: Buffer | string;
    sslKey?: Buffer | string;
    sslPass?: Buffer | string;
    sslCRL?: Buffer | string;
    autoReconnect?: boolean;
    noDelay?: boolean;
    keepAlive?: boolean;
    connectTimeoutMS?: number;
    family?: number;
    socketTimeoutMS?: number;
    reconnectTries?: number;
    reconnectInterval?: number;
    ha?: boolean;
    haInterval?: number;
    replicaSet?: string;
    secondaryAcceptableLatencyMS?: number;
    acceptableLatencyMS?: number;
    connectWithNoPrimary?: boolean;
    authSource?: string;
    w?: number | string;
    wtimeout?: number;
    j?: boolean;
    forceServerObjectId?: boolean;
    serializeFunctions?: boolean;
    ignoreUndefined?: boolean;
    raw?: boolean;
    bufferMaxEntries?: number;
    readPreference?:
      | 'primary'
      | 'primaryPreferred'
      | 'secondary'
      | 'secondaryPreferred'
      | 'nearest';
    pkFactory?: any;
    promiseLibrary?: any;
    readConcern?: any;
    maxStalenessSeconds?: number;
    loggerLevel?: 'error' | 'warn' | 'info' | 'debug';
    logger?: any;
    promoteValues?: boolean;
    promoteBuffers?: boolean;
    promoteLongs?: boolean;
    domainsEnabled?: boolean;
    keepAliveInitialDelay?: number;
    checkServerIdentity?: boolean | ((hostname: string, cert: any) => boolean);
    validateOptions?: any;
    appname?: string;
    auth?: any;
    useNewUrlParser?: boolean;
    useUnifiedTopology?: boolean;
  };

  export type MongoConfigLegacy = {
    uri?: string;
    options?: MongoClientOptions;
    compression?: boolean;
    collection?: string;
    ttl?: number;
  };

  export type Callback<T = any> = (error: Error | null, result?: T) => void;

  export class MongoStoreLegacy {
    constructor(args: MongoConfigLegacy);

    get(key: string, options?: Callback, cb?: Callback): Promise<any>;

    set(
      key: string,
      val: any,
      options?: { ttl: number } | Callback,
      cb?: Callback,
    ): Promise<void>;

    del(key: string, options?: any, cb?: Callback<boolean>): Promise<boolean>;

    reset(
      key?: string | Callback<boolean>,
      cb?: Callback<boolean>,
    ): Promise<boolean>;
  }

  export function create(args: MongoConfigLegacy): MongoStoreLegacy;
}
