import {
  PaymentMethod,
  PaymentStatus,
  InvoiceStatus,
  JournalLineType,
} from '@edusaas/shared-types';

// -----------------------------------------------------------------------------
// BILLING CATEGORIES
// -----------------------------------------------------------------------------
export interface CreateBillingCategoryDto {
  name: string;
  code: string;
  isRecurring?: boolean;
}

export interface BillingCategoryResponseData {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  isRecurring: boolean;
}

// -----------------------------------------------------------------------------
// INVOICES & BATCH GENERATION
// -----------------------------------------------------------------------------
export interface CreateInvoiceDto {
  studentId: string;
  billingCategoryId: string;
  title: string;
  totalAmount: number;
  dueDate: string; // YYYY-MM-DD
}

// Backward compatibility with Phase 0
export interface CreateInvoiceRequestDto extends CreateInvoiceDto {
  amount?: number;
  description?: string;
}

export interface GenerateBatchInvoicesDto {
  classGroupId?: string;
  institutionId?: string;
  billingCategoryId: string;
  title: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  month?: number; // 1 - 12
  year?: number; // e.g. 2026
}

export interface InvoiceFilterDto {
  studentId?: string;
  classGroupId?: string;
  billingCategoryId?: string;
  status?: InvoiceStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface InvoiceResponseData {
  id: string;
  tenantId: string;
  studentId: string;
  studentName?: string;
  studentNis?: string;
  classGroupName?: string;
  billingCategoryId: string;
  billingCategoryName?: string;
  invoiceNumber: string;
  title: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  payments?: PaymentResponseData[];
}

// -----------------------------------------------------------------------------
// PAYMENTS & GATEWAY SIMULATION
// -----------------------------------------------------------------------------
export interface ProcessPaymentRequestDto {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  idempotencyKey?: string;
  cashAccountId?: string;
}

export interface CreatePaymentDto extends ProcessPaymentRequestDto {
  amountPaid?: number; // alias for amount
}

export interface PaymentGatewaySimulationDto {
  invoiceId: string;
  paymentMethod: PaymentMethod;
  bankCode?: 'BCA' | 'BRI' | 'BNI' | 'MANDIRI' | 'BSI';
}

export interface PaymentGatewayChargeResponse {
  paymentId: string;
  invoiceId: string;
  transactionCode: string;
  paymentMethod: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  qrString?: string;
  qrImageUrl?: string;
  vaNumber?: string;
  bankCode?: string;
  expiresAt: string;
  idempotencyKey?: string;
}

export interface PaymentGatewayWebhookDto {
  transactionCode: string;
  gatewayReference: string;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  signatureKey: string;
}

export interface PaymentResponseData {
  id: string;
  tenantId: string;
  invoiceId: string;
  invoiceNumber?: string;
  studentName?: string;
  transactionCode: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  idempotencyKey?: string | null;
  gatewayReference?: string | null;
  receiptNumber?: string | null;
  paidAt: string;
  createdAt: string;
}

export interface DigitalReceiptDto {
  receiptNumber: string;
  transactionCode: string;
  invoiceNumber: string;
  invoiceTitle: string;
  studentName: string;
  studentNis: string;
  classGroupName?: string;
  amountPaid: number;
  totalInvoiceAmount: number;
  remainingBalance: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
  verificationHash: string;
  tenantName: string;
}

// -----------------------------------------------------------------------------
// CASH ACCOUNTS & DOUBLE-ENTRY ACCOUNTING LEDGERS
// -----------------------------------------------------------------------------
export interface CreateCashAccountDto {
  accountName: string;
  accountNumber?: string;
  bankName?: string;
  initialBalance?: number;
}

export interface CashAccountResponseData {
  id: string;
  tenantId: string;
  accountName: string;
  accountNumber: string | null;
  bankName: string | null;
  currentBalance: number;
  isActive: boolean;
}

export interface JournalLineItemDto {
  cashAccountId: string;
  lineType: JournalLineType;
  amount: number;
  notes?: string;
}

export interface CreateJournalEntryDto {
  entryDate: string; // YYYY-MM-DD
  referenceNo?: string;
  description: string;
  lines: JournalLineItemDto[];
}

export interface JournalLineResponseData {
  id: string;
  journalEntryId: string;
  cashAccountId: string;
  accountName?: string;
  lineType: JournalLineType;
  amount: number;
  notes?: string | null;
}

export interface JournalEntryResponseData {
  id: string;
  tenantId: string;
  entryDate: string;
  referenceNo: string;
  description: string;
  totalDebit: number;
  totalCredit: number;
  lines: JournalLineResponseData[];
  createdAt: string;
}

// -----------------------------------------------------------------------------
// FINANCIAL OVERVIEW & KPIS
// -----------------------------------------------------------------------------
export interface FinanceSummaryDto {
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  paidInvoicesCount: number;
  unpaidInvoicesCount: number;
  partiallyPaidCount: number;
  overdueInvoicesCount: number;
  collectionRatePercentage: number;
  cashBalances: Array<{
    accountId: string;
    accountName: string;
    balance: number;
  }>;
  totalCashBalance: number;
}
