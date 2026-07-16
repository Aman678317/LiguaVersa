import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  public client: PrismaClient;

  constructor() {
    this.client = new PrismaClient({
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }

  // Expose Prisma models as getters for compatibility with existing code
  get user() { return this.client.user; }
  get meeting() { return this.client.meeting; }
  get meetingParticipant() { return this.client.meetingParticipant; }
  get message() { return this.client.message; }
  get contact() { return this.client.contact; }
  get meetingInvitation() { return this.client.meetingInvitation; }
  get callHistory() { return this.client.callHistory; }
  get profile() { return this.client.profile; }
  get recording() { return this.client.recording; }
  get setting() { return this.client.setting; }
}
