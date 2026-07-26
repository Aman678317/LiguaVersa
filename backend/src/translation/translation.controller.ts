import { Controller, Post, Get, Body, Query, UseGuards, Request } from '@nestjs/common';
import { TranslationService } from './translation.service';

@Controller('api')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Post('translation/start')
  async startTranslation(@Body() body: { call_id: string; user_id?: string; source_language?: string; target_language?: string }, @Request() req) {
    const userId = body.user_id || req?.user?.id || 'anonymous';
    return this.translationService.startSession(body.call_id, userId, body.source_language, body.target_language);
  }

  @Post('translation/stop')
  async stopTranslation(@Body() body: { session_id: string }) {
    return this.translationService.stopSession(body.session_id);
  }

  @Post('translation/chunk')
  async recordChunk(@Body() body: { session_id: string; speaker?: string; original_text: string; translated_text: string; latency?: number; call_id?: string }) {
    return this.translationService.recordChunk({
      sessionId: body.session_id,
      speaker: body.speaker,
      originalText: body.original_text,
      translatedText: body.translated_text,
      latency: body.latency,
      callId: body.call_id,
    });
  }

  @Get('translation/status')
  async getStatus(@Query('session_id') sessionId: string) {
    return this.translationService.getSessionStatus(sessionId);
  }

  @Get('languages')
  async getLanguages() {
    return this.translationService.getSupportedLanguages();
  }

  @Post('caption')
  async saveCaption(@Body() body: { call_id: string; speaker: string; original_text: string; translated_text: string; source_lang: string; target_lang: string }) {
    return this.translationService.saveCaption({
      callId: body.call_id,
      speaker: body.speaker,
      originalText: body.original_text,
      translatedText: body.translated_text,
      sourceLang: body.source_lang,
      targetLang: body.target_lang,
    });
  }
}
