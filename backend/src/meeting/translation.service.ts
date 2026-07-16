import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TranslationService {
  private openai: OpenAI | null = null;
  private readonly defaultModel = 'openai/gpt-4o-mini';

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.OPENROUTER_API_KEY || '';
    if (apiKey) {
      this.openai = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: apiKey,
      });
    } else {
      console.warn("OPENROUTER_API_KEY is missing. Using fallback mock translation.");
    }
  }

  async translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
    if (!this.openai) {
      return `[${targetLang.toUpperCase()}] ${text}`;
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [
          { role: 'system', content: `You are a real-time voice translator. Translate the following spoken text from ${sourceLang} to ${targetLang}. Preserve the original meaning, tone, emotion, and context perfectly. Respond ONLY with the translated text, no quotes or explanations.` },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
      });
      return response.choices[0]?.message?.content?.trim() || text;
    } catch (error) {
      console.error("OpenRouter Translation Error:", error);
      return `[Error] ${text}`;
    }
  }

  async generateMeetingSummary(meetingId: string): Promise<any> {
    if (!this.openai) {
      return {
        summary: "Mock summary since OpenRouter is not configured.",
        keyPoints: ["Discussed project updates"],
        actionItems: ["Deploy to production"],
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
      
      const prompt = `Analyze the following meeting transcript and provide a JSON response with exactly these keys: "summary" (a short paragraph), "keyPoints" (array of strings), "actionItems" (array of strings), and "sentiment" (a string).\n\nTranscript:\n${transcript || 'No messages were sent in this meeting.'}`;
      
      const response = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });

      const text = response.choices[0]?.message?.content || '{}';
      return JSON.parse(text);
    } catch (error) {
      console.error("OpenRouter Summary Error:", error);
      return { error: "Failed to generate summary" };
    }
  }
}

