import { Module } from '@nestjs/common';
import { CacheModule } from '@anhdiepmmk/nestjs-cache-module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    CacheModule.register({
      memoryConfig: {
        ttl: 15 * 60 * 1000,
        max: 100,
      },
      cacheModulePrefix: 'test-service',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
