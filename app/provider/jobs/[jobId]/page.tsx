'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  Trash2,
  Navigation,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Play,
  Check,
  FileSpreadsheet,
  MoreHorizontal,
  Camera,
  Star,
  Tag,
  User,
  CloudRain,
  Sun,
  Cloud,
  Edit3,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDate, formatTime } from '@/lib/api-helpers';
import CompleteJobModal from '@/components/provider/CompleteJobModal';

interface Job {
  id: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  customerAddress: string;
  serviceType: string;
  startTime: string;
  endTime: string;
  status: string;
  source: string;
  isRenoaLead: boolean;
  estimatedValue: number | null;
  actualValue: number | null;
  internalNotes: string | null;
  customerNotes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    address: string;
  };
  photos?: Array<{
    id: string;
    type: string;
    url: string;
    createdAt: string;
  }>;
  provider: {
    id: string;
    businessName: string;
    phone: string;
    email: string;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    status: string;
  } | null;
}

// Service type icons
const serviceIcons: Record<string, string> = {
  'Lawn Mowing': '🌱',
  'Landscaping': '🌳',
  'Tree Trimming': '🌲',
  'Cleanup': '🍂',
  'Mulching': '🪵',
  'Fertilization': '🌿',
  'Default': '🏡',
};

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notesTab, setNotesTab] = useState<'internal' | 'customer'>('internal');
  const [internalNotes, setInternalNotes] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [actualValue, setActualValue] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0); // For in-progress timer
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  // Timer for in-progress jobs
  useEffect(() => {
    if (job?.status === 'in_progress') {
      const startTime = new Date(job.startTime).getTime();
      const timer = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000); // seconds
        setElapsedTime(elapsed);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [job?.status, job?.startTime]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/provider/jobs/${jobId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch job details');
      }

      setJob(data.job);
      setInternalNotes(data.job.internalNotes || '');
      setCustomerNotes(data.job.customerNotes || '');
      setActualValue(data.job.actualValue?.toString() || '');
    } catch (error: any) {
      console.error('Error fetching job:', error);
      toast.error(error.message || 'Failed to load job details');
      router.push('/provider/calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!job) return;

    // For completion, show smart modal instead of blocking
    if (newStatus === 'completed') {
      setShowCompleteModal(true);
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(`/api/provider/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      setJob({ ...job, status: newStatus });

      // Smart status-specific messages
      if (newStatus === 'in_progress') {
        toast.success('✓ Job started! Timer running.', {
          description: 'Good luck! Remember to take progress photos.',
        });
      } else {
        toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleJobCompleted = async (result: { invoiceId?: string; invoiceNumber?: string }) => {
    // Refetch the job data to get updated status and values
    await fetchJobDetails();

    // Close the modal
    setShowCompleteModal(false);

    // Show appropriate success message
    if (result.invoiceId) {
      toast.success('🎉 Job completed and invoice created!', {
        description: `Invoice ${result.invoiceNumber} sent to customer`,
        action: {
          label: 'View Invoice',
          onClick: () => router.push(`/provider/invoices/${result.invoiceId}`),
        },
      });
    } else {
      toast.success('🎉 Job completed! Awesome work!', {
        description: 'Ready to create an invoice?',
      });
    }
  };

  const handleSaveNotes = async () => {
    if (!job) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/provider/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internalNotes,
          customerNotes,
          actualValue: actualValue ? parseFloat(actualValue) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save');
      }

      setJob({
        ...job,
        internalNotes,
        customerNotes,
        actualValue: actualValue ? parseFloat(actualValue) : null,
      });
      toast.success('✓ Saved successfully');
    } catch (error: any) {
      console.error('Error saving:', error);
      toast.error(error.message || 'Failed to save');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteJob = async () => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/provider/jobs/${jobId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete job');
      }

      toast.success('Job deleted successfully');
      router.push('/provider/calendar');
    } catch (error: any) {
      console.error('Error deleting job:', error);
      toast.error(error.message || 'Failed to delete job');
      setUpdating(false);
    }
  };

  const openGoogleMaps = () => {
    if (!job) return;
    const address = encodeURIComponent(job.customerAddress);
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-lg text-zinc-400">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const duration = (new Date(job.endTime).getTime() - new Date(job.startTime).getTime()) / (1000 * 60 * 60);
  const serviceIcon = serviceIcons[job.serviceType] || serviceIcons['Default'];

  // Calculate status progress
  const statusSteps = ['scheduled', 'in_progress', 'completed'];
  const currentStepIndex = statusSteps.indexOf(job.status);

  // Get photos by type (safe with null check)
  const beforePhotos = job.photos?.filter(p => p.type === 'before') || [];
  const duringPhotos = job.photos?.filter(p => p.type === 'during') || [];
  const afterPhotos = job.photos?.filter(p => p.type === 'after') || [];

  // Format elapsed time for timer
  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-8 lg:pb-12">
      {/* HERO SECTION - Compact on desktop, prominent on mobile */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/20 border-b border-emerald-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
          {/* Breadcrumb */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-400 hover:text-emerald-400 transition-colors mb-3 lg:mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Calendar</span>
          </button>

          <div className="grid lg:grid-cols-3 gap-4 lg:gap-6 items-center">
            {/* Left: Main Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl lg:text-4xl">{serviceIcon}</span>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-zinc-50 mb-1">
                    {job.customerName}&apos;s Property
                  </h1>
                  <p className="text-base lg:text-lg text-emerald-400 font-semibold">{job.serviceType}</p>
                </div>
              </div>

              {job.isRenoaLead && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/30">
                  <Star className="h-3.5 w-3.5 fill-emerald-400" />
                  <span className="text-xs font-semibold">Renoa Lead</span>
                </div>
              )}
            </div>

            {/* Right: Status & Value - Horizontal on desktop */}
            <div className="flex lg:flex-row flex-col gap-3 lg:gap-4">
              {/* Status Badge - Smaller on desktop */}
              <div className={`
                flex-1 p-3 lg:p-4 rounded-lg border text-center transition-transform
                ${job.status === 'scheduled' ? 'bg-blue-500/10 border-blue-500/50' : ''}
                ${job.status === 'in_progress' ? 'bg-yellow-500/10 border-yellow-500/50' : ''}
                ${job.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/50' : ''}
                ${job.status === 'cancelled' ? 'bg-red-500/10 border-red-500/50' : ''}
              `}>
                {job.status === 'scheduled' && <Calendar className="h-6 w-6 lg:h-7 lg:w-7 text-blue-400 mx-auto mb-1" />}
                {job.status === 'in_progress' && <Clock className="h-6 w-6 lg:h-7 lg:w-7 text-yellow-400 mx-auto mb-1 animate-pulse" />}
                {job.status === 'completed' && <CheckCircle className="h-6 w-6 lg:h-7 lg:w-7 text-emerald-400 mx-auto mb-1" />}
                {job.status === 'cancelled' && <XCircle className="h-6 w-6 lg:h-7 lg:w-7 text-red-400 mx-auto mb-1" />}
                <p className="text-sm lg:text-base font-bold text-zinc-50 capitalize">
                  {job.status.replace('_', ' ')}
                </p>
              </div>

              {/* Job Value - Compact on desktop */}
              <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 lg:p-4 text-center">
                <p className="text-xs text-zinc-500 mb-0.5">Value</p>
                <p className="text-xl lg:text-2xl font-bold text-emerald-400">
                  {formatCurrency(job.status === 'completed' && job.actualValue ? job.actualValue : job.estimatedValue)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TIMER BANNER - Show only when in progress */}
      {job.status === 'in_progress' && (
        <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 border-b border-yellow-500/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-center gap-3">
              <Clock className="h-5 w-5 text-yellow-400 animate-pulse" />
              <span className="text-base font-bold text-yellow-400">
                In Progress: {formatElapsedTime(elapsedTime)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETION BANNER - Show only when completed */}
      {job.status === 'completed' && (
        <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/30 border-b border-emerald-500/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <span className="text-base font-bold text-emerald-400">
                ✓ Job Completed on {formatDate(job.updatedAt)}
              </span>
              {job.invoice ? (
                <span className="text-sm text-emerald-400/70">• Invoice #{job.invoice.invoiceNumber} created</span>
              ) : (
                <span className="text-sm text-emerald-400/70">• Next: Create Invoice</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QUICK ACTION BAR - Status-aware buttons */}
      <div className="sticky top-0 z-30 bg-zinc-900/95 backdrop-blur-lg border-b border-zinc-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 lg:py-3">
          <div className="flex flex-wrap gap-2 lg:gap-3 justify-start">
            {/* Call Customer */}
            <a
              href={`tel:${job.customerPhone}`}
              className="flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-emerald-500/50"
            >
              <Phone className="h-4 w-4 lg:h-4.5 lg:w-4.5 text-white" />
              <span className="text-xs lg:text-sm font-semibold text-white hidden sm:inline">Call</span>
            </a>

            {/* Navigate */}
            <button
              onClick={openGoogleMaps}
              className="flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-blue-500/50"
            >
              <Navigation className="h-4 w-4 lg:h-4.5 lg:w-4.5 text-white" />
              <span className="text-xs lg:text-sm font-semibold text-white hidden sm:inline">Navigate</span>
            </button>

            {/* Start Job */}
            {job.status === 'scheduled' && (
              <button
                onClick={() => handleStatusChange('in_progress')}
                disabled={updating}
                className="flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5 bg-green-600 hover:bg-green-500 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-green-500/50 disabled:opacity-50"
              >
                <Play className="h-4 w-4 lg:h-4.5 lg:w-4.5 text-white" />
                <span className="text-xs lg:text-sm font-semibold text-white hidden sm:inline">Start Job</span>
              </button>
            )}

            {/* Mark Complete */}
            {job.status === 'in_progress' && (
              <button
                onClick={() => handleStatusChange('completed')}
                disabled={updating}
                className="flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-emerald-500/50 disabled:opacity-50"
              >
                <Check className="h-4 w-4 lg:h-4.5 lg:w-4.5 text-white" />
                <span className="text-xs lg:text-sm font-semibold text-white hidden sm:inline">Complete</span>
              </button>
            )}

            {/* Create Invoice - Show only when completed and no invoice exists */}
            {job.status === 'completed' && !job.invoice && (
              <button className="flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5 bg-purple-600 hover:bg-purple-500 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-purple-500/50">
                <FileSpreadsheet className="h-4 w-4 lg:h-4.5 lg:w-4.5 text-white" />
                <span className="text-xs lg:text-sm font-semibold text-white hidden sm:inline">Create Invoice</span>
              </button>
            )}

            {/* View Invoice - Show when completed and invoice exists */}
            {job.status === 'completed' && job.invoice && (
              <button
                onClick={() => router.push(`/provider/invoices/${job.invoice.id}`)}
                className="flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-indigo-500/50"
              >
                <FileSpreadsheet className="h-4 w-4 lg:h-4.5 lg:w-4.5 text-white" />
                <span className="text-xs lg:text-sm font-semibold text-white hidden sm:inline">View Invoice</span>
              </button>
            )}

            {/* Add Photos - Show for scheduled and in_progress */}
            {(job.status === 'scheduled' || job.status === 'in_progress') && (
              <button className="flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5 bg-pink-600 hover:bg-pink-500 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-pink-500/50">
                <Camera className="h-4 w-4 lg:h-4.5 lg:w-4.5 text-white" />
                <span className="text-xs lg:text-sm font-semibold text-white hidden sm:inline">Add Photos</span>
              </button>
            )}

            {/* More Actions */}
            <button className="flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-all hover:scale-105 active:scale-95">
              <MoreHorizontal className="h-4 w-4 lg:h-4.5 lg:w-4.5 text-white" />
              <span className="text-xs lg:text-sm font-semibold text-white hidden sm:inline">More</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT - TWO COLUMNS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 lg:mt-8">
        <div className="grid lg:grid-cols-5 gap-4 lg:gap-6">
          {/* LEFT COLUMN (60%) */}
          <div className="lg:col-span-3 space-y-4 lg:space-y-6">
            {/* STATUS PROGRESS TRACKER */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 lg:p-6">
              <h2 className="text-lg font-bold text-zinc-100 mb-4 lg:mb-5 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                Job Progress
              </h2>

              <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-6 left-0 right-0 h-1 bg-zinc-800">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                  ></div>
                </div>

                {/* Steps */}
                <div className="relative grid grid-cols-3 gap-4">
                  {statusSteps.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;

                    return (
                      <div key={step} className="flex flex-col items-center">
                        <div className={`
                          h-12 w-12 rounded-full flex items-center justify-center mb-3 transition-all
                          ${isCompleted ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-zinc-800'}
                          ${isCurrent ? 'ring-4 ring-emerald-500/30 scale-110' : ''}
                        `}>
                          {step === 'scheduled' && <Calendar className={`h-6 w-6 ${isCompleted ? 'text-white' : 'text-zinc-600'}`} />}
                          {step === 'in_progress' && <Clock className={`h-6 w-6 ${isCompleted ? 'text-white' : 'text-zinc-600'} ${isCurrent ? 'animate-pulse' : ''}`} />}
                          {step === 'completed' && <CheckCircle className={`h-6 w-6 ${isCompleted ? 'text-white' : 'text-zinc-600'}`} />}
                        </div>
                        <p className={`text-sm font-semibold text-center capitalize ${isCompleted ? 'text-zinc-100' : 'text-zinc-500'}`}>
                          {step.replace('_', ' ')}
                        </p>
                        {isCompleted && (
                          <p className="text-xs text-zinc-500 mt-1">
                            {formatDate(job.updatedAt)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* PHOTOS SECTION */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 lg:p-6">
              <h2 className="text-lg font-bold text-zinc-100 mb-4 lg:mb-5 flex items-center gap-2">
                <Camera className="h-5 w-5 text-emerald-500" />
                Job Photos
              </h2>

              <div className="grid grid-cols-3 gap-6">
                {/* Before Photos */}
                <div>
                  <p className="text-sm font-semibold text-zinc-400 mb-3">Before</p>
                  {beforePhotos.length === 0 ? (
                    <button className="w-full aspect-square border-2 border-dashed border-zinc-700 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:bg-zinc-800/50 group">
                      <Camera className="h-8 w-8 text-zinc-600 group-hover:text-emerald-500" />
                      <span className="text-xs text-zinc-600 group-hover:text-emerald-400 font-medium">Add Photos</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {beforePhotos.map((photo) => (
                        <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer">
                          <img src={photo.url} alt="Before" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors"></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* During Photos */}
                <div>
                  <p className="text-sm font-semibold text-zinc-400 mb-3">During</p>
                  {duringPhotos.length === 0 ? (
                    <button className="w-full aspect-square border-2 border-dashed border-zinc-700 hover:border-yellow-500 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:bg-zinc-800/50 group">
                      <Camera className="h-8 w-8 text-zinc-600 group-hover:text-yellow-500" />
                      <span className="text-xs text-zinc-600 group-hover:text-yellow-400 font-medium">Add Photos</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {duringPhotos.map((photo) => (
                        <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer">
                          <img src={photo.url} alt="During" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors"></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* After Photos */}
                <div>
                  <p className="text-sm font-semibold text-zinc-400 mb-3">After</p>
                  {afterPhotos.length === 0 ? (
                    <button className="w-full aspect-square border-2 border-dashed border-zinc-700 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:bg-zinc-800/50 group">
                      <Camera className="h-8 w-8 text-zinc-600 group-hover:text-emerald-500" />
                      <span className="text-xs text-zinc-600 group-hover:text-emerald-400 font-medium">Add Photos</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {afterPhotos.map((photo) => (
                        <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer">
                          <img src={photo.url} alt="After" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors"></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {job.photos.length === 0 && (
                <div className="mt-6 text-center p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <p className="text-sm text-emerald-400 font-medium">
                    📸 Great work starts with great photos! Tap to add before photos
                  </p>
                </div>
              )}
            </div>

            {/* SMART NOTES SECTION */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4 lg:mb-5">
                <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-emerald-500" />
                  Notes
                </h2>
                <button
                  onClick={handleSaveNotes}
                  disabled={updating}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg hover:shadow-emerald-500/50"
                >
                  {updating ? 'Saving...' : '✓ Save'}
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-4 bg-zinc-800/50 p-1 rounded-lg">
                <button
                  onClick={() => setNotesTab('internal')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    notesTab === 'internal'
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Internal Notes
                </button>
                <button
                  onClick={() => setNotesTab('customer')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    notesTab === 'customer'
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Customer Notes
                </button>
              </div>

              {/* Notes Content */}
              {notesTab === 'internal' ? (
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="w-full px-4 py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[180px] font-mono text-sm"
                  placeholder="E.g., Customer wants extra mulch around roses&#10;Remember to check irrigation system&#10;Needs fall cleanup quote"
                />
              ) : (
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full px-4 py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[180px] font-mono text-sm"
                  placeholder="E.g., Remind them about seasonal fertilizer package&#10;Great candidates for monthly maintenance plan"
                />
              )}

              <p className="text-xs text-zinc-500 mt-2">
                Last updated {formatDate(job.updatedAt)}
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN (40%) */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            {/* CUSTOMER CARD - Fixed: No sticky positioning, scrolls normally */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-2xl p-4 lg:p-5">
              <div className="flex items-start gap-3 mb-4 lg:mb-5">
                {/* Customer Avatar */}
                <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full bg-emerald-600 flex items-center justify-center text-xl font-bold text-white">
                  {(job.customerName || job.customer?.name || 'U').charAt(0)}
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-zinc-100 mb-1">{job.customerName || job.customer?.name || 'Unknown'}</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <span className="text-xs text-zinc-400">Premium Client</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 lg:space-y-3 mb-4 lg:mb-5">
                <a
                  href={`tel:${job.customerPhone}`}
                  className="flex items-center gap-3 p-3 bg-zinc-800/50 hover:bg-emerald-600/20 rounded-lg transition-all group"
                >
                  <Phone className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-zinc-200">{job.customerPhone}</span>
                </a>

                {job.customerEmail && (
                  <a
                    href={`mailto:${job.customerEmail}`}
                    className="flex items-center gap-3 p-3 bg-zinc-800/50 hover:bg-blue-600/20 rounded-lg transition-all group"
                  >
                    <Mail className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-zinc-200 truncate">{job.customerEmail}</span>
                  </a>
                )}

                <button
                  onClick={openGoogleMaps}
                  className="flex items-center gap-3 p-3 bg-zinc-800/50 hover:bg-purple-600/20 rounded-lg transition-all group w-full"
                >
                  <MapPin className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-zinc-200 text-left">{job.customerAddress}</span>
                </button>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4 lg:mb-5">
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/30">
                  Pays on Time
                </span>
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/30">
                  HOA Property
                </span>
              </div>

              {/* Customer Stats */}
              <div className="grid grid-cols-2 gap-3 lg:gap-4 pt-3 lg:pt-4 border-t border-zinc-800">
                <div className="text-center">
                  <p className="text-xl lg:text-2xl font-bold text-emerald-400">12</p>
                  <p className="text-xs text-zinc-500">Previous Jobs</p>
                </div>
                <div className="text-center">
                  <p className="text-xl lg:text-2xl font-bold text-emerald-400">$8,400</p>
                  <p className="text-xs text-zinc-500">Total Spent</p>
                </div>
              </div>

              <p className="text-xs text-zinc-500 text-center mt-3 lg:mt-4">
                Customer since March 2024
              </p>
            </div>

            {/* JOB DETAILS CARD */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 lg:p-5">
              <h3 className="text-lg font-bold text-zinc-100 mb-3 lg:mb-4">Job Details</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Date & Time</span>
                  <span className="text-sm font-semibold text-zinc-100">
                    {formatDate(job.startTime)} at {formatTime(job.startTime)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Duration</span>
                  <span className="text-sm font-semibold text-zinc-100">{duration.toFixed(1)} hours</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Estimated Value</span>
                  <span className="text-sm font-semibold text-emerald-400">{formatCurrency(job.estimatedValue)}</span>
                </div>

                {/* Actual Cost - Show only for completed or in_progress jobs */}
                {(job.status === 'completed' || job.status === 'in_progress') && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">Actual Cost</span>
                    <input
                      type="number"
                      value={actualValue}
                      onChange={(e) => setActualValue(e.target.value)}
                      onBlur={handleSaveNotes}
                      className="w-32 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-sm font-semibold text-emerald-400 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="$0"
                    />
                  </div>
                )}

                <div className="pt-4 border-t border-zinc-800">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    job.isRenoaLead
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-700 text-zinc-300'
                  }`}>
                    {job.isRenoaLead ? '⭐ Renoa Lead' : 'Own Client'}
                  </span>
                </div>
              </div>
            </div>

            {/* ACTIVITY TIMELINE */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 lg:p-5">
              <h3 className="text-lg font-bold text-zinc-100 mb-3 lg:mb-4">Activity</h3>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">Job created</p>
                    <p className="text-xs text-zinc-500">{formatDate(job.createdAt)}</p>
                  </div>
                </div>

                {job.updatedAt !== job.createdAt && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Edit3 className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">Last updated</p>
                      <p className="text-xs text-zinc-500">{formatDate(job.updatedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* DANGER ZONE */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-red-400 mb-3">Danger Zone</h3>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={updating}
                className="w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 border border-red-500/30 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete Job
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border-2 border-red-500/30 rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-100 mb-2">Delete Job?</h3>
              <p className="text-sm text-zinc-400">This action cannot be undone</p>
            </div>

            <p className="text-sm text-zinc-300 mb-8 text-center">
              Delete job for <strong className="text-zinc-100">{job.customerName}</strong>?<br />
              All data, photos, and notes will be permanently removed.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={updating}
                className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteJob}
                disabled={updating}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/50"
              >
                {updating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Job Modal */}
      <CompleteJobModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onComplete={handleJobCompleted}
        hasAfterPhotos={afterPhotos.length > 0}
        estimatedValue={job.estimatedValue || 0}
        jobId={job.id}
        customerId={job.customer.id}
        providerId={job.provider.id}
        serviceType={job.serviceType}
      />
    </div>
  );
}
