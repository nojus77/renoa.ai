import { z } from 'zod';

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
});

export const createInvoiceSchema = z.object({
  providerId: z.string().min(1, 'Provider ID is required'),
  customerId: z.string().min(1, 'Customer is required'),
  jobId: z.string().optional(),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  taxRate: z.number().min(0).max(100).optional(),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  paymentInstructions: z.string().optional(),
  status: z.enum(['draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'cancelled']).optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
