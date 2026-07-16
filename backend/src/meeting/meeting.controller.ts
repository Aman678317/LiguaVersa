import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { MeetingService } from './meeting.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('meetings')
@UseGuards(JwtAuthGuard)
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @Post('create')
  async createMeeting(@Request() req, @Body() data: { title: string; description?: string }) {
    return this.meetingService.createMeeting({ ...data, hostId: req.user.id });
  }

  @Get('validate/:code')
  async validateCode(@Param('code') code: string) {
    return this.meetingService.validateMeetingCode(code);
  }

  @Post('invite')
  async inviteUser(@Body() data: { meetingCode: string; receiverId: string }) {
    return this.meetingService.inviteUser(data.meetingCode, data.receiverId);
  }

  @Get('summary/:code')
  async getSummary(@Param('code') code: string) {
    return this.meetingService.getMeetingSummary(code);
  }
}
