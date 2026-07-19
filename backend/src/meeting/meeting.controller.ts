import { Controller, Post, Get, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { MeetingService } from './meeting.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('meetings')
@UseGuards(JwtAuthGuard)
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @Post()
  async createMeeting(@Request() req, @Body() data: any) {
    return this.meetingService.createMeeting({ ...data, hostId: req.user.id });
  }

  @Get()
  async getMeetings(@Request() req) {
    return this.meetingService.getMeetings(req.user.id);
  }

  @Get(':id')
  async getMeeting(@Param('id') id: string, @Request() req) {
    if (id === 'validate' || id === 'invite' || id === 'summary') return; // Skip routes that match
    return this.meetingService.getMeetingById(id, req.user.id);
  }

  @Put(':id')
  async updateMeeting(@Param('id') id: string, @Request() req, @Body() data: any) {
    return this.meetingService.updateMeeting(id, data, req.user.id);
  }

  @Delete(':id')
  async deleteMeeting(@Param('id') id: string, @Request() req) {
    return this.meetingService.deleteMeeting(id, req.user.id);
  }

  @Post(':id/join')
  async joinMeeting(@Param('id') id: string, @Request() req, @Body() data: any) {
    return this.meetingService.joinMeeting(id, data.password, req.user.id);
  }

  @Get('validate/:code')
  async validateCode(@Param('code') code: string) {
    return this.meetingService.validateMeetingCode(code);
  }

  @Post(':id/invite')
  async inviteUser(@Param('id') id: string, @Body() data: { receiverId?: string; emails?: string[] }) {
    return this.meetingService.inviteUsers(id, data);
  }

  @Get('summary/:code')
  async getSummary(@Param('code') code: string) {
    return this.meetingService.getMeetingSummary(code);
  }
}
