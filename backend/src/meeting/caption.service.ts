import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CaptionService {
  constructor(private prisma: PrismaService) {}

  async saveCaptionHistory(participantId: string, meetingId: string, originalText: string, translatedText: string, targetLanguage: string, confidence: number, durationMs: number) {
    if (!participantId) return null;
    try {
      return await this.prisma.speechHistory.create({
        data: {
          participantId,
          meetingId,
          transcription: originalText,
          translatedText,
          targetLanguage,
          confidence,
          durationMs
        }
      });
    } catch (error) {
      console.warn("Could not save caption history, participant might not be linked yet.", error);
      return null;
    }
  }
}
