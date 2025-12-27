"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import {
  X,
  MapPin,
  Clock,
  User,
  DollarSign,
  Briefcase,
  ChevronRight,
  AlertCircle,
  CalendarX,
  ClockAlert,
  UserX,
  FileWarning,
  Loader2,
  Calendar,
  Phone,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Pencil,
  Save,
  XCircle,
  FileText,
  Users,
  Plus,
  Search,
  Check,
} from 'lucide-react';

export type SidebarMode = 'date' | 'alert' | 'job';
export type AlertType = 'schedule-conflicts' | 'overdue-jobs' | 'unconfirmed-soon' | 'unassigned-jobs' | 'overdue-invoices' | 'overloaded-workers' | 'underutilized-workers' | 'today-jobs';

// Worker type for selection
interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  profilePhotoUrl?: string | null;
  status?: string;
}

// Single job detail for the job mode
export interface JobDetail {
  id: string;
  customerName: string;
  customerPhone?: string;
  serviceType: string;
  address: string;
  startTime: string;
  endTime?: string;
  status: string;
  amount?: number | null;
  estimatedValue?: number | null;
  workerName?: string | null;
  workers?: { id: string; firstName: string; lastName: string }[];
  assignedUserIds?: string[];
  notes?: string;
  durationMinutes?: number;
}

interface Job {
  id: string;
  customerName: string;
  serviceType: string;
  address: string;
  startTime: string;
  endTime?: string;
  status: string;
  amount?: number | null;
  workerName?: string | null;
  phone?: string;
}

interface JobDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  mode: SidebarMode;
  // For date mode
  selectedDate?: string | null;
  // For alert mode
  alertType?: AlertType | null;
  alertCount?: number;
  // For job mode - single job detail view
  selectedJob?: JobDetail | null;
  onJobUpdate?: (updatedJob: JobDetail) => void;
  // Callback when a job is clicked in list view - switches to job detail mode
  onJobSelect?: (job: JobDetail) => void;
}

const alertConfig: Record<AlertType, { title: string; icon: React.ReactNode; description: string; color: string; actionLabel: string }> = {
  'schedule-conflicts': {
    title: 'Schedule Conflicts',
    icon: <AlertCircle className="h-5 w-5" />,
    description: 'Jobs with overlapping times',
    color: 'text-red-500',
    actionLabel: 'View Calendar',
  },
  'overdue-jobs': {
    title: 'Overdue Jobs',
    icon: <CalendarX className="h-5 w-5" />,
    description: 'Jobs past their scheduled time',
    color: 'text-red-500',
    actionLabel: 'View Jobs',
  },
  'unconfirmed-soon': {
    title: 'Starting Soon',
    icon: <ClockAlert className="h-5 w-5" />,
    description: 'Jobs starting within 2 hours',
    color: 'text-orange-500',
    actionLabel: 'View Jobs',
  },
  'unassigned-jobs': {
    title: 'Unassigned Jobs',
    icon: <UserX className="h-5 w-5" />,
    description: 'Jobs that need workers assigned',
    color: 'text-orange-500',
    actionLabel: 'Assign Workers',
  },
  'overdue-invoices': {
    title: 'Overdue Invoices',
    icon: <FileWarning className="h-5 w-5" />,
    description: 'Invoices unpaid for 30+ days',
    color: 'text-amber-500',
    actionLabel: 'View Invoices',
  },
  'overloaded-workers': {
    title: 'Overloaded Workers',
    icon: <User className="h-5 w-5" />,
    description: 'Workers with 8+ jobs this week',
    color: 'text-orange-500',
    actionLabel: 'View Team',
  },
  'underutilized-workers': {
    title: 'Underutilized Workers',
    icon: <User className="h-5 w-5" />,
    description: 'Workers with less than 2 jobs',
    color: 'text-amber-500',
    actionLabel: 'View Team',
  },
  'today-jobs': {
    title: 'Jobs Scheduled Today',
    icon: <Calendar className="h-5 w-5" />,
    description: 'All jobs scheduled for today',
    color: 'text-primary',
    actionLabel: 'View Calendar',
  },
};

