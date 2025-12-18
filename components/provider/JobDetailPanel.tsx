'use client'

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Phone, MapPin, MessageCircle, Edit2, Save, Trash2, CheckCircle, Send, Camera, ChevronDown, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import EditJobModal from './EditJobModal';

interface JobPhoto {
  id: string;
  url: string;
  type: string;
  createdAt: string;
}

interface Job {
  id: string;
  customerName: string;
  serviceType: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'dispatched' | 'on-the-way' | 'in-progress' | 'completed' | 'cancelled';
  isRenoaLead: boolean;
  phone: string;
  email: string;
  address: string;
  estimatedValue?: number;
  actualValue?: number;
  estimatedDuration?: number; // hours
  actualDurationMinutes?: number | null;
  createdAt: string;
  notes?: string;
  customerNotes?: string;
  dispatchedAt?: string | null;
  onTheWayAt?: string | null;
  arrivedAt?: string | null;
  completedAt?: string | null;
  completedByUserId?: string | null;
}

interface JobDetailPanelProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onJobUpdated: () => void;
}

export default function JobDetailPanel({ job, isOpen, onClose, onJobUpdated }: JobDetailPanelProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedJob, setEditedJob] = useState<Partial<Job>>({});
  const [activeTab, setActiveTab] = useState<'internal' | 'customer'>('internal');
  const [isSaving, setSaving] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const photosRef = useRef<HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jobPhotos, setJobPhotos] = useState<JobPhoto[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoType, setPhotoType] = useState<'before' | 'during' | 'after'>('before');

  useEffect(() => {
    if (job) {
      setEditedJob({
        actualValue: job.actualValue,
        notes: job.notes || '',
        customerNotes: job.customerNotes || '',
      });
      fetchJobPhotos();
    }
  }, [job]);

  const fetchJobPhotos = async () => {
    if (!job) return;

    try {
      const res = await fetch(`/api/provider/jobs/${job.id}/photos`);
      const data = await res.json();

      if (res.ok && data.photos) {
        setJobPhotos(data.photos);
      }
    } catch (error) {
      console.error('Error fetching job photos:', error);
    }
  };

  const handlePhotoUpload = async (file: File, type: string) => {
    console.log('📸 handlePhotoUpload called with:', { file: file?.name, type });

    if (!file || !job) {
      console.log('❌ No file or job', { file: !!file, job: !!job });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WebP image');
      return;
    }

    setUploadingPhoto(true);
    toast.loading('Uploading photo...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const res = await fetch(`/api/provider/jobs/${job.id}/photos/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload photo');
      }

      setJobPhotos([...jobPhotos, data.photo]);
      toast.dismiss();
      toast.success('Photo uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast.dismiss();
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoDelete = async (photoId: string) => {
    if (!job) return;

    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      toast.loading('Deleting photo...');

      const res = await fetch(`/api/provider/jobs/${job.id}/photos/${photoId}/delete`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete photo');
      }

      setJobPhotos(jobPhotos.filter(p => p.id !== photoId));
      toast.dismiss();
      toast.success('Photo deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      toast.dismiss();
      toast.error(error.message || 'Failed to delete photo');
    }
  };

  if (!job) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/provider/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedJob),
      });

      if (!res.ok) throw new Error('Failed to update job');

      toast.success('Job updated successfully');
      setIsEditing(false);
      onJobUpdated();
    } catch (error) {
      toast.error('Failed to update job');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');

      const res = await fetch(`/api/provider/jobs/${job.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          userId,
          userRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to update status');
        return;
      }

      toast.success(`Status updated to ${newStatus.replace(/-/g, ' ').replace('_', ' ')}`);
      setShowStatusMenu(false);
      onJobUpdated();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/provider/jobs/${job.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete job');

      toast.success('Job deleted successfully');
      onClose();
      onJobUpdated();
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getDuration = () => {
    const start = new Date(job.startTime);
    const end = new Date(job.endTime);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return hours;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'dispatched': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'on-the-way': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'in-progress': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  const calculateDuration = (start: string | null | undefined, end: string | null | undefined): string => {
    if (!start || !end) return '--';
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diffMs = endTime - startTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const statusSteps = ['scheduled', 'in-progress', 'completed', 'paid'];
  const currentStepIndex = statusSteps.indexOf(job.status === 'on-the-way' ? 'in-progress' : job.status);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full md:w-[600px] lg:w-[700px] bg-zinc-900 border-l border-zinc-800 z-50 transition-transform duration-300 overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header Section - FIELD OPTIMIZED */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 z-10">
          <div className="p-4 md:p-6 pb-3 md:pb-4">
            {/* Compact Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                  🏡
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg md:text-xl font-bold text-zinc-100 truncate">{job.customerName}&apos;s Property</h2>
                  <div className="text-sm text-emerald-500 font-medium">{job.serviceType.replace(/_/g, ' ')}</div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Compact Info Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-zinc-800/50 rounded-lg p-2.5 border border-zinc-700">
                <div className="text-xs text-zinc-400 mb-0.5">Status</div>
                <div className="relative">
                  <button
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                    className={`text-sm font-semibold flex items-center gap-1 ${
                      job.status === 'scheduled' ? 'text-blue-400' :
                      job.status === 'in-progress' ? 'text-orange-400' :
                      job.status === 'completed' ? 'text-emerald-400' :
                      'text-red-400'
                    }`}
                  >
                    {job.status.replace('_', ' ')}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {showStatusMenu && (
                    <div className="absolute top-full mt-1 left-0 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-20 min-w-[140px]">
                      {['scheduled', 'dispatched', 'on-the-way', 'in-progress', 'completed', 'cancelled'].map(status => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 transition-colors capitalize"
                        >
                          {status.replace(/-/g, ' ').replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-2.5 border border-zinc-700">
                <div className="text-xs text-zinc-400 mb-0.5">Value</div>
                <div className="text-sm font-semibold text-emerald-500">
                  ${job.estimatedValue || job.actualValue || 0}
                </div>
              </div>
            </div>

            {/* Timer Banner - Only when in progress */}
            {job.status === 'in-progress' && (
              <div className="bg-amber-900/20 border-2 border-amber-600 rounded-lg p-2.5 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    <span className="text-sm text-amber-500 font-medium">Job In Progress</span>
                  </div>
                  <div className="text-lg font-mono text-amber-500 font-bold">
                    {/* Timer would go here */}
                    --:--
                  </div>
                </div>
              </div>
            )}

            {/* Compact Action Grid */}
            <div className="grid grid-cols-4 gap-2">
              <a
                href={`tel:${job.phone}`}
                className="aspect-square bg-emerald-600 hover:bg-emerald-500 rounded-lg flex flex-col items-center justify-center transition-colors active:scale-95"
              >
                <span className="text-xl mb-0.5">📞</span>
                <span className="text-xs text-white">Call</span>
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square bg-blue-600 hover:bg-blue-500 rounded-lg flex flex-col items-center justify-center transition-colors active:scale-95"
              >
                <span className="text-xl mb-0.5">🧭</span>
                <span className="text-xs text-white">Navigate</span>
              </a>
              <button
                onClick={() => {
                  photosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="aspect-square bg-purple-600 hover:bg-purple-500 rounded-lg flex flex-col items-center justify-center transition-colors active:scale-95"
              >
                <span className="text-xl mb-0.5">📷</span>
                <span className="text-xs text-white">Photos</span>
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="w-full aspect-square bg-gray-700 hover:bg-gray-600 rounded-lg flex flex-col items-center justify-center transition-colors active:scale-95"
                >
                  <span className="text-xl mb-0.5">⋯</span>
                  <span className="text-xs text-white">More</span>
                </button>
                {showMoreMenu && (
                  <div className="absolute top-full mt-1 right-0 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-20 min-w-[160px]">
                    <button
                      onClick={() => {
                        setShowEditModal(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Job
                    </button>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-4 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center gap-2"
                      onClick={() => setShowMoreMenu(false)}
                    >
                      <MapPin className="h-4 w-4" />
                      Open in Maps
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${job.customerName} - ${job.serviceType} - ${job.address}`);
                        toast.success('Job details copied to clipboard');
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleDelete();
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-900/20 transition-colors flex items-center gap-2 border-t border-zinc-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Job
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content - FIELD OPTIMIZED */}
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Job Details - Collapsible */}
          <details className="group" open>
            <summary className="cursor-pointer bg-zinc-800/30 rounded-lg p-3 border border-zinc-700 hover:border-zinc-600 flex items-center justify-between select-none">
              <span className="font-semibold text-zinc-100 flex items-center gap-2">
                <span>ℹ️</span> Job Details
              </span>
              <span className="text-zinc-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-2 bg-zinc-800/30 border border-zinc-700 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Date</span>
                <span className="font-medium text-zinc-200">{formatDate(job.startTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Time</span>
                <span className="font-medium text-zinc-200">{formatTime(job.startTime)} - {formatTime(job.endTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Duration</span>
                <span className="font-medium text-zinc-200">
                  {job.status === 'completed' && job.actualDurationMinutes ? (
                    <>
                      {job.estimatedDuration ? `${Math.round(job.estimatedDuration * 60)} min est` : `${getDuration()} hr est`}
                      {' → '}
                      <span className={job.actualDurationMinutes > (job.estimatedDuration ? job.estimatedDuration * 60 : getDuration() * 60)
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                      }>
                        {job.actualDurationMinutes} min actual
                      </span>
                    </>
                  ) : job.status === 'completed' ? (
                    <>
                      {job.estimatedDuration ? `${Math.round(job.estimatedDuration * 60)} min` : `${getDuration()} hours`}
                      <span className="text-zinc-500 ml-1">(actual not recorded)</span>
                    </>
                  ) : (
                    job.estimatedDuration ? `${Math.round(job.estimatedDuration * 60)} min` : `${getDuration()} hours`
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Created</span>
                <span className="font-medium text-zinc-200">{getTimeAgo(job.createdAt)}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-zinc-400">Address</span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-400 hover:text-blue-300 text-right max-w-[200px]"
                >
                  {job.address}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Source</span>
                <span className={`font-medium ${job.isRenoaLead ? 'text-purple-400' : 'text-zinc-400'}`}>
                  {job.isRenoaLead ? 'Renoa Lead' : 'Own Client'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Estimated Value</label>
                  <p className="text-sm text-zinc-200 mt-1">
                    {job.estimatedValue ? `$${job.estimatedValue.toFixed(2)}` : 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Actual Value</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedJob.actualValue || ''}
                      onChange={(e) => setEditedJob({ ...editedJob, actualValue: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                      placeholder="0.00"
                    />
                  ) : (
                    <p className="text-sm text-zinc-200 mt-1">
                      {job.actualValue ? `$${job.actualValue.toFixed(2)}` : 'Not set'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </details>

          {/* Status Timeline */}
          <section>
            <h3 className="text-lg font-semibold text-zinc-100 mb-3">Progress</h3>
            <div className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                {statusSteps.map((step, index) => (
                  <div key={step} className="flex-1 flex flex-col items-center relative">
                    {/* Connector Line */}
                    {index < statusSteps.length - 1 && (
                      <div
                        className={`absolute top-5 left-1/2 w-full h-0.5 ${
                          index < currentStepIndex ? 'bg-emerald-500' : 'bg-zinc-700'
                        }`}
                      />
                    )}
                    {/* Circle */}
                    <div
                      className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                        index <= currentStepIndex
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'bg-zinc-800 border-zinc-700'
                      }`}
                    >
                      {index < currentStepIndex ? (
                        <CheckCircle className="h-5 w-5 text-white" />
                      ) : (
                        <span className="text-sm font-medium text-zinc-400">{index + 1}</span>
                      )}
                    </div>
                    {/* Label */}
                    <span
                      className={`mt-2 text-xs font-medium text-center capitalize ${
                        index <= currentStepIndex ? 'text-emerald-400' : 'text-zinc-500'
                      }`}
                    >
                      {step.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Job Timeline - Time Tracking */}
          {(job.dispatchedAt || job.onTheWayAt || job.arrivedAt || job.completedAt) && (
            <section>
              <h3 className="text-lg font-semibold text-zinc-100 mb-3">Job Timeline</h3>
              <div className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-4 space-y-3">
                {/* Timeline Events */}
                {job.dispatchedAt && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-purple-500 mt-1.5" />
                    <div className="flex-1">
                      <p className="text-sm text-zinc-300 font-medium">Dispatched</p>
                      <p className="text-xs text-zinc-500">{formatDate(job.dispatchedAt)} at {formatTime(job.dispatchedAt)}</p>
                    </div>
                  </div>
                )}

                {job.onTheWayAt && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-500 mt-1.5" />
                    <div className="flex-1">
                      <p className="text-sm text-zinc-300 font-medium">On the Way</p>
                      <p className="text-xs text-zinc-500">{formatDate(job.onTheWayAt)} at {formatTime(job.onTheWayAt)}</p>
                      {job.dispatchedAt && (
                        <p className="text-xs text-emerald-400 mt-0.5">
                          Response time: {calculateDuration(job.dispatchedAt, job.onTheWayAt)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {job.arrivedAt && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-yellow-500 mt-1.5" />
                    <div className="flex-1">
                      <p className="text-sm text-zinc-300 font-medium">Arrived / Started Work</p>
                      <p className="text-xs text-zinc-500">{formatDate(job.arrivedAt)} at {formatTime(job.arrivedAt)}</p>
                      {job.onTheWayAt && (
                        <p className="text-xs text-emerald-400 mt-0.5">
                          Travel time: {calculateDuration(job.onTheWayAt, job.arrivedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {job.completedAt && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                    <div className="flex-1">
                      <p className="text-sm text-zinc-300 font-medium">Completed</p>
                      <p className="text-xs text-zinc-500">{formatDate(job.completedAt)} at {formatTime(job.completedAt)}</p>
                      {job.arrivedAt && (
                        <p className="text-xs text-emerald-400 mt-0.5">
                          On-site time: {calculateDuration(job.arrivedAt, job.completedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Summary Stats */}
                {job.completedAt && job.onTheWayAt && (
                  <div className="pt-3 mt-3 border-t border-zinc-700 grid grid-cols-2 gap-3">
                    {job.onTheWayAt && job.arrivedAt && (
                      <div className="bg-zinc-900/50 rounded-lg p-2.5">
                        <p className="text-xs text-zinc-400 mb-0.5">Travel Time</p>
                        <p className="text-sm font-semibold text-blue-400">
                          {calculateDuration(job.onTheWayAt, job.arrivedAt)}
                        </p>
                      </div>
                    )}
                    {job.arrivedAt && job.completedAt && (
                      <div className="bg-zinc-900/50 rounded-lg p-2.5">
                        <p className="text-xs text-zinc-400 mb-0.5">On-Site Time</p>
                        <p className="text-sm font-semibold text-emerald-400">
                          {calculateDuration(job.arrivedAt, job.completedAt)}
                        </p>
                      </div>
                    )}
                    {job.onTheWayAt && job.completedAt && (
                      <div className="bg-zinc-900/50 rounded-lg p-2.5 col-span-2">
                        <p className="text-xs text-zinc-400 mb-0.5">Total Job Time</p>
                        <p className="text-lg font-bold text-purple-400">
                          {calculateDuration(job.onTheWayAt, job.completedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Photos Section */}
          <section ref={photosRef}>
            <h3 className="text-lg font-semibold text-zinc-100 mb-3">Photos</h3>

            {/* Photo type tabs */}
            <div className="flex gap-2 mb-3">
              {(['before', 'during', 'after'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setPhotoType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    photoType === type
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Photos grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Uploaded photos of selected type */}
              {jobPhotos
                .filter(photo => photo.type === photoType)
                .map((photo) => (
                  <div key={photo.id} className="relative aspect-square bg-zinc-800/30 border border-zinc-800 rounded-xl overflow-hidden group">
                    <img
                      src={photo.url}
                      alt={`${photo.type} photo`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handlePhotoDelete(photo.id)}
                      className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}

              {/* Upload button */}
              <div className="aspect-square bg-zinc-800/30 border-2 border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center hover:bg-zinc-800/50 hover:border-emerald-600 transition-colors relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => {
                    console.log('📁 File input onChange triggered');
                    const file = e.target.files?.[0];
                    console.log('📄 Selected file:', file?.name, file?.type);
                    if (file) {
                      handlePhotoUpload(file, photoType);
                      // Reset input so same file can be selected again
                      e.target.value = '';
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  disabled={uploadingPhoto}
                  onClick={(e) => {
                    console.log('🖱️ File input clicked');
                  }}
                />
                {uploadingPhoto ? (
                  <div className="flex flex-col items-center justify-center pointer-events-none">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-2"></div>
                    <span className="text-sm font-medium text-zinc-400">Uploading...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pointer-events-none">
                    <Camera className="h-8 w-8 text-zinc-600 mb-2" />
                    <span className="text-sm font-medium text-zinc-500">Add {photoType}</span>
                    <span className="text-xs text-zinc-600 mt-1">Click to upload</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Notes Tabs */}
          <section>
            <div className="flex items-center gap-2 mb-3 border-b border-zinc-800">
              <button
                onClick={() => setActiveTab('internal')}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                  activeTab === 'internal'
                    ? 'text-emerald-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Internal Notes
                {activeTab === 'internal' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('customer')}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                  activeTab === 'customer'
                    ? 'text-emerald-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Customer Notes
                {activeTab === 'customer' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                )}
              </button>
            </div>

            {activeTab === 'internal' ? (
              <textarea
                value={editedJob.notes || ''}
                onChange={(e) => setEditedJob({ ...editedJob, notes: e.target.value })}
                disabled={!isEditing}
                placeholder="Add internal notes (only you can see these)..."
                className="w-full min-h-[120px] px-4 py-3 bg-zinc-800/30 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
            ) : (
              <textarea
                value={editedJob.customerNotes || ''}
                onChange={(e) => setEditedJob({ ...editedJob, customerNotes: e.target.value })}
                disabled={!isEditing}
                placeholder="Add customer notes (customer can see these)..."
                className="w-full min-h-[120px] px-4 py-3 bg-zinc-800/30 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
            )}
          </section>

          {/* Activity Log */}
          <section>
            <h3 className="text-lg font-semibold text-zinc-100 mb-3">Activity Log</h3>
            <div className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                <div className="flex-1">
                  <p className="text-sm text-zinc-300">Job created</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{formatDate(job.createdAt)} at {formatTime(job.createdAt)}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                <div className="flex-1">
                  <p className="text-sm text-zinc-300">Status set to {job.status.replace('_', ' ')}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Current status</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Actions */}
        <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 p-4 flex items-center justify-between gap-3">
          <Button
            onClick={handleDelete}
            variant="outline"
            className="border-red-900/50 text-red-400 hover:bg-red-900/20 hover:border-red-900"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Job
          </Button>

          <div className="flex items-center gap-2">
            {isEditing && (
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}

            {job.status === 'in-progress' && (
              <Button
                onClick={() => handleStatusChange('completed')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            )}

            {job.status === 'completed' && (
              <Button
                onClick={() => router.push(`/provider/invoices/create?jobId=${job.id}`)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Job Modal */}
      {showEditModal && (
        <EditJobModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          jobId={job.id}
          initialData={{
            serviceType: job.serviceType,
            startTime: job.startTime,
            endTime: job.endTime,
            estimatedValue: job.estimatedValue,
            internalNotes: job.notes,
            customerNotes: job.customerNotes,
            status: job.status as 'scheduled' | 'completed' | 'in_progress' | 'cancelled',
          }}
          onJobUpdated={() => {
            onJobUpdated();
            setShowEditModal(false);
          }}
        />
      )}
    </>
  );
}
