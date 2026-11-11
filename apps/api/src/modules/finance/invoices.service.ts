import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InvoiceStatus } from '@edusaas/shared-types';
import {
  CreateInvoiceDto,
  GenerateBatchInvoicesDto,
  InvoiceFilterDto,
  InvoiceResponseData,
} from '@edusaas/api-contracts';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Create single invoice for a student
   */
  async createInvoice(
    tenantId: string,
    recordedByUserId: string,
    dto: CreateInvoiceDto,
  ): Promise<InvoiceResponseData> {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, tenantId, deletedAt: null },
      include: {
        classStudents: {
          include: { classGroup: true },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Santri tidak ditemukan pada tenant ini');
    }

    const category = await this.prisma.billingCategory.findFirst({
      where: { id: dto.billingCategoryId, tenantId },
    });

    if (!category) {
      throw new NotFoundException('Kategori tagihan tidak ditemukan');
    }

    if (dto.totalAmount <= 0) {
      throw new BadRequestException('Jumlah nominal tagihan harus lebih besar dari 0');
    }

    const dueDate = new Date(dto.dueDate);
    dueDate.setHours(23, 59, 59, 999);

    const invoiceNumber = await this.generateInvoiceNumber(tenantId);

    const created = await this.prisma.invoice.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        billingCategoryId: dto.billingCategoryId,
        invoiceNumber,
        title: dto.title.trim(),
        totalAmount: dto.totalAmount,
        paidAmount: 0,
        remainingAmount: dto.totalAmount,
        status: InvoiceStatus.UNPAID,
        dueDate,
      },
      include: {
        student: {
          include: {
            classStudents: {
              include: { classGroup: true },
            },
          },
        },
        billingCategory: true,
      },
    });

    await this.auditService.record({
      tenantId,
      userId: recordedByUserId,
      action: 'CREATE_INVOICE',
      resource: 'Invoice',
      resourceId: created.id,
      newValues: {
        invoiceNumber,
        studentId: dto.studentId,
        amount: dto.totalAmount,
        dueDate: dto.dueDate,
      },
    });

    return this.mapToResponse(created);
  }

  /**
   * Batch generate recurring invoices for an entire class or institution
   */
  async generateBatchInvoices(
    tenantId: string,
    recordedByUserId: string,
    dto: GenerateBatchInvoicesDto,
  ): Promise<{ generatedCount: number; skippedCount: number; invoices: InvoiceResponseData[] }> {
    const category = await this.prisma.billingCategory.findFirst({
      where: { id: dto.billingCategoryId, tenantId },
    });

    if (!category) {
      throw new NotFoundException('Kategori tagihan tidak ditemukan');
    }

    const studentWhere: any = {
      tenantId,
      status: 'ACTIVE',
      deletedAt: null,
    };

    if (dto.classGroupId) {
      studentWhere.classStudents = {
        some: { classGroupId: dto.classGroupId },
      };
    } else if (dto.institutionId) {
      studentWhere.institutionId = dto.institutionId;
    }

    const students = await this.prisma.student.findMany({
      where: studentWhere,
      include: {
        classStudents: {
          include: { classGroup: true },
        },
      },
    });

    if (students.length === 0) {
      throw new BadRequestException('Tidak ada santri aktif yang ditemukan untuk kriteria rombel/lembaga ini');
    }

    let generatedCount = 0;
    let skippedCount = 0;
    const createdInvoices: InvoiceResponseData[] = [];
    const dueDate = new Date(dto.dueDate);

    for (const student of students) {
      // Idempotency check: don't create duplicate invoice with identical title and category for same student
      const existing = await this.prisma.invoice.findFirst({
        where: {
          tenantId,
          studentId: student.id,
          billingCategoryId: dto.billingCategoryId,
          title: dto.title.trim(),
        },
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      const invoiceNumber = await this.generateInvoiceNumber(tenantId);
      const created = await this.prisma.invoice.create({
        data: {
          tenantId,
          studentId: student.id,
          billingCategoryId: dto.billingCategoryId,
          invoiceNumber,
          title: dto.title.trim(),
          totalAmount: dto.amount,
          paidAmount: 0,
          remainingAmount: dto.amount,
          status: InvoiceStatus.UNPAID,
          dueDate,
        },
        include: {
          student: {
            include: {
              classStudents: {
                include: { classGroup: true },
              },
            },
          },
          billingCategory: true,
        },
      });

      generatedCount++;
      createdInvoices.push(this.mapToResponse(created));
    }

    await this.auditService.record({
      tenantId,
      userId: recordedByUserId,
      action: 'BATCH_GENERATE_INVOICES',
      resource: 'Invoice',
      newValues: {
        billingCategoryId: dto.billingCategoryId,
        title: dto.title,
        generatedCount,
        skippedCount,
      },
    });

    return {
      generatedCount,
      skippedCount,
      invoices: createdInvoices,
    };
  }

  /**
   * List invoices with filtering, search, pagination, and Guardian financial isolation
   */
  async findAll(
    tenantId: string,
    filter: InvoiceFilterDto = {},
    guardianUserId?: string,
  ): Promise<{ data: InvoiceResponseData[]; meta: { total: number; page: number; limit: number } }> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    // 1. Guardian Financial Isolation Check
    if (guardianUserId) {
      const guardian = await this.prisma.guardian.findFirst({
        where: { tenantId, userId: guardianUserId },
        include: {
          students: {
            where: { hasFinancialAccess: true },
          },
        },
      });

      if (!guardian || guardian.students.length === 0) {
        // Guardian does not have financial access to any student
        return { data: [], meta: { total: 0, page, limit } };
      }

      const allowedStudentIds = guardian.students.map((link) => link.studentId);
      where.studentId = { in: allowedStudentIds };
    } else if (filter.studentId) {
      where.studentId = filter.studentId;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.billingCategoryId) {
      where.billingCategoryId = filter.billingCategoryId;
    }

    if (filter.classGroupId) {
      where.student = {
        classStudents: {
          some: { classGroupId: filter.classGroupId },
        },
      };
    }

    if (filter.search) {
      const s = filter.search.trim();
      where.OR = [
        { invoiceNumber: { contains: s, mode: 'insensitive' } },
        { title: { contains: s, mode: 'insensitive' } },
        { student: { fullName: { contains: s, mode: 'insensitive' } } },
        { student: { nis: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          student: {
            include: {
              classStudents: {
                include: { classGroup: true },
              },
            },
          },
          billingCategory: true,
          payments: {
            orderBy: { paidAt: 'desc' },
          },
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    const data = invoices.map((inv) => this.mapToResponse(inv));

    return {
      data,
      meta: { total, page, limit },
    };
  }

  /**
   * Find single invoice by ID
   */
  async findById(tenantId: string, id: string): Promise<InvoiceResponseData> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        student: {
          include: {
            classStudents: {
              include: { classGroup: true },
            },
          },
        },
        billingCategory: true,
        payments: {
          orderBy: { paidAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Faktur tagihan tidak ditemukan');
    }

    return this.mapToResponse(invoice);
  }

  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const count = await this.prisma.invoice.count({
      where: {
        tenantId,
        createdAt: { gte: startOfMonth },
      },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `INV/${yearMonth}/${sequence}`;
  }

  private mapToResponse(inv: any): InvoiceResponseData {
    const activeClass = inv.student?.classStudents?.[0]?.classGroup?.name;

    return {
      id: inv.id,
      tenantId: inv.tenantId,
      studentId: inv.studentId,
      studentName: inv.student?.fullName,
      studentNis: inv.student?.nis,
      classGroupName: activeClass,
      billingCategoryId: inv.billingCategoryId,
      billingCategoryName: inv.billingCategory?.name,
      invoiceNumber: inv.invoiceNumber,
      title: inv.title,
      totalAmount: Number(inv.totalAmount),
      paidAmount: Number(inv.paidAmount),
      remainingAmount: Number(inv.remainingAmount),
      status: inv.status as InvoiceStatus,
      dueDate: inv.dueDate instanceof Date ? inv.dueDate.toISOString().split('T')[0] : inv.dueDate,
      createdAt: inv.createdAt instanceof Date ? inv.createdAt.toISOString() : inv.createdAt,
      updatedAt: inv.updatedAt instanceof Date ? inv.updatedAt.toISOString() : inv.updatedAt,
      payments: inv.payments
        ? inv.payments.map((p: any) => ({
            id: p.id,
            tenantId: p.tenantId,
            invoiceId: p.invoiceId,
            transactionCode: p.transactionCode,
            amountPaid: Number(p.amountPaid),
            paymentMethod: p.paymentMethod,
            paymentStatus: p.paymentStatus,
            idempotencyKey: p.idempotencyKey,
            gatewayReference: p.gatewayReference,
            receiptNumber: p.receiptNumber,
            paidAt: p.paidAt instanceof Date ? p.paidAt.toISOString() : p.paidAt,
            createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
          }))
        : undefined,
    };
  }
}
