import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HistoryService {
  constructor(private prisma: PrismaService) {}

  async getHistory(userId: string) {
    return this.prisma.callHistory.findMany({
      where: { userId },
      include: {
        meeting: {
          include: {
            host: { select: { email: true, profile: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async endMeeting(userId: string, meetingCode: string, duration: number) {
    const meeting = await this.prisma.meeting.findUnique({ where: { meetingCode } });
    
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    // Don't duplicate history if they click leave twice
    const existing = await this.prisma.callHistory.findFirst({
      where: { userId, meetingId: meeting.id }
    });
    
    if (existing) return existing;

    return this.prisma.callHistory.create({
      data: {
        userId,
        meetingId: meeting.id,
        type: meeting.hostId === userId ? 'OUTGOING' : 'INCOMING',
        duration,
        qualityRating: 5
      }
    });
  }
}
