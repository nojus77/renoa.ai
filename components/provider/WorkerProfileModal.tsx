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
  Star,
  Clock,
  Briefcase,
  DollarSign,
  Calendar,
  Award,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  ChevronRight,
  User,
  Wrench,
  Check,
  Plus,
  Trash2,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import WorkerWeekCalendar from './WorkerWeekCalendar';

interface WorkerProfileModalProps {
  workerId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  onDelete?: (workerId: string) => void;
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
  schedule: {
    weekStart: string;
    weekEnd: string;
    days: Array<{
      date: string;
      dayName: string;
      dayNum: number;
      isOff: boolean;
      workingHours: { start: string; end: string } | null;
      jobs: Array<{
        id: string;
        time: string;
        service: string;
        customer: string;
        status: string;
      }>;
    }>;
  };
  recentJobs: Array<{
    id: string;
    date: string;
    customer: string;
    service: string;
    status: string;
    address: string;
    duration: number | null;
    earnings: number | null;
  }>;
  earnings: {
    history: Array<{
      period: string;
      startDate: string;
      endDate: string;
      hours: number;
      jobs: number;
      amount: number;
      isPaid: boolean;
      paidAt: string | null;
    }>;
    pending: number;
  };
  timeOff: Array<{
    id: string;
    startDate: string;
    endDate: string;
    reason: string | null;
    notes: string | null;
    status: string;
    createdAt: string;
  }>;
}

interface AvailableSkill {
  id: string;
  name: string;
  category: string | null;
}

type TabType = 'overview' | 'schedule' | 'jobs' | 'earnings' | 'timeoff';

