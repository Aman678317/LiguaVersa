import { Controller, Post, Get, Body, Query, Request } from '@nestjs/common';
import { CallService } from './call.service';

@Controller('api/call')
export class CallController {
  constructor(private readonly callService: CallService) {}

  @Post('start')
  async startCall(@Body() body: { callerId: string; receiverId: string }, @Request() req) {
    const callerId = body.callerId || req?.user?.id || 'unknown_caller';
    return this.callService.startCall(callerId, body.receiverId);
  }

  @Post('accept')
  async acceptCall(@Body() body: { callId: string }) {
    return this.callService.acceptCall(body.callId);
  }

  @Post('reject')
  async rejectCall(@Body() body: { callId: string }) {
    return this.callService.rejectCall(body.callId);
  }

  @Post('end')
  async endCall(@Body() body: { callId: string; duration?: number }) {
    return this.callService.endCall(body.callId, body.duration);
  }

  @Get('history')
  async getCallHistory(@Query('userId') userId: string, @Request() req) {
    const targetUserId = userId || req?.user?.id || 'unknown';
    return this.callService.getCallHistory(targetUserId);
  }
}
