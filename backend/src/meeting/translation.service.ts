import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class TranslationService {
  private openai: OpenAI | null = null;
  private readonly defaultModel = 'openai/gpt-4o-mini';

  constructor(private prisma: PrismaService, private analytics: AnalyticsService) {
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
    const startTime = Date.now();
    let success = true;
    let translated = text;

    if (!this.openai) {
      translated = `[${targetLang.toUpperCase()}] ${text}`;
    } else {
      try {
        const response = await this.openai.chat.completions.create({
          model: this.defaultModel,
          messages: [
            { role: 'system', content: `You are a real-time voice translator. Translate the following spoken text from ${sourceLang} to ${targetLang}. Preserve the original meaning, tone, emotion, and context perfectly. Respond ONLY with the translated text, no quotes or explanations.` },
            { role: 'user', content: text }
          ],
          temperature: 0.3,
        });
        translated = response.choices[0]?.message?.content?.trim() || text;
      } catch (error) {
        console.error("OpenRouter Translation Error:", error);
        success = false;
        translated = `[Error] ${text}`;
        this.analytics.logError({
          service: 'translation',
          message: error.message || 'Translation API failed',
          code: error.status ? String(error.status) : 'UNKNOWN'
        });
      }
    }

    const latencyMs = Date.now() - startTime;
    this.analytics.logTranslation({
      sourceLang,
      targetLang,
      latencyMs,
      bytesProcessed: Buffer.byteLength(text, 'utf8'),
      success,
      type: 'text' // default type, can be refined based on caller
    });

    return translated;
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

      const speechHistories = await this.prisma.speechHistory.findMany({
        where: { meetingId },
        include: { participant: { include: { user: true } } },
        orderBy: { createdAt: 'asc' }
      });
      
      const userIds = [...new Set(messages.map(m => m.senderId))];
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true }
      });
      const userMap = new Map(users.map(u => [u.id, u.email]));
      
      const chatTranscript = messages.map(m => `${userMap.get(m.senderId) || 'User'} (Chat): ${m.content}`).join('\n');
      const speechTranscript = speechHistories.map(s => {
        const userEmail = s.participant?.user?.email || 'Unknown User';
        return `${userEmail} (Voice): ${s.transcription}`;
      }).join('\n');

      const fullTranscript = `--- Chat Messages ---\n${chatTranscript}\n\n--- Spoken Audio ---\n${speechTranscript}`;
      
      const prompt = `Analyze the following meeting transcript and provide a JSON response with exactly these keys: "summary" (a short paragraph), "keyPoints" (array of strings), "actionItems" (array of strings), and "sentiment" (a string).\n\nTranscript:\n${fullTranscript || 'No messages or speech were recorded in this meeting.'}`;
      
      const response = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });

      const text = response.choices[0]?.message?.content || '{}';
      
      const parsedJson = JSON.parse(text);

      // Save summary to database
      await this.prisma.meetingSummary.create({
        data: {
          meetingId,
          summary: parsedJson.summary,
          keyPoints: parsedJson.keyPoints,
          actionItems: parsedJson.actionItems
        }
      });

      return parsedJson;
    } catch (error) {
      console.error("OpenRouter Summary Error:", error);
      return { error: "Failed to generate summary" };
    }
  }

  async aiChatQuery(meetingId: string, question: string, language?: string): Promise<string> {
    if (!this.openai) {
      return "Mock AI response. Please configure OpenRouter API Key.";
    }

    try {
      const messages = await this.prisma.message.findMany({
        where: { meetingId },
        orderBy: { createdAt: 'asc' }
      });

      const speechHistories = await this.prisma.speechHistory.findMany({
        where: { meetingId },
        include: { participant: { include: { user: true } } },
        orderBy: { createdAt: 'asc' }
      });

      const meetingSummary = await this.prisma.meetingSummary.findFirst({
        where: { meetingId },
        orderBy: { createdAt: 'desc' }
      });
      
      const userIds = [...new Set(messages.map(m => m.senderId))];
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true }
      });
      const userMap = new Map(users.map(u => [u.id, u.email]));
      
      const chatTranscript = messages.map(m => `${userMap.get(m.senderId) || 'User'} (Chat): ${m.content}`).join('\n');
      const speechTranscript = speechHistories.map(s => {
        const userEmail = s.participant?.user?.email || 'Unknown User';
        return `${userEmail} (Voice): ${s.transcription}`;
      }).join('\n');

      const fullTranscript = `--- Chat Messages ---\n${chatTranscript}\n\n--- Spoken Audio ---\n${speechTranscript}`;
      
      let contextStr = `Meeting Transcript:\n${fullTranscript}\n\n`;
      if (meetingSummary) {
        contextStr += `Meeting Summary:\n${meetingSummary.summary}\n\nKey Points:\n${JSON.stringify(meetingSummary.keyPoints)}\n\nAction Items:\n${JSON.stringify(meetingSummary.actionItems)}\n\n`;
      }

      let prompt = `You are a helpful AI assistant tasked with answering questions about a specific meeting. Use the provided meeting transcript and summary to answer the user's question accurately and concisely. If the answer cannot be found in the provided context, state that you don't know based on the meeting records.`;
      
      if (language && language !== 'English') {
        prompt += `\n\nCRITICAL INSTRUCTION: You MUST answer the user's question entirely in ${language}.`;
      }
      
      prompt += `\n\nContext:\n${contextStr}\n\nUser Question: ${question}\n\nAnswer:`;
      
      const response = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }]
      });

      return response.choices[0]?.message?.content || "I couldn't generate an answer.";
    } catch (error) {
      console.error("OpenRouter Chat Query Error:", error);
      return "An error occurred while answering your question.";
    }
  }
}

