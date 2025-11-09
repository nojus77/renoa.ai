import { z } from 'zod';

// Phone number regex - matches (XXX) XXX-XXXX format or raw 10 digits
const phoneRegex = /^(\(\d{3}\)\s\d{3}-\d{4}|\d{10})$/;

// Name regex - letters only (including accented characters), spaces, hyphens, and apostrophes
const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;

// Email regex - standard email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Zip code regex - exactly 5 digits
const zipRegex = /^\d{5}$/;

// Service types whitelist
export const SERVICE_TYPES = [
  'landscaping',
  'lawn_care',
  'hardscaping',
  'remodeling',
  'roofing',
  'fencing',
  'hvac',
  'plumbing',
  'painting',
  'flooring',
] as const;

export type ServiceType = typeof SERVICE_TYPES[number];

// Lead form validation schema
export const leadFormSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .regex(nameRegex, 'First name can only contain letters, spaces, hyphens, and apostrophes'),

  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .regex(nameRegex, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),

  email: z
    .string()
    .min(1, 'Email is required')
    .regex(emailRegex, 'Please enter a valid email address'),

  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(phoneRegex, 'Phone number must be exactly 10 digits')
    .transform((val) => val.replace(/\D/g, '')) // Strip formatting for storage
    .refine((val) => val.length === 10, 'Phone number must be exactly 10 digits'),

  address: z
    .string()
    .min(5, 'Address must be at least 5 characters'),

  city: z
    .string()
    .min(2, 'City is required'),

  state: z
    .string()
    .min(2, 'State is required'),

  zip: z
    .string()
    .regex(zipRegex, 'Zip code must be exactly 5 digits'),

  serviceType: z
    .enum(SERVICE_TYPES, {
      errorMap: () => ({ message: 'Please select a service type' }),
    }),

  // Optional fields
  description: z.string().optional(),
  projectDetails: z.string().optional(),
});

// Exit popup schema (simplified version with fewer required fields)
export const exitPopupSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .regex(nameRegex, 'Name can only contain letters, spaces, hyphens, and apostrophes'),

  email: z
    .string()
    .min(1, 'Email is required')
    .regex(emailRegex, 'Please enter a valid email address'),

  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(phoneRegex, 'Phone number must be exactly 10 digits')
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => val.length === 10, 'Phone number must be exactly 10 digits'),

  serviceType: z
    .enum(SERVICE_TYPES, {
      errorMap: () => ({ message: 'Please select a service type' }),
    }),
});

// Type inference
export type LeadFormData = z.infer<typeof leadFormSchema>;
export type ExitPopupFormData = z.infer<typeof exitPopupSchema>;

// Validation helper functions
export function validateLeadForm(data: unknown) {
  return leadFormSchema.safeParse(data);
}

export function validateExitPopup(data: unknown) {
  return exitPopupSchema.safeParse(data);
}

// Field-level validation for real-time feedback
export function validateField(fieldName: keyof LeadFormData, value: string) {
  try {
    const fieldSchema = leadFormSchema.shape[fieldName];
    fieldSchema.parse(value);
    return { valid: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message || 'Invalid value' };
    }
    return { valid: false, error: 'Invalid value' };
  }
}

// Phone number formatting utility
export function formatPhoneNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
}

// Strip phone formatting for submission
export function cleanPhoneNumber(value: string): string {
  return value.replace(/\D/g, '');
}
