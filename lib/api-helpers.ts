import { toast } from 'sonner';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function handleApiRequest<T>(
  request: Promise<Response>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    showSuccess?: boolean;
  }
): Promise<T> {
  try {
    const response = await request;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error ||
        options?.errorMessage ||
        `Request failed with status ${response.status}`;

      throw new ApiError(errorMessage, response.status);
    }

    const data = await response.json();

    if (options?.showSuccess !== false && options?.successMessage) {
      toast.success(options.successMessage);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      toast.error(error.message);
      throw error;
    }

    // Network errors or other issues
    const message = options?.errorMessage || 'Network error. Please check your connection.';
    toast.error(message);
    throw new ApiError(message);
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';

  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(date);
}
