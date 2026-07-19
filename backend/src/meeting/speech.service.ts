import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class SpeechService {
  private genAI: GoogleGenerativeAI | null = null;
  private readonly defaultModel = 'gemini-1.5-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      console.warn("GEMINI_API_KEY is missing. STT will use fallback/mock.");
    }
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string = 'audio/webm'): Promise<string> {
    if (!this.genAI) {
      // Return a mock transcription for testing without API keys
      return "Mock transcription of audio chunk.";
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: this.defaultModel });
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: mimeType,
            data: audioBuffer.toString('base64'),
          }
        },
        { text: "Transcribe the speech in this audio perfectly. Do not include any explanations, formatting, or quotes. Reply with ONLY the transcription." }
      ]);
      
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('SpeechService STT Error (Gemini):', error);
      throw new Error('Failed to transcribe audio using Gemini');
    }
  }
}
