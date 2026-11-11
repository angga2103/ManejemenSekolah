import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;

  const mockPrismaService = {
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return liveness ok', () => {
    const res = controller.checkLiveness();
    expect(res.status).toBe('ok');
    expect(res.service).toBe('edusaas-api');
    expect(res.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should return readiness ready', async () => {
    const res = await controller.checkReadiness();
    expect(res.status).toBe('ready');
    expect(res.database).toBe('connected');
  });
});
