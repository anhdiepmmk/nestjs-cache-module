export type GeneratorFunction = <T>(functionArgs: T) => string;

export type CacheWrapOptions = {
  keyOrGenerator?: string | GeneratorFunction;
  debug?: boolean;
  ttlInMilliseconds?: number;
  functionArgsSerializer?: GeneratorFunction;
};

export type CacheDelOptions = {
  keyOrGenerator?: string | GeneratorFunction;
  debug?: boolean;
  functionArgsSerializer?: GeneratorFunction;
};
