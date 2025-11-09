"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Settings,
  User,
  Bell,
  Shield,
  Mail,
  Database,
  Key,
  Palette,
  Save,
  Check,
  UserPlus,
  Trash2,
  Users,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { ROLE_DEFINITIONS, PERMISSION_GROUPS, getRoleDefinition, hasPermission, type AdminRole as AdminRoleType } from '@/lib/permissions';

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [adminRole, setAdminRole] = useState<string>('');
  const [admins, setAdmins] = useState<any[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', name: '', password: '', role: 'sales_rep' });
  const [timezonePreview, setTimezonePreview] = useState('');
  const [showPermissions, setShowPermissions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'role' | 'email' | 'lastLoginAt'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Change Password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [settings, setSettings] = useState({
    // Profile Settings
    companyName: 'Renoa.ai',
    email: 'admin@renoa.ai',
    phone: '+1 (555) 123-4567',

    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    leadAlerts: true,
    campaignReports: true,

    // Email Settings
    senderName: 'Renoa Team',
    senderEmail: 'noreply@renoa.ai',
    replyToEmail: 'support@renoa.ai',

    // Security Settings
    twoFactorEnabled: false,
    sessionTimeout: '30',

    // System Settings
    timezone: 'America/Chicago',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
  });

  useEffect(() => {
    // Get admin role from localStorage
    const role = localStorage.getItem('adminRole');
    setAdminRole(role || '');

    // Load admins if super_admin
    if (role === 'super_admin') {
      fetchAdmins();
    }
  }, []);

  // Real-time timezone preview clock that updates every second
  useEffect(() => {
    const updateTimezonePreview = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: settings.timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      const formattedTime = formatter.format(now);
      setTimezonePreview(formattedTime);
    };

    // Update immediately and then every second
    updateTimezonePreview();
    const interval = setInterval(updateTimezonePreview, 1000);

    return () => clearInterval(interval);
  }, [settings.timezone]);

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      console.log('Admins API response:', data);

      if (!response.ok) {
        toast.error(data.error || 'Failed to load admins');
        return;
      }

      if (data.admins) {
        setAdmins(data.admins);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load admins');
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdmin.email || !newAdmin.name) {
      toast.error('Please fill in email and name');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newAdmin.email,
          name: newAdmin.name,
          role: newAdmin.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to add admin');
        return;
      }

      // Show success message
      if (data.emailSent) {
        toast.success('Admin added successfully! Welcome email sent with temporary password.');
      } else {
        toast.success('Admin added successfully');
      }

      // Show warning if email failed to send
      if (data.emailError) {
        toast.warning(data.emailError, { duration: 5000 });
      }

      setShowAddAdmin(false);
      setNewAdmin({ email: '', name: '', password: '', role: 'admin' });
      fetchAdmins();
    } catch (error) {
      toast.error('Failed to add admin');
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete admin');
        return;
      }

      toast.success('Admin deleted successfully');
      fetchAdmins();
    } catch (error) {
      toast.error('Failed to delete admin');
    }
  };

  const handleChangePassword = async () => {
    // Validate passwords
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to change password');
        return;
      }

      toast.success('Password changed successfully');
      setShowChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

      // Clear the mustChangePassword flag in localStorage
      localStorage.setItem('adminMustChangePassword', 'false');
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Helper function to format relative time
  const formatRelativeTime = (date: string | null) => {
    if (!date) return 'Never';

    const now = new Date();
    const loginDate = new Date(date);
    const diffMs = now.getTime() - loginDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return loginDate.toLocaleDateString();
  };

  // Sort and filter admins
  const getSortedAndFilteredAdmins = () => {
    let filtered = admins.filter(admin =>
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle null values for lastLoginAt
      if (sortField === 'lastLoginAt') {
        if (!aVal) return 1;
        if (!bVal) return -1;
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Password Change Warning */}
      {typeof window !== 'undefined' && localStorage.getItem('adminMustChangePassword') === 'true' && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Key className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-400 mb-1">Password Change Required</h3>
              <p className="text-xs text-amber-300/80 mb-3">
                For security reasons, you must change your password before accessing other features of the admin dashboard.
                Please use the &quot;Change Password&quot; option below.
              </p>
              <Button
                size="sm"
                onClick={() => setShowChangePassword(true)}
                className="bg-amber-600 hover:bg-amber-500 text-white"
              >
                <Key className="h-3 w-3 mr-2" />
                Change Password Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your account and application preferences
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-500"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-3 w-3 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Profile Settings */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-400" />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Your organization name (appears on emails and reports)</p>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Primary admin contact email address</p>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Support contact number for urgent matters</p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-400" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs font-medium text-foreground">Email Notifications</p>
                <p className="text-[10px] text-muted-foreground">Receive updates via email</p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                className="h-4 w-4 rounded border-border cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs font-medium text-foreground">SMS Notifications</p>
                <p className="text-[10px] text-muted-foreground">Receive text message alerts</p>
              </div>
              <input
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                className="h-4 w-4 rounded border-border cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs font-medium text-foreground">Lead Alerts</p>
                <p className="text-[10px] text-muted-foreground">Alert for new high-priority leads</p>
              </div>
              <input
                type="checkbox"
                checked={settings.leadAlerts}
                onChange={(e) => setSettings({ ...settings, leadAlerts: e.target.checked })}
                className="h-4 w-4 rounded border-border cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs font-medium text-foreground">Campaign Reports</p>
                <p className="text-[10px] text-muted-foreground">Weekly campaign performance</p>
              </div>
              <input
                type="checkbox"
                checked={settings.campaignReports}
                onChange={(e) => setSettings({ ...settings, campaignReports: e.target.checked })}
                className="h-4 w-4 rounded border-border cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Configuration */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 text-sky-400" />
              Email Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Sender Name
              </label>
              <input
                type="text"
                value={settings.senderName}
                onChange={(e) => setSettings({ ...settings, senderName: e.target.value })}
                className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Display name for automated emails (e.g., &apos;Renoa Team&apos;)</p>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Sender Email
              </label>
              <input
                type="email"
                value={settings.senderEmail}
                onChange={(e) => setSettings({ ...settings, senderEmail: e.target.value })}
                className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Email address used to send notifications to customers</p>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Reply-To Email
              </label>
              <input
                type="email"
                value={settings.replyToEmail}
                onChange={(e) => setSettings({ ...settings, replyToEmail: e.target.value })}
                className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Where customer replies will be sent (e.g., &apos;support@renoa.ai&apos;)</p>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-rose-400" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs font-medium text-foreground">Two-Factor Authentication</p>
                <p className="text-[10px] text-muted-foreground">Add extra security to your account</p>
              </div>
              <input
                type="checkbox"
                checked={settings.twoFactorEnabled}
                onChange={(e) => setSettings({ ...settings, twoFactorEnabled: e.target.checked })}
                className="h-4 w-4 rounded border-border cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-border"
              onClick={() => setShowChangePassword(true)}
            >
              <Key className="h-3 w-3 mr-2" />
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-400" />
              System Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Timezone
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Current time: {timezonePreview}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Date Format
                </label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Currency
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Management - Only show to super_admin */}
      {adminRole === 'super_admin' && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-400" />
                Admin Management
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setShowAddAdmin(!showAddAdmin)}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                <UserPlus className="h-3 w-3 mr-2" />
                Add Admin
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showAddAdmin && (
              <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border space-y-3">
                <div className="mb-2 p-2 bg-sky-500/10 border border-sky-500/30 rounded-md">
                  <p className="text-xs text-sky-400">
                    A temporary password will be automatically generated and emailed to the new admin.
                    They will be required to change it on first login.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newAdmin.name}
                      onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newAdmin.email}
                      onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="admin@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Role
                    </label>
                    <select
                      value={newAdmin.role}
                      onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="sales_rep">Sales Representative</option>
                      <option value="customer_support">Customer Support</option>
                      <option value="developer">Developer</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                </div>

                {/* Role Permissions Info Panel */}
                <div className="mt-3 border border-border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowPermissions(!showPermissions)}
                    className="w-full px-3 py-2 bg-muted/20 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">
                        {getRoleDefinition(newAdmin.role as AdminRoleType)?.name} Permissions
                      </span>
                    </div>
                    {showPermissions ? (
                      <ChevronUp className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>

                  {showPermissions && (
                    <div className="p-3 bg-background space-y-3 max-h-64 overflow-y-auto">
                      <p className="text-[10px] text-muted-foreground mb-2">
                        {getRoleDefinition(newAdmin.role as AdminRoleType)?.description}
                      </p>
                      {Object.entries(PERMISSION_GROUPS).map(([groupName, permissions]) => {
                        const hasAnyInGroup = permissions.some(p =>
                          hasPermission(newAdmin.role as AdminRoleType, p.permission)
                        );

                        if (!hasAnyInGroup) return null;

                        return (
                          <div key={groupName}>
                            <h4 className="text-[10px] font-semibold text-foreground mb-1.5">{groupName}</h4>
                            <div className="space-y-1">
                              {permissions.map(({ permission, label }) => {
                                const hasAccess = hasPermission(newAdmin.role as AdminRoleType, permission);
                                return (
                                  <div key={permission} className="flex items-center gap-1.5">
                                    {hasAccess ? (
                                      <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                                    ) : (
                                      <XCircle className="h-3 w-3 text-muted-foreground/30 flex-shrink-0" />
                                    )}
                                    <span className={`text-[10px] ${
                                      hasAccess ? 'text-foreground' : 'text-muted-foreground/50'
                                    }`}>
                                      {label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddAdmin}
                    className="bg-emerald-600 hover:bg-emerald-500"
                  >
                    Create Admin
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddAdmin(false)}
                    className="border-border"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Search Bar */}
            {!showAddAdmin && admins.length > 0 && (
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Team Overview Table */}
            <div className="space-y-2">
              {loadingAdmins ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2" />
                  Loading team members...
                </div>
              ) : admins.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No team members found. Click &quot;Add Admin&quot; to invite your first team member.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4">
                          <button
                            onClick={() => handleSort('name')}
                            className="flex items-center gap-1 text-xs font-semibold text-foreground hover:text-emerald-400 transition-colors"
                          >
                            Name
                            {sortField === 'name' && (
                              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            )}
                            {sortField !== 'name' && <ArrowUpDown className="h-3 w-3 opacity-30" />}
                          </button>
                        </th>
                        <th className="text-left py-3 px-4">
                          <button
                            onClick={() => handleSort('role')}
                            className="flex items-center gap-1 text-xs font-semibold text-foreground hover:text-emerald-400 transition-colors"
                          >
                            Role
                            {sortField === 'role' && (
                              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            )}
                            {sortField !== 'role' && <ArrowUpDown className="h-3 w-3 opacity-30" />}
                          </button>
                        </th>
                        <th className="text-left py-3 px-4">
                          <button
                            onClick={() => handleSort('email')}
                            className="flex items-center gap-1 text-xs font-semibold text-foreground hover:text-emerald-400 transition-colors"
                          >
                            Email
                            {sortField === 'email' && (
                              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            )}
                            {sortField !== 'email' && <ArrowUpDown className="h-3 w-3 opacity-30" />}
                          </button>
                        </th>
                        <th className="text-left py-3 px-4">
                          <button
                            onClick={() => handleSort('lastLoginAt')}
                            className="flex items-center gap-1 text-xs font-semibold text-foreground hover:text-emerald-400 transition-colors"
                          >
                            Last Login
                            {sortField === 'lastLoginAt' && (
                              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            )}
                            {sortField !== 'lastLoginAt' && <ArrowUpDown className="h-3 w-3 opacity-30" />}
                          </button>
                        </th>
                        <th className="text-center py-3 px-4">
                          <div className="flex items-center justify-center gap-1 text-xs font-semibold text-foreground">
                            <Clock className="h-3 w-3" />
                            Active Time
                          </div>
                        </th>
                        <th className="text-center py-3 px-4">
                          <div className="text-xs font-semibold text-foreground">
                            Status
                          </div>
                        </th>
                        <th className="text-center py-3 px-4">
                          <div className="text-xs font-semibold text-foreground">
                            Actions
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedAndFilteredAdmins().map((admin) => {
                        const roleDefinition = getRoleDefinition(admin.role as AdminRoleType);
                        const isActive = admin.lastLoginAt &&
                          (new Date().getTime() - new Date(admin.lastLoginAt).getTime()) < 86400000; // Active if logged in within 24h

                        return (
                          <tr key={admin.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="text-xs font-medium text-foreground">{admin.name}</div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={`text-[10px] ${roleDefinition?.badgeClass || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                                {roleDefinition?.name || admin.role.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-xs text-muted-foreground">{admin.email}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-xs text-muted-foreground">{formatRelativeTime(admin.lastLoginAt)}</div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="text-xs text-muted-foreground/50">—</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-1.5">
                                <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-gray-400/50'}`} />
                                <span className="text-xs text-muted-foreground">{isActive ? 'Active' : 'Inactive'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteAdmin(admin.id)}
                                  className="h-7 px-2"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* No results message */}
                  {getSortedAndFilteredAdmins().length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No team members found matching &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="bg-card border-rose-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-rose-400 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-xs font-medium text-foreground">Export All Data</p>
              <p className="text-[10px] text-muted-foreground">Download a copy of all your data</p>
            </div>
            <Button variant="outline" size="sm" className="border-border">
              Export
            </Button>
          </div>
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-xs font-medium text-foreground">Delete Account</p>
              <p className="text-[10px] text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Key className="h-5 w-5 text-emerald-400" />
              Change Password
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter your current password and choose a new password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter new password (min 8 characters)"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowChangePassword(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
              }}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              {changingPassword ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Changing...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
