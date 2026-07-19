import { Controller, Post, Get, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { MeetingService } from './meeting.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccessToken } from 'livekit-server-sdk';

import { TranslationService } from './translation.service';

@Controller('meetings')
@UseGuards(JwtAuthGuard)
export class MeetingController {
  constructor(
    private readonly meetingService: MeetingService,
    private readonly translationService: TranslationService
  ) {}

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

  @Post('summary/:code/chat')
  async chatWithSummary(@Param('code') code: string, @Body('question') question: string, @Body('language') language?: string) {
    const summaryData = await this.meetingService.getMeetingSummary(code);
    if (!summaryData || !summaryData.meeting) {
      return { answer: 'Meeting not found.' };
    }
    const answer = await this.translationService.aiChatQuery(summaryData.meeting.id, question, language);
    return { answer };
  }

  @Get(':id/livekit/token')
  async getLiveKitToken(@Param('id') id: string, @Request() req) {
    const roomName = id;
    const participantName = req.user.email || `User ${req.user.id}`;
    
    // In production, these should come from environment variables.
    // Using hardcoded devkey/secret as per docker-compose for this exercise.
    const at = new AccessToken('devkey', 'secret', {
      identity: req.user.id,
      name: participantName,
    });
    at.addGrant({ roomJoin: true, room: roomName });
    
    const token = await at.toJwt();
    return { token };
  }
}
