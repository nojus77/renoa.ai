"use client";

import { useState, useEffect } from 'react';
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
} from 'lucide-react';

export type SidebarMode = 'date' | 'alert' | 'job';
export type AlertType = 'schedule-conflicts' | 'overdue-jobs' | 'unconfirmed-soon' | 'unassigned-jobs' | 'overdue-invoices' | 'overloaded-workers' | 'underutilized-workers' | 'today-jobs';

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
  notes?: string;
  estimatedDuration?: number;
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

  // Reset edit state when sidebar closes or job changes
  useEffect(() => {
    if (!isOpen || mode !== 'job') {
      setIsEditing(false);
      setEditForm(null);
    }
  }, [isOpen, mode]);

  // Initialize edit form when selected job changes
  useEffect(() => {
    if (selectedJob && mode === 'job') {
      setEditForm({ ...selectedJob });
    }
  }, [selectedJob, mode]);

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
          ...editForm,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsEditing(false);
        if (onJobUpdate) {
          onJobUpdate(editForm);
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
    }
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
        className={`fixed right-0 top-0 bottom-0 w-full sm:w-[450px] bg-card border-l border-border z-50 transition-transform duration-300 ease-out shadow-2xl flex flex-col ${
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
                  onClick={() => setIsEditing(true)}
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
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium capitalize ${getStatusColor(selectedJob.status)}`}>
                  {getStatusIcon(selectedJob.status)}
                  {selectedJob.status.replace('_', ' ')}
                </span>
                {isEditing && (
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="text-xs bg-muted border border-border rounded-lg px-2 py-1 text-foreground"
                  >
                    <option value="pending">Pending</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                )}
              </div>

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
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                      placeholder="Customer name"
                    />
                    <input
                      type="tel"
                      value={editForm.customerPhone || ''}
                      onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                      placeholder="Phone number"
                    />
                  </div>
                ) : (
                  <>
                    <p className="text-base font-semibold text-foreground">{selectedJob.customerName}</p>
                    {selectedJob.customerPhone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <a href={`tel:${selectedJob.customerPhone}`} className="text-sm hover:text-primary transition-colors">
                          {selectedJob.customerPhone}
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
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                    placeholder="Service type"
                  />
                ) : (
                  <p className="text-sm font-medium text-primary">{selectedJob.serviceType}</p>
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
                      <label className="text-xs text-muted-foreground">Start Time</label>
                      <input
                        type="datetime-local"
                        value={editForm.startTime ? format(new Date(editForm.startTime), "yyyy-MM-dd'T'HH:mm") : ''}
                        onChange={(e) => setEditForm({ ...editForm, startTime: new Date(e.target.value).toISOString() })}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">End Time</label>
                      <input
                        type="datetime-local"
                        value={editForm.endTime ? format(new Date(editForm.endTime), "yyyy-MM-dd'T'HH:mm") : ''}
                        onChange={(e) => setEditForm({ ...editForm, endTime: new Date(e.target.value).toISOString() })}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-foreground">
                      {format(new Date(selectedJob.startTime), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-sm">
                        {formatDateTime(selectedJob.startTime)}
                        {selectedJob.endTime && ` - ${formatDateTime(selectedJob.endTime)}`}
                      </span>
                    </div>
                    {selectedJob.estimatedDuration && (
                      <p className="text-xs text-muted-foreground">
                        Est. duration: {selectedJob.estimatedDuration} min
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
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                    placeholder="Address"
                  />
                ) : (
                  <p className="text-sm text-foreground">{selectedJob.address}</p>
                )}
              </div>

              {/* Assigned Workers */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Assigned Workers</span>
                </div>
                {selectedJob.workers && selectedJob.workers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.workers.map((worker) => (
                      <span key={worker.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                        <User className="h-3 w-3" />
                        {worker.firstName} {worker.lastName}
                      </span>
                    ))}
                  </div>
                ) : selectedJob.workerName ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    <User className="h-3 w-3" />
                    {selectedJob.workerName}
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
                  <input
                    type="number"
                    value={editForm.amount || editForm.estimatedValue || ''}
                    onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || null })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                    placeholder="Amount"
                  />
                ) : (
                  <p className="text-lg font-bold text-emerald-500">
                    {formatCurrency(selectedJob.amount || selectedJob.estimatedValue || 0)}
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
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground min-h-[80px] resize-none"
                    placeholder="Add notes..."
                  />
                ) : selectedJob.notes ? (
                  <p className="text-sm text-foreground whitespace-pre-wrap">{selectedJob.notes}</p>
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

          {/* Job mode - Close button when not editing (NO navigation) */}
          {mode === 'job' && selectedJob && !isEditing && (
            <button
              onClick={onClose}
              className="w-full py-3 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Close
            </button>
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
