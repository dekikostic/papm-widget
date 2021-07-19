import { Controller, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import type { RunParam } from './types';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('RunAsync')
  async runAsync(@Query() query: RunParam) {
    const msg = await this.appService.RunAsync(query);

    return msg;
  }
}
