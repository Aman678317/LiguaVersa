import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

@Injectable()
export class STTService {
  createStream(sourceLang: string) {
    const emitter = new EventEmitter();
    return { emitter };
  }
  processAudio(emitter: EventEmitter, chunk: ArrayBuffer) {}
}
