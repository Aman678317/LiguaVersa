import { Test, TestingModule } from '@nestjs/testing';
import { MeetingService } from './meeting.service';
import { PrismaService } from '../prisma/prisma.service';
import { MeetingGateway } from './meeting.gateway';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('MeetingService - Phase 1 Host Controls', () => {
  let service: MeetingService;
  let prisma: PrismaService;

  const mockPrismaService = {
    meeting: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    meetingReminder: { create: jest.fn() },
    meetingParticipant: { create: jest.fn() },
  };

  const mockMeetingGateway = {
    server: { emit: jest.fn(), in: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MeetingGateway, useValue: mockMeetingGateway },
      ],
    }).compile();

    service = module.get<MeetingService>(MeetingService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('isHost', () => {
    it('should return true if user is the meeting host', async () => {
      mockPrismaService.meeting.findUnique.mockResolvedValue({ id: 'm1', hostId: 'user1' });
      const result = await service.isHost('m1', 'user1');
      expect(result).toBe(true);
    });

    it('should return false if user is not the meeting host', async () => {
      mockPrismaService.meeting.findUnique.mockResolvedValue({ id: 'm1', hostId: 'user1' });
      const result = await service.isHost('m1', 'user2');
      expect(result).toBe(false);
    });
  });

  describe('toggleLock', () => {
    it('should allow host to toggle meeting lock state', async () => {
      mockPrismaService.meeting.findUnique.mockResolvedValue({ id: 'm1', hostId: 'user1', isLocked: false });
      mockPrismaService.meeting.update.mockResolvedValue({ id: 'm1', isLocked: true });

      const result = await service.toggleLock('m1', 'user1');
      expect(result).toEqual({ success: true, isLocked: true });
    });

    it('should throw BadRequestException if non-host attempts to toggle lock', async () => {
      mockPrismaService.meeting.findUnique.mockResolvedValue({ id: 'm1', hostId: 'user1', isLocked: false });

      await expect(service.toggleLock('m1', 'user2')).rejects.toThrow(BadRequestException);
    });
  });

  describe('toggleWaitingRoom', () => {
    it('should allow host to toggle waiting room', async () => {
      mockPrismaService.meeting.findUnique.mockResolvedValue({ id: 'm1', hostId: 'user1', waitingRoom: false });
      mockPrismaService.meeting.update.mockResolvedValue({ id: 'm1', waitingRoom: true });

      const result = await service.toggleWaitingRoom('m1', 'user1');
      expect(result).toEqual({ success: true, waitingRoom: true });
    });

    it('should throw BadRequestException if non-host attempts to toggle waiting room', async () => {
      mockPrismaService.meeting.findUnique.mockResolvedValue({ id: 'm1', hostId: 'user1', waitingRoom: false });

      await expect(service.toggleWaitingRoom('m1', 'user2')).rejects.toThrow(BadRequestException);
    });
  });
});
