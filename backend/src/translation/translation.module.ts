import { Module } from '@nestjs/common';
import { AudioStreamGateway } from './audio-stream.gateway';
import { PipelineManager } from './pipeline.manager';
import { STTService } from './stt.service';
import { TranslationService } from './translation.service';
import { TTSService } from './tts.service';

@Module({
  providers: [AudioStreamGateway, PipelineManager, STTService, TranslationService, TTSService],
})
export class TranslationModule {}
