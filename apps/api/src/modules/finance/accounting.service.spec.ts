import { Test, TestingModule } from '@nestjs/testing';
import { AccountingService } from './accounting.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException } from '@nestjs/common';
import { JournalLineType } from '@edusaas/shared-types';

describe('AccountingService', () => {
  let service: AccountingService;
  let prisma: any;
  let auditService: any;

  const mockTenantId = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    prisma = {
      cashAccount: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      journalEntry: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      invoice: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    auditService = {
      record: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountingService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<AccountingService>(AccountingService);
  });

  describe('createJournalEntry', () => {
    it('should reject unbalanced journal entry when Debit != Credit', async () => {
      await expect(
        service.createJournalEntry(mockTenantId, 'user-treasurer', {
          entryDate: '2026-11-12',
          description: 'Penerimaan infak',
          lines: [
            { cashAccountId: 'acc-1', lineType: JournalLineType.DEBIT, amount: 500000 },
            { cashAccountId: 'acc-2', lineType: JournalLineType.CREDIT, amount: 400000 }, // unbalanced
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully post balanced journal entry and update account balances', async () => {
      prisma.journalEntry.create.mockResolvedValue({
        id: 'jrn-1',
        tenantId: mockTenantId,
        entryDate: new Date('2026-11-12'),
        referenceNo: 'JRN/001',
        description: 'Penerimaan SPP Kas',
        lines: [
          { id: 'l1', cashAccountId: 'acc-1', lineType: JournalLineType.DEBIT, amount: 500000, cashAccount: { accountName: 'Kas' } },
          { id: 'l2', cashAccountId: 'acc-2', lineType: JournalLineType.CREDIT, amount: 500000, cashAccount: { accountName: 'Pendapatan' } },
        ],
        createdAt: new Date(),
      });

      const res = await service.createJournalEntry(mockTenantId, 'user-treasurer', {
        entryDate: '2026-11-12',
        referenceNo: 'JRN/001',
        description: 'Penerimaan SPP Kas',
        lines: [
          { cashAccountId: 'acc-1', lineType: JournalLineType.DEBIT, amount: 500000 },
          { cashAccountId: 'acc-2', lineType: JournalLineType.CREDIT, amount: 500000 },
        ],
      });

      expect(res.totalDebit).toBe(500000);
      expect(res.totalCredit).toBe(500000);
      expect(prisma.cashAccount.update).toHaveBeenCalledTimes(2);
      expect(auditService.record).toHaveBeenCalled();
    });
  });

  describe('getFinanceSummary', () => {
    it('should aggregate financial KPIs accurately', async () => {
      prisma.invoice.findMany.mockResolvedValue([
        { totalAmount: 1000000, paidAmount: 1000000, remainingAmount: 0, status: 'PAID', dueDate: new Date() },
        { totalAmount: 1000000, paidAmount: 500000, remainingAmount: 500000, status: 'PARTIALLY_PAID', dueDate: new Date() },
        { totalAmount: 500000, paidAmount: 0, remainingAmount: 500000, status: 'UNPAID', dueDate: new Date('2020-01-01') }, // overdue
      ]);

      prisma.cashAccount.findMany.mockResolvedValue([
        { id: 'a1', accountName: 'Kas Tunai', currentBalance: 1500000 },
      ]);

      const summary = await service.getFinanceSummary(mockTenantId);

      expect(summary.totalInvoiced).toBe(2500000);
      expect(summary.totalCollected).toBe(1500000);
      expect(summary.totalOutstanding).toBe(1000000);
      expect(summary.paidInvoicesCount).toBe(1);
      expect(summary.partiallyPaidCount).toBe(1);
      expect(summary.unpaidInvoicesCount).toBe(1);
      expect(summary.overdueInvoicesCount).toBe(1);
      expect(summary.collectionRatePercentage).toBe(60);
      expect(summary.totalCashBalance).toBe(1500000);
    });
  });
});
