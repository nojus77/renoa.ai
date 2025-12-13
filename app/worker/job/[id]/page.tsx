'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import WorkerLayout from '@/components/worker/WorkerLayout';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  Navigation,
  CheckCircle2,
  Loader2,
  Calendar,
  User,
  FileText,
  AlertCircle,
  XCircle,
  Image as ImageIcon,
  Camera,
  Plus,
  Send,
  History,
  Receipt,
  X,
  ChevronRight,
  Wrench,
  Package,
  DollarSign,
  Save,
  Timer,
} from 'lucide-react';
import { toast } from 'sonner';

// Lime green brand color
const LIME_GREEN = '#a3e635';

interface Job {
  id: string;
  serviceType: string;
  address: string;
  startTime: string;
  endTime: string;
  status: string;
  onTheWayAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  customerNotes: string | null;
  internalNotes: string | null;
  estimatedValue: number | null;
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
  workLogs: {
    id: string;
    clockIn: string;
    clockOut: string | null;
    hoursWorked: number | null;
    earnings: number | null;
  }[];
}

interface JobNote {
  id: string;
  content: string;
  author: string;
  authorRole: 'worker' | 'dispatcher';
  createdAt: string;
}

interface JobMedia {
  id: string;
  url: string;
  type: 'photo' | 'video';
  caption?: string;
  createdAt: string;
}

interface CustomerJob {
  id: string;
  serviceType: string;
  date: string;
  amount: number;
  status: string;
  workerName?: string;
  duration?: number;
  workPerformed?: string;
  partsUsed?: string[];
  hasPhotos?: boolean;
  notes?: string;
}

