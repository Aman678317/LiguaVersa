import { Module } from '@nestjs/common';
import { MeetingGateway } from './meeting.gateway';
import { MeetingController } from './meeting.controller';
import { MeetingService } from './meeting.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TranslationService } from './translation.service';

@Module({
  imports: [PrismaModule],
  controllers: [MeetingController],
  providers: [MeetingGateway, MeetingService, TranslationService],
})
export class MeetingModule {}
