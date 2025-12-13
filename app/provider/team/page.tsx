"use client"

import { useState, useEffect, useMemo, useRef } from 'react';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus, Mail, User, Shield, Eye, EyeOff, Loader2, Users, Edit2, Trash2, X, RefreshCw, Pencil, Award, Star, Wrench, Monitor, Crown, DollarSign, Plus, Search, Library, ChevronDown, CalendarPlus, Calendar, Settings, Lightbulb, Clock } from 'lucide-react';
import DeleteMemberDialog from '@/components/provider/DeleteMemberDialog';
import WorkerProfileModal from '@/components/provider/WorkerProfileModal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

interface WorkerSkill {
  id: string;
  skillId: string;
  level?: string;
  skill: {
    id: string;
    name: string;
    category?: string | null;
  };
}

interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: string;
  status: string;
  skills: string[];
  workerSkills?: WorkerSkill[];
  color?: string | null;
  hourlyRate?: number | null;
  workingHours?: Record<string, { start: string; end: string }> | null;
  createdAt: string;
  lastActive?: string | null;
  profilePhotoUrl?: string | null;
  // Worker stats
  hoursThisWeek?: number;
  jobsCompleted?: number;
  availableToday?: boolean;
  nextJob?: {
    id: string;
    startTime: string;
    serviceType: string;
  } | null;
}

interface Crew {
  id: string;
  name: string;
  userIds: string[];
  users: TeamMember[];
  memberCount: number;
  leaderId?: string | null;
  color?: string;
  jobsThisWeek?: number;
  nextJob?: {
    id: string;
    startTime: string;
    serviceType: string;
    customer?: {
      firstName: string;
      lastName: string;
    };
  } | null;
  unassignedToday?: number;
  skills?: string[];
}

const EMPTY_PAYROLL_SUMMARY = {
  totalHours: 0,
  totalEarnings: 0,
  totalUnpaid: 0,
  totalPaid: 0,
  totalTipsEligible: 0,
  totalTipsRecorded: 0,
  workersCount: 0,
  logsCount: 0,
};

const getRecordedTip = (log: any) => {
  if (!log) return 0;
  if (typeof log.recordedTip === 'number') return log.recordedTip;
  if (log.job?.tipAmount) return log.job.tipAmount || 0;
  return 0;
};

const getTipEligible = (log: any) => {
  if (!log) return 0;
  if (typeof log.tipEligible === 'number') return log.tipEligible;
  const recorded = getRecordedTip(log);
  const paymentMethod = log.job?.paymentMethod?.toLowerCase();
  if (paymentMethod === 'cash') return 0;
  return recorded;
};

const getPayoutAmount = (log: any) => {
  if (!log) return 0;
  if (typeof log.payoutAmount === 'number') return log.payoutAmount;
  const recorded = getRecordedTip(log);
  const eligible = getTipEligible(log);
  const base = (log.earnings || 0) - recorded;
  return Math.round((base + eligible) * 100) / 100;
};

