"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
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
} from 'lucide-react';

export type AlertType = 'schedule-conflicts' | 'overdue-jobs' | 'unconfirmed-soon' | 'unassigned-jobs' | 'overdue-invoices';

interface AlertJobsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  alertType: AlertType | null;
  alertDetails: { count: number; href: string } | null;
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
}

const alertConfig: Record<AlertType, { title: string; icon: React.ReactNode; description: string; color: string }> = {
  'schedule-conflicts': {
    title: 'Schedule Conflicts',
    icon: <AlertCircle className="h-5 w-5" />,
    description: 'These jobs have overlapping times',
    color: 'text-red-500',
  },
  'overdue-jobs': {
    title: 'Overdue Jobs',
    icon: <CalendarX className="h-5 w-5" />,
    description: 'Jobs past their scheduled time',
    color: 'text-red-500',
  },
  'unconfirmed-soon': {
    title: 'Starting Soon',
    icon: <ClockAlert className="h-5 w-5" />,
    description: 'Jobs starting within 2 hours',
    color: 'text-orange-500',
  },
  'unassigned-jobs': {
    title: 'Unassigned Jobs',
    icon: <UserX className="h-5 w-5" />,
    description: 'Jobs that need workers assigned',
    color: 'text-orange-500',
  },
  'overdue-invoices': {
    title: 'Overdue Invoices',
    icon: <FileWarning className="h-5 w-5" />,
    description: 'Invoices unpaid for 30+ days',
    color: 'text-amber-500',
  },
};

export default function AlertJobsSidebar({ isOpen, onClose, alertType, alertDetails }: AlertJobsSidebarProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && alertType) {
      fetchAlertJobs();
    }
  }, [isOpen, alertType]);

  const fetchAlertJobs = async () => {
    if (!alertType) return;

    setLoading(true);
    try {
      const providerId = localStorage.getItem('providerId');
      const res = await fetch(`/api/provider/alerts/jobs?providerId=${providerId}&alertType=${alertType}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
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
    return format(date, "EEE, MMM d 'at' h:mm a");
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

  const config = alertType ? alertConfig[alertType] : null;

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
        className={`fixed right-0 top-0 bottom-0 w-full sm:w-[450px] bg-card border-l border-border z-50 transition-transform duration-300 ease-out shadow-2xl ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center ${config?.color || ''}`}>
                {config?.icon}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{config?.title || 'Alert'}</h2>
                <p className="text-xs text-muted-foreground">{config?.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 overflow-y-auto h-[calc(100vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Briefcase className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No jobs found</p>
              <p className="text-xs mt-1">This alert may have been resolved</p>
            </div>
          ) : (
            jobs.map((job) => (
              <button
                key={job.id}
                onClick={() => {
                  router.push(`/provider/jobs/${job.id}`);
                  onClose();
                }}
                className="w-full bg-muted/30 hover:bg-muted/50 border border-border hover:border-primary/30 rounded-xl p-4 text-left transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Customer Name */}
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground truncate">{job.customerName}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${getStatusColor(job.status)}`}>
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

                    {/* Date & Time */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="text-xs">{formatDateTime(job.startTime)}</span>
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

                      {job.amount && (
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

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border p-4">
          <button
            onClick={() => {
              if (alertDetails?.href) {
                router.push(alertDetails.href);
              }
              onClose();
            }}
            className="w-full py-3 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            View All
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
