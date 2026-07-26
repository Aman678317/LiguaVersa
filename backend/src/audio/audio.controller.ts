import { Controller, Post, Get, Body, Query, Res } from '@nestjs/common';
import { AudioService } from './audio.service';
import { Response } from 'express';

@Controller('api/audio')
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Post('upload')
  async uploadAudio(@Body() body: { chunk_id: string; duration?: number; sample_rate?: number; codec?: string }) {
    return this.audioService.uploadAudio({
      chunkId: body.chunk_id,
      duration: body.duration,
      sampleRate: body.sample_rate,
      codec: body.codec,
    });
  }

  @Get('stream')
  async streamAudio(@Query('chunk_id') chunkId: string, @Res() res: Response) {
    res.setHeader('Content-Type', 'audio/wav');
    return res.send(Buffer.from([]));
  }

  @Post('process')
  async processAudio(@Body() body: { chunk_id: string; duration?: number }) {
    return this.audioService.processAudioChunk(body.chunk_id, body.duration);
  }
}
