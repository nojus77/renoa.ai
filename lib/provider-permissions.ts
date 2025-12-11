/**
 * Provider Portal Permission System
 * Role-based access control for provider portal users
 */

export type ProviderUserRole = 'owner' | 'office' | 'field';

/**
 * Check if user can manage team members (invite, edit, deactivate)
 */
export function canManageTeam(role: ProviderUserRole): boolean {
  return role === 'owner';
}

/**
 * Check if user can manage customers (create, edit, delete)
 */
export function canManageCustomers(role: ProviderUserRole): boolean {
  return role === 'owner' || role === 'office';
}

/**
 * Check if user can manage jobs (create, edit, delete)
 */
export function canManageJobs(role: ProviderUserRole): boolean {
  return role === 'owner' || role === 'office';
}

/**
 * Check if user can view financial information (invoices, revenue, estimates)
 */
export function canViewFinancials(role: ProviderUserRole): boolean {
  return role === 'owner' || role === 'office';
}

/**
 * Check if user can view all jobs (field users only see assigned jobs)
 */
export function canViewAllJobs(role: ProviderUserRole): boolean {
  return role === 'owner' || role === 'office';
}

/**
 * Check if user can manage settings (business info, services, integrations)
 */
export function canManageSettings(role: ProviderUserRole): boolean {
  return role === 'owner';
}

/**
 * Check if user can update job status
 */
export function canUpdateJobStatus(role: ProviderUserRole): boolean {
  // All roles can update status, but field users only for assigned jobs
  return true;
}

/**
 * Check if user can view messages/notifications
 */
export function canViewMessages(role: ProviderUserRole): boolean {
  return role === 'owner' || role === 'office';
}

/**
 * Check if user can manage availability/schedule
 */
export function canManageAvailability(role: ProviderUserRole): boolean {
  return role === 'owner' || role === 'office';
}
