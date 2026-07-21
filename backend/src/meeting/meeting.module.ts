import { Module } from '@nestjs/common';
import { MeetingGateway } from './meeting.gateway';
import { MeetingController } from './meeting.controller';
import { MeetingService } from './meeting.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CaptionService } from './caption.service';
import { RecordingController } from './recording.controller';
import { ChatModule } from '../chat/chat.module';
import { SpeechService } from './speech.service';
import { TranslationService } from './translation.service';
import { TtsService } from './tts.service';

@Module({
  imports: [PrismaModule, ChatModule],
  controllers: [MeetingController, RecordingController],
  providers: [
    MeetingGateway,
    MeetingService,
    CaptionService,
    SpeechService,
    TranslationService,
    TtsService,
  ],
})
export class MeetingModule {}
