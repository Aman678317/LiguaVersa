import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class TtsService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || '';
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      console.warn("OPENAI_API_KEY is missing. TTS will return empty buffers.");
    }
  }

  async generateSpeech(text: string, voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy'): Promise<Buffer> {
    if (!this.openai) {
      // Return a 0-byte buffer for testing without API keys
      return Buffer.from([]);
    }

    try {
      const response = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: voice,
        input: text,
        response_format: 'mp3',
      });

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('TtsService Speech Generation Error:', error);
      throw new Error('Failed to generate speech audio');
    }
  }
}
