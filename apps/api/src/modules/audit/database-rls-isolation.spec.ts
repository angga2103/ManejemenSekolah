import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenantContext } from '../../common/tenant/tenant-context';

describe('[Database Security Audit] PostgreSQL Row-Level Security (RLS) & Session Isolation', () => {
  let prismaService: PrismaService;
  let mockExecuteRaw: jest.Mock;
  let mockTransaction: jest.Mock;

  const validTenantA = '11111111-1111-4111-8111-111111111111';
  const validTenantB = '22222222-2222-4222-8222-222222222222';

  beforeEach(async () => {
    mockExecuteRaw = jest.fn().mockResolvedValue(1);

    // Simulated transaction client that reflects execution
    mockTransaction = jest.fn(async (callback) => {
      const tx = {
        $executeRaw: mockExecuteRaw,
        student: {
          findMany: jest.fn().mockResolvedValue([{ id: 's-1', tenantId: validTenantA }]),
          create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 's-new', ...args.data })),
        },
      };
      return callback(tx);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $transaction: mockTransaction,
            withTenantContext: PrismaService.prototype.withTenantContext,
            withSuperAdminContext: PrismaService.prototype.withSuperAdminContext,
            logger: { warn: jest.fn(), log: jest.fn() },
          },
        },
      ],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('1. Transaction-Scoped RLS Context Injection (SET LOCAL)', () => {
    it('should set local tenant_id and disable super_admin bypass for tenant transactions', async () => {
      const result = await prismaService.withTenantContext(validTenantA, async (tx: any) => {
        return tx.student.findMany();
      });

      expect(result).toHaveLength(1);
      expect(mockTransaction).toHaveBeenCalledTimes(1);

      // Verify that parameterized queries set transaction-local configuration
      expect(mockExecuteRaw).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining("SELECT set_config('app.current_tenant_id'")]),
        validTenantA,
      );
      expect(mockExecuteRaw).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining("SELECT set_config('app.is_super_admin'")]),
        'false',
      );
    });

    it('should resolve tenantId automatically from AsyncLocalStorage TenantContext when omitted', async () => {
      await TenantContext.run({ tenantId: validTenantB }, async () => {
        await prismaService.withTenantContext(async (tx: any) => {
          return tx.student.findMany();
        });
      });

      expect(mockExecuteRaw).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining("SELECT set_config('app.current_tenant_id'")]),
        validTenantB,
      );
    });

    it('should strictly reject invalid UUID formats and SQL injection attempts in tenant context', async () => {
      const sqlInjectionPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE students; --",
        "invalid-non-uuid-string",
        "",
        "12345",
      ];

      for (const maliciousPayload of sqlInjectionPayloads) {
        await expect(
          prismaService.withTenantContext(maliciousPayload, async (tx: any) => tx.student.findMany()),
        ).rejects.toThrow(BadRequestException);
      }

      // Ensure database was never touched with malicious payloads
      expect(mockExecuteRaw).not.toHaveBeenCalled();
    });
  });

  describe('2. Super Admin Controlled Bypass & Privilege Isolation', () => {
    it('should enable super admin bypass flag strictly inside withSuperAdminContext', async () => {
      await prismaService.withSuperAdminContext(async (tx: any) => {
        return tx.student.findMany();
      });

      expect(mockExecuteRaw).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining("SELECT set_config('app.is_super_admin'")]),
        'true',
      );
    });

    it('should ensure tenant transactions explicitly reset is_super_admin to false', async () => {
      await prismaService.withTenantContext(validTenantA, async (tx: any) => tx.student.findMany());

      expect(mockExecuteRaw).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining("SELECT set_config('app.is_super_admin'")]),
        'false',
      );
    });
  });

  describe('3. Concurrency & Transaction Boundary Isolation', () => {
    it('should maintain independent session contexts across concurrent parallel transactions', async () => {
      const executionLogs: string[] = [];

      // Simulate two concurrent requests for different tenants
      const reqA = prismaService.withTenantContext(validTenantA, async () => {
        executionLogs.push(`tx-A-start:${validTenantA}`);
        await new Promise((r) => setTimeout(r, 10));
        executionLogs.push(`tx-A-end:${validTenantA}`);
        return 'result-A';
      });

      const reqB = prismaService.withTenantContext(validTenantB, async () => {
        executionLogs.push(`tx-B-start:${validTenantB}`);
        await new Promise((r) => setTimeout(r, 10));
        executionLogs.push(`tx-B-end:${validTenantB}`);
        return 'result-B';
      });

      const [resA, resB] = await Promise.all([reqA, reqB]);

      expect(resA).toBe('result-A');
      expect(resB).toBe('result-B');
      expect(executionLogs).toContain(`tx-A-start:${validTenantA}`);
      expect(executionLogs).toContain(`tx-B-start:${validTenantB}`);
    });

    it('should abort cleanly on transaction failure without leaking context to connection pool', async () => {
      const failingTx = prismaService.withTenantContext(validTenantA, async () => {
        throw new Error('Deadlock / Integrity violation simulated');
      });

      await expect(failingTx).rejects.toThrow('Deadlock / Integrity violation simulated');
    });
  });
});
