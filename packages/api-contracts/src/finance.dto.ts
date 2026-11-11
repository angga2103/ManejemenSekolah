import { PaymentMethod } from '@edusaas/shared-types';

export interface CreateInvoiceRequestDto {
  studentId: string;
  billingCategoryId: string;
  title: string;
  amount: number;
  dueDate: string; // ISO date string
  description?: string;
}

export interface ProcessPaymentRequestDto {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  idempotencyKey: string;
}
