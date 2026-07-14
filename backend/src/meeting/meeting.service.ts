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

  async createMeeting(data: { title: string; description?: string; hostId: string }) {
    const meetingCode = this.generateMeetingCode();
    
    const meeting = await this.prisma.meeting.create({
      data: {
        hostId: data.hostId,
        title: data.title || 'New Meeting',
        description: data.description,
        meetingCode: meetingCode,
      }
    });

    return { meetingCode: meeting.meetingCode, meetingId: meeting.id };
  }

  async validateMeetingCode(code: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { meetingCode: code }
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found.');
    }

    return { valid: true, meetingId: meeting.id, title: meeting.title };
  }

  async inviteUser(meetingCode: string, receiverId: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { meetingCode } });
    if (!meeting) throw new NotFoundException('Meeting not found.');

    const receiver = await this.prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      throw new BadRequestException('User with this ID is not registered.');
    }

    const invitation = await this.prisma.meetingInvitation.create({
      data: {
        meetingId: meeting.id,
        senderId: meeting.hostId,
        receiverId: receiver.id,
      }
    });

    // Notify the receiver in real-time
    this.meetingGateway.server.emit(`invite-received-${receiver.id}`, {
      invitationId: invitation.id,
      meetingCode: meeting.meetingCode,
      title: meeting.title,
    });

    return { success: true, message: 'Invitation sent.' };
  }
}
