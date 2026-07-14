import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

@Injectable()
export class TTSService {
  generateSpeechStream(text: string, voiceId: string, targetLang: string, emitter: EventEmitter) {}
}