export default function TeamManagementPage() {
  const [providerName, setProviderName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCrews, setLoadingCrews] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'crews' | 'time-off' | 'payroll'>('members');

  // Invite dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteRole, setInviteRole] = useState('office');
  const [inviteSkills, setInviteSkills] = useState('');
  const [inviteSelectedSkills, setInviteSelectedSkills] = useState<string[]>([]);
  const [inviteSkillSearch, setInviteSkillSearch] = useState('');
  const [inviteSkillsPopoverOpen, setInviteSkillsPopoverOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [showTempPassword, setShowTempPassword] = useState(false);

  // Crew dialog state
  const [crewDialogOpen, setCrewDialogOpen] = useState(false);
  const [editingCrew, setEditingCrew] = useState<Crew | null>(null);
  const [crewName, setCrewName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [crewLeaderId, setCrewLeaderId] = useState<string>('');
  const [crewColor, setCrewColor] = useState<string>('#10b981');
  const [savingCrew, setSavingCrew] = useState(false);
  const [expandedCrews, setExpandedCrews] = useState<Record<string, boolean>>({});

  // Delete confirmation state
  const [deletingCrew, setDeletingCrew] = useState<Crew | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Team member delete state
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);

  // Profile modal state
  const [profileWorkerId, setProfileWorkerId] = useState<string | null>(null);

  // Available skills state
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);

  // Skills popover state (per member)
  const [skillsSearch, setSkillsSearch] = useState<Record<string, string>>({});
  const [skillsPopoverOpen, setSkillsPopoverOpen] = useState<Record<string, boolean>>({});

  // Load default skills state
  const [loadingDefaultSkills, setLoadingDefaultSkills] = useState(false);

  // Filter and search state
  const [memberFilter, setMemberFilter] = useState<'all' | 'field' | 'office' | 'inactive'>('all');
  const [memberSearch, setMemberSearch] = useState('');

  // Skills management state (per member)
  const [skillSearchFor, setSkillSearchFor] = useState<Record<string, string>>({});
  const [skillsPopoverOpenFor, setSkillsPopoverOpenFor] = useState<Record<string, boolean>>({});

  // Time-off requests state
  const [timeOffRequests, setTimeOffRequests] = useState<any[]>([]);
  const [loadingTimeOff, setLoadingTimeOff] = useState(false);
  const [processingTimeOff, setProcessingTimeOff] = useState<string | null>(null);

  // Payroll state
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [payrollDateRange, setPayrollDateRange] = useState<'this-week' | 'last-week' | 'this-month'>('this-week');
  const [processingPay, setProcessingPay] = useState<string | null>(null);
  const [payrollSummary, setPayrollSummary] = useState(EMPTY_PAYROLL_SUMMARY);
  const [payrollByWorker, setPayrollByWorker] = useState<any[]>([]);
  const [selectedWorkLogIds, setSelectedWorkLogIds] = useState<string[]>([]);
  const [bulkPayLoading, setBulkPayLoading] = useState(false);
  const [processingWorkerPay, setProcessingWorkerPay] = useState<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  // Filtered team members based on search and filter
  const filteredTeamMembers = useMemo(() => {
    return teamMembers
      .filter(m => {
        if (memberFilter === 'field') return m.role === 'field';
        if (memberFilter === 'office') return m.role === 'office' || m.role === 'owner';
        if (memberFilter === 'inactive') return m.status !== 'active';
        return true;
      })
      .filter(m =>
        m.firstName.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.lastName.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.email.toLowerCase().includes(memberSearch.toLowerCase())
      );
  }, [teamMembers, memberFilter, memberSearch]);

  const unpaidWorkLogs = useMemo(() => workLogs.filter(log => !log.isPaid), [workLogs]);
  const allSelectableIds = useMemo(() => unpaidWorkLogs.map(log => log.id), [unpaidWorkLogs]);
  const unpaidWorkerCount = useMemo(() => {
    const ids = new Set<string>();
    unpaidWorkLogs.forEach(log => {
      if (log.userId) ids.add(log.userId);
    });
    return ids.size;
  }, [unpaidWorkLogs]);
  const areAllSelected = allSelectableIds.length > 0 && allSelectableIds.every(id => selectedWorkLogIds.includes(id));
  const selectedTotals = useMemo(() => {
    const workerIds = new Set<string>();
    let count = 0;
    let hours = 0;
    let amount = 0;
    let tips = 0;

    workLogs.forEach(log => {
      if (selectedWorkLogIds.includes(log.id) && !log.isPaid) {
        count += 1;
        hours += log.hoursWorked || 0;
        amount += getPayoutAmount(log);
        tips += getTipEligible(log);
        if (log.userId) {
          workerIds.add(log.userId);
        }
      }
    });

    return {
      count,
      hours,
      amount,
      tips,
      workerCount: workerIds.size,
    };
  }, [selectedWorkLogIds, workLogs]);
  const totalUnpaidAmount = useMemo(
    () =>
      unpaidWorkLogs.reduce((sum, log) => {
        return sum + getPayoutAmount(log);
      }, 0),
    [unpaidWorkLogs]
  );

  useEffect(() => {
    setSelectedWorkLogIds(prev => {
      const filtered = prev.filter(id => allSelectableIds.includes(id));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [allSelectableIds]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedWorkLogIds.length > 0 && !areAllSelected;
    }
  }, [selectedWorkLogIds, areAllSelected]);

  useEffect(() => {
    const name = localStorage.getItem('providerName') || 'Provider Portal';
    const role = localStorage.getItem('userRole') || '';
    setProviderName(name);
    setUserRole(role);
    fetchTeamMembers();
    fetchCrews();
  }, []);

  // Fetch time-off when tab changes to time-off
  useEffect(() => {
    if (activeTab === 'time-off') {
      fetchTimeOffRequests();
    }
  }, [activeTab]);

  // Fetch payroll when tab changes to payroll or date range changes
  useEffect(() => {
    if (activeTab === 'payroll') {
      fetchPayroll();
    }
  }, [activeTab, payrollDateRange]);

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      const providerId = localStorage.getItem('providerId');
      if (!providerId) {
        toast.error('Not logged in');
        return;
      }

      const res = await fetch(`/api/provider/team?providerId=${providerId}`);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to fetch team members');
        return;
      }

      setTeamMembers(data.users || []);
    } catch (error) {
      toast.error('Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  };

  const fetchCrews = async () => {
    setLoadingCrews(true);
    try {
      const providerId = localStorage.getItem('providerId');
      if (!providerId) return;

      const res = await fetch(`/api/provider/crews?providerId=${providerId}`);
      const data = await res.json();

      if (res.ok) {
        setCrews(data.crews || []);
      }
    } catch (error) {
      console.error('Error fetching crews:', error);
    } finally {
      setLoadingCrews(false);
    }
  };

  const fetchTimeOffRequests = async () => {
    setLoadingTimeOff(true);
    try {
      const providerId = localStorage.getItem('providerId');
      if (!providerId) return;

      const res = await fetch(`/api/provider/time-off?providerId=${providerId}`);
      const data = await res.json();

      if (res.ok) {
        setTimeOffRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching time-off requests:', error);
    } finally {
      setLoadingTimeOff(false);
    }
  };

  const fetchPayroll = async () => {
    setLoadingPayroll(true);
    try {
      const providerId = localStorage.getItem('providerId');
      if (!providerId) return;

      const res = await fetch(`/api/provider/payroll?providerId=${providerId}&range=${payrollDateRange}`);
      const data = await res.json();

      if (res.ok) {
        setWorkLogs(data.workLogs || []);
        setPayrollByWorker(data.byWorker || []);
        setPayrollSummary(data.summary || { ...EMPTY_PAYROLL_SUMMARY });
        setSelectedWorkLogIds([]);
      }
    } catch (error) {
      console.error('Error fetching payroll:', error);
    } finally {
      setLoadingPayroll(false);
    }
  };

  const handleTimeOffAction = async (requestId: string, action: 'approved' | 'denied') => {
    setProcessingTimeOff(requestId);
    try {
      // API expects 'approve' or 'deny', not 'approved' or 'denied'
      const apiAction = action === 'approved' ? 'approve' : 'deny';
      const res = await fetch(`/api/provider/time-off/${requestId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: apiAction }),
      });

      if (res.ok) {
        toast.success(`Request ${action}`);
        fetchTimeOffRequests();
      } else {
        toast.error('Failed to process request');
      }
    } catch (error) {
      toast.error('Failed to process request');
    } finally {
      setProcessingTimeOff(null);
    }
  };

  const handleMarkPaid = async (workLogId: string) => {
    setProcessingPay(workLogId);
    try {
      const res = await fetch(`/api/provider/payroll/${workLogId}/pay`, {
        method: 'PATCH',
      });

      if (res.ok) {
        toast.success('Marked as paid');
        fetchPayroll();
      } else {
        toast.error('Failed to mark as paid');
      }
    } catch (error) {
      toast.error('Failed to mark as paid');
    } finally {
      setProcessingPay(null);
    }
  };

  const toggleSelectAll = () => {
    if (areAllSelected) {
      setSelectedWorkLogIds([]);
    } else {
      setSelectedWorkLogIds(allSelectableIds);
    }
  };

  const toggleSelectWorkLog = (workLogId: string) => {
    setSelectedWorkLogIds(prev =>
      prev.includes(workLogId) ? prev.filter(id => id !== workLogId) : [...prev, workLogId]
    );
  };

  const handleMarkSelectedPaid = async () => {
    if (selectedWorkLogIds.length === 0) {
      toast.error('Select at least one work log');
      return;
    }

    setBulkPayLoading(true);
    try {
      const res = await fetch('/api/provider/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workLogIds: selectedWorkLogIds }),
      });

      if (res.ok) {
        toast.success(`Marked ${selectedWorkLogIds.length} job${selectedWorkLogIds.length === 1 ? '' : 's'} as paid`);
        setSelectedWorkLogIds([]);
        fetchPayroll();
      } else {
        toast.error('Failed to mark selected jobs as paid');
      }
    } catch (error) {
      toast.error('Failed to mark selected jobs as paid');
    } finally {
      setBulkPayLoading(false);
    }
  };

  const handleMarkAllPaid = async () => {
    if (allSelectableIds.length === 0) {
      toast.error('No unpaid jobs to pay');
      return;
    }

    setBulkPayLoading(true);
    try {
      const res = await fetch('/api/provider/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workLogIds: allSelectableIds }),
      });

      if (res.ok) {
        toast.success('Marked all unpaid jobs as paid');
        setSelectedWorkLogIds([]);
        fetchPayroll();
      } else {
        toast.error('Failed to mark all jobs as paid');
      }
    } catch (error) {
      toast.error('Failed to mark all jobs as paid');
    } finally {
      setBulkPayLoading(false);
    }
  };

  const handleMarkWorkerPaid = async (userId: string) => {
    if (!userId) {
      toast.error('Worker not found');
      return;
    }

    setProcessingWorkerPay(userId);
    try {
      const res = await fetch('/api/provider/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        toast.success('Marked worker as paid');
        fetchPayroll();
      } else {
        toast.error('Failed to mark worker as paid');
      }
    } catch (error) {
      toast.error('Failed to mark worker as paid');
    } finally {
      setProcessingWorkerPay(null);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail || !inviteFirstName || !inviteLastName || !inviteRole) {
      toast.error('Please fill in all required fields');
      return;
    }

    setInviting(true);
    try {
      const providerId = localStorage.getItem('providerId');
      const userId = localStorage.getItem('userId');

      if (!providerId || !userId) {
        toast.error('Not logged in');
        setInviting(false);
        return;
      }

      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          userId,
          email: inviteEmail,
          firstName: inviteFirstName,
          lastName: inviteLastName,
          role: inviteRole,
          skills: inviteRole === 'field' ? inviteSelectedSkills : [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Invite failed:', { status: res.status, data });
        // Skip showing enterprise limit toast - it's marketing BS
        if (data.errorType !== 'enterprise_limit') {
          toast.error(data.error || `Failed to invite user (${res.status})`);
        }
        return;
      }

      // Optimistic update - add new member immediately
      if (data.user) {
        setTeamMembers(prev => [data.user, ...prev]);
      }

      setTempPassword(data.tempPassword);
      setShowTempPassword(true);
      toast.success(`User invited! Temp password: ${data.tempPassword}`);

      setInviteEmail('');
      setInviteFirstName('');
      setInviteLastName('');
      setInviteRole('office');
      setInviteSkills('');
      setInviteSelectedSkills([]);
    } catch (error) {
      toast.error('Failed to invite user');
    } finally {
      setInviting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // OPTIMISTIC UPDATE - SAVE CREW
  // ═══════════════════════════════════════════════════════════════════
  const handleSaveCrew = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!crewName.trim()) {
      toast.error('Please enter a crew name');
      return;
    }

    setSavingCrew(true);
    const providerId = localStorage.getItem('providerId');
    if (!providerId) {
      toast.error('Not logged in');
      setSavingCrew(false);
      return;
    }

    const isEditing = !!editingCrew;
    const tempId = isEditing ? editingCrew.id : `temp-${Date.now()}`;

    // Get member details for optimistic update
    const selectedMembers = teamMembers.filter(m => selectedMemberIds.includes(m.id));

    // Create optimistic crew object
    const optimisticCrew = {
      id: tempId,
      name: crewName,
      userIds: selectedMemberIds,
      leaderId: crewLeaderId || null,
      color: crewColor,
      providerId,
      users: selectedMembers,
      memberCount: selectedMemberIds.length,
      jobsThisWeek: 0,
      nextJob: null,
      unassignedToday: 0,
      skills: [],
      createdAt: new Date().toISOString(),
    };

    // Store old crew for rollback
    const oldCrew = isEditing ? crews.find(c => c.id === editingCrew.id) : null;

    // Optimistic update
    if (isEditing) {
      setCrews(prev => prev.map(c => c.id === tempId ? optimisticCrew : c));
    } else {
      setCrews(prev => [optimisticCrew, ...prev]);
    }

    // Close dialog immediately
    handleCloseCrewDialog();

    try {
      const url = isEditing
        ? `/api/provider/crews/${editingCrew.id}`
        : '/api/provider/crews';

      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          name: crewName,
          userIds: selectedMemberIds,
          leaderId: crewLeaderId || null,
          color: crewColor,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save crew');
      }

      // Replace temp crew with real one
      if (!isEditing) {
        setCrews(prev => prev.map(c => c.id === tempId ? data.crew : c));
      }

      toast.success(`Crew ${isEditing ? 'updated' : 'created'}`);
    } catch (error: any) {
      // Revert on error
      if (isEditing && oldCrew) {
        setCrews(prev => prev.map(c => c.id === tempId ? oldCrew : c));
      } else {
        setCrews(prev => prev.filter(c => c.id !== tempId));
      }
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'create'} crew`);
    } finally {
      setSavingCrew(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // OPTIMISTIC UPDATE - DELETE CREW
  // ═══════════════════════════════════════════════════════════════════
  const handleDeleteCrew = async () => {
    if (!deletingCrew) return;

    setDeleting(true);
    const providerId = localStorage.getItem('providerId');
    if (!providerId) {
      toast.error('Not logged in');
      setDeleting(false);
      return;
    }

    const crewToDelete = deletingCrew;
    const crewId = deletingCrew.id;

    // Optimistic delete
    setCrews(prev => prev.filter(c => c.id !== crewId));
    setDeletingCrew(null);

    try {
      const res = await fetch(`/api/provider/crews/${crewId}?providerId=${providerId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete crew');
      }

      toast.success('Crew deleted');
    } catch (error: any) {
      // Restore crew on error
      setCrews(prev => [crewToDelete, ...prev]);
      toast.error(error.message || 'Failed to delete crew');
    } finally {
      setDeleting(false);
    }
  };

  const autoGenerateCrews = async () => {
    const providerId = localStorage.getItem('providerId');
    if (!providerId) {
      toast.error('Not logged in');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/provider/crews/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate crews');
      }

      if (data.crews && data.crews.length > 0) {
        // Optimistically add generated crews to state
        setCrews(prev => [...data.crews, ...prev]);
        toast.success(`Created ${data.crews.length} crew${data.crews.length !== 1 ? 's' : ''} based on skills!`);
      } else {
        toast.info('No crews generated. Need at least 2 field workers with skills.');
      }
    } catch (error: any) {
      console.error('Auto-generate error:', error);
      toast.error(error.message || 'Failed to generate crews');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCrewDialog = (crew?: Crew) => {
    if (crew) {
      setEditingCrew(crew);
      setCrewName(crew.name);
      setSelectedMemberIds(crew.userIds);
      setCrewLeaderId(crew.leaderId || '');
      setCrewColor(crew.color || '#10b981');
    } else {
      setEditingCrew(null);
      setCrewName('');
      setSelectedMemberIds([]);
      setCrewLeaderId('');
      setCrewColor('#10b981');
    }
    setCrewDialogOpen(true);
  };

  const handleCloseCrewDialog = () => {
    setCrewDialogOpen(false);
    setEditingCrew(null);
    setCrewName('');
    setSelectedMemberIds([]);
    setCrewLeaderId('');
    setCrewColor('#10b981');
  };

  const handleCloseInviteDialog = () => {
    setInviteDialogOpen(false);
    setTempPassword('');
    setShowTempPassword(false);
  };

  // ═══════════════════════════════════════════════════════════════════
  // OPTIMISTIC UPDATE - ROLE
  // ═══════════════════════════════════════════════════════════════════
  const updateMemberRole = async (memberId: string, newRole: string) => {
    const oldRole = teamMembers.find(m => m.id === memberId)?.role;

    // Optimistic update
    setTeamMembers(prev => prev.map(m =>
      m.id === memberId ? { ...m, role: newRole } : m
    ));

    try {
      const res = await fetch(`/api/provider/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) throw new Error('Failed to update role');

      toast.success('Role updated');
    } catch (error) {
      // Revert on error
      setTeamMembers(prev => prev.map(m =>
        m.id === memberId ? { ...m, role: oldRole || 'field' } : m
      ));
      toast.error('Failed to update role');
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // OPTIMISTIC UPDATE - STATUS
  // ═══════════════════════════════════════════════════════════════════
  const updateMemberStatus = async (memberId: string, isActive: boolean) => {
    const oldStatus = teamMembers.find(m => m.id === memberId)?.status;
    const newStatus = isActive ? 'active' : 'inactive';

    // Optimistic update
    setTeamMembers(prev => prev.map(m =>
      m.id === memberId ? { ...m, status: newStatus } : m
    ));

    try {
      const res = await fetch(`/api/provider/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      toast.success(`Member ${isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      // Revert on error
      setTeamMembers(prev => prev.map(m =>
        m.id === memberId ? { ...m, status: oldStatus || 'active' } : m
      ));
      toast.error('Failed to update status');
    }
  };

  // Inline skill management functions with OPTIMISTIC UPDATES
  const addSkill = async (memberId: string, skillId: string, skillName: string) => {
    // 1. OPTIMISTIC UPDATE - Update UI immediately
    setTeamMembers(prev => prev.map(m => {
      if (m.id !== memberId) return m;
      return {
        ...m,
        workerSkills: [
          ...(m.workerSkills || []),
          {
            id: `temp-${Date.now()}`,
            skillId,
            level: 'basic',
            skill: { id: skillId, name: skillName, category: null }
          }
        ]
      };
    }));

    // 2. API call in background
    try {
      const res = await fetch(`/api/provider/team/${memberId}/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId, level: 'basic' }),
      });

      if (!res.ok) throw new Error('Failed to add skill');

      const newSkill = await res.json();

      // 3. Replace temp with real data
      setTeamMembers(prev => prev.map(m => {
        if (m.id !== memberId) return m;
        return {
          ...m,
          workerSkills: (m.workerSkills || []).map(ws =>
            ws.id.startsWith('temp-') && ws.skillId === skillId
              ? newSkill
              : ws
          )
        };
      }));

      toast.success(`Added ${skillName}`);
    } catch (error) {
      // 4. REVERT on failure
      setTeamMembers(prev => prev.map(m => {
        if (m.id !== memberId) return m;
        return {
          ...m,
          workerSkills: (m.workerSkills || []).filter(ws => ws.skillId !== skillId)
        };
      }));
      toast.error('Failed to add skill');
    }
  };

  const createAndAddSkill = async (memberId: string, skillName: string) => {
    try {
      const providerId = localStorage.getItem('providerId');
      if (!providerId) {
        toast.error('Not logged in');
        return;
      }

      // 1. Create the skill
      const createRes = await fetch('/api/provider/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          name: skillName.trim(),
          category: 'Custom',
        }),
      });

      if (!createRes.ok) {
        toast.error('Failed to create skill');
        return;
      }

      const newSkill = await createRes.json();

      // 2. Add to available skills
      setAvailableSkills(prev => [...prev, newSkill]);

      // 3. Add to member (optimistic)
      setTeamMembers(prev => prev.map(m => {
        if (m.id !== memberId) return m;
        return {
          ...m,
          workerSkills: [
            ...(m.workerSkills || []),
            {
              id: `temp-${Date.now()}`,
              skillId: newSkill.id,
              level: 'basic',
              skill: newSkill,
            },
          ],
        };
      }));

      // 4. API call to add skill to member
      const addRes = await fetch(`/api/provider/team/${memberId}/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId: newSkill.id, level: 'basic' }),
      });

      if (!addRes.ok) {
        // Revert on failure
        setTeamMembers(prev => prev.map(m => {
          if (m.id !== memberId) return m;
          return {
            ...m,
            workerSkills: (m.workerSkills || []).filter(ws => ws.skillId !== newSkill.id),
          };
        }));
        toast.error('Failed to add skill');
        return;
      }

      const addedSkill = await addRes.json();

      // 5. Replace temp with real data
      setTeamMembers(prev => prev.map(m => {
        if (m.id !== memberId) return m;
        return {
          ...m,
          workerSkills: (m.workerSkills || []).map(ws =>
            ws.id.startsWith('temp-') && ws.skillId === newSkill.id
              ? addedSkill
              : ws
          ),
        };
      }));

      // 6. Clear search
      setSkillSearchFor(prev => ({ ...prev, [memberId]: '' }));
      setSkillsPopoverOpenFor(prev => ({ ...prev, [memberId]: false }));

      toast.success(`Created and added "${skillName}"`);
    } catch (err) {
      toast.error('Failed to create skill');
    }
  };

  const removeSkill = async (memberId: string, workerSkillId: string) => {
    // Find the skill for potential revert
    const member = teamMembers.find(m => m.id === memberId);
    const removedSkill = member?.workerSkills?.find(ws => ws.id === workerSkillId);

    // 1. OPTIMISTIC - Remove immediately
    setTeamMembers(prev => prev.map(m => {
      if (m.id !== memberId) return m;
      return {
        ...m,
        workerSkills: (m.workerSkills || []).filter(ws => ws.id !== workerSkillId)
      };
    }));

    // 2. API call
    try {
      const res = await fetch(`/api/provider/team/${memberId}/skills?skillId=${removedSkill?.skillId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to remove skill');

      toast.success('Skill removed');
    } catch (error) {
      // 3. REVERT on failure
      if (removedSkill) {
        setTeamMembers(prev => prev.map(m => {
          if (m.id !== memberId) return m;
          return {
            ...m,
            workerSkills: [...(m.workerSkills || []), removedSkill]
          };
        }));
      }
      toast.error('Failed to remove skill');
    }
  };

  // Create custom skill and add to worker
  // Load default skills library
  const loadDefaultSkills = async () => {
    try {
      setLoadingDefaultSkills(true);
      const providerId = localStorage.getItem('providerId');
      if (!providerId) {
        toast.error('Not logged in');
        return;
      }

      const res = await fetch(`/api/provider/skills/seed-defaults?providerId=${providerId}`, {
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to load default skills');
      }

      const result = await res.json();

      // Refresh the skills list
      const skillsRes = await fetch(`/api/provider/skills?providerId=${providerId}`);
      const skillsData = await skillsRes.json();
      setAvailableSkills(Array.isArray(skillsData) ? skillsData : skillsData.skills || []);

      toast.success(result.message || `Added ${result.added} default skills`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load default skills');
    } finally {
      setLoadingDefaultSkills(false);
    }
  };

  // Load available skills on mount
  useEffect(() => {
    const loadSkills = async () => {
      try {
        const providerId = localStorage.getItem('providerId');
        if (!providerId) return;

        const res = await fetch(`/api/provider/skills?providerId=${providerId}`);
        const data = await res.json();
        setAvailableSkills(Array.isArray(data) ? data : data.skills || []);
      } catch (error) {
        console.error('Failed to load skills:', error);
      }
    };

    loadSkills();
  }, []);

  const getRoleBadge = (role: string) => {
    const roleColors = {
      owner: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      office: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      field: 'bg-green-500/20 text-green-300 border-green-500/30',
    };

    return (
      <Badge className={roleColors[role as keyof typeof roleColors] || 'bg-zinc-500/20 text-zinc-300'}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Active</Badge>
    ) : (
      <Badge className="bg-zinc-500/20 text-zinc-300 border-zinc-500/30">Inactive</Badge>
    );
  };

  const isOwner = userRole === 'owner';

  // Helper component for searchable skills selector
  const SkillsSelector = ({ member }: { member: TeamMember }) => {
    const search = skillsSearch[member.id] || '';
    const isOpen = skillsPopoverOpen[member.id] || false;

    // Filter and group skills
    const filteredSkills = useMemo(() => {
      const memberSkillIds = member.workerSkills?.map(ws => ws.skillId) || [];

      return availableSkills
        .filter(skill => !memberSkillIds.includes(skill.id))
        .filter(skill =>
          skill.name.toLowerCase().includes(search.toLowerCase()) ||
          skill.category?.toLowerCase().includes(search.toLowerCase())
        );
    }, [member.workerSkills, search]);

    // Group by usage: Popular (2+ workers) vs Others
    const groupedSkills = useMemo(() => {
      const popular = filteredSkills.filter(s => (s.usageCount || 0) >= 2);
      const others = filteredSkills.filter(s => (s.usageCount || 0) < 2);
      return { popular, others };
    }, [filteredSkills]);

    return (
      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          setSkillsPopoverOpen(prev => ({ ...prev, [member.id]: open }));
          if (!open) {
            setSkillsSearch(prev => ({ ...prev, [member.id]: '' }));
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 text-xs text-zinc-400 hover:text-white">
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0 bg-zinc-900 border-zinc-700" align="start">
          {/* Search Input */}
          <div className="p-2 border-b border-zinc-700">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search skills... (e.g. tree, mowing)"
                value={search}
                onChange={(e) => setSkillsSearch(prev => ({ ...prev, [member.id]: e.target.value }))}
                className="pl-8 h-8 text-sm bg-zinc-800 border-zinc-700 text-zinc-100"
                autoFocus
              />
            </div>
          </div>

          {/* Skills List */}
          <div className="max-h-64 overflow-y-auto p-1">
            {/* Popular Skills - Used by 2+ workers */}
            {groupedSkills.popular.length > 0 && (
              <div>
                <div className="px-2 py-1.5 text-xs text-emerald-400 font-semibold uppercase bg-emerald-500/10 sticky top-0 backdrop-blur-sm">
                  Popular in your team
                </div>
                {groupedSkills.popular.map((skill: any) => (
                  <button
                    key={skill.id}
                    onClick={() => {
                      addSkill(member.id, skill.id, skill.name);
                      // Don't close - allow adding more
                    }}
                    className="w-full text-left px-2 py-1.5 text-sm text-zinc-300 rounded hover:bg-zinc-700 flex items-center justify-between group"
                  >
                    <span>{skill.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {skill.usageCount}
                      </span>
                      <Plus className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Other Skills */}
            {groupedSkills.others.length > 0 && (
              <div>
                {groupedSkills.popular.length > 0 && (
                  <div className="px-2 py-1.5 text-xs text-zinc-500 font-semibold uppercase bg-zinc-800/50 sticky top-0 backdrop-blur-sm mt-1">
                    Other skills
                  </div>
                )}
                {groupedSkills.others.map((skill: any) => (
                  <button
                    key={skill.id}
                    onClick={() => {
                      addSkill(member.id, skill.id, skill.name);
                      // Don't close - allow adding more
                    }}
                    className="w-full text-left px-2 py-1.5 text-sm text-zinc-300 rounded hover:bg-zinc-700 flex items-center justify-between group"
                  >
                    <span>{skill.name}</span>
                    <div className="flex items-center gap-2">
                      {skill.usageCount > 0 && (
                        <span className="text-xs text-zinc-500">{skill.usageCount}</span>
                      )}
                      <Plus className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No results + Create option */}
            {filteredSkills.length === 0 && search && (
              <div className="p-3 text-center">
                <p className="text-sm text-zinc-400 mb-2">No skills match &quot;{search}&quot;</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    createAndAddSkill(member.id, search);
                    setSkillsPopoverOpen(prev => ({ ...prev, [member.id]: false }));
                    setSkillsSearch(prev => ({ ...prev, [member.id]: '' }));
                  }}
                  className="text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Create &quot;{search}&quot; skill
                </Button>
              </div>
            )}

            {filteredSkills.length === 0 && !search && (
              <p className="text-xs text-zinc-600 text-center py-3">All skills assigned</p>
            )}
          </div>

          {/* Quick create at bottom */}
          <div className="p-2 border-t border-zinc-700">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-zinc-400 hover:text-white hover:bg-zinc-700"
              onClick={() => {
                const skillName = prompt('Enter custom skill name:');
                if (skillName) {
                  createAndAddSkill(member.id, skillName);
                  setSkillsPopoverOpen(prev => ({ ...prev, [member.id]: false }));
                }
              }}
            >
              <Plus className="w-3 h-3 mr-1" />
              Create custom skill
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <ProviderLayout providerName={providerName}>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex-none p-4 lg:p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Team Management</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your team members and crews
              </p>
            </div>

            {isOwner && (
              <div className="flex gap-2">
                {activeTab === 'members' && availableSkills.length < 20 && (
                  <Button
                    variant="outline"
                    onClick={loadDefaultSkills}
                    disabled={loadingDefaultSkills}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    {loadingDefaultSkills ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Library className="h-4 w-4 mr-2" />
                        Load Default Skills
                      </>
                    )}
                  </Button>
                )}
                {activeTab === 'members' && (
                  <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-emerald-600 hover:bg-emerald-500">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-950 border-zinc-800 max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-zinc-100">Invite Team Member</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                          Add a new team member to your organization
                        </DialogDescription>
                      </DialogHeader>

                      {tempPassword ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                            <p className="text-sm text-emerald-300 mb-2">User invited successfully!</p>
                            <p className="text-xs text-zinc-400 mb-3">
                              Share this temporary password with the new team member:
                            </p>
                            <div className="flex items-center gap-2">
                              <Input
                                type={showTempPassword ? 'text' : 'password'}
                                value={tempPassword}
                                readOnly
                                className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setShowTempPassword(!showTempPassword)}
                                className="border-zinc-700"
                              >
                                {showTempPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                            <p className="text-xs text-zinc-500 mt-2">
                              They can log in at /provider/login with their email and this password
                            </p>
                          </div>
                          <Button
                            onClick={handleCloseInviteDialog}
                            className="w-full bg-emerald-600 hover:bg-emerald-500"
                          >
                            Done
                          </Button>
                        </div>
                      ) : (
                        <form onSubmit={handleInviteUser} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="firstName" className="text-zinc-200">First Name</Label>
                              <Input
                                id="firstName"
                                value={inviteFirstName}
                                onChange={(e) => setInviteFirstName(e.target.value)}
                                className="bg-zinc-900 border-zinc-800 text-zinc-100"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="lastName" className="text-zinc-200">Last Name</Label>
                              <Input
                                id="lastName"
                                value={inviteLastName}
                                onChange={(e) => setInviteLastName(e.target.value)}
                                className="bg-zinc-900 border-zinc-800 text-zinc-100"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-zinc-200">Email Address</Label>
                            <Input
                              id="email"
                              type="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              className="bg-zinc-900 border-zinc-800 text-zinc-100"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="role" className="text-zinc-200">Role</Label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border-zinc-800">
                                <SelectItem value="owner">Owner - Full access</SelectItem>
                                <SelectItem value="office">Office - Manage customers & jobs</SelectItem>
                                <SelectItem value="field">Field - View assigned jobs only</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {inviteRole === 'field' && (
                            <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                              <p className="text-xs text-zinc-400">
                                You can assign skills, equipment, and certifications after the team member is added.
                              </p>
                            </div>
                          )}

                          <Button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-500"
                            disabled={inviting}
                          >
                            {inviting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Inviting...
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Send Invite
                              </>
                            )}
                          </Button>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>
                )}

                {activeTab === 'crews' && (
                  <Button
                    onClick={() => handleOpenCrewDialog()}
                    className="bg-emerald-600 hover:bg-emerald-500"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Create Crew
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 bg-zinc-900/50 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'members'
                  ? 'bg-emerald-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              Team Members
            </button>
            <button
              onClick={() => setActiveTab('crews')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'crews'
                  ? 'bg-emerald-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              Crews
            </button>
            <button
              onClick={() => setActiveTab('time-off')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'time-off'
                  ? 'bg-emerald-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              Time Off
            </button>
            <button
              onClick={() => setActiveTab('payroll')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'payroll'
                  ? 'bg-emerald-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              Payroll
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          {!isOwner && (
            <Card className="mb-6 bg-yellow-500/10 border-yellow-500/30">
              <CardContent className="p-4">
                <p className="text-sm text-yellow-300">
                  <Shield className="h-4 w-4 inline mr-2" />
                  Only owners can manage team members and crews. Contact your administrator.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Team Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              {/* ENHANCED FILTERS */}
              <div className="space-y-3">
                {/* Top Row: Search + Quick Filters + Invite */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Search with Icon */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input
                        placeholder="Search team..."
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className="pl-9 w-64 h-9 bg-zinc-900 border-zinc-700"
                      />
                    </div>

                    {/* Quick Filter Tabs */}
                    <div className="flex bg-zinc-800 rounded-lg p-1">
                      {[
                        { value: 'all' as const, label: 'All', count: teamMembers.length },
                        { value: 'field' as const, label: 'Field', count: teamMembers.filter(m => m.role === 'field_worker' || m.role === 'crew_leader').length },
                        { value: 'office' as const, label: 'Office', count: teamMembers.filter(m => m.role === 'office_staff' || m.role === 'owner').length },
                        { value: 'inactive' as const, label: 'Inactive', count: teamMembers.filter(m => m.status !== 'active').length },
                      ].map(tab => (
                        <button
                          key={tab.value}
                          onClick={() => setMemberFilter(tab.value)}
                          className={cn(
                            "px-3 py-1.5 text-sm rounded-md transition-colors font-medium",
                            memberFilter === tab.value
                              ? "bg-emerald-600 text-white"
                              : "text-zinc-400 hover:text-white"
                          )}
                        >
                          {tab.label}
                          <span className={cn(
                            "ml-1 text-xs",
                            memberFilter === tab.value ? "text-emerald-100" : "text-zinc-500"
                          )}>
                            ({tab.count})
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {isOwner && (
                    <Button
                      onClick={() => setInviteDialogOpen(true)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite Member
                    </Button>
                  )}
                </div>

                {/* Second Row: Skill Filter + Quick Toggles */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Skill Filter Dropdown */}
                  <Select value="" onValueChange={(skillName) => {
                    // TODO: Add skill filtering logic
                    console.log('Filter by skill:', skillName);
                  }}>
                    <SelectTrigger className="w-[180px] h-9 bg-zinc-900 border-zinc-700">
                      <SelectValue placeholder="Filter by skill..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 max-h-[300px]">
                      {availableSkills
                        .slice()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(skill => (
                          <SelectItem key={skill.id} value={skill.name}>
                            {skill.name}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>

                  {/* Quick Toggle: Only Active */}
                  <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={memberFilter !== 'all' && memberFilter !== 'inactive'}
                      onChange={(e) => {
                        if (e.target.checked && memberFilter === 'all') {
                          setMemberFilter('field');
                        } else if (!e.target.checked) {
                          setMemberFilter('all');
                        }
                      }}
                      className="w-4 h-4 rounded border-zinc-600 text-emerald-600 focus:ring-emerald-600 focus:ring-offset-0 bg-zinc-900"
                    />
                    <span className="text-sm text-zinc-300">Only active</span>
                  </label>

                  {/* Quick Toggle: Available Today */}
                  <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        // TODO: Add filter for members available today
                        console.log('Filter available today:', e.target.checked);
                      }}
                      className="w-4 h-4 rounded border-zinc-600 text-emerald-600 focus:ring-emerald-600 focus:ring-offset-0 bg-zinc-900"
                    />
                    <span className="text-sm text-zinc-300">Available today</span>
                  </label>

                  {/* Results Count */}
                  <span className="text-xs text-zinc-500 ml-auto">
                    Showing {filteredTeamMembers.length} of {teamMembers.length} members
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <User className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
                  <p className="text-zinc-400">No team members yet</p>
                  {isOwner && (
                    <p className="text-sm text-zinc-500 mt-2">
                      Click &ldquo;Invite Member&rdquo; to get started
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {/* BETTER TABLE - Scannable with zebra stripes */}
                  <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-zinc-800 sticky top-0">
                          <tr className="text-left text-xs text-zinc-400 uppercase">
                            <th className="px-4 py-3 sticky left-0 bg-zinc-800 z-10">Member</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Skills</th>
                            <th className="px-4 py-3 text-right">This Week</th>
                            <th className="px-4 py-3">Next Job</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          {filteredTeamMembers.map((member, idx) => (
                            <tr
                              key={member.id}
                              onClick={() => setProfileWorkerId(member.id)}
                              className={cn(
                                "hover:bg-zinc-800/70 transition-colors cursor-pointer",
                                idx % 2 === 0 ? "bg-zinc-900" : "bg-zinc-900/50"
                              )}
                            >
                            {/* Member - Frozen Column */}
                            <td className="px-4 py-3 sticky left-0 bg-inherit z-10">
                              <div className="flex items-center gap-3">
                                <Avatar
                                  className="w-8 h-8"
                                  style={{ backgroundColor: member.color || '#6b7280' }}
                                >
                                  <AvatarFallback className="text-white text-xs">
                                    {member.firstName[0]}{member.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-sm text-zinc-100">{member.firstName} {member.lastName}</div>
                                  <div className="text-xs text-zinc-500">{member.email}</div>
                                </div>
                              </div>
                            </td>

                            {/* Role */}
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={member.role}
                                onValueChange={(value) => isOwner && updateMemberRole(member.id, value)}
                                disabled={!isOwner}
                              >
                                <SelectTrigger className="w-24 h-7 text-xs bg-zinc-800 border-zinc-700">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-700">
                                  <SelectItem value="field">Field</SelectItem>
                                  <SelectItem value="office">Office</SelectItem>
                                  <SelectItem value="owner">Owner</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={member.status === 'active'}
                                  onCheckedChange={(checked) => isOwner && updateMemberStatus(member.id, checked)}
                                  disabled={!isOwner}
                                  className="scale-75"
                                />
                                <span className={cn(
                                  "text-xs",
                                  member.status === 'active' ? "text-emerald-400" : "text-red-400"
                                )}>
                                  {member.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </td>

                            {/* Skills */}
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1 flex-wrap max-w-[200px]">
                                {member.workerSkills && member.workerSkills.length > 0 ? (
                                  <>
                                    {member.workerSkills.slice(0, 2).map(ws => (
                                      <Badge key={ws.id} variant="secondary" className="text-xs px-1.5 py-0 bg-zinc-800 text-zinc-300 flex items-center gap-1">
                                        {ws.skill.name}
                                        {isOwner && (
                                          <X
                                            className="w-3 h-3 cursor-pointer hover:text-red-400"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeSkill(member.id, ws.id);
                                            }}
                                          />
                                        )}
                                      </Badge>
                                    ))}

                                    {/* +X with title showing all remaining skills */}
                                    {member.workerSkills.length > 2 && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs px-1.5 py-0 border-zinc-700 text-zinc-400 cursor-default"
                                        title={member.workerSkills.slice(2).map(ws => ws.skill.name).join(', ')}
                                      >
                                        +{member.workerSkills.length - 2}
                                      </Badge>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-xs text-zinc-600">None</span>
                                )}

                                {/* Quick add button inline */}
                                {isOwner && (
                                  <Popover
                                    open={skillsPopoverOpenFor[member.id] || false}
                                    onOpenChange={(open) => {
                                      setSkillsPopoverOpenFor(prev => ({ ...prev, [member.id]: open }));
                                      if (!open) setSkillSearchFor(prev => ({ ...prev, [member.id]: '' }));
                                    }}
                                  >
                                    <PopoverTrigger asChild>
                                      <button className="text-xs text-zinc-500 hover:text-white px-1">
                                        + Add
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-0 bg-zinc-900 border-zinc-700" align="start">
                                      {/* Search */}
                                      <div className="p-2 border-b border-zinc-700">
                                        <Input
                                          placeholder="Search or create skill..."
                                          value={skillSearchFor[member.id] || ''}
                                          onChange={(e) => setSkillSearchFor(prev => ({ ...prev, [member.id]: e.target.value }))}
                                          className="h-8 text-sm bg-zinc-800 border-zinc-700"
                                          autoFocus
                                        />
                                      </div>

                                      {/* Skills list */}
                                      <div className="max-h-40 overflow-y-auto p-1">
                                        {availableSkills
                                          .filter(s => !member.workerSkills?.some(ws => ws.skillId === s.id))
                                          .filter(s => s.name.toLowerCase().includes((skillSearchFor[member.id] || '').toLowerCase()))
                                          .slice(0, 8)
                                          .map(skill => (
                                            <button
                                              key={skill.id}
                                              onClick={() => {
                                                addSkill(member.id, skill.id, skill.name);
                                                setSkillSearchFor(prev => ({ ...prev, [member.id]: '' }));
                                              }}
                                              className="w-full text-left px-2 py-1.5 text-sm text-zinc-300 rounded hover:bg-zinc-700"
                                            >
                                              {skill.name}
                                            </button>
                                          ))
                                        }

                                        {/* CREATE CUSTOM SKILL - shows when search doesn't match */}
                                        {skillSearchFor[member.id] &&
                                         skillSearchFor[member.id].length > 1 &&
                                         !availableSkills.some(s => s.name.toLowerCase() === skillSearchFor[member.id].toLowerCase()) && (
                                          <button
                                            onClick={() => createAndAddSkill(member.id, skillSearchFor[member.id])}
                                            className="w-full text-left px-2 py-1.5 text-sm rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 flex items-center gap-2"
                                          >
                                            <Plus className="w-3 h-3" />
                                            Create &quot;{skillSearchFor[member.id]}&quot;
                                          </button>
                                        )}

                                        {/* No results message */}
                                        {skillSearchFor[member.id] &&
                                         availableSkills
                                           .filter(s => !member.workerSkills?.some(ws => ws.skillId === s.id))
                                           .filter(s => s.name.toLowerCase().includes(skillSearchFor[member.id].toLowerCase()))
                                           .length === 0 &&
                                         !(skillSearchFor[member.id].length > 1) && (
                                          <p className="px-2 py-3 text-sm text-zinc-500 text-center">No matching skills</p>
                                        )}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>
                            </td>

                            {/* Hours This Week - Right Aligned */}
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-medium text-zinc-100 tabular-nums">
                                {member.hoursThisWeek || 0}h
                              </span>
                            </td>

                            {/* Next Job */}
                            <td className="px-4 py-3">
                              {member.nextJob ? (
                                <div>
                                  <div className="text-sm font-medium text-zinc-200">
                                    {format(new Date(member.nextJob.startTime), 'EEE, MMM d')}
                                  </div>
                                  <div className="text-xs text-zinc-500">
                                    {format(new Date(member.nextJob.startTime), 'h:mm a')} · {member.nextJob.serviceType}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-zinc-600">No upcoming jobs</span>
                              )}
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {filteredTeamMembers.length === 0 && (
                      <div className="py-12 text-center text-zinc-500">
                        <Users className="w-8 h-8 mx-auto mb-2" />
                        <p>No team members found</p>
                      </div>
                    )}
                    </div>
                  </div>

                  {/* SUMMARY ROW */}
                  <div className="flex items-center justify-between text-sm text-zinc-500">
                    <span>{filteredTeamMembers.length} of {teamMembers.length} members</span>
                    <span>
                      {teamMembers.filter(m => m.role === 'field' && m.status === 'active').length} field workers active
                    </span>
                  </div>
                </>
              )}

            </div>
          )}

          {/* Crews Tab */}
          {activeTab === 'crews' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <p className="text-zinc-400 text-sm">{crews.length} crews configured</p>
              </div>

              {/* Crews Grid */}
              {loadingCrews ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                </div>
              ) : crews.length === 0 ? (
                /* SMART EMPTY STATE */
                <div className="max-w-2xl mx-auto">
                  <div className="text-center py-12 px-6 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-100 mb-2">Create Your First Crew</h3>
                    <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                      Crews help you organize field workers into teams for efficient job scheduling and assignment.
                    </p>

                    {isOwner && (
                      <>
                        <div className="flex gap-3 justify-center mb-8">
                          <Button
                            onClick={() => handleOpenCrewDialog()}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Create First Crew
                          </Button>
                          <Button
                            onClick={autoGenerateCrews}
                            variant="outline"
                            className="border-zinc-600 hover:bg-zinc-800"
                            disabled={loading}
                          >
                            <Lightbulb className="w-4 h-4 mr-2" />
                            Auto-generate from Skills
                          </Button>
                        </div>

                        {/* Helpful Tips */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                          <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                            <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center mb-3">
                              <Users className="w-4 h-4 text-blue-400" />
                            </div>
                            <h4 className="text-sm font-medium text-zinc-200 mb-1">Organize by Skills</h4>
                            <p className="text-xs text-zinc-500">
                              Group workers with complementary skills for balanced teams
                            </p>
                          </div>
                          <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                            <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center mb-3">
                              <Calendar className="w-4 h-4 text-purple-400" />
                            </div>
                            <h4 className="text-sm font-medium text-zinc-200 mb-1">Faster Scheduling</h4>
                            <p className="text-xs text-zinc-500">
                              Assign entire crews to jobs in one click on the calendar
                            </p>
                          </div>
                          <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                            <div className="w-8 h-8 bg-amber-600/20 rounded-lg flex items-center justify-center mb-3">
                              <Crown className="w-4 h-4 text-amber-400" />
                            </div>
                            <h4 className="text-sm font-medium text-zinc-200 mb-1">Assign Leaders</h4>
                            <p className="text-xs text-zinc-500">
                              Designate crew leaders to manage daily operations
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : crews.length <= 2 ? (
                /* SUGGESTION FOR FEW CREWS */
                <div className="mb-4">
                  <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-blue-200 font-medium mb-1">Tip: Organize More Crews</p>
                      <p className="text-xs text-blue-300/80">
                        Having multiple crews helps with workload distribution and scheduling flexibility. Consider organizing by geography, specialization, or equipment.
                      </p>
                    </div>
                  </div>
                  {/* Render crew cards (same as normal grid) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {crews.map((crew) => {
                      const crewSkills = crew.skills || [];
                      const leader = crew.users.find(m => m.id === crew.leaderId);

                      return (
                        <div key={crew.id} className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
                          <div className="h-2" style={{ backgroundColor: crew.color || '#10b981' }} />
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg text-zinc-100">{crew.name}</h3>
                                <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-400">
                                  {crew.memberCount} members
                                </Badge>
                              </div>
                              {isOwner && (
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-zinc-700" onClick={() => handleOpenCrewDialog(crew)}>
                                    <Pencil className="w-4 h-4 text-zinc-400" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-zinc-700" onClick={() => setDeletingCrew(crew)}>
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                  </Button>
                                </div>
                              )}
                            </div>

                            {leader && (
                              <div className="flex items-center gap-2 mb-3 p-2 bg-zinc-700/50 rounded">
                                <Crown className="w-4 h-4 text-yellow-400" />
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs" style={{ backgroundColor: leader.color || '#10b981' }}>
                                    {leader.firstName[0]}{leader.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-zinc-200">{leader.firstName} {leader.lastName}</span>
                                <Badge className="text-xs ml-auto bg-yellow-600">Leader</Badge>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-zinc-700/30 rounded-lg">
                              <div>
                                <div className="text-xs text-zinc-500 mb-1">Next Job</div>
                                {crew.nextJob ? (
                                  <div>
                                    <div className="text-sm font-medium text-zinc-200">{format(new Date(crew.nextJob.startTime), 'EEE, MMM d')}</div>
                                    <div className="text-xs text-zinc-400">{format(new Date(crew.nextJob.startTime), 'h:mm a')}</div>
                                  </div>
                                ) : (
                                  <div className="text-sm text-zinc-500">No jobs scheduled</div>
                                )}
                              </div>
                              <div>
                                <div className="text-xs text-zinc-500 mb-1">Needs Attention</div>
                                {crew.unassignedToday && crew.unassignedToday > 0 ? (
                                  <div className="text-sm font-medium text-yellow-400">{crew.unassignedToday} unassigned today</div>
                                ) : (
                                  <div className="text-sm text-green-400">All assigned ✓</div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="text-xs text-zinc-500 uppercase mb-2">Members ({crew.users.length})</div>
                              <div className="space-y-1">
                                {crew.users.map(member => (
                                  <div key={member.id} className="flex items-center justify-between p-2 rounded bg-zinc-700/30 hover:bg-zinc-700/50">
                                    <div className="flex items-center gap-2">
                                      <Avatar className="w-7 h-7">
                                        <AvatarFallback className="text-xs" style={{ backgroundColor: member.color || '#10b981' }}>
                                          {member.firstName[0]}{member.lastName[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="text-sm font-medium text-zinc-200 flex items-center gap-1">
                                          {member.firstName} {member.lastName}
                                          {member.id === crew.leaderId && <Crown className="w-3 h-3 text-yellow-400" />}
                                        </div>
                                        <div className="text-xs text-zinc-500 capitalize">
                                          {member.role === 'field' ? 'Field Worker' :
                                           member.role === 'office' ? 'Office' :
                                           member.role === 'owner' ? 'Owner' : member.role}
                                        </div>
                                      </div>
                                    </div>
                                    <span className="text-xs font-medium text-zinc-400">{member.hoursThisWeek || 0}h</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex gap-2 mb-3">
                              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => console.log('Assign jobs to crew:', crew.id)}>
                                <CalendarPlus className="w-4 h-4 mr-1" />
                                Assign Jobs
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1 border-zinc-600 hover:bg-zinc-800" onClick={() => window.location.href = `/provider/calendar?crew=${crew.id}`}>
                                <Calendar className="w-4 h-4 mr-1" />
                                Schedule
                              </Button>
                              <Button size="sm" variant="ghost" className="hover:bg-zinc-700" onClick={() => handleOpenCrewDialog(crew)}>
                                <Settings className="w-4 h-4" />
                              </Button>
                            </div>

                            {crewSkills.length > 0 && (
                              <div className="pt-3 border-t border-zinc-700">
                                <div className="flex flex-wrap gap-1">
                                  {crewSkills.slice(0, 4).map(skill => (
                                    <Badge key={skill} variant="secondary" className="text-xs bg-zinc-700/50 border-zinc-600">{skill}</Badge>
                                  ))}
                                  {crewSkills.length > 4 && (
                                    <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-400">+{crewSkills.length - 4}</Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {crews.map((crew) => {
                    const isExpanded = expandedCrews[crew.id];
                    const totalHoursThisWeek = crew.users.reduce((sum, m) => sum + (m.hoursThisWeek || 0), 0);
                    const crewSkills = Array.from(new Set(crew.users.flatMap(m => m.workerSkills?.map(ws => ws.skill.name) || [])));
                    const leader = crew.users.find(m => m.id === crew.leaderId);

                    return (
                      <div key={crew.id} className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
                        {/* Color bar */}
                        <div className="h-2" style={{ backgroundColor: crew.color || '#10b981' }} />

                        <div className="p-4">
                          {/* Crew name + actions */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg text-zinc-100">{crew.name}</h3>
                              <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-400">
                                {crew.memberCount} members
                              </Badge>
                            </div>
                            {isOwner && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-7 h-7 hover:bg-zinc-700"
                                  onClick={() => handleOpenCrewDialog(crew)}
                                >
                                  <Pencil className="w-4 h-4 text-zinc-400" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-7 h-7 hover:bg-zinc-700"
                                  onClick={() => setDeletingCrew(crew)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Crew Leader */}
                          {leader && (
                            <div className="flex items-center gap-2 mb-3 p-2 bg-zinc-700/50 rounded">
                              <Crown className="w-4 h-4 text-yellow-400" />
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs" style={{ backgroundColor: leader.color || '#10b981' }}>
                                  {leader.firstName[0]}{leader.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-zinc-200">{leader.firstName} {leader.lastName}</span>
                              <Badge className="text-xs ml-auto bg-yellow-600">Leader</Badge>
                            </div>
                          )}

                          {/* Better Metrics - Actionable Info */}
                          <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-zinc-700/30 rounded-lg">
                            {/* Next Job */}
                            <div>
                              <div className="text-xs text-zinc-500 mb-1">Next Job</div>
                              {crew.nextJob ? (
                                <div>
                                  <div className="text-sm font-medium text-zinc-200">{format(new Date(crew.nextJob.startTime), 'EEE, MMM d')}</div>
                                  <div className="text-xs text-zinc-400">{format(new Date(crew.nextJob.startTime), 'h:mm a')}</div>
                                </div>
                              ) : (
                                <div className="text-sm text-zinc-500">No jobs scheduled</div>
                              )}
                            </div>

                            {/* Unassigned */}
                            <div>
                              <div className="text-xs text-zinc-500 mb-1">Needs Attention</div>
                              {crew.unassignedToday && crew.unassignedToday > 0 ? (
                                <div className="text-sm font-medium text-yellow-400">
                                  {crew.unassignedToday} unassigned today
                                </div>
                              ) : (
                                <div className="text-sm text-green-400">All assigned ✓</div>
                              )}
                            </div>
                          </div>

                          {/* Members List - Always Visible */}
                          <div className="space-y-2 mb-4">
                            <div className="text-xs text-zinc-500 uppercase mb-2">Members ({crew.users.length})</div>
                            <div className="space-y-1">
                              {crew.users.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-2 rounded bg-zinc-700/30 hover:bg-zinc-700/50">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-7 h-7">
                                      <AvatarFallback className="text-xs" style={{ backgroundColor: member.color || '#10b981' }}>
                                        {member.firstName[0]}{member.lastName[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="text-sm font-medium text-zinc-200 flex items-center gap-1">
                                        {member.firstName} {member.lastName}
                                        {member.id === crew.leaderId && (
                                          <Crown className="w-3 h-3 text-yellow-400" />
                                        )}
                                      </div>
                                      <div className="text-xs text-zinc-500 capitalize">
                                        {member.role === 'field' ? 'Field Worker' :
                                         member.role === 'office' ? 'Office' :
                                         member.role === 'owner' ? 'Owner' : member.role}
                                      </div>
                                    </div>
                                  </div>
                                  <span className="text-xs font-medium text-zinc-400">{member.hoursThisWeek || 0}h</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Primary Action Buttons */}
                          <div className="flex gap-2 mb-3">
                            <Button
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                // TODO: Navigate to calendar with crew filter or open job assignment modal
                                console.log('Assign jobs to crew:', crew.id);
                              }}
                            >
                              <CalendarPlus className="w-4 h-4 mr-1" />
                              Assign Jobs
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-zinc-600 hover:bg-zinc-800"
                              onClick={() => {
                                // TODO: Navigate to calendar with crew filter
                                window.location.href = `/provider/calendar?crew=${crew.id}`;
                              }}
                            >
                              <Calendar className="w-4 h-4 mr-1" />
                              Schedule
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="hover:bg-zinc-700"
                              onClick={() => handleOpenCrewDialog(crew)}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Skills coverage */}
                          {crewSkills.length > 0 && (
                            <div className="pt-3 border-t border-zinc-700">
                              <div className="flex flex-wrap gap-1">
                                {crewSkills.slice(0, 4).map(skill => (
                                  <Badge key={skill} variant="secondary" className="text-xs bg-zinc-700/50 border-zinc-600">
                                    {skill}
                                  </Badge>
                                ))}
                                {crewSkills.length > 4 && (
                                  <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-400">
                                    +{crewSkills.length - 4}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Time Off Tab */}
          {activeTab === 'time-off' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-100">Time Off Requests</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchTimeOffRequests}
                  disabled={loadingTimeOff}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingTimeOff ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {loadingTimeOff ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                </div>
              ) : timeOffRequests.length === 0 ? (
                <Card className="bg-zinc-800 border-zinc-700">
                  <CardContent className="p-8 text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-zinc-500" />
                    <h3 className="text-lg font-medium text-zinc-200 mb-2">No Time Off Requests</h3>
                    <p className="text-sm text-zinc-400">
                      When team members request time off, they&apos;ll appear here for your approval.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {/* Pending requests first */}
                  {timeOffRequests.filter(r => r.status === 'pending').length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Pending Approval ({timeOffRequests.filter(r => r.status === 'pending').length})
                      </h3>
                      <div className="space-y-2">
                        {timeOffRequests
                          .filter(r => r.status === 'pending')
                          .map(request => (
                            <Card key={request.id} className="bg-zinc-800 border-amber-600/30">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <button
                                    onClick={() => request.userId && setProfileWorkerId(request.userId)}
                                    className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                                  >
                                    <Avatar className="h-10 w-10">
                                      <AvatarFallback style={{ backgroundColor: request.user?.color || '#10b981' }}>
                                        {request.user?.firstName?.[0]}{request.user?.lastName?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium text-zinc-100 hover:text-emerald-400 transition-colors">
                                        {request.user?.firstName} {request.user?.lastName}
                                      </div>
                                      <div className="text-sm text-zinc-400">
                                        {format(new Date(request.startDate), 'MMM d')} - {format(new Date(request.endDate), 'MMM d, yyyy')}
                                      </div>
                                    </div>
                                  </button>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="border-zinc-600 text-zinc-300 capitalize">
                                      {request.reason || 'Time off'}
                                    </Badge>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-green-600 text-green-400 hover:bg-green-600/20"
                                        onClick={() => handleTimeOffAction(request.id, 'approved')}
                                        disabled={processingTimeOff === request.id}
                                      >
                                        {processingTimeOff === request.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          'Approve'
                                        )}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-red-600 text-red-400 hover:bg-red-600/20"
                                        onClick={() => handleTimeOffAction(request.id, 'denied')}
                                        disabled={processingTimeOff === request.id}
                                      >
                                        Deny
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                {request.notes && (
                                  <p className="mt-2 text-sm text-zinc-400 pl-13">
                                    Note: {request.notes}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Recent processed requests */}
                  {timeOffRequests.filter(r => r.status !== 'pending').length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-zinc-400 mb-3">Recent Requests</h3>
                      <div className="space-y-2">
                        {timeOffRequests
                          .filter(r => r.status !== 'pending')
                          .slice(0, 10)
                          .map(request => (
                            <Card key={request.id} className="bg-zinc-800/50 border-zinc-700">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <button
                                    onClick={() => request.userId && setProfileWorkerId(request.userId)}
                                    className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                                  >
                                    <Avatar className="h-10 w-10">
                                      <AvatarFallback style={{ backgroundColor: request.user?.color || '#10b981' }}>
                                        {request.user?.firstName?.[0]}{request.user?.lastName?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium text-zinc-100 hover:text-emerald-400 transition-colors">
                                        {request.user?.firstName} {request.user?.lastName}
                                      </div>
                                      <div className="text-sm text-zinc-400">
                                        {format(new Date(request.startDate), 'MMM d')} - {format(new Date(request.endDate), 'MMM d, yyyy')}
                                      </div>
                                    </div>
                                  </button>
                                  <Badge
                                    className={
                                      request.status === 'approved'
                                        ? 'bg-green-600/20 text-green-400 border-green-600/30'
                                        : 'bg-red-600/20 text-red-400 border-red-600/30'
                                    }
                                  >
                                    {request.status}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Payroll Tab */}
          {activeTab === 'payroll' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-100">Payroll</h2>
                <div className="flex items-center gap-2">
                  <Select value={payrollDateRange} onValueChange={(v: any) => setPayrollDateRange(v)}>
                    <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="this-week">This Week</SelectItem>
                      <SelectItem value="last-week">Last Week</SelectItem>
                      <SelectItem value="this-month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchPayroll}
                    disabled={loadingPayroll}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingPayroll ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              {loadingPayroll ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                </div>
              ) : workLogs.length === 0 ? (
                <Card className="bg-zinc-800 border-zinc-700">
                  <CardContent className="p-8 text-center">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 text-zinc-500" />
                    <h3 className="text-lg font-medium text-zinc-200 mb-2">No Work Logs</h3>
                    <p className="text-sm text-zinc-400">
                      When workers clock in and out of jobs, their hours and earnings will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-zinc-800 border-zinc-700">
                      <CardContent className="p-4">
                        <div className="text-sm text-zinc-400">Total Hours</div>
                        <div className="text-2xl font-bold text-zinc-100">
                          {(payrollSummary.totalHours || 0).toFixed(1)}h
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-zinc-800 border-zinc-700">
                      <CardContent className="p-4">
                        <div className="text-sm text-zinc-400">Total Earnings</div>
                        <div className="text-2xl font-bold text-emerald-400">
                          ${(payrollSummary.totalEarnings || 0).toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-zinc-800 border-zinc-700">
                      <CardContent className="p-4">
                        <div className="text-sm text-zinc-400">Unpaid</div>
                        <div className="text-2xl font-bold text-amber-400">
                          ${(payrollSummary.totalUnpaid || 0).toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-zinc-800 border-zinc-700">
                      <CardContent className="p-4">
                        <div className="text-sm text-zinc-400">Tips to Pay</div>
                        <div className="text-2xl font-bold text-emerald-300">
                          ${(payrollSummary.totalTipsEligible || 0).toFixed(2)}
                        </div>
                        {(payrollSummary.totalTipsRecorded || 0) > (payrollSummary.totalTipsEligible || 0) && (
                          <p className="text-xs text-zinc-500 mt-2">
                            Cash tips recorded: ${((payrollSummary.totalTipsRecorded || 0) - (payrollSummary.totalTipsEligible || 0)).toFixed(2)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Card className="bg-zinc-800 border-zinc-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-zinc-100 text-base">Bulk Payout</CardTitle>
                        <CardDescription className="text-zinc-400">
                          Select multiple jobs below or pay everything owed at once.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedTotals.count > 0 ? (
                          <div className="text-xs text-emerald-400 font-medium space-y-1">
                            <div>
                              {selectedTotals.count} job{selectedTotals.count !== 1 ? 's' : ''} •{' '}
                              {selectedTotals.workerCount} worker{selectedTotals.workerCount !== 1 ? 's' : ''} •{' '}
                              {selectedTotals.hours.toFixed(1)}h • ${selectedTotals.amount.toFixed(2)}
                            </div>
                            {selectedTotals.tips > 0 && (
                              <div className="text-emerald-300">
                                Includes ${selectedTotals.tips.toFixed(2)} in tips owed
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-zinc-400">
                            Select rows in the table to build a payout batch.
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={handleMarkSelectedPaid}
                            disabled={selectedTotals.count === 0 || bulkPayLoading}
                            className="bg-emerald-600 hover:bg-emerald-500"
                          >
                            {bulkPayLoading ? (
                              <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                              </span>
                            ) : (
                              `Pay Selected Jobs${selectedTotals.count > 0 ? ` (${selectedTotals.count})` : ''}`
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleMarkAllPaid}
                            disabled={unpaidWorkLogs.length === 0 || bulkPayLoading}
                            className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10"
                          >
                            {bulkPayLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              `Pay All (${unpaidWorkLogs.length} jobs • ${unpaidWorkerCount} workers • $${totalUnpaidAmount.toFixed(2)})`
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-zinc-800 border-zinc-700 lg:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-zinc-100 text-base">Workers Owed</CardTitle>
                        <CardDescription className="text-zinc-400">
                          Pay each worker&apos;s outstanding jobs with a single click.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {payrollByWorker.length === 0 ? (
                          <p className="text-sm text-zinc-400">Everyone is caught up. 🎉</p>
                        ) : (
                          payrollByWorker.map(worker => {
                            const workerId = worker.user?.id || worker.logs?.[0]?.userId;
                            return (
                              <div
                                key={workerId || worker.logs?.[0]?.id}
                                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border border-zinc-700/70 bg-zinc-900/40"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarFallback style={{ backgroundColor: worker.user?.color || '#10b981' }}>
                                      {worker.user?.firstName?.[0] ?? '?'}
                                      {worker.user?.lastName?.[0] ?? ''}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="text-sm font-medium text-zinc-100">
                                      {worker.user
                                        ? `${worker.user.firstName} ${worker.user.lastName}`
                                        : 'Worker'}
                                    </div>
                                    <div className="text-xs text-zinc-400">
                                      {worker.logs?.length || 0} job{(worker.logs?.length || 0) === 1 ? '' : 's'} •{' '}
                                      {worker.totalHours?.toFixed(1) || '0.0'}h
                                    </div>
                                    <div className="text-xs text-zinc-500">
                                      Tips to pay ${worker.totalTips?.toFixed(2) || '0.00'}
                                      {worker.cashTipsKept > 0 && (
                                        <span className="ml-1 text-amber-400">
                                          + ${worker.cashTipsKept.toFixed(2)} cash
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-emerald-400">
                                    ${worker.totalOwed?.toFixed(2) || '0.00'}
                                  </div>
                                  <div className="text-xs text-zinc-500">Outstanding</div>
                                </div>
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-500"
                                  disabled={!workerId || processingWorkerPay === workerId}
                                  onClick={() => workerId && handleMarkWorkerPaid(workerId)}
                                >
                                  {processingWorkerPay === workerId ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'Pay Worker'
                                  )}
                                </Button>
                              </div>
                            );
                          })
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Work Logs Table */}
                  <Card className="bg-zinc-800 border-zinc-700">
                    <CardContent className="p-0">
                      <table className="w-full">
                        <thead className="bg-zinc-900/50">
                          <tr>
                            <th className="w-12 p-4">
                              <input
                                ref={selectAllRef}
                                type="checkbox"
                                className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-emerald-500 focus:ring-emerald-500"
                                onChange={toggleSelectAll}
                                checked={areAllSelected && unpaidWorkLogs.length > 0}
                                disabled={unpaidWorkLogs.length === 0}
                              />
                            </th>
                            <th className="text-left p-4 text-sm font-medium text-zinc-400">Worker</th>
                            <th className="text-left p-4 text-sm font-medium text-zinc-400">Job</th>
                            <th className="text-left p-4 text-sm font-medium text-zinc-400">Date</th>
                            <th className="text-left p-4 text-sm font-medium text-zinc-400">Hours</th>
                            <th className="text-left p-4 text-sm font-medium text-zinc-400">Base Pay</th>
                            <th className="text-left p-4 text-sm font-medium text-zinc-400">Tip</th>
                            <th className="text-left p-4 text-sm font-medium text-zinc-400">Total Due</th>
                            <th className="text-left p-4 text-sm font-medium text-zinc-400">Status</th>
                            <th className="text-right p-4 text-sm font-medium text-zinc-400">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-700">
                          {workLogs.map(log => {
                            const recordedTip = getRecordedTip(log);
                            const tipEligible = getTipEligible(log);
                            const payoutAmount = getPayoutAmount(log);
                            const basePay = Math.max(payoutAmount - tipEligible, 0);

                            return (
                              <tr key={log.id} className="hover:bg-zinc-700/30">
                                <td className="p-4">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-emerald-500 focus:ring-emerald-500"
                                    checked={selectedWorkLogIds.includes(log.id)}
                                  onChange={() => toggleSelectWorkLog(log.id)}
                                  disabled={log.isPaid}
                                />
                              </td>
                              <td className="p-4">
                                <button
                                  onClick={() => log.userId && setProfileWorkerId(log.userId)}
                                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                >
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback style={{ backgroundColor: log.user?.color || '#10b981' }}>
                                      {log.user?.firstName?.[0]}{log.user?.lastName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm text-zinc-200 hover:text-emerald-400 transition-colors">
                                    {log.user?.firstName} {log.user?.lastName}
                                  </span>
                                </button>
                              </td>
                              <td className="p-4 text-sm text-zinc-300">
                                {log.job?.serviceType || 'Unknown'}
                              </td>
                              <td className="p-4 text-sm text-zinc-400">
                                {format(new Date(log.clockIn), 'MMM d, h:mm a')}
                              </td>
                              <td className="p-4 text-sm text-zinc-300">
                                {log.hoursWorked?.toFixed(1) || '-'}h
                              </td>
                              <td className="p-4 text-sm text-zinc-300">
                                ${basePay.toFixed(2)}
                              </td>
                              <td className="p-4 text-sm">
                                {tipEligible > 0 ? (
                                  <div className="text-emerald-400 font-medium">
                                    +${tipEligible.toFixed(2)}
                                    <div className="text-xs text-zinc-500">Card/Check/Invoice</div>
                                  </div>
                                ) : recordedTip > 0 ? (
                                  <div className="text-amber-400 font-medium">
                                    Cash ${recordedTip.toFixed(2)}
                                    <div className="text-xs text-zinc-500">Worker already has it</div>
                                  </div>
                                ) : (
                                  <span className="text-zinc-500">—</span>
                                )}
                              </td>
                              <td className="p-4 text-sm font-medium text-emerald-400">
                                ${payoutAmount.toFixed(2)}
                                {tipEligible > 0 && (
                                  <div className="text-xs text-zinc-500">Includes tip</div>
                                )}
                              </td>
                              <td className="p-4">
                                <Badge
                                  className={
                                    log.isPaid
                                      ? 'bg-green-600/20 text-green-400 border-green-600/30'
                                      : 'bg-amber-600/20 text-amber-400 border-amber-600/30'
                                  }
                                >
                                  {log.isPaid ? 'Paid' : 'Unpaid'}
                                </Badge>
                              </td>
                              <td className="p-4 text-right">
                                {!log.isPaid && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20"
                                    onClick={() => handleMarkPaid(log.id)}
                                    disabled={processingPay === log.id}
                                  >
                                    {processingPay === log.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      'Mark Paid'
                                    )}
                                  </Button>
                                )}
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Crew Create/Edit Dialog */}
      <Dialog open={crewDialogOpen} onOpenChange={setCrewDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              {editingCrew ? 'Edit Crew' : 'Create Crew'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {editingCrew ? 'Update crew details and members' : 'Create a new crew and assign members'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCrew} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="crewName" className="text-zinc-200">Crew Name</Label>
              <Input
                id="crewName"
                value={crewName}
                onChange={(e) => setCrewName(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-zinc-100"
                placeholder="e.g., Morning Crew, Team A"
                required
              />
            </div>

            {/* Crew Color */}
            <div className="space-y-2">
              <Label className="text-zinc-200">Crew Color</Label>
              <div className="flex gap-2 mt-2">
                {['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCrewColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      crewColor === color ? "border-white scale-110" : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Crew Leader */}
            <div className="space-y-2">
              <Label className="text-zinc-200">Crew Leader (optional)</Label>
              <Select value={crewLeaderId || 'none'} onValueChange={(value) => setCrewLeaderId(value === 'none' ? '' : value)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                  <SelectValue placeholder="Select crew leader" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="none" className="text-zinc-400">No leader</SelectItem>
                  {teamMembers.filter(m => m.role === 'field').map((worker) => (
                    <SelectItem key={worker.id} value={worker.id} className="text-zinc-100">
                      {worker.firstName} {worker.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-200">Team Members</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto border border-zinc-800 rounded-lg p-2">
                {teamMembers.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-4">
                    No team members available
                  </p>
                ) : (
                  teamMembers.map((member) => {
                    const isSelected = selectedMemberIds?.includes(member.id) ?? false;
                    return (
                      <label
                        key={member.id}
                        className={`
                          flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all
                          ${isSelected
                            ? 'bg-emerald-500/10 border-2 border-emerald-500/30'
                            : 'bg-zinc-800/30 border-2 border-transparent hover:bg-zinc-800/50'
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMemberIds([...selectedMemberIds, member.id]);
                            } else {
                              setSelectedMemberIds(selectedMemberIds.filter(id => id !== member.id));
                            }
                          }}
                          className="w-4 h-4 rounded border-zinc-600 text-emerald-500 focus:ring-emerald-500"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            {member.profilePhotoUrl ? (
                              <img
                                src={member.profilePhotoUrl}
                                alt={`${member.firstName} ${member.lastName}`}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium text-emerald-400">
                                {member.firstName[0]}{member.lastName[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-200">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-xs text-zinc-500 capitalize">{member.role}</p>
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {selectedMemberIds.length > 0 && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <p className="text-xs text-emerald-400 font-medium">
                  {selectedMemberIds.length} member{selectedMemberIds.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseCrewDialog}
                className="flex-1 border-zinc-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                disabled={savingCrew}
              >
                {savingCrew ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingCrew ? 'Update Crew' : 'Create Crew'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCrew} onOpenChange={() => setDeletingCrew(null)}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">Delete Crew</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete &ldquo;{deletingCrew?.name}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeletingCrew(null)}
              className="border-zinc-700"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCrew}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-500"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Team Member Dialog */}
      <DeleteMemberDialog
        member={deletingMember}
        isOpen={!!deletingMember}
        onClose={() => setDeletingMember(null)}
        onSuccess={(deletedMemberId) => {
          // Optimistic update - remove member from state
          setTeamMembers(prev => prev.filter(m => m.id !== deletedMemberId));
          setDeletingMember(null);
        }}
      />

      {/* Worker Profile Modal (with inline editing) */}
      <WorkerProfileModal
        workerId={profileWorkerId}
        isOpen={!!profileWorkerId}
        onClose={() => setProfileWorkerId(null)}
        onUpdate={() => {
          // Refresh team members after update
          fetchTeamMembers();
        }}
        onDelete={(workerId) => {
          // Remove deleted member from state
          setTeamMembers(prev => prev.filter(m => m.id !== workerId));
        }}
      />

    </ProviderLayout>
  );
}
