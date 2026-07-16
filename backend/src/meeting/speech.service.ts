import { Injectable } from '@nestjs/common';
import OpenAI, { toFile } from 'openai';

@Injectable()
export class SpeechService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || '';
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      console.warn("OPENAI_API_KEY is missing. STT will use fallback/mock.");
    }
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string = 'audio/webm'): Promise<string> {
    if (!this.openai) {
      // Return a mock transcription for testing without API keys
      return "Mock transcription of audio chunk.";
    }

    try {
      // OpenAI requires a file name with a known extension to determine the format
      let extension = 'webm';
      if (mimeType.includes('mp4')) extension = 'mp4';
      if (mimeType.includes('wav')) extension = 'wav';
      if (mimeType.includes('mpeg') || mimeType.includes('mp3')) extension = 'mp3';

      const file = await toFile(audioBuffer, `speech.${extension}`, { type: mimeType });

      const response = await this.openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        response_format: 'text',
      });

      return (response as any).trim();
    } catch (error) {
      console.error('SpeechService STT Error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }
}