export default function WorkerProfileModal({
  workerId,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: WorkerProfileModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [weekOffset, setWeekOffset] = useState(0);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [jobFilter, setJobFilter] = useState<'all' | 'completed' | 'upcoming'>('all');
  const [earningsFilter, setEarningsFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

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

  const fetchProfile = useCallback(async (offset = 0) => {
    if (!workerId) return;

    try {
      if (offset !== 0) {
        setLoadingSchedule(true);
      } else {
        setLoading(true);
      }

      const res = await fetch(`/api/provider/team/${workerId}/profile?weekOffset=${offset}`);
      const data = await res.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setProfile(data);

      // Initialize form values
      if (offset === 0) {
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
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
      setLoadingSchedule(false);
    }
  }, [workerId]);

  const fetchAvailableSkills = useCallback(async () => {
    if (!profile) return;
    setLoadingSkills(true);
    try {
      const res = await fetch(`/api/provider/skills?providerId=${profile.user.id.split('_')[0]}`);
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
      setActiveTab('overview');
      setWeekOffset(0);
      setEditingContact(false);
      setEditingPay(false);
      setEditingSkills(false);
      setEditingPermissions(false);
      setEditingRole(false);
      fetchProfile(0);
    }
  }, [isOpen, workerId, fetchProfile]);

  useEffect(() => {
    if (isOpen && workerId && weekOffset !== 0) {
      fetchProfile(weekOffset);
    }
  }, [weekOffset, isOpen, workerId, fetchProfile]);

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
      fetchProfile(weekOffset);
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
      fetchProfile(weekOffset);
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
      fetchProfile(weekOffset);
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
      fetchProfile(weekOffset);
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
      fetchProfile(weekOffset);
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
      fetchProfile(weekOffset);
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

  const filteredJobs = profile?.recentJobs.filter(job => {
    if (jobFilter === 'completed') return job.status === 'completed';
    if (jobFilter === 'upcoming') return job.status === 'scheduled';
    return true;
  }) || [];

  const filteredEarnings = profile?.earnings.history.filter(entry => {
    if (earningsFilter === 'paid') return entry.isPaid;
    if (earningsFilter === 'unpaid') return !entry.isPaid;
    return true;
  }) || [];

  // Filter available skills (exclude already assigned)
  const assignedSkillIds = new Set(profile?.skills.map(s => s.id) || []);
  const filteredAvailableSkills = availableSkills.filter(
    s => !assignedSkillIds.has(s.id) && s.name.toLowerCase().includes(skillSearch.toLowerCase())
  );

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <User className="w-4 h-4" /> },
    { id: 'schedule', label: 'Schedule', icon: <Calendar className="w-4 h-4" /> },
    { id: 'jobs', label: 'Jobs', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'earnings', label: 'Earnings', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'timeoff', label: 'Time Off', icon: <ClockIcon className="w-4 h-4" /> },
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

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-3 mt-4">
                  <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-white">{profile.stats.weekHours}h</div>
                    <div className="text-xs text-zinc-500">{profile.stats.weekJobs} jobs this week</div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-white">{profile.stats.monthHours}h</div>
                    <div className="text-xs text-zinc-500">{profile.stats.monthJobs} jobs this month</div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-emerald-400">
                      ${profile.stats.totalUnpaidEarnings.toFixed(0)}
                    </div>
                    <div className="text-xs text-zinc-500">Unpaid earnings</div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-yellow-400 flex items-center justify-center gap-1">
                      {profile.stats.avgRating ? (
                        <>
                          <Star className="w-4 h-4 fill-current" />
                          {profile.stats.avgRating}
                        </>
                      ) : (
                        <span className="text-zinc-500 text-sm">No reviews</span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {profile.stats.totalReviews} review{profile.stats.totalReviews !== 1 ? 's' : ''}
                    </div>
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
                {/* Overview Tab */}
                {activeTab === 'overview' && (
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

                {/* Schedule Tab */}
                {activeTab === 'schedule' && (
                  <WorkerWeekCalendar
                    days={profile.schedule.days}
                    weekStart={profile.schedule.weekStart}
                    weekEnd={profile.schedule.weekEnd}
                    onPrevWeek={() => setWeekOffset(prev => prev - 1)}
                    onNextWeek={() => setWeekOffset(prev => prev + 1)}
                    onJobClick={handleJobClick}
                    loading={loadingSchedule}
                  />
                )}

                {/* Jobs Tab */}
                {activeTab === 'jobs' && (
                  <div className="space-y-4">
                    {/* Filter */}
                    <div className="flex gap-2">
                      {(['all', 'completed', 'upcoming'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setJobFilter(filter)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            jobFilter === filter
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                          }`}
                        >
                          {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                      ))}
                    </div>

                    {/* Jobs List */}
                    <div className="space-y-2">
                      {filteredJobs.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">
                          No jobs found
                        </div>
                      ) : (
                        filteredJobs.map((job) => (
                          <button
                            key={job.id}
                            onClick={() => handleJobClick(job.id)}
                            className="w-full flex items-center justify-between p-3 bg-zinc-800/30 hover:bg-zinc-800/50 rounded-lg transition-colors text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white truncate">{job.service}</span>
                                {getJobStatusBadge(job.status)}
                              </div>
                              <div className="text-sm text-zinc-400 truncate">{job.customer}</div>
                              <div className="text-xs text-zinc-500">
                                {format(parseISO(job.date), 'MMM d, yyyy h:mm a')}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {job.earnings && (
                                <span className="text-emerald-400 font-medium">
                                  ${job.earnings.toFixed(0)}
                                </span>
                              )}
                              <ChevronRight className="w-4 h-4 text-zinc-500" />
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Earnings Tab */}
                {activeTab === 'earnings' && (
                  <div className="space-y-4">
                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-zinc-800/30 rounded-lg p-3 text-center">
                        <div className="text-lg font-semibold text-white">
                          ${profile.stats.weekEarnings.toFixed(0)}
                        </div>
                        <div className="text-xs text-zinc-500">This week</div>
                      </div>
                      <div className="bg-zinc-800/30 rounded-lg p-3 text-center">
                        <div className="text-lg font-semibold text-white">
                          ${profile.stats.monthEarnings.toFixed(0)}
                        </div>
                        <div className="text-xs text-zinc-500">This month</div>
                      </div>
                      <div className="bg-emerald-500/10 rounded-lg p-3 text-center border border-emerald-500/20">
                        <div className="text-lg font-semibold text-emerald-400">
                          ${profile.earnings.pending.toFixed(0)}
                        </div>
                        <div className="text-xs text-zinc-500">Pending</div>
                      </div>
                    </div>

                    {/* Filter */}
                    <div className="flex gap-2">
                      {(['all', 'paid', 'unpaid'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setEarningsFilter(filter)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            earningsFilter === filter
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                          }`}
                        >
                          {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                      ))}
                    </div>

                    {/* Earnings History */}
                    <div className="space-y-2">
                      {filteredEarnings.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">
                          No earnings found
                        </div>
                      ) : (
                        filteredEarnings.map((entry, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg"
                          >
                            <div>
                              <div className="font-medium text-white">{entry.period}</div>
                              <div className="text-sm text-zinc-400">
                                {entry.hours}h • {entry.jobs} jobs
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-white">${entry.amount.toFixed(2)}</div>
                              <Badge
                                variant="outline"
                                className={entry.isPaid
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                }
                              >
                                {entry.isPaid ? 'Paid' : 'Pending'}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Time Off Tab */}
                {activeTab === 'timeoff' && (
                  <div className="space-y-4">
                    {profile.timeOff.length === 0 ? (
                      <div className="text-center py-8 text-zinc-500">
                        No time off requests
                      </div>
                    ) : (
                      profile.timeOff.map((request) => (
                        <div
                          key={request.id}
                          className="flex items-start justify-between p-4 bg-zinc-800/30 rounded-lg"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white capitalize">
                                {request.reason || 'Time Off'}
                              </span>
                              <Badge
                                variant="outline"
                                className={
                                  request.status === 'approved'
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                    : request.status === 'denied'
                                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                    : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                }
                              >
                                {request.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                                {request.status === 'denied' && <XCircle className="w-3 h-3 mr-1" />}
                                {request.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                                {request.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-zinc-400 mt-1">
                              {format(parseISO(request.startDate), 'MMM d, yyyy')} -{' '}
                              {format(parseISO(request.endDate), 'MMM d, yyyy')}
                            </div>
                            {request.notes && (
                              <div className="text-sm text-zinc-500 mt-2">{request.notes}</div>
                            )}
                          </div>
                        </div>
                      ))
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
