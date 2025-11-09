/**
 * Role-Based Access Control (RBAC) Configuration
 * Defines permissions for each admin role in the system
 */

export type AdminRole = 'super_admin' | 'sales_rep' | 'customer_support' | 'developer';

export type Permission =
  // Dashboard & Analytics
  | 'view_dashboard'
  | 'view_analytics'
  | 'view_financial_data'

  // Leads Management
  | 'view_leads'
  | 'create_leads'
  | 'edit_leads'
  | 'delete_leads'
  | 'assign_leads'
  | 'export_leads'

  // Campaigns
  | 'view_campaigns'
  | 'create_campaigns'
  | 'edit_campaigns'
  | 'delete_campaigns'
  | 'launch_campaigns'

  // Providers
  | 'view_providers'
  | 'create_providers'
  | 'edit_providers'
  | 'delete_providers'
  | 'manage_provider_assignments'

  // Messages & Communications
  | 'view_messages'
  | 'send_messages'
  | 'manage_templates'

  // Admin Management
  | 'view_admins'
  | 'create_admins'
  | 'edit_admins'
  | 'delete_admins'

  // System Settings
  | 'view_settings'
  | 'edit_settings'
  | 'manage_integrations'
  | 'view_logs'
  | 'access_database_tools';

export interface RoleDefinition {
  name: string;
  description: string;
  color: string;
  badgeClass: string;
  permissions: Permission[];
}

export const ROLE_DEFINITIONS: Record<AdminRole, RoleDefinition> = {
  super_admin: {
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    color: 'purple',
    badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    permissions: [
      // Full access to everything
      'view_dashboard',
      'view_analytics',
      'view_financial_data',
      'view_leads',
      'create_leads',
      'edit_leads',
      'delete_leads',
      'assign_leads',
      'export_leads',
      'view_campaigns',
      'create_campaigns',
      'edit_campaigns',
      'delete_campaigns',
      'launch_campaigns',
      'view_providers',
      'create_providers',
      'edit_providers',
      'delete_providers',
      'manage_provider_assignments',
      'view_messages',
      'send_messages',
      'manage_templates',
      'view_admins',
      'create_admins',
      'edit_admins',
      'delete_admins',
      'view_settings',
      'edit_settings',
      'manage_integrations',
      'view_logs',
      'access_database_tools',
    ],
  },

  sales_rep: {
    name: 'Sales Representative',
    description: 'Manage leads, campaigns, and providers',
    color: 'blue',
    badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    permissions: [
      'view_dashboard',
      'view_analytics',
      'view_leads',
      'create_leads',
      'edit_leads',
      'assign_leads',
      'export_leads',
      'view_campaigns',
      'create_campaigns',
      'edit_campaigns',
      'launch_campaigns',
      'view_providers',
      'edit_providers',
      'manage_provider_assignments',
      'view_messages',
      'send_messages',
      'manage_templates',
    ],
  },

  customer_support: {
    name: 'Customer Support',
    description: 'Handle customer inquiries and lead communications',
    color: 'green',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    permissions: [
      'view_dashboard',
      'view_leads',
      'edit_leads',
      'view_providers',
      'view_messages',
      'send_messages',
    ],
  },

  developer: {
    name: 'Developer',
    description: 'Technical access to system settings and integrations',
    color: 'orange',
    badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    permissions: [
      'view_dashboard',
      'view_analytics',
      'view_settings',
      'edit_settings',
      'manage_integrations',
      'view_logs',
      'access_database_tools',
    ],
  },
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: AdminRole, permission: Permission): boolean {
  const roleDefinition = ROLE_DEFINITIONS[role];
  return roleDefinition?.permissions.includes(permission) ?? false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: AdminRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: AdminRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: AdminRole): Permission[] {
  return ROLE_DEFINITIONS[role]?.permissions ?? [];
}

/**
 * Get role definition
 */
export function getRoleDefinition(role: AdminRole): RoleDefinition | undefined {
  return ROLE_DEFINITIONS[role];
}

/**
 * Permission groups for displaying in UI
 */
export const PERMISSION_GROUPS = {
  'Dashboard & Analytics': [
    { permission: 'view_dashboard' as Permission, label: 'View Dashboard' },
    { permission: 'view_analytics' as Permission, label: 'View Analytics' },
    { permission: 'view_financial_data' as Permission, label: 'View Financial Data' },
  ],
  'Leads Management': [
    { permission: 'view_leads' as Permission, label: 'View Leads' },
    { permission: 'create_leads' as Permission, label: 'Create Leads' },
    { permission: 'edit_leads' as Permission, label: 'Edit Leads' },
    { permission: 'delete_leads' as Permission, label: 'Delete Leads' },
    { permission: 'assign_leads' as Permission, label: 'Assign Leads' },
    { permission: 'export_leads' as Permission, label: 'Export Leads' },
  ],
  'Campaigns': [
    { permission: 'view_campaigns' as Permission, label: 'View Campaigns' },
    { permission: 'create_campaigns' as Permission, label: 'Create Campaigns' },
    { permission: 'edit_campaigns' as Permission, label: 'Edit Campaigns' },
    { permission: 'delete_campaigns' as Permission, label: 'Delete Campaigns' },
    { permission: 'launch_campaigns' as Permission, label: 'Launch Campaigns' },
  ],
  'Providers': [
    { permission: 'view_providers' as Permission, label: 'View Providers' },
    { permission: 'create_providers' as Permission, label: 'Create Providers' },
    { permission: 'edit_providers' as Permission, label: 'Edit Providers' },
    { permission: 'delete_providers' as Permission, label: 'Delete Providers' },
    { permission: 'manage_provider_assignments' as Permission, label: 'Manage Assignments' },
  ],
  'Communications': [
    { permission: 'view_messages' as Permission, label: 'View Messages' },
    { permission: 'send_messages' as Permission, label: 'Send Messages' },
    { permission: 'manage_templates' as Permission, label: 'Manage Templates' },
  ],
  'Admin Management': [
    { permission: 'view_admins' as Permission, label: 'View Admins' },
    { permission: 'create_admins' as Permission, label: 'Create Admins' },
    { permission: 'edit_admins' as Permission, label: 'Edit Admins' },
    { permission: 'delete_admins' as Permission, label: 'Delete Admins' },
  ],
  'System': [
    { permission: 'view_settings' as Permission, label: 'View Settings' },
    { permission: 'edit_settings' as Permission, label: 'Edit Settings' },
    { permission: 'manage_integrations' as Permission, label: 'Manage Integrations' },
    { permission: 'view_logs' as Permission, label: 'View Logs' },
    { permission: 'access_database_tools' as Permission, label: 'Database Tools' },
  ],
};
