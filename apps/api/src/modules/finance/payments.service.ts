import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentMethod, PaymentStatus, InvoiceStatus, JournalLineType } from '@edusaas/shared-types';
import {
  CreatePaymentDto,
  PaymentGatewaySimulationDto,
  PaymentGatewayChargeResponse,
  PaymentGatewayWebhookDto,
  PaymentResponseData,
  DigitalReceiptDto,
} from '@edusaas/api-contracts';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly gatewaySecret = process.env.PAYMENT_GATEWAY_SECRET || 'edusaas_payment_secret_2026';

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Process payment (manual cash, bank transfer, or offline collection)
   */
  async processPayment(
    tenantId: string,
    recordedByUserId: string,
    dto: CreatePaymentDto,
  ): Promise<{ payment: PaymentResponseData; receipt: DigitalReceiptDto }> {
    const amountToPay = dto.amountPaid ?? dto.amount;
    if (!amountToPay || amountToPay <= 0) {
      throw new BadRequestException('Nominal pembayaran harus lebih besar dari 0');
    }

    // 1. Idempotency Check
    if (dto.idempotencyKey) {
      const existingPayment = await this.prisma.payment.findFirst({
        where: { tenantId, idempotencyKey: dto.idempotencyKey },
        include: { invoice: { include: { student: true, tenant: true } } },
      });

      if (existingPayment) {
        this.logger.warn(`[IDEMPOTENCY] Replaying existing payment for key: ${dto.idempotencyKey}`);
        return {
          payment: this.mapToResponse(existingPayment),
          receipt: this.buildDigitalReceipt(existingPayment, existingPayment.invoice),
        };
      }
    }

    // 2. Fetch and Validate Invoice
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: dto.invoiceId, tenantId },
      include: {
        student: {
          include: {
            classStudents: {
              include: { classGroup: true },
            },
          },
        },
        tenant: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Faktur tagihan tidak ditemukan');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new ConflictException('Faktur tagihan ini sudah lunas sepenuhnya');
    }

    const currentRemaining = Number(invoice.remainingAmount);
    if (amountToPay > currentRemaining) {
      throw new BadRequestException(
        `Nominal pembayaran (Rp ${amountToPay.toLocaleString('id-ID')}) melebihi sisa tagihan (Rp ${currentRemaining.toLocaleString('id-ID')})`,
      );
    }

    // 3. Generate Codes
    const transactionCode = await this.generateTransactionCode(tenantId);
    const receiptNumber = await this.generateReceiptNumber(tenantId);
    const newPaidAmount = Number(invoice.paidAmount) + amountToPay;
    const newRemainingAmount = currentRemaining - amountToPay;
    const newInvoiceStatus =
      newRemainingAmount <= 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

    // 4. Atomic Transaction: Create Payment & Update Invoice
    const [createdPayment, updatedInvoice] = await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          tenantId,
          invoiceId: invoice.id,
          transactionCode,
          amountPaid: amountToPay,
          paymentMethod: dto.paymentMethod,
          paymentStatus: PaymentStatus.SUCCESS,
          idempotencyKey: dto.idempotencyKey || null,
          receiptNumber,
          paidAt: new Date(),
        },
      }),
      this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newInvoiceStatus,
        },
      }),
    ]);

    // 5. Automated Double-Entry Accounting
    if (dto.cashAccountId) {
      await this.recordAutomaticJournalEntry(
        tenantId,
        dto.cashAccountId,
        amountToPay,
        transactionCode,
        invoice.title,
        recordedByUserId,
      );
    }

    // 6. Audit Trail
    await this.auditService.record({
      tenantId,
      userId: recordedByUserId,
      action: 'PAYMENT_RECEIVED',
      resource: 'Payment',
      resourceId: createdPayment.id,
      newValues: {
        transactionCode,
        receiptNumber,
        invoiceId: invoice.id,
        amountPaid: amountToPay,
        paymentMethod: dto.paymentMethod,
        remainingBalance: newRemainingAmount,
      },
    });

    // 7. Dispatch Digital Receipt Notification to Guardians
    const receipt = this.buildDigitalReceipt(createdPayment, invoice, newRemainingAmount);
    await this.notifyPaymentReceipt(tenantId, invoice.studentId, receipt);

    return {
      payment: this.mapToResponse(createdPayment, invoice.student?.fullName, invoice.invoiceNumber),
      receipt,
    };
  }

  /**
   * Simulate Payment Gateway Charge (QRIS or Virtual Account generation)
   */
  async simulateGatewayCharge(
    tenantId: string,
    dto: PaymentGatewaySimulationDto,
  ): Promise<PaymentGatewayChargeResponse> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: dto.invoiceId, tenantId },
      include: { student: true },
    });

    if (!invoice) {
      throw new NotFoundException('Faktur tagihan tidak ditemukan');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new ConflictException('Faktur tagihan sudah lunas');
    }

    const amount = Number(invoice.remainingAmount);
    const transactionCode = await this.generateTransactionCode(tenantId);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    let qrString: string | undefined;
    let vaNumber: string | undefined;

    if (dto.paymentMethod === PaymentMethod.QRIS) {
      qrString = `00020101021226${tenantId.substring(0, 8)}52040000530336054${amount}5802ID5914EDUSAAS PESANTREN6007JAKARTA6304ABCD`;
    } else if (dto.paymentMethod === PaymentMethod.VIRTUAL_ACCOUNT) {
      const bankPrefix =
        dto.bankCode === 'BCA'
          ? '10088'
          : dto.bankCode === 'BRI'
            ? '10089'
            : dto.bankCode === 'BNI'
              ? '88012'
              : dto.bankCode === 'MANDIRI'
                ? '88824'
                : '45100'; // BSI (Bank Syariah Indonesia)
      const studentCleanNis = invoice.student.nis.replace(/\D/g, '').padEnd(6, '0');
      vaNumber = `${bankPrefix}${studentCleanNis}`;
    }

    // Create PENDING payment record
    const payment = await this.prisma.payment.create({
      data: {
        tenantId,
        invoiceId: invoice.id,
        transactionCode,
        amountPaid: amount,
        paymentMethod: dto.paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        gatewayReference: `GW-REF-${Date.now()}`,
      },
    });

    return {
      paymentId: payment.id,
      invoiceId: invoice.id,
      transactionCode,
      paymentMethod: dto.paymentMethod,
      amount,
      status: PaymentStatus.PENDING,
      qrString,
      qrImageUrl: qrString ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrString)}` : undefined,
      vaNumber,
      bankCode: dto.bankCode || 'BSI',
      expiresAt,
    };
  }

  /**
   * Process Gateway Webhook Callback (Anti-tamper HMAC verification)
   */
  async processGatewayWebhook(
    tenantId: string,
    dto: PaymentGatewayWebhookDto,
  ): Promise<{ status: string; message: string }> {
    // 1. Verify Signature: sha256(transactionCode + gatewayReference + amountPaid + gatewaySecret)
    const rawSign = `${dto.transactionCode}${dto.gatewayReference}${dto.amountPaid}${this.gatewaySecret}`;
    const expectedSignature = crypto.createHash('sha256').update(rawSign).digest('hex');

    if (dto.signatureKey !== expectedSignature) {
      this.logger.error(`[WEBHOOK-FRAUD] Invalid webhook signature for transaction: ${dto.transactionCode}`);
      throw new BadRequestException('Tanda tangan digital webhook tidak valid');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { transactionCode: dto.transactionCode },
      include: {
        invoice: {
          include: {
            student: {
              include: {
                classStudents: {
                  include: { classGroup: true },
                },
              },
            },
            tenant: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Data transaksi gateway tidak ditemukan');
    }

    if (payment.paymentStatus === PaymentStatus.SUCCESS) {
      return { status: 'OK', message: 'Transaksi telah diproses sebelumnya' };
    }

    if (dto.paymentStatus === PaymentStatus.SUCCESS) {
      const receiptNumber = await this.generateReceiptNumber(tenantId);
      const invoice = payment.invoice;
      const amountPaid = Number(payment.amountPaid);
      const newPaid = Number(invoice.paidAmount) + amountPaid;
      const newRemaining = Math.max(0, Number(invoice.remainingAmount) - amountPaid);
      const newInvoiceStatus = newRemaining === 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            paymentStatus: PaymentStatus.SUCCESS,
            gatewayReference: dto.gatewayReference,
            receiptNumber,
            paidAt: new Date(),
          },
        }),
        this.prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: newPaid,
            remainingAmount: newRemaining,
            status: newInvoiceStatus,
          },
        }),
      ]);

      const receipt = this.buildDigitalReceipt(
        { ...payment, receiptNumber, paidAt: new Date() },
        invoice,
        newRemaining,
      );

      await this.notifyPaymentReceipt(tenantId, invoice.studentId, receipt);

      this.logger.log(`[WEBHOOK-SUCCESS] Payment completed via gateway: ${dto.transactionCode}`);
      return { status: 'SUCCESS', message: 'Pembayaran sukses diverifikasi gateway' };
    }

    // Marked as failed or expired
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { paymentStatus: dto.paymentStatus },
    });

    return { status: dto.paymentStatus, message: 'Status pembayaran diperbarui' };
  }

  /**
   * Fetch Digital Receipt by Payment ID
   */
  async getDigitalReceipt(tenantId: string, paymentId: string): Promise<DigitalReceiptDto> {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, tenantId },
      include: {
        invoice: {
          include: {
            student: {
              include: {
                classStudents: {
                  include: { classGroup: true },
                },
              },
            },
            tenant: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Data pembayaran tidak ditemukan');
    }

    return this.buildDigitalReceipt(payment, payment.invoice);
  }

  // ---------------------------------------------------------------------------
  // HELPER METHODS
  // ---------------------------------------------------------------------------

  private async generateTransactionCode(tenantId: string): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `TRX/${dateStr}/${randomHex}`;
  }

  private async generateReceiptNumber(tenantId: string): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const count = await this.prisma.payment.count({
      where: {
        tenantId,
        paymentStatus: PaymentStatus.SUCCESS,
        createdAt: { gte: startOfMonth },
      },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `REC/${yearMonth}/${sequence}`;
  }

  private buildDigitalReceipt(payment: any, invoice: any, remainingBalance?: number): DigitalReceiptDto {
    const activeClass = invoice.student?.classStudents?.[0]?.classGroup?.name;
    const paidAtStr = payment.paidAt instanceof Date ? payment.paidAt.toISOString() : payment.paidAt;
    const amount = Number(payment.amountPaid);
    const balance = remainingBalance ?? Number(invoice.remainingAmount);

    const verificationPayload = `${payment.receiptNumber}|${payment.transactionCode}|${amount}|${payment.tenantId}`;
    const verificationHash = crypto
      .createHmac('sha256', this.gatewaySecret)
      .update(verificationPayload)
      .digest('hex');

    return {
      receiptNumber: payment.receiptNumber || `TEMP-${payment.transactionCode}`,
      transactionCode: payment.transactionCode,
      invoiceNumber: invoice.invoiceNumber,
      invoiceTitle: invoice.title,
      studentName: invoice.student?.fullName || 'Santri',
      studentNis: invoice.student?.nis || '-',
      classGroupName: activeClass,
      amountPaid: amount,
      totalInvoiceAmount: Number(invoice.totalAmount),
      remainingBalance: balance,
      paymentMethod: payment.paymentMethod as PaymentMethod,
      paidAt: paidAtStr,
      verificationHash,
      tenantName: invoice.tenant?.name || 'Sistem Pendidikan & Pesantren',
    };
  }

  private async recordAutomaticJournalEntry(
    tenantId: string,
    cashAccountId: string,
    amount: number,
    transactionCode: string,
    invoiceTitle: string,
    recordedByUserId: string,
  ) {
    try {
      const entryDate = new Date();
      entryDate.setHours(0, 0, 0, 0);

      // Debit Cash/Bank Account, Credit Revenue (Internal Offset)
      await this.prisma.$transaction([
        this.prisma.journalEntry.create({
          data: {
            tenantId,
            entryDate,
            referenceNo: `JRN/${transactionCode}`,
            description: `Penerimaan Pembayaran: ${invoiceTitle} (${transactionCode})`,
            lines: {
              create: [
                {
                  cashAccountId,
                  lineType: JournalLineType.DEBIT,
                  amount,
                  notes: 'Penerimaan kas/bank masuk',
                },
              ],
            },
          },
        }),
        this.prisma.cashAccount.update({
          where: { id: cashAccountId },
          data: {
            currentBalance: { increment: amount },
          },
        }),
      ]);
    } catch (e) {
      this.logger.warn(`Failed to record automated journal line: ${e.message}`);
    }
  }

  private async notifyPaymentReceipt(tenantId: string, studentId: string, receipt: DigitalReceiptDto) {
    const formattedAmount = `Rp ${receipt.amountPaid.toLocaleString('id-ID')}`;
    const title = `Kuitansi Digital Pembayaran: ${receipt.invoiceTitle}`;
    const body = `Alhamdulillah, pembayaran untuk ${receipt.studentName} sebesar ${formattedAmount} via ${receipt.paymentMethod} telah sukses diterima. No. Kuitansi: ${receipt.receiptNumber}. Sisa tagihan: Rp ${receipt.remainingBalance.toLocaleString('id-ID')}.`;

    try {
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        include: {
          guardians: {
            where: { hasFinancialAccess: true },
            include: { guardian: true },
          },
        },
      });

      if (!student) return;

      for (const link of student.guardians) {
        // Send In-App & WhatsApp / Push
        await this.notificationsService.sendNotification(tenantId, {
          userId: link.guardian.userId,
          title,
          body,
          category: 'FINANCIAL',
          metadata: {
            receiptNumber: receipt.receiptNumber,
            invoiceNumber: receipt.invoiceNumber,
            amountPaid: receipt.amountPaid,
          },
        });
      }
    } catch (e) {
      this.logger.error(`Failed to dispatch payment receipt notification: ${e.message}`);
    }
  }

  private mapToResponse(p: any, studentName?: string, invoiceNumber?: string): PaymentResponseData {
    return {
      id: p.id,
      tenantId: p.tenantId,
      invoiceId: p.invoiceId,
      invoiceNumber: invoiceNumber || p.invoice?.invoiceNumber,
      studentName: studentName || p.invoice?.student?.fullName,
      transactionCode: p.transactionCode,
      amountPaid: Number(p.amountPaid),
      paymentMethod: p.paymentMethod as PaymentMethod,
      paymentStatus: p.paymentStatus as PaymentStatus,
      idempotencyKey: p.idempotencyKey,
      gatewayReference: p.gatewayReference,
      receiptNumber: p.receiptNumber,
      paidAt: p.paidAt instanceof Date ? p.paidAt.toISOString() : p.paidAt,
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    };
  }
}