export default function JobDetailsSidebar({
  isOpen,
  onClose,
  mode,
  selectedDate,
  alertType,
  alertCount,
  selectedJob,
  onJobUpdate,
  onJobSelect,
}: JobDetailsSidebarProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Edit mode state for single job view
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<JobDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Worker selection state
  const [availableWorkers, setAvailableWorkers] = useState<Worker[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [workerSearchQuery, setWorkerSearchQuery] = useState('');
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const workerDropdownRef = useRef<HTMLDivElement>(null);

  // Reset edit state when sidebar closes or job changes
  useEffect(() => {
    if (!isOpen || mode !== 'job') {
      setIsEditing(false);
      setEditForm(null);
      setSaveSuccess(false);
      setShowWorkerDropdown(false);
      setWorkerSearchQuery('');
    }
  }, [isOpen, mode]);

  // Initialize edit form when selected job changes
  useEffect(() => {
    if (selectedJob && mode === 'job') {
      setEditForm({ ...selectedJob });
      // Initialize selected workers from job data
      const workerIds = selectedJob.assignedUserIds ||
        (selectedJob.workers?.map(w => w.id) || []);
      setSelectedWorkerIds(workerIds);
    }
  }, [selectedJob, mode]);

  // Fetch available workers when entering edit mode
  useEffect(() => {
    if (isEditing && availableWorkers.length === 0) {
      fetchAvailableWorkers();
    }
  }, [isEditing]);

  // Close worker dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workerDropdownRef.current && !workerDropdownRef.current.contains(event.target as Node)) {
        setShowWorkerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAvailableWorkers = async () => {
    setLoadingWorkers(true);
    try {
      const providerId = localStorage.getItem('providerId');
      const res = await fetch(`/api/provider/team?providerId=${providerId}`);
      if (res.ok) {
        const data = await res.json();
        // Filter to only include field workers who are active
        const workers = (data.users || []).filter((u: Worker) =>
          u.role === 'field' && u.status !== 'inactive'
        );
        setAvailableWorkers(workers);
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
    } finally {
      setLoadingWorkers(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (mode === 'date' && selectedDate) {
        fetchJobsByDate();
      } else if (mode === 'alert' && alertType) {
        fetchAlertJobs();
      }
    }
  }, [isOpen, mode, selectedDate, alertType]);

  const fetchJobsByDate = async () => {
    if (!selectedDate) return;

    setLoading(true);
    try {
      const providerId = localStorage.getItem('providerId');
      const res = await fetch(`/api/provider/jobs/by-date?providerId=${providerId}&date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        const jobList = data.data?.jobs || [];
        setJobs(jobList.map((job: any) => ({
          id: job.id,
          customerName: job.customerName,
          serviceType: job.serviceType,
          address: job.address,
          startTime: job.startTime,
          endTime: job.endTime,
          status: job.status,
          amount: job.amount,
          workerName: job.assignedUsers?.map((u: any) => `${u.firstName} ${u.lastName}`).join(', ') || null,
          phone: job.customerPhone,
        })));
        setTotalRevenue(data.data?.summary?.totalRevenue || 0);
      }
    } catch (error) {
      console.error('Error fetching jobs by date:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlertJobs = async () => {
    if (!alertType) return;

    setLoading(true);
    try {
      const providerId = localStorage.getItem('providerId');
      const res = await fetch(`/api/provider/alerts/jobs?providerId=${providerId}&alertType=${alertType}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        const total = (data.jobs || []).reduce((sum: number, job: Job) => sum + (job.amount || 0), 0);
        setTotalRevenue(total);
      }
    } catch (error) {
      console.error('Error fetching alert jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "h:mm a");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'in_progress': return 'bg-orange-500/20 text-orange-400';
      case 'completed': return 'bg-emerald-500/20 text-emerald-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3.5 w-3.5" />;
      case 'in_progress': return <Clock className="h-3.5 w-3.5" />;
      case 'scheduled':
      case 'pending': return <Calendar className="h-3.5 w-3.5" />;
      default: return <AlertTriangle className="h-3.5 w-3.5" />;
    }
  };

  const config = alertType ? alertConfig[alertType] : null;

  // Handle entering edit mode
  const handleStartEdit = () => {
    setIsEditing(true);
    setSaveSuccess(false);
  };

  // Handle save for job edit
  const handleSaveJob = async () => {
    if (!editForm || !selectedJob) return;

    setSaving(true);
    try {
      const providerId = localStorage.getItem('providerId');
      const res = await fetch(`/api/provider/jobs/${selectedJob.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          status: editForm.status,
          startTime: editForm.startTime,
          endTime: editForm.endTime,
          assignedUserIds: selectedWorkerIds,
          actualValue: editForm.amount,
          internalNotes: editForm.notes,
        }),
      });

      if (res.ok) {
        // Update the edit form with selected workers
        const updatedWorkers = availableWorkers.filter(w => selectedWorkerIds.includes(w.id));
        const updatedJob: JobDetail = {
          ...editForm,
          workers: updatedWorkers.map(w => ({ id: w.id, firstName: w.firstName, lastName: w.lastName })),
          assignedUserIds: selectedWorkerIds,
          workerName: updatedWorkers.map(w => `${w.firstName} ${w.lastName}`).join(', ') || null,
        };
        setEditForm(updatedJob);
        setIsEditing(false);
        setSaveSuccess(true);
        // Clear success after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
        if (onJobUpdate) {
          onJobUpdate(updatedJob);
        }
      } else {
        console.error('Failed to save job');
      }
    } catch (error) {
      console.error('Error saving job:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (selectedJob) {
      setEditForm({ ...selectedJob });
      // Reset selected workers
      const workerIds = selectedJob.assignedUserIds ||
        (selectedJob.workers?.map(w => w.id) || []);
      setSelectedWorkerIds(workerIds);
    }
    setShowWorkerDropdown(false);
    setWorkerSearchQuery('');
  };

  // Worker selection helpers
  const toggleWorker = (workerId: string) => {
    setSelectedWorkerIds(prev =>
      prev.includes(workerId)
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  };

  const removeWorker = (workerId: string) => {
    setSelectedWorkerIds(prev => prev.filter(id => id !== workerId));
  };

  const filteredWorkers = availableWorkers.filter(worker => {
    const fullName = `${worker.firstName} ${worker.lastName}`.toLowerCase();
    return fullName.includes(workerSearchQuery.toLowerCase());
  });

  const getWorkerInitials = (worker: Worker) => {
    return `${worker.firstName[0]}${worker.lastName[0]}`.toUpperCase();
  };

  // Determine title and subtitle based on mode
  const getTitle = () => {
    if (mode === 'job' && selectedJob) {
      return selectedJob.customerName;
    }
    if (mode === 'date' && selectedDate) {
      return format(new Date(selectedDate + 'T12:00:00'), 'EEEE, MMMM d');
    }
    return config?.title || 'Jobs';
  };

  const getSubtitle = () => {
    if (mode === 'job' && selectedJob) {
      return selectedJob.serviceType;
    }
    if (mode === 'date') {
      return `${jobs.length} job${jobs.length !== 1 ? 's' : ''} • ${formatCurrency(totalRevenue)} total`;
    }
    return config?.description || '';
  };

  const getIcon = () => {
    if (mode === 'job') {
      return <Briefcase className="h-5 w-5 text-primary" />;
    }
    if (mode === 'date') {
      return <Calendar className="h-5 w-5 text-primary" />;
    }
    return config?.icon;
  };

  const getViewAllHref = () => {
    if (mode === 'date' && selectedDate) {
      return `/provider/calendar?date=${selectedDate}`;
    }
    switch (alertType) {
      case 'schedule-conflicts': return '/provider/calendar';
      case 'overdue-jobs': return '/provider/jobs?status=overdue';
      case 'unconfirmed-soon': return '/provider/jobs?status=pending';
      case 'unassigned-jobs': return '/provider/calendar';
      case 'overdue-invoices': return '/provider/invoices?status=overdue';
      case 'overloaded-workers': return '/provider/team';
      case 'underutilized-workers': return '/provider/team';
      case 'today-jobs': return '/provider/calendar';
      default: return '/provider/jobs';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-in Panel from Right */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full sm:w-[500px] bg-card border-l border-border z-50 transition-transform duration-300 ease-out shadow-2xl flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-card border-b border-border z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center ${config?.color || 'text-primary'}`}>
                {getIcon()}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{getTitle()}</h2>
                <p className="text-xs text-muted-foreground">{getSubtitle()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Edit button for job mode */}
              {mode === 'job' && selectedJob && !isEditing && (
                <button
                  onClick={handleStartEdit}
                  className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                  title="Edit job"
                >
                  <Pencil className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {/* Job Detail Mode */}
          {mode === 'job' && selectedJob && editForm ? (
            <div className="space-y-4">
              {/* Success message */}
              {saveSuccess && (
                <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Changes saved successfully!</span>
                </div>
              )}

              {/* Status - Badge in view mode, Dropdown in edit mode */}
              {isEditing ? (
                <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Status</span>
                  </div>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium capitalize ${getStatusColor(editForm.status)}`}>
                    {getStatusIcon(editForm.status)}
                    {editForm.status.replace('_', ' ')}
                  </span>
                </div>
              )}

              {/* Customer Info */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <User className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Customer</span>
                </div>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editForm.customerName}
                      onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="Customer name"
                    />
                    <input
                      type="tel"
                      value={editForm.customerPhone || ''}
                      onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="Phone number"
                    />
                  </div>
                ) : (
                  <>
                    <p className="text-base font-semibold text-foreground">{editForm.customerName}</p>
                    {editForm.customerPhone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <a href={`tel:${editForm.customerPhone}`} className="text-sm hover:text-primary transition-colors">
                          {editForm.customerPhone}
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Service Type */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Briefcase className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Service</span>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.serviceType}
                    onChange={(e) => setEditForm({ ...editForm, serviceType: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    placeholder="Service type"
                  />
                ) : (
                  <p className="text-sm font-medium text-primary">{editForm.serviceType}</p>
                )}
              </div>

              {/* Schedule */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Schedule</span>
                </div>
                {isEditing ? (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Start Time</label>
                      <input
                        type="datetime-local"
                        value={editForm.startTime ? format(new Date(editForm.startTime), "yyyy-MM-dd'T'HH:mm") : ''}
                        onChange={(e) => setEditForm({ ...editForm, startTime: new Date(e.target.value).toISOString() })}
                        className="w-full bg-[#1a1a1a] border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">End Time</label>
                      <input
                        type="datetime-local"
                        value={editForm.endTime ? format(new Date(editForm.endTime), "yyyy-MM-dd'T'HH:mm") : ''}
                        onChange={(e) => setEditForm({ ...editForm, endTime: new Date(e.target.value).toISOString() })}
                        className="w-full bg-[#1a1a1a] border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-foreground">
                      {format(new Date(editForm.startTime), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-sm">
                        {formatDateTime(editForm.startTime)}
                        {editForm.endTime && ` - ${formatDateTime(editForm.endTime)}`}
                      </span>
                    </div>
                    {editForm.durationMinutes && (
                      <p className="text-xs text-muted-foreground">
                        Est. duration: {editForm.durationMinutes} min
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Location */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Location</span>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    placeholder="Address"
                  />
                ) : (
                  <p className="text-sm text-foreground">{editForm.address}</p>
                )}
              </div>

              {/* Assigned Workers */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Assigned Workers</span>
                </div>
                {isEditing ? (
                  <div className="space-y-3" ref={workerDropdownRef}>
                    {/* Selected workers as chips */}
                    {selectedWorkerIds.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedWorkerIds.map((workerId) => {
                          const worker = availableWorkers.find(w => w.id === workerId);
                          // Also check original job workers if not in available workers yet
                          const originalWorker = editForm.workers?.find(w => w.id === workerId);
                          const workerName = worker
                            ? `${worker.firstName} ${worker.lastName}`
                            : originalWorker
                              ? `${originalWorker.firstName} ${originalWorker.lastName}`
                              : 'Unknown Worker';
                          const initials = worker
                            ? getWorkerInitials(worker)
                            : originalWorker
                              ? `${originalWorker.firstName[0]}${originalWorker.lastName[0]}`.toUpperCase()
                              : '??';
                          return (
                            <span
                              key={workerId}
                              className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-muted text-primary rounded-lg text-xs font-medium group"
                            >
                              <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-semibold text-primary">
                                {initials}
                              </span>
                              {workerName}
                              <button
                                onClick={() => removeWorker(workerId)}
                                className="p-0.5 hover:bg-red-500/20 rounded-full transition-colors"
                              >
                                <X className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Worker button / dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowWorkerDropdown(!showWorkerDropdown)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] hover:bg-muted border border-border rounded-lg text-sm text-primary font-medium transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add Worker
                      </button>

                      {showWorkerDropdown && (
                        <div className="absolute left-0 top-full mt-2 w-full bg-[#1a1a1a] border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                          {/* Search input */}
                          <div className="p-3 border-b border-border">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <input
                                type="text"
                                value={workerSearchQuery}
                                onChange={(e) => setWorkerSearchQuery(e.target.value)}
                                placeholder="Search workers..."
                                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                autoFocus
                              />
                            </div>
                          </div>

                          {/* Worker list */}
                          <div className="max-h-48 overflow-y-auto">
                            {loadingWorkers ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                              </div>
                            ) : filteredWorkers.length === 0 ? (
                              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                                {workerSearchQuery ? 'No workers found' : 'No available workers'}
                              </div>
                            ) : (
                              filteredWorkers.map((worker) => {
                                const isSelected = selectedWorkerIds.includes(worker.id);
                                return (
                                  <button
                                    key={worker.id}
                                    type="button"
                                    onClick={() => toggleWorker(worker.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors ${
                                      isSelected ? 'bg-primary/10' : ''
                                    }`}
                                  >
                                    <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground">
                                      {getWorkerInitials(worker)}
                                    </span>
                                    <span className="flex-1 text-sm font-medium text-foreground">
                                      {worker.firstName} {worker.lastName}
                                    </span>
                                    {isSelected && (
                                      <Check className="h-4 w-4 text-primary" />
                                    )}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : selectedWorkerIds.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedWorkerIds.map((workerId) => {
                      const worker = availableWorkers.find(w => w.id === workerId);
                      const originalWorker = editForm.workers?.find(w => w.id === workerId);
                      const workerName = worker
                        ? `${worker.firstName} ${worker.lastName}`
                        : originalWorker
                          ? `${originalWorker.firstName} ${originalWorker.lastName}`
                          : editForm.workerName || 'Unknown Worker';
                      return (
                        <span key={workerId} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                          <User className="h-3 w-3" />
                          {workerName}
                        </span>
                      );
                    })}
                  </div>
                ) : editForm.workers && editForm.workers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {editForm.workers.map((worker) => (
                      <span key={worker.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                        <User className="h-3 w-3" />
                        {worker.firstName} {worker.lastName}
                      </span>
                    ))}
                  </div>
                ) : editForm.workerName ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    <User className="h-3 w-3" />
                    {editForm.workerName}
                  </span>
                ) : (
                  <p className="text-sm text-orange-500 flex items-center gap-1.5">
                    <UserX className="h-4 w-4" />
                    No workers assigned
                  </p>
                )}
              </div>

              {/* Amount */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Amount</span>
                </div>
                {isEditing ? (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <input
                      type="number"
                      value={editForm.amount || editForm.estimatedValue || ''}
                      onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || null })}
                      className="w-full bg-[#1a1a1a] border border-border rounded-lg pl-7 pr-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                ) : (
                  <p className="text-lg font-bold text-emerald-500">
                    {formatCurrency(editForm.amount || editForm.estimatedValue || 0)}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Notes</span>
                </div>
                {isEditing ? (
                  <textarea
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-border rounded-lg px-3 py-2.5 text-sm text-foreground min-h-[80px] resize-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    placeholder="Add notes..."
                  />
                ) : editForm.notes ? (
                  <p className="text-sm text-foreground whitespace-pre-wrap">{editForm.notes}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No notes</p>
                )}
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : jobs.length === 0 && mode !== 'job' ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Briefcase className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No jobs found</p>
              <p className="text-xs mt-1">
                {mode === 'date' ? 'No jobs on this date' : 'This alert may have been resolved'}
              </p>
            </div>
          ) : (
            jobs.map((job) => (
              <button
                key={job.id}
                onClick={() => {
                  // Convert Job to JobDetail and call onJobSelect to switch to job detail mode
                  if (onJobSelect) {
                    const jobDetail: JobDetail = {
                      id: job.id,
                      customerName: job.customerName,
                      customerPhone: job.phone,
                      serviceType: job.serviceType,
                      address: job.address,
                      startTime: job.startTime,
                      endTime: job.endTime,
                      status: job.status,
                      amount: job.amount,
                      workerName: job.workerName,
                    };
                    onJobSelect(jobDetail);
                  }
                }}
                className="w-full bg-muted/30 hover:bg-muted/50 border border-border hover:border-primary/30 rounded-xl p-4 text-left transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Customer Name + Status */}
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground truncate">{job.customerName}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${getStatusColor(job.status)}`}>
                        {getStatusIcon(job.status)}
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Service Type */}
                    <div className="flex items-center gap-2 text-primary">
                      <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="text-xs font-medium truncate">{job.serviceType}</span>
                    </div>

                    {/* Address */}
                    {job.address && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                        <span className="text-xs truncate">{job.address}</span>
                      </div>
                    )}

                    {/* Time */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="text-xs">
                        {formatDateTime(job.startTime)}
                        {job.endTime && ` - ${formatDateTime(job.endTime)}`}
                      </span>
                    </div>

                    {/* Worker and Amount */}
                    <div className="flex items-center justify-between pt-1">
                      {job.workerName ? (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <User className="h-3 w-3 flex-shrink-0" />
                          <span className="text-xs">{job.workerName}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-orange-500">
                          <UserX className="h-3 w-3 flex-shrink-0" />
                          <span className="text-xs font-medium">Needs worker</span>
                        </div>
                      )}

                      {job.amount && job.amount > 0 && (
                        <span className="text-xs font-semibold text-emerald-500">
                          {formatCurrency(job.amount)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer with total and action */}
        <div className="flex-shrink-0 bg-card border-t border-border p-4 space-y-3">
          {/* Job mode - Edit actions (only show when editing) */}
          {mode === 'job' && selectedJob && isEditing && (
            <div className="flex gap-3">
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="flex-1 py-3 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={handleSaveJob}
                disabled={saving}
                className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* Job mode - Edit button + Close button when not editing */}
          {mode === 'job' && selectedJob && !isEditing && (
            <div className="space-y-3">
              {/* Large Edit Job Details button - triggers inline edit mode */}
              <button
                onClick={handleStartEdit}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors flex items-center justify-center gap-3 text-base"
              >
                <Pencil className="h-5 w-5" />
                Edit Job Details
              </button>
              {/* Close button */}
              <button
                onClick={onClose}
                className="w-full py-3 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Close
              </button>
            </div>
          )}

          {/* Total Revenue for date mode */}
          {mode === 'date' && totalRevenue > 0 && (
            <div className="flex items-center justify-between px-2 py-2 bg-emerald-500/10 rounded-lg">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <span className="text-lg font-bold text-emerald-500">{formatCurrency(totalRevenue)}</span>
            </div>
          )}

          {/* Navigation button for date and alert modes */}
          {mode !== 'job' && (
            <button
              onClick={() => {
                router.push(getViewAllHref());
                onClose();
              }}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {mode === 'alert' ? config?.actionLabel : 'View in Calendar'}
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
