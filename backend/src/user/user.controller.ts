import { Controller, Get, Query, UseGuards, Request, Put, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req) {
    const user = await this.userService.getUserById(req.user.id);
    return { success: true, user };
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Request() req, @Body() body: { firstName: string, lastName: string, timezone: string }) {
    const profile = await this.userService.updateProfile(req.user.id, body);
    return { success: true, profile };
  }

  @Get('search')
  async searchUsers(@Query('q') query: string) {
    const results = await this.userService.searchUsers(query);
    return { success: true, results };
  }
}
