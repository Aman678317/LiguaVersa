import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MeetingGateway } from './meeting.gateway';

@Injectable()
export class MeetingService {
  constructor(
    private prisma: PrismaService,
    private meetingGateway: MeetingGateway
  ) {}

  private generateMeetingCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomStr = (len: number) => Array.from({length: len}).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    return `LVA-${randomStr(4)}-${randomStr(4)}`;
  }

  async createMeeting(data: any) {
    const meetingCode = this.generateMeetingCode();
    
    const meeting = await this.prisma.meeting.create({
      data: {
        hostId: data.hostId,
        title: data.title || 'New Meeting',
        description: data.description,
        meetingCode: meetingCode,
        password: data.password || null,
        waitingRoom: data.waitingRoom ?? false,
        type: data.meetingType || 'Video',
        timezone: data.timeZone || 'UTC',
        recurringType: data.recurring || 'None',
        scheduledFor: data.date && data.startTime ? new Date(`${data.date}T${data.startTime}:00Z`) : null,
        settings: {
          create: {
            liveTranslation: data.liveTranslation ?? true,
            liveCaptions: data.liveCaptions ?? true,
            aiSummary: data.aiSummary ?? true,
            recording: data.recording ?? false,
          }
        },
        translationSettings: {
          create: {
            meetingLanguage: data.meetingLanguage || 'English',
            translationLanguage: data.translationLanguage || 'Hindi',
          }
        }
      },
      include: {
        settings: true,
        translationSettings: true
      }
    });

    if (data.reminder && data.reminder !== 'None') {
      await this.prisma.meetingReminder.create({
        data: { meetingId: meeting.id, timeStr: data.reminder }
      });
    }

    if (data.participants) {
      const emails = data.participants.split(',').map(e => e.trim()).filter(e => e);
      for (const email of emails) {
        await this.prisma.meetingParticipant.create({
          data: { meetingId: meeting.id, email }
        });
      }
    }

    return { success: true, meeting };
  }

  async getMeetings(userId: string) {
    return this.prisma.meeting.findMany({
      where: { hostId: userId },
      include: {
        participants: true,
        settings: true,
        translationSettings: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getMeetingById(id: string, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: { settings: true, translationSettings: true, participants: true }
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    return meeting;
  }

  async updateMeeting(id: string, data: any, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id } });
    if (!meeting || meeting.hostId !== userId) throw new BadRequestException('Unauthorized');

    return this.prisma.meeting.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        password: data.password,
        scheduledFor: data.date && data.startTime ? new Date(`${data.date}T${data.startTime}:00Z`) : undefined,
      }
    });
  }

  async deleteMeeting(id: string, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id } });
    if (!meeting || meeting.hostId !== userId) throw new BadRequestException('Unauthorized');
    
    await this.prisma.meeting.delete({ where: { id } });
    return { success: true };
  }

  async joinMeeting(id: string, password?: string, userId?: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    
    if (meeting.password && meeting.password !== password) {
      throw new BadRequestException('Invalid password');
    }

    if (meeting.waitingRoom && meeting.hostId !== userId) {
      return { success: true, waiting: true, message: 'Joined waiting room' };
    }

    return { success: true, meetingId: meeting.id, meetingCode: meeting.meetingCode };
  }

  async validateMeetingCode(code: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { meetingCode: code } });
    if (!meeting) throw new NotFoundException('Meeting not found.');
    return { valid: true, meetingId: meeting.id, title: meeting.title };
  }

  async inviteUsers(id: string, data: { receiverId?: string; emails?: string[] }) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id } });
    if (!meeting) throw new NotFoundException('Meeting not found.');

    if (data.emails) {
      // Mock sending email invites
      console.log(`Sending email invitations for meeting ${meeting.id} to: ${data.emails.join(', ')}`);
    }

    return { success: true, message: 'Invitations sent.' };
  }

  async getMeetingSummary(code: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { meetingCode: code },
      include: {
        host: { select: { email: true, profile: true } },
        participants: { include: { user: { select: { email: true, profile: true } } } },
        recordings: true,
        speechHistories: {
          include: {
            participant: {
              include: { user: { select: { email: true, profile: true } } }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!meeting) throw new NotFoundException('Meeting not found.');

    return { success: true, meeting };
  }
}
