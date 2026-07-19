import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TranslationModule } from './translation/translation.module';
import { MeetingModule } from './meeting/meeting.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { ContactModule } from './contact/contact.module';
import { AuthModule } from './auth/auth.module';
import { HistoryModule } from './history/history.module';
import { ChatModule } from './chat/chat.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // 100 requests per minute
    }]),
    PrismaModule, 
    TranslationModule, 
    MeetingModule, 
    UserModule, 
    ContactModule, 
    AuthModule, 
    HistoryModule, 
    ChatModule, 
    AnalyticsModule, 
    AdminModule,
    HealthModule
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
