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
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [adminRole, setAdminRole] = useState<string>('');
  const [admins, setAdmins] = useState<any[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', name: '', password: '', role: 'admin' });

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
    timezone: 'America/New_York',
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
      if (data.admins) {
        setAdmins(data.admins);
      }
    } catch (error) {
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
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                </select>
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
                      <option value="viewer">Viewer</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
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

            <div className="space-y-2">
              {loadingAdmins ? (
                <div className="text-center py-4 text-muted-foreground text-xs">
                  Loading admins...
                </div>
              ) : admins.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-xs">
                  No admins found
                </div>
              ) : (
                admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-medium text-foreground">{admin.name}</h4>
                        <Badge className={`text-[10px] ${
                          admin.role === 'super_admin'
                            ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                            : admin.role === 'admin'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                        }`}>
                          {admin.role.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{admin.email}</p>
                      {admin.lastLoginAt && (
                        <p className="text-[10px] text-muted-foreground">
                          Last login: {new Date(admin.lastLoginAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteAdmin(admin.id)}
                      className="ml-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
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
