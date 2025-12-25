import { z } from 'zod';

export const createJobSchema = z.object({
  providerId: z.string().min(1, 'Provider ID is required'),
  customerId: z.string().min(1, 'Customer is required'),
  serviceType: z.string().min(1, 'Service type is required'),
  address: z.string().min(1, 'Address is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  durationMinutes: z.number().positive('Duration must be positive'),
  estimatedValue: z.number().nonnegative('Estimated value cannot be negative').optional(),
  assignedUserIds: z.array(z.string()).optional(),
  status: z.enum(['scheduled', 'confirmed', 'dispatched', 'on-the-way', 'in-progress', 'completed', 'cancelled']).optional(),
  jobInstructions: z.string().optional(),
  customerNotes: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.string().optional(),
  recurringEndDate: z.string().optional(),
});

export const completeJobSchema = z.object({
  actualValue: z.number().nonnegative('Actual value cannot be negative').optional(),
  actualDurationMinutes: z.number().positive('Duration must be positive').optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type CompleteJobInput = z.infer<typeof completeJobSchema>;
