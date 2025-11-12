'use client'

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Phone, MapPin, MessageCircle, Edit2, Save, Trash2, CheckCircle, Send, Camera, ChevronDown, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import EditJobModal from './EditJobModal';

interface Job {
  id: string;
  customerName: string;
  serviceType: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  isRenoaLead: boolean;
  phone: string;
  email: string;
  address: string;
  estimatedValue?: number;
  actualValue?: number;
  createdAt: string;
  notes?: string;
  customerNotes?: string;
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

  useEffect(() => {
    if (job) {
      setEditedJob({
        actualValue: job.actualValue,
        notes: job.notes || '',
        customerNotes: job.customerNotes || '',
      });
    }
  }, [job]);

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
      const res = await fetch(`/api/provider/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
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
      case 'in_progress': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  const statusSteps = ['scheduled', 'in_progress', 'completed', 'paid'];
  const currentStepIndex = statusSteps.indexOf(job.status);

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
                      job.status === 'in_progress' ? 'text-orange-400' :
                      job.status === 'completed' ? 'text-emerald-400' :
                      'text-red-400'
                    }`}
                  >
                    {job.status.replace('_', ' ')}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {showStatusMenu && (
                    <div className="absolute top-full mt-1 left-0 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-20 min-w-[140px]">
                      {['scheduled', 'in_progress', 'completed', 'cancelled'].map(status => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 transition-colors capitalize"
                        >
                          {status.replace('_', ' ')}
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
            {job.status === 'in_progress' && (
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
                <span className="font-medium text-zinc-200">{getDuration()} hours</span>
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

          {/* Photos Section */}
          <section ref={photosRef}>
            <h3 className="text-lg font-semibold text-zinc-100 mb-3">Photos</h3>
            <div className="grid grid-cols-3 gap-3">
              {['Before', 'During', 'After'].map((label) => (
                <div key={label} className="aspect-square bg-zinc-800/30 border border-zinc-800 rounded-xl flex flex-col items-center justify-center hover:bg-zinc-800/50 transition-colors cursor-pointer">
                  <Camera className="h-8 w-8 text-zinc-600 mb-2" />
                  <span className="text-sm font-medium text-zinc-500">{label}</span>
                  <span className="text-xs text-zinc-600 mt-1">Click to upload</span>
                </div>
              ))}
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

            {job.status === 'in_progress' && (
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
            status: job.status,
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
