import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello('hello world');
  }

  @Get('/ho')
  getHo(): string {
    return this.appService.getHo('HO HO');
  }

  @Get('/hi')
  getHi(): string {
    return this.appService.getHi();
  }

  @Get('/he')
  getHe(): string {
    return this.appService.getHe('HE HE');
  }
}
