import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { JournalLineType, InvoiceStatus } from '@edusaas/shared-types';
import {
  CreateCashAccountDto,
  CashAccountResponseData,
  CreateJournalEntryDto,
  JournalEntryResponseData,
  FinanceSummaryDto,
} from '@edusaas/api-contracts';

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Create new cash / bank account
   */
  async createCashAccount(tenantId: string, dto: CreateCashAccountDto): Promise<CashAccountResponseData> {
    const created = await this.prisma.cashAccount.create({
      data: {
        tenantId,
        accountName: dto.accountName.trim(),
        accountNumber: dto.accountNumber?.trim() || null,
        bankName: dto.bankName?.trim() || null,
        currentBalance: dto.initialBalance ?? 0,
        isActive: true,
      },
    });

    return {
      id: created.id,
      tenantId: created.tenantId,
      accountName: created.accountName,
      accountNumber: created.accountNumber,
      bankName: created.bankName,
      currentBalance: Number(created.currentBalance),
      isActive: created.isActive,
    };
  }

  /**
   * List all cash and bank accounts
   */
  async listCashAccounts(tenantId: string): Promise<CashAccountResponseData[]> {
    const accounts = await this.prisma.cashAccount.findMany({
      where: { tenantId },
      orderBy: { accountName: 'asc' },
    });

    return accounts.map((a) => ({
      id: a.id,
      tenantId: a.tenantId,
      accountName: a.accountName,
      accountNumber: a.accountNumber,
      bankName: a.bankName,
      currentBalance: Number(a.currentBalance),
      isActive: a.isActive,
    }));
  }

  /**
   * Create double-entry journal entry with strict debit/credit balance verification
   */
  async createJournalEntry(
    tenantId: string,
    recordedByUserId: string,
    dto: CreateJournalEntryDto,
  ): Promise<JournalEntryResponseData> {
    if (!dto.lines || dto.lines.length < 2) {
      throw new BadRequestException('Entri jurnal double-entry minimal harus memiliki 2 baris (Debit & Credit)');
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of dto.lines) {
      if (line.amount <= 0) {
        throw new BadRequestException('Nominal pada baris jurnal harus lebih besar dari 0');
      }
      if (line.lineType === JournalLineType.DEBIT) {
        totalDebit += line.amount;
      } else if (line.lineType === JournalLineType.CREDIT) {
        totalCredit += line.amount;
      }
    }

    // Enforce Double-Entry Balance
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new BadRequestException(
        `Jurnal tidak seimbang: Total Debit (Rp ${totalDebit.toLocaleString('id-ID')}) tidak sama dengan Total Credit (Rp ${totalCredit.toLocaleString('id-ID')})`,
      );
    }

    const entryDate = new Date(dto.entryDate);
    entryDate.setHours(0, 0, 0, 0);
    const referenceNo = dto.referenceNo || `JRN/${Date.now()}`;

    // Atomic transaction: create entry, lines, and update cash account balances
    const created = await this.prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          tenantId,
          entryDate,
          referenceNo,
          description: dto.description.trim(),
          lines: {
            create: dto.lines.map((l) => ({
              cashAccountId: l.cashAccountId,
              lineType: l.lineType,
              amount: l.amount,
              notes: l.notes || null,
            })),
          },
        },
        include: {
          lines: {
            include: { cashAccount: true },
          },
        },
      });

      // Update cash account balances
      for (const line of dto.lines) {
        const delta = line.lineType === JournalLineType.DEBIT ? line.amount : -line.amount;
        await tx.cashAccount.update({
          where: { id: line.cashAccountId },
          data: {
            currentBalance: { increment: delta },
          },
        });
      }

      return entry;
    });

    await this.auditService.record({
      tenantId,
      userId: recordedByUserId,
      action: 'CREATE_JOURNAL_ENTRY',
      resource: 'JournalEntry',
      resourceId: created.id,
      newValues: { referenceNo, totalDebit, totalCredit, linesCount: dto.lines.length },
    });

    return {
      id: created.id,
      tenantId: created.tenantId,
      entryDate: created.entryDate.toISOString().split('T')[0],
      referenceNo: created.referenceNo,
      description: created.description,
      totalDebit,
      totalCredit,
      lines: created.lines.map((l) => ({
        id: l.id,
        journalEntryId: l.journalEntryId,
        cashAccountId: l.cashAccountId,
        accountName: l.cashAccount?.accountName,
        lineType: l.lineType as JournalLineType,
        amount: Number(l.amount),
        notes: l.notes,
      })),
      createdAt: created.createdAt.toISOString(),
    };
  }

  /**
   * List recent journal entries
   */
  async listJournalEntries(tenantId: string, limit = 50): Promise<JournalEntryResponseData[]> {
    const entries = await this.prisma.journalEntry.findMany({
      where: { tenantId },
      include: {
        lines: {
          include: { cashAccount: true },
        },
      },
      orderBy: { entryDate: 'desc' },
      take: Math.min(100, limit),
    });

    return entries.map((e) => {
      let totalDebit = 0;
      let totalCredit = 0;
      for (const l of e.lines) {
        if (l.lineType === 'DEBIT') totalDebit += Number(l.amount);
        else totalCredit += Number(l.amount);
      }

      return {
        id: e.id,
        tenantId: e.tenantId,
        entryDate: e.entryDate.toISOString().split('T')[0],
        referenceNo: e.referenceNo,
        description: e.description,
        totalDebit,
        totalCredit,
        lines: e.lines.map((l) => ({
          id: l.id,
          journalEntryId: l.journalEntryId,
          cashAccountId: l.cashAccountId,
          accountName: l.cashAccount?.accountName,
          lineType: l.lineType as JournalLineType,
          amount: Number(l.amount),
          notes: l.notes,
        })),
        createdAt: e.createdAt.toISOString(),
      };
    });
  }

  /**
   * Fetch complete financial overview & KPIs
   */
  async getFinanceSummary(tenantId: string): Promise<FinanceSummaryDto> {
    const [invoices, cashAccounts] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { tenantId },
        select: {
          totalAmount: true,
          paidAmount: true,
          remainingAmount: true,
          status: true,
          dueDate: true,
        },
      }),
      this.prisma.cashAccount.findMany({
        where: { tenantId, isActive: true },
      }),
    ]);

    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let paidInvoicesCount = 0;
    let unpaidInvoicesCount = 0;
    let partiallyPaidCount = 0;
    let overdueInvoicesCount = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const inv of invoices) {
      const total = Number(inv.totalAmount);
      const paid = Number(inv.paidAmount);
      const remaining = Number(inv.remainingAmount);

      totalInvoiced += total;
      totalCollected += paid;
      totalOutstanding += remaining;

      if (inv.status === InvoiceStatus.PAID) {
        paidInvoicesCount++;
      } else if (inv.status === InvoiceStatus.PARTIALLY_PAID) {
        partiallyPaidCount++;
      } else if (inv.status === InvoiceStatus.UNPAID) {
        unpaidInvoicesCount++;
      }

      if (inv.status !== InvoiceStatus.PAID && new Date(inv.dueDate) < today) {
        overdueInvoicesCount++;
      }
    }

    let totalCashBalance = 0;
    const cashBalances = cashAccounts.map((a) => {
      const bal = Number(a.currentBalance);
      totalCashBalance += bal;
      return {
        accountId: a.id,
        accountName: a.accountName,
        balance: bal,
      };
    });

    const collectionRatePercentage =
      totalInvoiced > 0
        ? Math.round((totalCollected / totalInvoiced) * 100 * 10) / 10
        : 0;

    return {
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      paidInvoicesCount,
      unpaidInvoicesCount,
      partiallyPaidCount,
      overdueInvoicesCount,
      collectionRatePercentage,
      cashBalances,
      totalCashBalance,
    };
  }
}
