'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Loader2,
  X,
  Phone,
  Mail,
  Edit2,
  Clock,
  DollarSign,
  Award,
  Check,
  Plus,
  Trash2,
  Search,
  User,
  Wrench,
  TrendingUp,
  BarChart3,
  Car,
  Coffee,
  Briefcase,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

interface WorkerProfileModalProps {
  workerId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  onDelete?: (workerId: string) => void;
  initialTab?: 'profile' | 'skills' | 'performance' | 'time';
}

interface ProfileData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    role: string;
    status: string;
    profilePhotoUrl: string | null;
    payType: string | null;
    hourlyRate: number | null;
    commissionRate: number | null;
    color: string | null;
    createdAt: string;
    canCreateJobs: boolean;
    jobsNeedApproval: boolean;
  };
  skills: Array<{
    id: string;
    name: string;
    level: string;
    category: string | null;
  }>;
  stats: {
    weekHours: number;
    weekJobs: number;
    weekEarnings: number;
    monthHours: number;
    monthJobs: number;
    monthEarnings: number;
    totalUnpaidEarnings: number;
    avgRating: number | null;
    totalReviews: number;
  };
}

interface PerformanceData {
  stats: {
    jobsCompleted: number;
    totalRevenue: number;
    hoursWorked: number;
    avgJobDuration: number;
    revenuePerHour: number;
  };
  utilization: number;
  timeBreakdown: {
    jobTime: number;
    driveTime: number;
    idleTime: number;
  };
  recentJobs: Array<{
    id: string;
    date: string;
    customer: string;
    service: string;
    status: string;
    duration: number;
    revenue: number;
  }>;
}

interface TimeLog {
  id: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  hoursWorked: number;
  status: 'active' | 'completed';
}

interface AvailableSkill {
  id: string;
  name: string;
  category: string | null;
}

type TabType = 'profile' | 'skills' | 'performance' | 'time';

