import { Injectable, Logger, LoggerService } from '@nestjs/common';
import { CacheWrap } from '@anhdiepmmk/nestjs-cache-module';

@Injectable()
export class AppService {
  private readonly logger: Logger = new Logger(AppService.name);
  @CacheWrap({
    debug: true,
  })
  getHello(message: string): string {
    return message;
  }

  @CacheWrap({
    debug: true,
    functionArgsSerializer: (functionArgs) => {
      const message: string = functionArgs[0] as string;
      return message;
    },
  })
  getHo(message: string): string {
    return message;
  }

  @CacheWrap({
    keyOrGenerator: 'hi',
    ttlInMilliseconds: 1 * 60 * 1000, // 1m
    debug: true,
  })
  getHi(): string {
    this.logger.log('get hi');
    return 'Hi there';
  }

  @CacheWrap({
    keyOrGenerator: (functionArgs) => {
      const message: string = functionArgs[0] as string;
      return `hello-world:${message}`;
    },
    ttlInMilliseconds: 1 * 60 * 1000, // 1m
    debug: true,
  })
  getHe(message?: string): string {
    this.logger.log('get he');
    return message ?? 'He he';
  }
}
