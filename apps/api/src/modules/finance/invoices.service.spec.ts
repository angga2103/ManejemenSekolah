import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InvoiceStatus } from '@edusaas/shared-types';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let prisma: any;
  let auditService: any;

  const mockTenantId = '11111111-1111-1111-1111-111111111111';
  const mockStudentId = '22222222-2222-2222-2222-222222222222';
  const mockCategoryId = '33333333-3333-3333-3333-333333333333';

  beforeEach(async () => {
    prisma = {
      student: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      billingCategory: {
        findFirst: jest.fn(),
      },
      invoice: {
        create: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      guardian: {
        findFirst: jest.fn(),
      },
    };

    auditService = {
      record: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  describe('createInvoice', () => {
    it('should create an invoice with sequential number, initial unpaid status and remaining amount', async () => {
      prisma.student.findFirst.mockResolvedValue({
        id: mockStudentId,
        fullName: 'Ahmad Faiz',
        nis: '2026001',
        classStudents: [{ classGroup: { name: '10 MIPA 1' } }],
      });

      prisma.billingCategory.findFirst.mockResolvedValue({
        id: mockCategoryId,
        name: 'SPP Bulanan',
        code: 'SPP',
      });

      prisma.invoice.count.mockResolvedValue(4); // 5th invoice this month

      prisma.invoice.create.mockImplementation((args) => ({
        id: 'inv-1',
        tenantId: mockTenantId,
        studentId: mockStudentId,
        billingCategoryId: mockCategoryId,
        invoiceNumber: args.data.invoiceNumber,
        title: args.data.title,
        totalAmount: args.data.totalAmount,
        paidAmount: 0,
        remainingAmount: args.data.totalAmount,
        status: InvoiceStatus.UNPAID,
        dueDate: args.data.dueDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        student: { fullName: 'Ahmad Faiz', nis: '2026001', classStudents: [{ classGroup: { name: '10 MIPA 1' } }] },
        billingCategory: { name: 'SPP Bulanan' },
      }));

      const res = await service.createInvoice(mockTenantId, 'user-admin', {
        studentId: mockStudentId,
        billingCategoryId: mockCategoryId,
        title: 'SPP November 2026',
        totalAmount: 500000,
        dueDate: '2026-11-20',
      });

      expect(res.invoiceNumber).toMatch(/^INV\/\d{6}\/0005$/);
      expect(res.totalAmount).toBe(500000);
      expect(res.remainingAmount).toBe(500000);
      expect(res.paidAmount).toBe(0);
      expect(res.status).toBe(InvoiceStatus.UNPAID);
      expect(auditService.record).toHaveBeenCalled();
    });
  });

  describe('generateBatchInvoices', () => {
    it('should batch create invoices for class roster and skip duplicate existing ones', async () => {
      prisma.billingCategory.findFirst.mockResolvedValue({ id: mockCategoryId, name: 'SPP' });

      prisma.student.findMany.mockResolvedValue([
        { id: 's1', fullName: 'Student 1', classStudents: [] },
        { id: 's2', fullName: 'Student 2', classStudents: [] },
      ]);

      // s1 already has invoice, s2 does not
      prisma.invoice.findFirst
        .mockResolvedValueOnce({ id: 'existing-inv' })
        .mockResolvedValueOnce(null);

      prisma.invoice.count.mockResolvedValue(10);
      prisma.invoice.create.mockImplementation((args) => ({
        id: 'inv-new',
        tenantId: mockTenantId,
        studentId: args.data.studentId,
        billingCategoryId: mockCategoryId,
        invoiceNumber: args.data.invoiceNumber,
        title: args.data.title,
        totalAmount: args.data.totalAmount,
        paidAmount: 0,
        remainingAmount: args.data.totalAmount,
        status: InvoiceStatus.UNPAID,
        dueDate: args.data.dueDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        student: { fullName: 'Student 2', classStudents: [] },
        billingCategory: { name: 'SPP' },
      }));

      const res = await service.generateBatchInvoices(mockTenantId, 'user-admin', {
        classGroupId: 'class-1',
        billingCategoryId: mockCategoryId,
        title: 'SPP November 2026',
        amount: 500000,
        dueDate: '2026-11-20',
      });

      expect(res.generatedCount).toBe(1);
      expect(res.skippedCount).toBe(1);
    });
  });

  describe('Guardian Financial Isolation', () => {
    it('should only return invoices for students where guardian hasFinancialAccess=true', async () => {
      prisma.guardian.findFirst.mockResolvedValue({
        id: 'g-1',
        students: [
          { studentId: 's1', hasFinancialAccess: true },
        ],
      });

      prisma.invoice.findMany.mockResolvedValue([]);
      prisma.invoice.count.mockResolvedValue(0);

      await service.findAll(mockTenantId, {}, 'guardian-user-1');

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            studentId: { in: ['s1'] },
          }),
        }),
      );
    });
  });
});
