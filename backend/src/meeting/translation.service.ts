import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class TranslationService {
  private ai: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (apiKey) {
      this.ai = new GoogleGenerativeAI(apiKey);
      this.model = this.ai.getGenerativeModel({ model: 'gemini-3.5-flash' });
    }
  }

  async translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
    if (!this.model) {
      console.warn("GEMINI_API_KEY is missing. Using fallback mock translation.");
      return `[${targetLang.toUpperCase()}] ${text}`;
    }

    try {
      const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Only output the translated text and nothing else, without quotes.\n\nText: ${text}`;
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error("Gemini Translation Error:", error);
      return `[Error: Translation Failed] ${text}`;
    }
  }
}