export default function WorkerProfileModal({
  workerId,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  initialTab = 'profile',
}: WorkerProfileModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Performance state
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [performancePeriod, setPerformancePeriod] = useState<'week' | 'month' | 'quarter'>('week');
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  // Time logs state
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [loadingTimeLogs, setLoadingTimeLogs] = useState(false);

  // Edit states
  const [editingContact, setEditingContact] = useState(false);
  const [editingPay, setEditingPay] = useState(false);
  const [editingSkills, setEditingSkills] = useState(false);
  const [editingPermissions, setEditingPermissions] = useState(false);
  const [editingRole, setEditingRole] = useState(false);

  // Form values
  const [contactForm, setContactForm] = useState({ phone: '' });
  const [payForm, setPayForm] = useState({ payType: 'hourly', hourlyRate: '', commissionRate: '' });
  const [permissionsForm, setPermissionsForm] = useState({ canCreateJobs: false, jobsNeedApproval: false });
  const [roleForm, setRoleForm] = useState({ role: 'field', status: 'active' });

  // Skills management
  const [availableSkills, setAvailableSkills] = useState<AvailableSkill[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [loadingSkills, setLoadingSkills] = useState(false);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Saving states
  const [savingContact, setSavingContact] = useState(false);
  const [savingPay, setSavingPay] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [savingSkill, setSavingSkill] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!workerId) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/provider/team/${workerId}/profile`);
      const data = await res.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setProfile(data);

      // Initialize form values
      setContactForm({ phone: data.user.phone || '' });
      setPayForm({
        payType: data.user.payType || 'hourly',
        hourlyRate: data.user.hourlyRate?.toString() || '',
        commissionRate: data.user.commissionRate?.toString() || '',
      });
      setPermissionsForm({
        canCreateJobs: data.user.canCreateJobs || false,
        jobsNeedApproval: data.user.jobsNeedApproval || false,
      });
      setRoleForm({
        role: data.user.role || 'field',
        status: data.user.status || 'active',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  const fetchPerformance = useCallback(async () => {
    if (!workerId) return;

    try {
      setLoadingPerformance(true);
      const res = await fetch(`/api/provider/team/${workerId}/performance?period=${performancePeriod}`);
      const data = await res.json();

      if (data.error) {
        console.error('Performance error:', data.error);
        return;
      }

      setPerformanceData(data);
    } catch (error) {
      console.error('Error fetching performance:', error);
    } finally {
      setLoadingPerformance(false);
    }
  }, [workerId, performancePeriod]);

  const fetchTimeLogs = useCallback(async () => {
    if (!workerId) return;

    try {
      setLoadingTimeLogs(true);
      const res = await fetch(`/api/provider/team/${workerId}/time-logs`);
      const data = await res.json();

      if (data.error) {
        console.error('Time logs error:', data.error);
        return;
      }

      setTimeLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching time logs:', error);
    } finally {
      setLoadingTimeLogs(false);
    }
  }, [workerId]);

  const fetchAvailableSkills = useCallback(async () => {
    if (!profile) return;
    setLoadingSkills(true);
    try {
      const providerId = localStorage.getItem('providerId');
      const res = await fetch(`/api/provider/skills?providerId=${providerId}`);
      const data = await res.json();
      if (data.skills) {
        setAvailableSkills(data.skills);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setLoadingSkills(false);
    }
  }, [profile]);

  useEffect(() => {
    if (isOpen && workerId) {
      setActiveTab(initialTab);
      setEditingContact(false);
      setEditingPay(false);
      setEditingSkills(false);
      setEditingPermissions(false);
      setEditingRole(false);
      fetchProfile();
    }
  }, [isOpen, workerId, initialTab, fetchProfile]);

  // Fetch performance data when tab changes to performance
  useEffect(() => {
    if (isOpen && workerId && activeTab === 'performance') {
      fetchPerformance();
    }
  }, [isOpen, workerId, activeTab, performancePeriod, fetchPerformance]);

  // Fetch time logs when tab changes to time
  useEffect(() => {
    if (isOpen && workerId && activeTab === 'time') {
      fetchTimeLogs();
    }
  }, [isOpen, workerId, activeTab, fetchTimeLogs]);

  useEffect(() => {
    if (editingSkills && profile) {
      fetchAvailableSkills();
    }
  }, [editingSkills, profile, fetchAvailableSkills]);

  const handleJobClick = (jobId: string) => {
    onClose();
    router.push(`/provider/jobs/${jobId}`);
  };

  const handleCall = () => {
    if (profile?.user.phone) {
      window.location.href = `tel:${profile.user.phone}`;
    }
  };

  const handleEmail = () => {
    if (profile?.user.email) {
      window.location.href = `mailto:${profile.user.email}`;
    }
  };

  // Save handlers
  const saveContact = async () => {
    if (!workerId) return;
    setSavingContact(true);
    try {
      const res = await fetch(`/api/provider/team/${workerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: contactForm.phone || null }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success('Contact info updated');
      setEditingContact(false);
      fetchProfile();
      onUpdate?.();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error('Failed to save');
    } finally {
      setSavingContact(false);
    }
  };

  const savePay = async () => {
    if (!workerId) return;

    // Validate commission rate before saving
    if (payForm.payType === 'commission' && payForm.commissionRate) {
      const rate = parseFloat(payForm.commissionRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        toast.error('Commission rate must be between 0 and 100%');
        return;
      }
    }

    setSavingPay(true);
    try {
      const res = await fetch(`/api/provider/team/${workerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payType: payForm.payType,
          hourlyRate: payForm.payType === 'hourly' ? parseFloat(payForm.hourlyRate) || null : null,
          commissionRate: payForm.payType === 'commission' ? parseFloat(payForm.commissionRate) || null : null,
        }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success('Pay rate updated');
      setEditingPay(false);
      fetchProfile();
      onUpdate?.();
    } catch (error) {
      console.error('Error saving pay:', error);
      toast.error('Failed to save');
    } finally {
      setSavingPay(false);
    }
  };

  const savePermissions = async () => {
    if (!workerId) return;
    setSavingPermissions(true);
    try {
      const res = await fetch(`/api/provider/team/${workerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canCreateJobs: permissionsForm.canCreateJobs,
          jobsNeedApproval: permissionsForm.jobsNeedApproval,
        }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success('Permissions updated');
      setEditingPermissions(false);
      fetchProfile();
      onUpdate?.();
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('Failed to save');
    } finally {
      setSavingPermissions(false);
    }
  };

  const saveRole = async () => {
    if (!workerId) return;
    setSavingRole(true);
    try {
      const res = await fetch(`/api/provider/team/${workerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: roleForm.role,
          status: roleForm.status,
        }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success('Role & status updated');
      setEditingRole(false);
      fetchProfile();
      onUpdate?.();
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error('Failed to save');
    } finally {
      setSavingRole(false);
    }
  };

  const addSkill = async (skillId: string) => {
    if (!workerId) return;
    setSavingSkill(true);
    try {
      const res = await fetch(`/api/provider/team/${workerId}/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId, level: 'basic' }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success('Skill added');
      fetchProfile();
      onUpdate?.();
    } catch (error) {
      console.error('Error adding skill:', error);
      toast.error('Failed to add skill');
    } finally {
      setSavingSkill(false);
    }
  };

  const removeSkill = async (skillId: string) => {
    if (!workerId) return;
    setSavingSkill(true);
    try {
      const res = await fetch(`/api/provider/team/${workerId}/skills?skillId=${skillId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success('Skill removed');
      fetchProfile();
      onUpdate?.();
    } catch (error) {
      console.error('Error removing skill:', error);
      toast.error('Failed to remove skill');
    } finally {
      setSavingSkill(false);
    }
  };

  const handleDelete = async () => {
    if (!workerId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/provider/team/${workerId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success('Team member removed');
      onClose();
      onDelete?.(workerId);
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to remove team member');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Owner</Badge>;
      case 'office':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Office</Badge>;
      case 'field':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Field Worker</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30">Inactive</Badge>;
      case 'on_leave':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">On Leave</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="text-emerald-400 text-xs">Completed</span>;
      case 'in_progress':
        return <span className="text-blue-400 text-xs">In Progress</span>;
      case 'scheduled':
        return <span className="text-zinc-400 text-xs">Scheduled</span>;
      case 'cancelled':
        return <span className="text-red-400 text-xs">Cancelled</span>;
      default:
        return <span className="text-zinc-500 text-xs">{status}</span>;
    }
  };

  // Filter available skills (exclude already assigned)
  const assignedSkillIds = new Set(profile?.skills.map(s => s.id) || []);
  const filteredAvailableSkills = availableSkills.filter(
    s => !assignedSkillIds.has(s.id) && s.name.toLowerCase().includes(skillSearch.toLowerCase())
  );

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'skills', label: 'Skills & Pay', icon: <Wrench className="w-4 h-4" /> },
    { id: 'performance', label: 'Performance', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'time', label: 'Time Logs', icon: <Clock className="w-4 h-4" /> },
  ];

  const SectionHeader = ({
    title,
    isEditing,
    onEdit,
    onSave,
    onCancel,
    saving,
  }: {
    title: string;
    isEditing: boolean;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    saving?: boolean;
  }) => (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
      {isEditing ? (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving} className="h-7 px-2">
            <X className="w-3 h-3" />
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving} className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="ghost" onClick={onEdit} className="h-7 px-2 text-zinc-500 hover:text-zinc-300">
          <Edit2 className="w-3 h-3" />
        </Button>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : profile ? (
            <>
              {/* Header */}
              <div className="p-6 border-b border-zinc-800 shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-2" style={{ borderColor: profile.user.color || '#10b981' }}>
                      <AvatarImage src={profile.user.profilePhotoUrl || undefined} />
                      <AvatarFallback className="bg-zinc-800 text-lg">
                        {profile.user.firstName[0]}{profile.user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        {profile.user.firstName} {profile.user.lastName}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        {getRoleBadge(profile.user.role)}
                        {getStatusBadge(profile.user.status)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {profile.user.phone && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCall}
                        className="border-zinc-700"
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEmail}
                      className="border-zinc-700"
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onClose}
                      className="text-zinc-400"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-zinc-800 px-6 shrink-0 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-emerald-400 border-emerald-400'
                        : 'text-zinc-400 border-transparent hover:text-zinc-300'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    {/* Contact Info */}
                    <div className="bg-zinc-800/30 rounded-lg p-4">
                      <SectionHeader
                        title="Contact Information"
                        isEditing={editingContact}
                        onEdit={() => {
                          setContactForm({ phone: profile.user.phone || '' });
                          setEditingContact(true);
                        }}
                        onSave={saveContact}
                        onCancel={() => setEditingContact(false)}
                        saving={savingContact}
                      />
                      {editingContact ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-zinc-500" />
                            <span className="text-sm text-zinc-500">{profile.user.email}</span>
                            <span className="text-xs text-zinc-600">(cannot change)</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-zinc-500" />
                            <Input
                              value={contactForm.phone}
                              onChange={(e) => setContactForm({ phone: e.target.value })}
                              placeholder="Phone number"
                              className="flex-1 bg-zinc-800 border-zinc-700 h-8"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-zinc-500" />
                            <span className="text-sm text-zinc-300">{profile.user.email}</span>
                          </div>
                          {profile.user.phone && (
                            <div className="flex items-center gap-3">
                              <Phone className="w-4 h-4 text-zinc-500" />
                              <span className="text-sm text-zinc-300">{profile.user.phone}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Role & Status */}
                    <div className="bg-zinc-800/30 rounded-lg p-4">
                      <SectionHeader
                        title="Role & Status"
                        isEditing={editingRole}
                        onEdit={() => {
                          setRoleForm({
                            role: profile.user.role || 'field',
                            status: profile.user.status || 'active',
                          });
                          setEditingRole(true);
                        }}
                        onSave={saveRole}
                        onCancel={() => setEditingRole(false)}
                        saving={savingRole}
                      />
                      {editingRole ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Role</label>
                            <Select value={roleForm.role} onValueChange={(v) => setRoleForm({ ...roleForm, role: v })}>
                              <SelectTrigger className="bg-zinc-800 border-zinc-700 h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="field">Field Worker</SelectItem>
                                <SelectItem value="office">Office</SelectItem>
                                <SelectItem value="owner">Owner</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Status</label>
                            <Select value={roleForm.status} onValueChange={(v) => setRoleForm({ ...roleForm, status: v })}>
                              <SelectTrigger className="bg-zinc-800 border-zinc-700 h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="on_leave">On Leave</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {getRoleBadge(profile.user.role)}
                          {getStatusBadge(profile.user.status)}
                        </div>
                      )}
                    </div>

                    {/* Permissions */}
                    {profile.user.role === 'field' && (
                      <div className="bg-zinc-800/30 rounded-lg p-4">
                        <SectionHeader
                          title="Permissions"
                          isEditing={editingPermissions}
                          onEdit={() => {
                            setPermissionsForm({
                              canCreateJobs: profile.user.canCreateJobs || false,
                              jobsNeedApproval: profile.user.jobsNeedApproval || false,
                            });
                            setEditingPermissions(true);
                          }}
                          onSave={savePermissions}
                          onCancel={() => setEditingPermissions(false)}
                          saving={savingPermissions}
                        />
                        {editingPermissions ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-zinc-300">Can create jobs</span>
                              <Switch
                                checked={permissionsForm.canCreateJobs}
                                onCheckedChange={(checked) => setPermissionsForm({ ...permissionsForm, canCreateJobs: checked })}
                              />
                            </div>
                            {permissionsForm.canCreateJobs && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-300">Jobs need approval</span>
                                <Switch
                                  checked={permissionsForm.jobsNeedApproval}
                                  onCheckedChange={(checked) => setPermissionsForm({ ...permissionsForm, jobsNeedApproval: checked })}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-zinc-300">Can create jobs</span>
                              <Badge variant={profile.user.canCreateJobs ? 'default' : 'outline'} className={profile.user.canCreateJobs ? 'bg-emerald-500/20 text-emerald-400' : ''}>
                                {profile.user.canCreateJobs ? 'Yes' : 'No'}
                              </Badge>
                            </div>
                            {profile.user.canCreateJobs && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-300">Jobs need approval</span>
                                <Badge variant={profile.user.jobsNeedApproval ? 'default' : 'outline'} className={profile.user.jobsNeedApproval ? 'bg-yellow-500/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-400'}>
                                  {profile.user.jobsNeedApproval ? 'Yes' : 'No'}
                                </Badge>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Member Since */}
                    <div className="text-sm text-zinc-500">
                      Member since {format(parseISO(profile.user.createdAt), 'MMMM d, yyyy')}
                    </div>
                  </div>
                )}

                {/* Skills & Pay Tab */}
                {activeTab === 'skills' && (
                  <div className="space-y-6">
                    {/* Skills */}
                    <div className="bg-zinc-800/30 rounded-lg p-4">
                      <SectionHeader
                        title="Skills"
                        isEditing={editingSkills}
                        onEdit={() => {
                          setSkillSearch('');
                          setEditingSkills(true);
                        }}
                        onSave={() => setEditingSkills(false)}
                        onCancel={() => setEditingSkills(false)}
                        saving={savingSkill}
                      />
                      {editingSkills ? (
                        <div className="space-y-3">
                          {/* Current skills with remove */}
                          <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill) => (
                              <Badge
                                key={skill.id}
                                variant="outline"
                                className="bg-zinc-800/50 border-zinc-700 pr-1"
                              >
                                <Wrench className="w-3 h-3 mr-1" />
                                {skill.name}
                                <button
                                  onClick={() => removeSkill(skill.id)}
                                  className="ml-2 p-0.5 hover:bg-red-500/20 rounded"
                                  disabled={savingSkill}
                                >
                                  <X className="w-3 h-3 text-red-400" />
                                </button>
                              </Badge>
                            ))}
                            {profile.skills.length === 0 && (
                              <span className="text-sm text-zinc-500">No skills assigned</span>
                            )}
                          </div>

                          {/* Add skill picker */}
                          <div className="border-t border-zinc-700 pt-3">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                              <Input
                                value={skillSearch}
                                onChange={(e) => setSkillSearch(e.target.value)}
                                placeholder="Search skills to add..."
                                className="bg-zinc-800 border-zinc-700 h-8 pl-9"
                              />
                            </div>
                            {loadingSkills ? (
                              <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading skills...
                              </div>
                            ) : filteredAvailableSkills.length > 0 ? (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {filteredAvailableSkills.slice(0, 10).map((skill) => (
                                  <button
                                    key={skill.id}
                                    onClick={() => addSkill(skill.id)}
                                    disabled={savingSkill}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-zinc-800 hover:bg-emerald-500/20 border border-zinc-700 hover:border-emerald-500/30 rounded-md transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                    {skill.name}
                                  </button>
                                ))}
                              </div>
                            ) : skillSearch && (
                              <p className="text-xs text-zinc-500 mt-2">No matching skills found</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.length > 0 ? (
                            profile.skills.map((skill) => (
                              <Badge
                                key={skill.id}
                                variant="outline"
                                className="bg-zinc-800/50 border-zinc-700"
                              >
                                <Wrench className="w-3 h-3 mr-1" />
                                {skill.name}
                                {skill.level !== 'basic' && (
                                  <span className="ml-1 text-xs text-zinc-500">({skill.level})</span>
                                )}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-zinc-500">No skills assigned</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Pay Rate */}
                    <div className="bg-zinc-800/30 rounded-lg p-4">
                      <SectionHeader
                        title="Pay Rate"
                        isEditing={editingPay}
                        onEdit={() => {
                          setPayForm({
                            payType: profile.user.payType || 'hourly',
                            hourlyRate: profile.user.hourlyRate?.toString() || '',
                            commissionRate: profile.user.commissionRate?.toString() || '',
                          });
                          setEditingPay(true);
                        }}
                        onSave={savePay}
                        onCancel={() => setEditingPay(false)}
                        saving={savingPay}
                      />
                      {editingPay ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Pay Type</label>
                            <Select value={payForm.payType} onValueChange={(v) => setPayForm({ ...payForm, payType: v })}>
                              <SelectTrigger className="bg-zinc-800 border-zinc-700 h-9 w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hourly">Hourly</SelectItem>
                                <SelectItem value="commission">Commission</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {payForm.payType === 'hourly' ? (
                            <div>
                              <label className="text-xs text-zinc-500 mb-1 block">Hourly Rate ($)</label>
                              <Input
                                type="number"
                                value={payForm.hourlyRate}
                                onChange={(e) => setPayForm({ ...payForm, hourlyRate: e.target.value })}
                                placeholder="0.00"
                                className="bg-zinc-800 border-zinc-700 h-9 w-32"
                              />
                            </div>
                          ) : (
                            <div>
                              <label className="text-xs text-zinc-500 mb-1 block">Commission Rate (%)</label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={payForm.commissionRate}
                                onChange={(e) => setPayForm({ ...payForm, commissionRate: e.target.value })}
                                placeholder="0"
                                className="bg-zinc-800 border-zinc-700 h-9 w-32"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-500" />
                          <span className="text-lg font-semibold text-white">
                            {profile.user.payType === 'commission'
                              ? `${profile.user.commissionRate || 0}% commission`
                              : `$${profile.user.hourlyRate || 0}/hr`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-zinc-800/30 rounded-lg p-3 text-center">
                        <div className="text-lg font-semibold text-white">{profile.stats.weekHours}h</div>
                        <div className="text-xs text-zinc-500">This week</div>
                      </div>
                      <div className="bg-zinc-800/30 rounded-lg p-3 text-center">
                        <div className="text-lg font-semibold text-white">{profile.stats.weekJobs}</div>
                        <div className="text-xs text-zinc-500">Jobs this week</div>
                      </div>
                      <div className="bg-emerald-500/10 rounded-lg p-3 text-center border border-emerald-500/20">
                        <div className="text-lg font-semibold text-emerald-400">
                          ${profile.stats.totalUnpaidEarnings.toFixed(0)}
                        </div>
                        <div className="text-xs text-zinc-500">Unpaid</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Performance Tab */}
                {activeTab === 'performance' && (
                  <div className="space-y-6">
                    {/* Period Selector */}
                    <div className="flex gap-2">
                      {(['week', 'month', 'quarter'] as const).map((period) => (
                        <button
                          key={period}
                          onClick={() => setPerformancePeriod(period)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            performancePeriod === period
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                          }`}
                        >
                          {period.charAt(0).toUpperCase() + period.slice(1)}
                        </button>
                      ))}
                    </div>

                    {loadingPerformance ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                      </div>
                    ) : performanceData ? (
                      <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-zinc-800/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                              <Briefcase className="w-4 h-4" />
                              Jobs
                            </div>
                            <div className="text-2xl font-bold text-white">{performanceData.stats.jobsCompleted}</div>
                          </div>
                          <div className="bg-zinc-800/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                              <DollarSign className="w-4 h-4" />
                              Revenue
                            </div>
                            <div className="text-2xl font-bold text-emerald-400">${performanceData.stats.totalRevenue.toFixed(0)}</div>
                          </div>
                          <div className="bg-zinc-800/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                              <Clock className="w-4 h-4" />
                              Hours
                            </div>
                            <div className="text-2xl font-bold text-white">{performanceData.stats.hoursWorked.toFixed(1)}h</div>
                          </div>
                          <div className="bg-zinc-800/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                              <TrendingUp className="w-4 h-4" />
                              $/Hour
                            </div>
                            <div className="text-2xl font-bold text-white">${performanceData.stats.revenuePerHour.toFixed(0)}</div>
                          </div>
                        </div>

                        {/* Utilization Bar */}
                        <div className="bg-zinc-800/30 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-zinc-300">Utilization Rate</span>
                            <span className="text-sm font-bold text-emerald-400">{performanceData.utilization}%</span>
                          </div>
                          <div className="h-3 bg-zinc-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${performanceData.utilization}%` }}
                            />
                          </div>
                          <div className="text-xs text-zinc-500 mt-1">
                            Time spent on billable work vs. available hours
                          </div>
                        </div>

                        {/* Time Breakdown */}
                        <div className="bg-zinc-800/30 rounded-lg p-4">
                          <h3 className="text-sm font-medium text-zinc-400 mb-3">Time Breakdown</h3>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-emerald-500 rounded" />
                                <Briefcase className="w-4 h-4 text-zinc-400" />
                                <span className="text-sm text-zinc-300">Job Time</span>
                              </div>
                              <span className="text-sm font-medium text-white">{performanceData.timeBreakdown.jobTime.toFixed(1)}h</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded" />
                                <Car className="w-4 h-4 text-zinc-400" />
                                <span className="text-sm text-zinc-300">Drive Time</span>
                              </div>
                              <span className="text-sm font-medium text-white">{performanceData.timeBreakdown.driveTime.toFixed(1)}h</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-zinc-500 rounded" />
                                <Coffee className="w-4 h-4 text-zinc-400" />
                                <span className="text-sm text-zinc-300">Idle Time</span>
                              </div>
                              <span className="text-sm font-medium text-white">{performanceData.timeBreakdown.idleTime.toFixed(1)}h</span>
                            </div>
                          </div>
                        </div>

                        {/* Recent Jobs */}
                        {performanceData.recentJobs.length > 0 && (
                          <div className="bg-zinc-800/30 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-zinc-400 mb-3">Recent Jobs</h3>
                            <div className="space-y-2">
                              {performanceData.recentJobs.slice(0, 5).map((job) => (
                                <button
                                  key={job.id}
                                  onClick={() => handleJobClick(job.id)}
                                  className="w-full flex items-center justify-between p-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors text-left"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-white text-sm truncate">{job.service}</span>
                                      {getJobStatusBadge(job.status)}
                                    </div>
                                    <div className="text-xs text-zinc-500">{job.customer}</div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-emerald-400 text-sm font-medium">${job.revenue.toFixed(0)}</span>
                                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12 text-zinc-500">
                        No performance data available
                      </div>
                    )}
                  </div>
                )}

                {/* Time Logs Tab */}
                {activeTab === 'time' && (
                  <div className="space-y-4">
                    {loadingTimeLogs ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                      </div>
                    ) : timeLogs.length > 0 ? (
                      <div className="space-y-2">
                        {timeLogs.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg"
                          >
                            <div>
                              <div className="font-medium text-white">
                                {format(parseISO(log.date), 'EEEE, MMM d, yyyy')}
                              </div>
                              <div className="text-sm text-zinc-400">
                                {format(parseISO(log.clockIn), 'h:mm a')}
                                {log.clockOut ? ` - ${format(parseISO(log.clockOut), 'h:mm a')}` : ' - Active'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-white">
                                {log.hoursWorked.toFixed(1)}h
                              </div>
                              <Badge
                                variant="outline"
                                className={log.status === 'active'
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                                }
                              >
                                {log.status === 'active' ? 'Active' : 'Completed'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-zinc-500">
                        <Clock className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
                        <p>No time logs found</p>
                        <p className="text-sm mt-1">Time logs will appear when the worker clocks in</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-zinc-800 flex justify-between items-center shrink-0">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4 inline-block mr-1" />
                  Remove team member
                </button>
                <Button variant="ghost" onClick={onClose}>
                  Close
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-20 text-zinc-500">
              Failed to load profile
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <span className="font-medium text-white">
                {profile?.user.firstName} {profile?.user.lastName}
              </span>{' '}
              from your team? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
