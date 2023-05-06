import { Module } from '@nestjs/common';
import { CacheModule } from '@anhdiepmmk/nestjs-cache-module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [CacheModule.register({})],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
