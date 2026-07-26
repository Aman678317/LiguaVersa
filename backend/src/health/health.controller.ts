import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { SystemHealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private prisma: PrismaHealthIndicator,
    private prismaService: PrismaService,
    private systemHealthService: SystemHealthService
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prisma.pingCheck('database', this.prismaService),
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),
    ]);
  }

  @Get(':component')
  async getComponentHealth(@Param('component') component: string) {
    if (['audio', 'video', 'network', 'translation'].includes(component)) {
      return this.systemHealthService.getHealthStatus(component);
    }
    return { error: 'Invalid component' };
  }

  @Post('recover')
  async triggerRecovery(@Body() body: { component: string, issue: string }) {
    return this.systemHealthService.recover(body.component, body.issue);
  }

  @Post('restart')
  async triggerRestart(@Body() body: { module: string }) {
    return this.systemHealthService.restart(body.module);
  }
}
