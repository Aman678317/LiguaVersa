import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): { message: string, status: string, version: string } {
    return {
      message: 'Welcome to the LinguaVerse API',
      status: 'operational',
      version: '1.0.0'
    };
  }
}
