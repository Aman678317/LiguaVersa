import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const activeUsers = await this.prisma.session.count({
      where: { expiresAt: { gt: new Date() } }
    });

    const activeMeetings = await this.prisma.meeting.count({
      where: { status: 'ONGOING' }
    });

    const translations = await this.prisma.translationMetric.count();

    const latestHealth = await this.prisma.systemMetric.findFirst({
      orderBy: { timestamp: 'desc' }
    });

    return {
      activeUsers,
      activeMeetings,
      totalTranslations: translations,
      systemHealth: latestHealth || { cpuUsage: 0, memoryUsage: 0, activeSockets: 0, dbHealth: 'ok', apiHealth: 'ok' }
    };
  }

  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profile: true
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });
  }

  async getMeetings() {
    return this.prisma.meetingMetric.findMany({
      take: 50,
      orderBy: { timestamp: 'desc' }
    });
  }

  async getSystemMetrics() {
    return this.prisma.systemMetric.findMany({
      take: 100,
      orderBy: { timestamp: 'desc' }
    });
  }

  async getErrorLogs() {
    return this.prisma.errorLog.findMany({
      take: 50,
      orderBy: { timestamp: 'desc' }
    });
  }
}