interface JobDetails {
  workPerformed: string;
  partsUsed: string[];
  laborHours: number;
  price: number;
}

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [userId, setUserId] = useState<string>('');
  const [providerId, setProviderId] = useState<string>('');
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Live date/time
  const [currentTime, setCurrentTime] = useState(new Date());

  // Timer state
  const [travelTimer, setTravelTimer] = useState<number>(0);
  const [jobTimer, setJobTimer] = useState<number>(0);
  const [isTraveling, setIsTraveling] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const travelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const jobIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Notes state
  const [notes, setNotes] = useState<JobNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Media state
  const [media, setMedia] = useState<JobMedia[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<JobMedia | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Customer history state
  const [showCustomerHistory, setShowCustomerHistory] = useState(false);
  const [customerJobs, setCustomerJobs] = useState<CustomerJob[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Invoice state
  const [sendingInvoice, setSendingInvoice] = useState(false);

  // Job Details form state
  const [jobDetails, setJobDetails] = useState<JobDetails>({
    workPerformed: '',
    partsUsed: [],
    laborHours: 0,
    price: 0,
  });
  const [newPart, setNewPart] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Format current time for display
  const formatCurrentTime = () => {
    return currentTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }) + ', ' + currentTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Timer formatting
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const fetchJob = useCallback(async (uid: string, jid: string) => {
    try {
      const res = await fetch(`/api/worker/jobs/today?userId=${uid}`);
      const data = await res.json();

      if (data.jobs) {
        const foundJob = data.jobs.find((j: Job) => j.id === jid);
        if (foundJob) {
          setJob(foundJob);
          // Initialize timers based on job state
          if (foundJob.onTheWayAt && !foundJob.arrivedAt) {
            setIsTraveling(true);
            const elapsed = Math.floor((Date.now() - new Date(foundJob.onTheWayAt).getTime()) / 1000);
            setTravelTimer(elapsed);
          }
          if (foundJob.workLogs?.some((l: { clockIn: string; clockOut: string | null }) => l.clockIn && !l.clockOut)) {
            setIsWorking(true);
            const activeLog = foundJob.workLogs.find((l: { clockIn: string; clockOut: string | null }) => l.clockIn && !l.clockOut);
            if (activeLog) {
              const elapsed = Math.floor((Date.now() - new Date(activeLog.clockIn).getTime()) / 1000);
              setJobTimer(elapsed);
            }
          }
        } else {
          // Try fetching from week endpoint
          const weekRes = await fetch(`/api/worker/jobs/week?userId=${uid}`);
          const weekData = await weekRes.json();
          if (weekData.jobs) {
            const weekJob = weekData.jobs.find((j: Job) => j.id === jid);
            if (weekJob) {
              setJob(weekJob);
            } else {
              toast.error('Job not found');
              router.push('/worker/schedule');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchNotes = useCallback(async (jid: string) => {
    try {
      const res = await fetch(`/api/worker/jobs/${jid}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  }, []);

  const fetchMedia = useCallback(async (jid: string) => {
    try {
      const res = await fetch(`/api/worker/jobs/${jid}/media`);
      if (res.ok) {
        const data = await res.json();
        setMedia(data.media || []);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  }, []);

  useEffect(() => {
    const uid = localStorage.getItem('workerUserId');
    const pid = localStorage.getItem('workerProviderId');

    if (!uid || !pid) {
      router.push('/provider/login');
      return;
    }

    setUserId(uid);
    setProviderId(pid);
    if (jobId) {
      fetchJob(uid, jobId);
      fetchNotes(jobId);
      fetchMedia(jobId);
    }
  }, [router, jobId, fetchJob, fetchNotes, fetchMedia]);

  // Travel timer effect
  useEffect(() => {
    if (isTraveling) {
      travelIntervalRef.current = setInterval(() => {
        setTravelTimer(prev => prev + 1);
      }, 1000);
    } else if (travelIntervalRef.current) {
      clearInterval(travelIntervalRef.current);
    }
    return () => {
      if (travelIntervalRef.current) clearInterval(travelIntervalRef.current);
    };
  }, [isTraveling]);

  // Job timer effect
  useEffect(() => {
    if (isWorking) {
      jobIntervalRef.current = setInterval(() => {
        setJobTimer(prev => prev + 1);
      }, 1000);
    } else if (jobIntervalRef.current) {
      clearInterval(jobIntervalRef.current);
    }
    return () => {
      if (jobIntervalRef.current) clearInterval(jobIntervalRef.current);
    };
  }, [isWorking]);

  // Update labor hours from timer
  useEffect(() => {
    if (jobTimer > 0) {
      setJobDetails(prev => ({
        ...prev,
        laborHours: parseFloat((jobTimer / 3600).toFixed(2)),
      }));
    }
  }, [jobTimer]);

  const getJobStatus = (j: Job) => {
    if (j.completedAt) return 'completed';
    if (j.workLogs?.some((l) => l.clockIn && !l.clockOut)) return 'working';
    if (j.arrivedAt) return 'arrived';
    if (j.onTheWayAt) return 'on_the_way';
    return 'scheduled';
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatShortDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const handleAction = async (action: string) => {
    if (!job) return;
    setActionLoading(action);

    try {
      let endpoint = '';
      let body: Record<string, unknown> = {};

      switch (action) {
        case 'on_the_way':
          endpoint = '/api/worker/jobs/status';
          body = { jobId: job.id, userId, action };
          setIsTraveling(true);
          setTravelTimer(0);
          break;
        case 'arrived':
          endpoint = '/api/worker/jobs/status';
          body = { jobId: job.id, userId, action, travelDuration: travelTimer };
          setIsTraveling(false);
          break;
        case 'start':
          endpoint = '/api/worker/clock-in';
          body = { jobId: job.id, userId, providerId };
          setIsWorking(true);
          setJobTimer(0);
          break;
        case 'complete':
          endpoint = '/api/worker/clock-out';
          body = { jobId: job.id, userId, jobDuration: jobTimer };
          setIsWorking(false);
          break;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          action === 'on_the_way'
            ? 'On your way!'
            : action === 'arrived'
            ? 'Marked as arrived!'
            : action === 'start'
            ? 'Job started!'
            : `Job completed! Earned $${data.earnings?.toFixed(2) || '0.00'}`
        );
        fetchJob(userId, jobId);
      } else {
        toast.error(data.error || 'Action failed');
        // Revert timer states on failure
        if (action === 'on_the_way') setIsTraveling(false);
        if (action === 'start') setIsWorking(false);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Something went wrong');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !job) return;
    setAddingNote(true);

    try {
      const res = await fetch(`/api/worker/jobs/${job.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNote.trim(),
          userId,
          customerId: job.customer.id,
        }),
      });

      if (res.ok) {
        toast.success('Note added');
        setNewNote('');
        fetchNotes(job.id);
      } else {
        toast.error('Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !job) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });
    formData.append('jobId', job.id);
    formData.append('userId', userId);

    try {
      const res = await fetch(`/api/worker/jobs/${job.id}/media`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast.success('Media uploaded');
        fetchMedia(job.id);
      } else {
        toast.error('Failed to upload media');
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error('Failed to upload media');
    }

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleViewCustomerHistory = async () => {
    if (!job) return;
    setShowCustomerHistory(true);
    setLoadingHistory(true);

    try {
      const res = await fetch(`/api/worker/customers/${job.customer.id}/jobs`);
      if (res.ok) {
        const data = await res.json();
        setCustomerJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching customer history:', error);
      toast.error('Failed to load customer history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!job) return;
    setSendingInvoice(true);

    try {
      const res = await fetch(`/api/worker/jobs/${job.id}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, jobDetails }),
      });

      if (res.ok) {
        toast.success('Invoice sent to customer');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to send invoice');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice');
    } finally {
      setSendingInvoice(false);
    }
  };

  const handleAddPart = () => {
    if (newPart.trim()) {
      setJobDetails(prev => ({
        ...prev,
        partsUsed: [...prev.partsUsed, newPart.trim()],
      }));
      setNewPart('');
    }
  };

  const handleRemovePart = (index: number) => {
    setJobDetails(prev => ({
      ...prev,
      partsUsed: prev.partsUsed.filter((_, i) => i !== index),
    }));
  };

  const handleSaveJobDetails = async () => {
    if (!job) return;
    setSavingDetails(true);

    try {
      const res = await fetch(`/api/worker/jobs/${job.id}/details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...jobDetails,
        }),
      });

      if (res.ok) {
        toast.success('Job details saved');
      } else {
        toast.error('Failed to save job details');
      }
    } catch (error) {
      console.error('Error saving job details:', error);
      toast.error('Failed to save job details');
    } finally {
      setSavingDetails(false);
    }
  };

  const openMaps = (address: string) => {
    const encoded = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
  };

  const callPhone = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
      scheduled: {
        bg: 'bg-lime-500/20',
        text: 'text-lime-400',
        label: 'Scheduled',
        icon: <Calendar className="w-4 h-4" />,
      },
      on_the_way: {
        bg: 'bg-amber-500/20',
        text: 'text-amber-400',
        label: 'On the Way',
        icon: <Navigation className="w-4 h-4" />,
      },
      arrived: {
        bg: 'bg-orange-500/20',
        text: 'text-orange-400',
        label: 'Arrived',
        icon: <MapPin className="w-4 h-4" />,
      },
      working: {
        bg: 'bg-lime-500/20',
        text: 'text-lime-400',
        label: 'In Progress',
        icon: <Clock className="w-4 h-4" />,
      },
      completed: {
        bg: 'bg-purple-500/20',
        text: 'text-purple-400',
        label: 'Completed',
        icon: <CheckCircle2 className="w-4 h-4" />,
      },
      cancelled: {
        bg: 'bg-red-500/20',
        text: 'text-red-400',
        label: 'Cancelled',
        icon: <XCircle className="w-4 h-4" />,
      },
    };
    return configs[status] || configs.scheduled;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-purple-500/20 text-purple-400';
      case 'in_progress':
        return 'bg-lime-500/20 text-lime-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-zinc-700 text-zinc-300';
    }
  };

  const renderActionButtons = () => {
    if (!job) return null;
    const status = getJobStatus(job);
    const isLoading = (action: string) => actionLoading === action;

    switch (status) {
      case 'scheduled':
        return (
          <button
            onClick={() => handleAction('on_the_way')}
            disabled={!!actionLoading}
            className="flex-1 py-4 text-zinc-900 font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            style={{ backgroundColor: LIME_GREEN }}
          >
            {isLoading('on_the_way') ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Navigation className="w-5 h-5" />
                On My Way
              </>
            )}
          </button>
        );
      case 'on_the_way':
        return (
          <button
            onClick={() => handleAction('arrived')}
            disabled={!!actionLoading}
            className="flex-1 py-4 text-zinc-900 font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            style={{ backgroundColor: LIME_GREEN }}
          >
            {isLoading('arrived') ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Timer className="w-5 h-5" />
                En Route: {formatTimer(travelTimer)}
              </>
            )}
          </button>
        );
      case 'arrived':
        return (
          <button
            onClick={() => handleAction('start')}
            disabled={!!actionLoading}
            className="flex-1 py-4 text-zinc-900 font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            style={{ backgroundColor: LIME_GREEN }}
          >
            {isLoading('start') ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Clock className="w-5 h-5" />
                Start Job
              </>
            )}
          </button>
        );
      case 'working':
        return (
          <button
            onClick={() => handleAction('complete')}
            disabled={!!actionLoading}
            className="flex-1 py-4 text-zinc-900 font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            style={{ backgroundColor: LIME_GREEN }}
          >
            {isLoading('complete') ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Timer className="w-5 h-5" />
                Working: {formatTimer(jobTimer)}
              </>
            )}
          </button>
        );
      case 'completed':
        return (
          <div className="flex-1 py-4 bg-zinc-800 text-purple-400 font-semibold rounded-xl flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Job Completed
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <WorkerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: LIME_GREEN }} />
        </div>
      </WorkerLayout>
    );
  }

  if (!job) {
    return (
      <WorkerLayout>
        <div className="p-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="bg-zinc-900 rounded-xl p-8 text-center border border-zinc-800">
            <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">Job not found</p>
          </div>
        </div>
      </WorkerLayout>
    );
  }

  const status = getJobStatus(job);
  const statusConfig = getStatusConfig(status);

  return (
    <WorkerLayout>
      <div className="p-4 pb-44 space-y-4">
        {/* Header with Date/Time */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Job Details</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-400">{formatCurrentTime()}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${statusConfig.bg}`}
        >
          <span className={statusConfig.text}>{statusConfig.icon}</span>
          <span className={`font-medium ${statusConfig.text}`}>{statusConfig.label}</span>
        </div>

        {/* Main Job Info Card */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          {/* Service Type Header */}
          <div className="p-4 border-b border-zinc-800">
            <h2 className="text-lg font-semibold text-white">{job.serviceType}</h2>
            {job.estimatedValue && (
              <p className="text-sm mt-1" style={{ color: LIME_GREEN }}>
                ${job.estimatedValue.toFixed(2)} estimated
              </p>
            )}
          </div>

          {/* Customer Info */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${LIME_GREEN}20` }}>
                <User className="w-5 h-5" style={{ color: LIME_GREEN }} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">{job.customer.name}</p>
                {job.customer.email && (
                  <p className="text-zinc-500 text-sm">{job.customer.email}</p>
                )}
              </div>
              {job.customer.phone && (
                <button
                  onClick={() => callPhone(job.customer.phone!)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: LIME_GREEN }}
                >
                  <Phone className="w-5 h-5 text-zinc-900" />
                </button>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-zinc-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-zinc-300">{job.address}</p>
                <button
                  onClick={() => openMaps(job.address)}
                  className="flex items-center gap-1 text-sm mt-2 hover:underline"
                  style={{ color: LIME_GREEN }}
                >
                  <Navigation className="w-4 h-4" />
                  Get Directions
                </button>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-zinc-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-zinc-300">{formatDate(job.startTime)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 mt-3">
              <Clock className="w-5 h-5 text-zinc-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-zinc-300">
                  {formatTime(job.startTime)} - {formatTime(job.endTime)}
                </p>
                <p className="text-zinc-500 text-sm">
                  Duration: {getDuration(job.startTime, job.endTime)}
                </p>
              </div>
            </div>
          </div>

          {/* Existing Notes from Job */}
          {(job.customerNotes || job.internalNotes) && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-zinc-400" />
                <span className="font-medium text-zinc-300">Job Notes</span>
              </div>
              <div className="space-y-3">
                {job.customerNotes && (
                  <div className="bg-zinc-800/50 rounded-lg p-3">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                      Customer Notes
                    </p>
                    <p className="text-zinc-300 text-sm">{job.customerNotes}</p>
                  </div>
                )}
                {job.internalNotes && (
                  <div className="bg-zinc-800/50 rounded-lg p-3">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                      Internal Notes
                    </p>
                    <p className="text-zinc-300 text-sm">{job.internalNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SEND INVOICE BUTTON - Prominent Position */}
        <button
          onClick={handleSendInvoice}
          disabled={sendingInvoice}
          className="w-full rounded-xl p-4 flex items-center justify-center gap-2 transition-colors font-semibold text-zinc-900"
          style={{ backgroundColor: LIME_GREEN }}
        >
          {sendingInvoice ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Receipt className="w-5 h-5" />
              <span>Send Invoice to Customer</span>
            </>
          )}
        </button>

        {/* Work Log Info (if started) */}
        {job.workLogs && job.workLogs.length > 0 && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <h3 className="font-medium text-zinc-300 mb-3">Work Log</h3>
            {job.workLogs.map((log) => (
              <div key={log.id} className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Clock In:</span>
                  <span className="text-zinc-300">
                    {new Date(log.clockIn).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </span>
                </div>
                {log.clockOut && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Clock Out:</span>
                    <span className="text-zinc-300">
                      {new Date(log.clockOut).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </span>
                  </div>
                )}
                {log.hoursWorked && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Hours Worked:</span>
                    <span className="text-zinc-300">{log.hoursWorked.toFixed(2)}h</span>
                  </div>
                )}
                {log.earnings && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Earnings:</span>
                    <span className="font-medium" style={{ color: LIME_GREEN }}>
                      ${log.earnings.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Notes Section */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" style={{ color: LIME_GREEN }} />
              <h3 className="font-medium text-white">Notes</h3>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {/* Existing Notes */}
            {notes.length > 0 ? (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {notes.map((note) => (
                  <div key={note.id} className="bg-zinc-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-zinc-300">{note.author}</span>
                      <span className="text-xs text-zinc-500">
                        {formatShortDate(note.createdAt)}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-sm">{note.content}</p>
                    <span className="text-xs text-zinc-600 mt-1 inline-block">
                      {note.authorRole === 'dispatcher' ? 'Dispatcher' : 'Worker'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm text-center py-2">No notes yet</p>
            )}

            {/* Add Note Input */}
            <div className="flex gap-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none resize-none"
                style={{ borderColor: newNote ? LIME_GREEN : undefined }}
                rows={2}
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || addingNote}
                className="p-3 rounded-lg transition-colors disabled:bg-zinc-700 disabled:text-zinc-500"
                style={{ backgroundColor: newNote.trim() ? LIME_GREEN : undefined }}
              >
                {addingNote ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <Send className="w-5 h-5 text-zinc-900" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Job Details Section - NEW */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5" style={{ color: LIME_GREEN }} />
              <h3 className="font-medium text-white">Job Details</h3>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {/* Work Performed */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Work Performed</label>
              <textarea
                value={jobDetails.workPerformed}
                onChange={(e) => setJobDetails(prev => ({ ...prev, workPerformed: e.target.value }))}
                placeholder="Describe the work completed..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none resize-none"
                rows={3}
              />
            </div>

            {/* Parts Used */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Parts Used</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newPart}
                  onChange={(e) => setNewPart(e.target.value)}
                  placeholder="Add a part..."
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPart()}
                />
                <button
                  onClick={handleAddPart}
                  disabled={!newPart.trim()}
                  className="p-2 rounded-lg transition-colors disabled:bg-zinc-700"
                  style={{ backgroundColor: newPart.trim() ? LIME_GREEN : undefined }}
                >
                  <Plus className="w-5 h-5 text-zinc-900" />
                </button>
              </div>
              {jobDetails.partsUsed.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {jobDetails.partsUsed.map((part, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded-lg text-sm text-zinc-300"
                    >
                      <Package className="w-3 h-3" />
                      {part}
                      <button
                        onClick={() => handleRemovePart(index)}
                        className="ml-1 text-zinc-500 hover:text-zinc-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Labor Hours */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Labor Hours {isWorking && <span className="text-xs" style={{ color: LIME_GREEN }}>(auto-updating from timer)</span>}
              </label>
              <input
                type="number"
                step="0.25"
                value={jobDetails.laborHours}
                onChange={(e) => setJobDetails(prev => ({ ...prev, laborHours: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            {/* Price/Cost */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Price/Cost ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="number"
                  step="0.01"
                  value={jobDetails.price}
                  onChange={(e) => setJobDetails(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Photos Link */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
            >
              <Camera className="w-4 h-4" />
              Add Photos of Work Done
            </button>

            {/* Save Button */}
            <button
              onClick={handleSaveJobDetails}
              disabled={savingDetails}
              className="w-full py-3 rounded-lg font-semibold transition-colors text-zinc-900"
              style={{ backgroundColor: LIME_GREEN }}
            >
              {savingDetails ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" />
                  Save Job Details
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Media Section */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5" style={{ color: LIME_GREEN }} />
                <h3 className="font-medium text-white">Media</h3>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-sm"
                style={{ color: LIME_GREEN }}
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>
          <div className="p-4">
            {media.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {media.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedMedia(item)}
                    className="aspect-square bg-zinc-800 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                  >
                    {item.type === 'photo' ? (
                      <img
                        src={item.url}
                        alt="Job media"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-zinc-500" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <ImageIcon className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">No media yet</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
                >
                  Add Photos/Videos
                </button>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleMediaUpload}
          />
        </div>

        {/* Customer History Button */}
        <button
          onClick={handleViewCustomerHistory}
          className="w-full bg-zinc-900 rounded-xl border border-zinc-800 p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
              <History className="w-5 h-5 text-zinc-400" />
            </div>
            <span className="font-medium text-white">View Customer History</span>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-500" />
        </button>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4 z-40">
        <div className="max-w-lg mx-auto flex gap-3">
          {/* Navigate Button */}
          {status !== 'completed' && (
            <button
              onClick={() => openMaps(job.address)}
              className="p-4 rounded-xl transition-colors"
              style={{ backgroundColor: LIME_GREEN }}
            >
              <Navigation className="w-5 h-5 text-zinc-900" />
            </button>
          )}

          {/* Call Button */}
          {job.customer.phone && status !== 'completed' && (
            <button
              onClick={() => callPhone(job.customer.phone!)}
              className="p-4 rounded-xl transition-colors"
              style={{ backgroundColor: LIME_GREEN }}
            >
              <Phone className="w-5 h-5 text-zinc-900" />
            </button>
          )}

          {/* Main Action Button */}
          {renderActionButtons()}
        </div>
      </div>

      {/* Media Lightbox */}
      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-full"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          {selectedMedia.type === 'photo' ? (
            <img
              src={selectedMedia.url}
              alt="Job media"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <video
              src={selectedMedia.url}
              controls
              className="max-w-full max-h-full"
            />
          )}
        </div>
      )}

      {/* Customer History Modal */}
      {showCustomerHistory && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-zinc-900 w-full max-w-md max-h-[80vh] rounded-t-2xl sm:rounded-2xl border border-zinc-800 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 shrink-0">
              <h2 className="text-lg font-semibold text-white">Customer History</h2>
              <button
                onClick={() => setShowCustomerHistory(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto flex-1">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: LIME_GREEN }} />
                </div>
              ) : customerJobs.length > 0 ? (
                <div className="space-y-3">
                  {customerJobs.map((cJob) => (
                    <div
                      key={cJob.id}
                      className="bg-zinc-800/50 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-white">{cJob.serviceType}</p>
                          <p className="text-zinc-500 text-sm">{formatShortDate(cJob.date)}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(cJob.status)}`}>
                          {cJob.status}
                        </span>
                      </div>

                      {/* Worker Name */}
                      {cJob.workerName && (
                        <p className="text-zinc-400 text-sm">
                          <span className="text-zinc-500">Worker:</span> {cJob.workerName}
                        </p>
                      )}

                      {/* Duration */}
                      {cJob.duration && (
                        <p className="text-zinc-400 text-sm">
                          <span className="text-zinc-500">Duration:</span> {formatDuration(cJob.duration)}
                        </p>
                      )}

                      {/* Work Performed */}
                      {cJob.workPerformed && (
                        <p className="text-zinc-400 text-sm">
                          <span className="text-zinc-500">Work:</span> {cJob.workPerformed}
                        </p>
                      )}

                      {/* Parts Used */}
                      {cJob.partsUsed && cJob.partsUsed.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-zinc-500 text-sm">Parts:</span>
                          {cJob.partsUsed.map((part, i) => (
                            <span key={i} className="text-xs bg-zinc-700 px-2 py-0.5 rounded text-zinc-300">
                              {part}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Notes */}
                      {cJob.notes && (
                        <p className="text-zinc-400 text-sm italic">&quot;{cJob.notes}&quot;</p>
                      )}

                      {/* Price and Photos */}
                      <div className="flex items-center justify-between pt-1">
                        <p className="font-medium" style={{ color: LIME_GREEN }}>
                          ${cJob.amount.toFixed(2)}
                        </p>
                        {cJob.hasPhotos && (
                          <span className="text-xs text-zinc-500 flex items-center gap-1">
                            <Camera className="w-3 h-3" /> Photos
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                  <p className="text-zinc-500">No previous jobs with this customer</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </WorkerLayout>
  );
}
