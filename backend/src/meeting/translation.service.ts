import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TranslationService {
  private ai: GoogleGenerativeAI;
  private model: any;

  constructor(private prisma: PrismaService) {
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

  async generateMeetingSummary(meetingId: string): Promise<any> {
    if (!this.model) {
      return {
        summary: "Mock summary since Gemini is not configured.",
        keyPoints: ["Discussed project updates", "Planned next steps"],
        actionItems: ["Deploy to production", "Fix UI bugs"],
        sentiment: "Neutral"
      };
    }

    try {
      const messages = await this.prisma.message.findMany({
        where: { meetingId },
        orderBy: { createdAt: 'asc' }
      });
      
      const userIds = [...new Set(messages.map(m => m.senderId))];
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true }
      });
      const userMap = new Map(users.map(u => [u.id, u.email]));
      
      const transcript = messages.map(m => `${userMap.get(m.senderId) || 'User'}: ${m.content}`).join('\n');
      
      const prompt = `Analyze the following meeting transcript and provide a JSON response with the following keys: "summary" (a short paragraph), "keyPoints" (array of strings), "actionItems" (array of strings), and "sentiment" (a string).\n\nTranscript:\n${transcript || 'No messages were sent in this meeting.'}`;
      
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      // Try to parse JSON from the text, handling possible markdown blocks
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { summary: "Could not parse JSON", raw: text };
    } catch (error) {
      console.error("Gemini Summary Error:", error);
      return { error: "Failed to generate summary" };
    }
  }
}
