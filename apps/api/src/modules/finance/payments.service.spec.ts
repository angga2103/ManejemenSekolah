import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentMethod, PaymentStatus, InvoiceStatus } from '@edusaas/shared-types';
import * as crypto from 'crypto';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: any;
  let auditService: any;
  let notificationsService: any;

  const mockTenantId = '11111111-1111-1111-1111-111111111111';
  const mockInvoiceId = '44444444-4444-4444-4444-444444444444';

  beforeEach(async () => {
    prisma = {
      payment: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      invoice: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      student: {
        findUnique: jest.fn(),
      },
      journalEntry: {
        create: jest.fn(),
      },
      cashAccount: {
        update: jest.fn(),
      },
      $transaction: jest.fn((callbackOrArray) => {
        if (typeof callbackOrArray === 'function') {
          return callbackOrArray(prisma);
        }
        return Promise.all(callbackOrArray);
      }),
    };

    auditService = {
      record: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    notificationsService = {
      sendNotification: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('processPayment', () => {
    it('should process partial payment, calculate remaining balance, and set PARTIALLY_PAID status', async () => {
      const mockInvoice = {
        id: mockInvoiceId,
        tenantId: mockTenantId,
        studentId: 'student-1',
        invoiceNumber: 'INV/202611/0001',
        title: 'Uang Pangkal Masuk',
        totalAmount: 2000000,
        paidAmount: 0,
        remainingAmount: 2000000,
        status: InvoiceStatus.UNPAID,
        student: { fullName: 'Ahmad Faiz', nis: '2026001', classStudents: [] },
        tenant: { name: 'Pesantren Al-Hikmah' },
      };

      prisma.invoice.findFirst.mockResolvedValue(mockInvoice);
      prisma.payment.count.mockResolvedValue(0);

      // Paying 500,000 out of 2,000,000
      prisma.payment.create.mockResolvedValue({
        id: 'pay-1',
        tenantId: mockTenantId,
        invoiceId: mockInvoiceId,
        transactionCode: 'TRX/20261112/A1B2C3',
        amountPaid: 500000,
        paymentMethod: PaymentMethod.CASH,
        paymentStatus: PaymentStatus.SUCCESS,
        receiptNumber: 'REC/202611/0001',
        paidAt: new Date(),
        createdAt: new Date(),
      });

      prisma.invoice.update.mockResolvedValue({
        ...mockInvoice,
        paidAmount: 500000,
        remainingAmount: 1500000,
        status: InvoiceStatus.PARTIALLY_PAID,
      });

      const res = await service.processPayment(mockTenantId, 'user-treasurer', {
        invoiceId: mockInvoiceId,
        amountPaid: 500000,
        amount: 500000,
        paymentMethod: PaymentMethod.CASH,
      });

      expect(res.payment.amountPaid).toBe(500000);
      expect(res.receipt.remainingBalance).toBe(1500000);
      expect(res.receipt.receiptNumber).toBe('REC/202611/0001');
      expect(auditService.record).toHaveBeenCalled();
    });

    it('should process full payment and mark invoice as PAID with digital receipt', async () => {
      const mockInvoice = {
        id: mockInvoiceId,
        tenantId: mockTenantId,
        studentId: 'student-1',
        invoiceNumber: 'INV/202611/0002',
        title: 'SPP Bulanan',
        totalAmount: 500000,
        paidAmount: 0,
        remainingAmount: 500000,
        status: InvoiceStatus.UNPAID,
        student: { fullName: 'Fathimah Azzahra', nis: '2026002', classStudents: [] },
        tenant: { name: 'Pesantren Al-Hikmah' },
      };

      prisma.invoice.findFirst.mockResolvedValue(mockInvoice);
      prisma.payment.count.mockResolvedValue(1);

      prisma.payment.create.mockResolvedValue({
        id: 'pay-2',
        tenantId: mockTenantId,
        invoiceId: mockInvoiceId,
        transactionCode: 'TRX/20261112/F4E5D6',
        amountPaid: 500000,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentStatus: PaymentStatus.SUCCESS,
        receiptNumber: 'REC/202611/0002',
        paidAt: new Date(),
        createdAt: new Date(),
      });

      prisma.invoice.update.mockResolvedValue({
        ...mockInvoice,
        paidAmount: 500000,
        remainingAmount: 0,
        status: InvoiceStatus.PAID,
      });

      const res = await service.processPayment(mockTenantId, 'user-treasurer', {
        invoiceId: mockInvoiceId,
        amountPaid: 500000,
        amount: 500000,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
      });

      expect(res.receipt.remainingBalance).toBe(0);
      expect(res.receipt.verificationHash).toBeDefined();
    });

    it('should prevent double charging when idempotency key is replayed', async () => {
      const existingPayment = {
        id: 'pay-cached',
        tenantId: mockTenantId,
        invoiceId: mockInvoiceId,
        transactionCode: 'TRX/EXISTING',
        amountPaid: 500000,
        paymentMethod: PaymentMethod.QRIS,
        paymentStatus: PaymentStatus.SUCCESS,
        idempotencyKey: 'idem-key-12345',
        receiptNumber: 'REC/202611/0099',
        paidAt: new Date(),
        createdAt: new Date(),
        invoice: {
          invoiceNumber: 'INV/202611/0001',
          title: 'SPP',
          totalAmount: 500000,
          remainingAmount: 0,
          student: { fullName: 'Ahmad Faiz', classStudents: [] },
          tenant: { name: 'Al-Hikmah' },
        },
      };

      prisma.payment.findFirst.mockResolvedValue(existingPayment);

      const res = await service.processPayment(mockTenantId, 'user-treasurer', {
        invoiceId: mockInvoiceId,
        amountPaid: 500000,
        amount: 500000,
        paymentMethod: PaymentMethod.QRIS,
        idempotencyKey: 'idem-key-12345',
      });

      expect(res.payment.transactionCode).toBe('TRX/EXISTING');
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });
  });

  describe('Payment Gateway Simulation & Webhook', () => {
    it('should generate simulated QRIS charge payload with 24-hour expiration', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        id: mockInvoiceId,
        tenantId: mockTenantId,
        remainingAmount: 500000,
        status: InvoiceStatus.UNPAID,
        student: { nis: '2026001' },
      });

      prisma.payment.create.mockResolvedValue({
        id: 'pay-qris-pending',
        transactionCode: 'TRX/QRIS/123',
      });

      const charge = await service.simulateGatewayCharge(mockTenantId, {
        invoiceId: mockInvoiceId,
        paymentMethod: PaymentMethod.QRIS,
      });

      expect(charge.paymentMethod).toBe(PaymentMethod.QRIS);
      expect(charge.qrString).toContain('EDUSAAS PESANTREN');
      expect(charge.status).toBe(PaymentStatus.PENDING);
    });

    it('should verify gateway webhook signature and mark payment as SUCCESS', async () => {
      const secret = 'edusaas_payment_secret_2026';
      const trxCode = 'TRX/GW/999';
      const gwRef = 'REF-BANK-999';
      const amount = 500000;
      const signatureKey = crypto
        .createHash('sha256')
        .update(`${trxCode}${gwRef}${amount}${secret}`)
        .digest('hex');

      prisma.payment.findUnique.mockResolvedValue({
        id: 'pay-pending-1',
        tenantId: mockTenantId,
        transactionCode: trxCode,
        amountPaid: amount,
        paymentStatus: PaymentStatus.PENDING,
        invoice: {
          id: mockInvoiceId,
          title: 'SPP',
          totalAmount: 500000,
          paidAmount: 0,
          remainingAmount: 500000,
          studentId: 'student-1',
          student: { fullName: 'Ahmad Faiz', classStudents: [] },
          tenant: { name: 'Al-Hikmah' },
        },
      });

      prisma.payment.count.mockResolvedValue(5);
      prisma.payment.update.mockResolvedValue({ id: 'pay-pending-1' });
      prisma.invoice.update.mockResolvedValue({ id: mockInvoiceId });

      const webhookRes = await service.processGatewayWebhook(mockTenantId, {
        transactionCode: trxCode,
        gatewayReference: gwRef,
        amountPaid: amount,
        paymentStatus: PaymentStatus.SUCCESS,
        signatureKey,
      });

      expect(webhookRes.status).toBe('SUCCESS');
      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ paymentStatus: PaymentStatus.SUCCESS }),
        }),
      );
    });
  });
});
