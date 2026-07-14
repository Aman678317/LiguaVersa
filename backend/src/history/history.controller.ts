import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private historyService: HistoryService) {}

  @Get()
  async getHistory(@Request() req) {
    const history = await this.historyService.getHistory(req.user.id);
    return { success: true, history };
  }

  @Post('end')
  async endMeeting(@Request() req, @Body() body: { meetingCode: string, duration: number }) {
    const result = await this.historyService.endMeeting(req.user.id, body.meetingCode, body.duration);
    return { success: true, history: result };
  }
}
