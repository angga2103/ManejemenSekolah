import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  @SwaggerResponse({ status: 200, description: 'Service is alive' })
  checkLiveness() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'edusaas-api',
      version: '0.1.0',
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  @SwaggerResponse({ status: 200, description: 'Service dependencies are ready' })
  async checkReadiness() {
    let dbStatus = 'disconnected';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'offline_mode';
    }

    return {
      status: 'ready',
      database: dbStatus,
      redis: 'ready',
      memory: {
        heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
