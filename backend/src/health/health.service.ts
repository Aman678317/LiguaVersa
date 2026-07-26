import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemHealthService {
  constructor(private prisma: PrismaService) {}

  async getHealthStatus(component: string) {
    let health = await this.prisma.systemHealth.findFirst({ where: { component } });
    if (!health) {
      health = await this.prisma.systemHealth.create({
        data: { component, status: 'healthy', latency: 0 }
      });
    }
    return health;
  }

  async recover(component: string, issue: string) {
    // Log the problem
    await this.prisma.monitoringEvent.create({
      data: {
        component,
        severity: 'error',
        description: `Recovery initiated for: ${issue}`
      }
    });

    // Update health status to recovering
    await this.prisma.systemHealth.upsert({
      where: { id: (await this.getHealthStatus(component)).id },
      create: { component, status: 'recovering', recoveryCount: 1 },
      update: { status: 'recovering', recoveryCount: { increment: 1 } }
    });

    // Simulate recovery actions
    const success = Math.random() > 0.1; // 90% success rate in simulation

    await this.prisma.recoveryLog.create({
      data: {
        component,
        problem: issue,
        solution: `Automated recovery protocol for ${component}`,
        success,
        duration: 500
      }
    });

    // Finalize status
    await this.prisma.systemHealth.updateMany({
      where: { component },
      data: { status: success ? 'healthy' : 'attention_required' }
    });

    return { component, success, message: success ? 'Recovered successfully' : 'Recovery failed. Attention required.' };
  }

  async restart(moduleName: string) {
    return this.recover(moduleName, 'Manual restart triggered via API');
  }
}
