import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

@Injectable()
export class SpeechService implements OnModuleInit {
  private readonly logger = new Logger(SpeechService.name);

  onModuleInit() {
    if (!process.env.OPENAI_API_KEY) {
      this.logger.warn('\n' + '='.repeat(60) + '\nCRITICAL STARTUP WARNING:\nOPENAI_API_KEY is missing! Speech-to-Text (STT) operations will fail in production.\n' + '='.repeat(60));
    }
  }

  async transcribe(audioBuffer: Buffer, sourceLang: string): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is missing. Cannot transcribe.');
    }
    // STT logic here
    return '';
  }
}
