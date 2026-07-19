import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService implements OnModuleInit, OnModuleDestroy {
  private translationMetricsBuffer: any[] = [];
  private errorLogsBuffer: any[] = [];
  private flushInterval: any;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    // Flush metrics to DB every 5 seconds
    this.flushInterval = setInterval(() => this.flushMetrics(), 5000);
  }

  onModuleDestroy() {
    clearInterval(this.flushInterval);
    this.flushMetrics(); // Final flush
  }

  logTranslation(metric: { userId?: string, sourceLang: string, targetLang: string, latencyMs: number, bytesProcessed: number, success: boolean, type: string }) {
    this.translationMetricsBuffer.push(metric);
  }

  logError(error: { service: string, message: string, code?: string, stackTrace?: string, userId?: string }) {
    this.errorLogsBuffer.push(error);
  }

  async logMeeting(metric: { meetingId: string, durationSeconds: number, participants: number, translationsMade: number, captionsMade: number }) {
    try {
      await this.prisma.meetingMetric.create({ data: metric });
    } catch (e) {
      console.error("Failed to log meeting metric", e);
    }
  }

  async logSystemHealth(metrics: { cpuUsage: number, memoryUsage: number, activeSockets: number, dbHealth: string, apiHealth: string }) {
    try {
      await this.prisma.systemMetric.create({ data: metrics });
    } catch (e) {
      console.error("Failed to log system health", e);
    }
  }

  private async flushMetrics() {
    if (this.translationMetricsBuffer.length > 0) {
      const batch = [...this.translationMetricsBuffer];
      this.translationMetricsBuffer = [];
      try {
        await this.prisma.translationMetric.createMany({ data: batch });
      } catch (e) {
        console.error("Failed to flush translation metrics", e);
      }
    }

    if (this.errorLogsBuffer.length > 0) {
      const batch = [...this.errorLogsBuffer];
      this.errorLogsBuffer = [];
      try {
        await this.prisma.errorLog.createMany({ data: batch });
      } catch (e) {
        console.error("Failed to flush error logs", e);
      }
    }
  }
}
