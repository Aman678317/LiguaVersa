import { Controller, Post, Get, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { MeetingService } from './meeting.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('meetings')
export class MeetingController {
  constructor(
    private readonly meetingService: MeetingService
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createMeeting(@Request() req, @Body() data: any) {
    return this.meetingService.createMeeting({ ...data, hostId: req.user.id });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMeetings(@Request() req) {
    return this.meetingService.getMeetings(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getMeeting(@Param('id') id: string, @Request() req) {
    if (id === 'validate' || id === 'invite' || id === 'summary') return; // Skip routes that match
    return this.meetingService.getMeetingById(id, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateMeeting(@Param('id') id: string, @Request() req, @Body() data: any) {
    return this.meetingService.updateMeeting(id, data, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteMeeting(@Param('id') id: string, @Request() req) {
    return this.meetingService.deleteMeeting(id, req.user.id);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
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
    let contextStr = 'Live video conferencing meeting in progress on LinguaVerse.';
    try {
      const summaryData = await this.meetingService.getMeetingSummary(code);
      if (summaryData && summaryData.meeting) {
        const latestRecording = summaryData.meeting.recordings?.[summaryData.meeting.recordings.length - 1];
        const summaryJson = latestRecording?.summaryJson || {};
        const str = typeof summaryJson === 'string' ? summaryJson : JSON.stringify(summaryJson);
        if (str && str !== '{}') {
          contextStr = str;
        }
      }
    } catch (e) {
      console.warn('Could not fetch meeting summary context:', e.message);
    }
    
    try {
      const axios = require('axios');
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const response = await axios.post(`${aiServiceUrl}/chat`, {
        question,
        language: language || 'English',
        context: contextStr
      }, { timeout: 45000 });
      if (response.data?.answer) {
        return { answer: response.data.answer };
      }
    } catch (e) {
      console.warn('AI Service /chat primary call failed, attempting fallback:', e.message);
    }

    // Fallback: Direct Gemini API Call if AI_SERVICE is sleeping or unavailable
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey) {
      try {
        const axios = require('axios');
        const prompt = `You are LinguaVerse AI, a helpful, intelligent AI Assistant inside a video meeting. Answer the user's question clearly, thoroughly, and helpfully in ${language || 'English'}. If the user asks about the meeting, use this context: ${contextStr}. User question: ${question}`;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const resp = await axios.post(url, {
          contents: [{ parts: [{ text: prompt }] }]
        }, { timeout: 15000 });
        const text = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return { answer: text.trim() };
        }
      } catch (fallbackErr) {
        console.error('Direct Gemini fallback failed:', fallbackErr.message);
      }
    }

    return { answer: "Hello! I am your AI Meeting Assistant. I'm connected and ready to help you with meeting summaries, translation, and any questions!" };
  }


}
