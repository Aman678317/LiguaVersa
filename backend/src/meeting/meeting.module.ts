import { Module } from '@nestjs/common';
import { MeetingGateway } from './meeting.gateway';
import { MeetingController } from './meeting.controller';
import { MeetingService } from './meeting.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TranslationService } from './translation.service';
import { SpeechService } from './speech.service';
import { TtsService } from './tts.service';
import { RecordingController } from './recording.controller';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [PrismaModule, ChatModule],
  controllers: [MeetingController, RecordingController],
  providers: [MeetingGateway, MeetingService, TranslationService, SpeechService, TtsService],
})
export class MeetingModule {}
