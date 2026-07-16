import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email }, include: { profile: true } });
  }

  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { profile: true, settings: true }
    });
  }

  async updateProfile(userId: string, data: { firstName: string, lastName: string, timezone: string }) {
    // Check if profile exists, if not create it
    const existing = await this.prisma.profile.findUnique({ where: { userId } });
    
    if (existing) {
      return this.prisma.profile.update({
        where: { userId },
        data
      });
    } else {
      return this.prisma.profile.create({
        data: {
          userId,
          ...data
        }
      });
    }
  }

  async updateSettings(userId: string, data: any) {
    const existing = await this.prisma.setting.findUnique({ where: { userId } });
    if (existing) {
      return this.prisma.setting.update({ where: { userId }, data });
    } else {
      return this.prisma.setting.create({ data: { userId, ...data } });
    }
  }

  async searchUsers(query: string) {
    if (!query) return [];
    
    return this.prisma.user.findMany({
      where: {
        email: {
          contains: query,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        email: true,
      },
      take: 10
    });
  }
}
