'use client'

import { useState, useEffect } from 'react';
import {
  X, Phone, MapPin, MessageCircle, Navigation, Camera, MoreHorizontal,
  Clock, DollarSign, User, Users, Calendar, CheckCircle, AlertCircle,
  FileText, Image as ImageIcon, History, StickyNote, Play, Square,
  Edit, Trash2, Copy, ExternalLink, Flag, Repeat, Star, Pencil, Check, XIcon, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface JobPhoto {
  id: string;
  url: string;
  type: 'before' | 'during' | 'after';
  createdAt: string;
  uploadedBy?: string;
}

interface AssignedUser {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  profilePhotoUrl?: string;
}

interface Job {
  id: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  address: string;
  serviceType: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'dispatched' | 'on-the-way' | 'in-progress' | 'completed' | 'cancelled';
  isRenoaLead?: boolean;
  estimatedValue?: number;
  actualValue?: number;
  jobInstructions?: string;
  customerNotes?: string;
  assignedUserIds?: string[];
  assignedUsers?: AssignedUser[];
  isRecurring?: boolean;
  priority?: 'urgent' | 'high' | 'normal';
  createdAt: string;
  dispatchedAt?: string | null;
  onTheWayAt?: string | null;
  arrivedAt?: string | null;
  completedAt?: string | null;
  completedByUserId?: string;
}

interface JobDetailViewProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onJobUpdated: () => void;
}

type TabType = 'overview' | 'photos' | 'history' | 'notes';

export default function JobDetailView({ job, isOpen, onClose, onJobUpdated }: JobDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [jobPhotos, setJobPhotos] = useState<JobPhoto[]>([]);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    if (job) {
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

  if (!isOpen || !job) return null;

  // Validate required job properties to prevent crashes
  if (!job.id || !job.customerName) {
    console.error('JobDetailView: Missing required job properties', job);
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-4">Error Loading Job</h2>
          <p className="text-zinc-300 mb-4">This job is missing required data.</p>
          <Button onClick={onClose} className="w-full">Close</Button>
        </div>
      </div>
    );
  }

  const statusColors = {
    scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    dispatched: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    'on-the-way': 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    'in-progress': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    completed: 'bg-green-500/20 text-green-400 border-green-500/40',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/40',
  };

  const statusLabels = {
    scheduled: 'Scheduled',
    dispatched: 'Dispatched',
    'on-the-way': 'On The Way',
    'in-progress': 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  const formatCurrency = (cents?: number) => {
    if (!cents) return '$0.00';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const duration = (new Date(job.endTime).getTime() - new Date(job.startTime).getTime()) / (1000 * 60 * 60);

  const beforePhotos = jobPhotos.filter(p => p.type === 'before');
  const duringPhotos = jobPhotos.filter(p => p.type === 'during');
  const afterPhotos = jobPhotos.filter(p => p.type === 'after');

  // Check if completed job has no photos
  const needsPhotos = job.status === 'completed' && jobPhotos.length === 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center md:p-4">
      <div className="bg-zinc-900 md:rounded-xl border border-zinc-800 w-full max-w-7xl h-full md:h-[90vh] flex flex-col overflow-hidden">

        {/* HEADER */}
        <div className="border-b border-zinc-800 p-6 bg-zinc-900/95 backdrop-blur">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-zinc-100">{job.serviceType}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${statusColors[job.status]}`}>
                  {statusLabels[job.status]}
                </span>
                {job.priority === 'urgent' && (
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded uppercase flex items-center gap-1">
                    <Flag className="h-3 w-3" />
                    Urgent
                  </span>
                )}
                {job.isRecurring && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded flex items-center gap-1">
                    <Repeat className="h-3 w-3" />
                    Recurring
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-zinc-400">
                <span>Job #{job.id.slice(0, 8)}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDateTime(job.startTime)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {duration.toFixed(1)}h
                </span>
              </div>

              {job.assignedUsers && job.assignedUsers.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <Users className="h-4 w-4 text-zinc-500" />
                  <div className="flex items-center gap-2">
                    {job.assignedUsers.slice(0, 3).map((user) => (
                      <div key={user.id} className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800/50 rounded">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-semibold text-emerald-400">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <span className="text-xs text-zinc-300">{user.firstName} {user.lastName}</span>
                      </div>
                    ))}
                    {job.assignedUsers.length > 3 && (
                      <span className="text-xs text-zinc-500">+{job.assignedUsers.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-zinc-400" />
            </button>
          </div>

          {/* QUICK ACTIONS */}
          <div className="flex items-center gap-2 mt-4">
            <Button
              onClick={() => window.open(`tel:${job.customerPhone}`, '_self')}
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call
            </Button>
            <Button
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`, '_blank')}
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Navigate
            </Button>
            {job.status === 'scheduled' && (
              <Button className="bg-emerald-600 hover:bg-emerald-500">
                <Play className="h-4 w-4 mr-2" />
                Dispatch Job
              </Button>
            )}
            {job.status === 'in-progress' && (
              <Button className="bg-emerald-600 hover:bg-emerald-500">
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Job
              </Button>
            )}
            <Button
              onClick={() => setActiveTab('photos')}
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800"
            >
              <Camera className="h-4 w-4 mr-2" />
              Photos ({jobPhotos.length})
            </Button>
            <Button
              onClick={() => setActiveTab('notes')}
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>

            <div className="relative ml-auto">
              <Button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                variant="outline"
                className="border-zinc-700 hover:bg-zinc-800"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>

              {showMoreMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-10">
                  <button className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Job
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    Duplicate Job
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    View in List
                  </button>
                  <div className="border-t border-zinc-700 my-1" />
                  <button className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-700 flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Cancel Job
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

          {/* LEFT COLUMN - Main workspace (70%) */}
          <div className="flex-1 flex flex-col md:border-r border-zinc-800">
            {/* TABS */}
            <div className="border-b border-zinc-800 bg-zinc-900/50">
              <div className="flex gap-1 p-2">
                {[
                  { id: 'overview', label: 'Overview', icon: FileText },
                  { id: 'photos', label: 'Photos', icon: ImageIcon, count: jobPhotos.length },
                  { id: 'history', label: 'History', icon: History },
                  { id: 'notes', label: 'Notes', icon: StickyNote },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 relative ${
                      activeTab === tab.id
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={`px-1.5 py-0.5 ${needsPhotos && tab.id === 'photos' ? 'bg-red-500/20 text-red-400' : 'bg-zinc-700'} rounded text-xs`}>
                        {tab.count}
                      </span>
                    )}
                    {needsPhotos && tab.id === 'photos' && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && <OverviewTab job={job} />}
              {activeTab === 'photos' && (
                <PhotosTab
                  beforePhotos={beforePhotos}
                  afterPhotos={afterPhotos}
                  onPhotoUploaded={fetchJobPhotos}
                  jobId={job.id}
                  jobStatus={job.status}
                />
              )}
              {activeTab === 'history' && <HistoryTab job={job} />}
              {activeTab === 'notes' && <NotesTab job={job} onJobUpdated={onJobUpdated} />}
            </div>
          </div>

          {/* RIGHT SIDEBAR - Context (30%) */}
          <div className="w-full md:w-96 overflow-y-auto p-6 space-y-6 border-t md:border-t-0 border-zinc-800">
            <CustomerCard job={job} />
            <JobValueSummary job={job} />
          </div>
        </div>

        {/* MOBILE BOTTOM ACTION BAR */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4 flex gap-2 z-10">
          <Button
            onClick={() => window.open(`tel:${job.customerPhone}`, '_self')}
            variant="outline"
            className="flex-1 border-zinc-700 hover:bg-zinc-800"
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`, '_blank')}
            variant="outline"
            className="flex-1 border-zinc-700 hover:bg-zinc-800"
          >
            <Navigation className="h-4 w-4" />
          </Button>
          {job.status === 'in-progress' && (
            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-500">
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete
            </Button>
          )}
          <Button
            variant="outline"
            className="border-zinc-700 hover:bg-zinc-800"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// OVERVIEW TAB - Schedule, Timeline, Service Details
function OverviewTab({ job }: { job: Job }) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedDate, setEditedDate] = useState('');
  const [editedStartTime, setEditedStartTime] = useState('');
  const [editedEndTime, setEditedEndTime] = useState('');
  const [saving, setSaving] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDateForInput = (dateStr: string) => {
    return new Date(dateStr).toISOString().split('T')[0];
  };

  const formatTimeForInput = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toTimeString().slice(0, 5);
  };

  const duration = (new Date(job.endTime).getTime() - new Date(job.startTime).getTime()) / (1000 * 60 * 60);

  // Calculate time tracking if timestamps exist
  const travelTime = job.onTheWayAt && job.arrivedAt
    ? (new Date(job.arrivedAt).getTime() - new Date(job.onTheWayAt).getTime()) / (1000 * 60)
    : null;

  const onSiteTime = job.arrivedAt && job.completedAt
    ? (new Date(job.completedAt).getTime() - new Date(job.arrivedAt).getTime()) / (1000 * 60 * 60)
    : null;

  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      const startDateTime = new Date(`${editedDate}T${editedStartTime}`);
      const endDateTime = new Date(`${editedDate}T${editedEndTime}`);

      const res = await fetch(`/api/provider/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        }),
      });

      if (!res.ok) throw new Error('Failed to update schedule');

      toast.success('Schedule updated successfully');
      setEditingField(null);
      window.location.reload(); // Refresh to show updated data
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Failed to update schedule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SCHEDULE & ASSIGNMENT */}
      <div className="bg-zinc-800/30 rounded-lg border border-zinc-700 p-4">
        <h3 className="text-sm font-bold text-zinc-100 mb-4">Schedule & Assignment</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            {/* Date Field - Editable */}
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Date</label>
              {editingField === 'date' ? (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={editedDate}
                    onChange={(e) => setEditedDate(e.target.value)}
                    className="flex-1 px-2 py-1 bg-zinc-900 border border-emerald-500 rounded text-sm text-zinc-200 focus:outline-none"
                  />
                  <button
                    onClick={handleSaveSchedule}
                    disabled={saving}
                    className="p-1 bg-emerald-600 hover:bg-emerald-500 rounded text-white"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingField(null)}
                    className="p-1 bg-zinc-700 hover:bg-zinc-600 rounded text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  className="group flex items-center gap-2 cursor-pointer"
                  onClick={() => {
                    setEditedDate(formatDateForInput(job.startTime));
                    setEditedStartTime(formatTimeForInput(job.startTime));
                    setEditedEndTime(formatTimeForInput(job.endTime));
                    setEditingField('date');
                  }}
                >
                  <p className="text-sm text-zinc-200">{formatDate(job.startTime)}</p>
                  <Pencil className="h-3 w-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>

            {/* Time Window - Editable */}
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Time Window</label>
              {editingField === 'time' ? (
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={editedStartTime}
                    onChange={(e) => setEditedStartTime(e.target.value)}
                    className="flex-1 px-2 py-1 bg-zinc-900 border border-emerald-500 rounded text-sm text-zinc-200 focus:outline-none"
                  />
                  <span className="text-zinc-500">–</span>
                  <input
                    type="time"
                    value={editedEndTime}
                    onChange={(e) => setEditedEndTime(e.target.value)}
                    className="flex-1 px-2 py-1 bg-zinc-900 border border-emerald-500 rounded text-sm text-zinc-200 focus:outline-none"
                  />
                  <button
                    onClick={handleSaveSchedule}
                    disabled={saving}
                    className="p-1 bg-emerald-600 hover:bg-emerald-500 rounded text-white"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingField(null)}
                    className="p-1 bg-zinc-700 hover:bg-zinc-600 rounded text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  className="group flex items-center gap-2 cursor-pointer"
                  onClick={() => {
                    setEditedDate(formatDateForInput(job.startTime));
                    setEditedStartTime(formatTimeForInput(job.startTime));
                    setEditedEndTime(formatTimeForInput(job.endTime));
                    setEditingField('time');
                  }}
                >
                  <p className="text-sm text-zinc-200">
                    {formatTime(job.startTime)} – {formatTime(job.endTime)}
                  </p>
                  <Pencil className="h-3 w-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>

            {/* Duration - Calculated */}
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Duration</label>
              <p className="text-sm text-zinc-200">{duration.toFixed(1)} hours</p>
            </div>

            {/* Status - Read only for now */}
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Status</label>
              <p className="text-sm text-zinc-200 capitalize">{job.status.replace(/-/g, ' ')}</p>
            </div>
          </div>

          {/* Assigned Team - Interactive badges */}
          {job.assignedUsers && job.assignedUsers.length > 0 && (
            <div>
              <label className="text-xs text-zinc-500 mb-2 block">Assigned Team</label>
              <div className="flex flex-wrap gap-2">
                {job.assignedUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => window.open(`/provider/calendar?user=${user.id}`, '_blank')}
                    className="group flex items-center gap-2 px-3 py-1.5 bg-zinc-700/50 rounded hover:bg-zinc-700 cursor-pointer transition-colors relative"
                    title={`Click to view ${user.firstName}'s calendar`}
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-semibold text-emerald-400">
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <span className="text-sm text-zinc-200">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="text-xs text-zinc-500 capitalize">({user.role})</span>

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                      <p className="text-xs text-zinc-300">Click to view calendar</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TIME TRACKING */}
      {(travelTime !== null || onSiteTime !== null) && (
        <div className="bg-zinc-800/30 rounded-lg border border-zinc-700 p-4">
          <h3 className="text-sm font-bold text-zinc-100 mb-4">Time Tracking</h3>
          <div className="space-y-2">
            {travelTime !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Travel Time</span>
                <span className="text-sm font-semibold text-zinc-200">{travelTime.toFixed(0)} min</span>
              </div>
            )}
            {onSiteTime !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">On-Site Time</span>
                <span className="text-sm font-semibold text-zinc-200">{onSiteTime.toFixed(1)}h</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SERVICE DETAILS - Enhanced */}
      <div className="bg-zinc-800/30 rounded-lg border border-zinc-700 p-4">
        <h3 className="text-sm font-bold text-zinc-100 mb-4">Service Details</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Service Type</label>
            <span className="inline-block px-2 py-1 bg-emerald-500/20 text-emerald-400 text-sm rounded">
              {job.serviceType}
            </span>
          </div>

          {/* Location Details */}
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Location</label>
            <div className="flex items-start gap-2 p-3 bg-zinc-900/50 border border-zinc-700 rounded">
              <MapPin className="h-4 w-4 text-zinc-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-zinc-200">{job.address}</p>
                <button
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`, '_blank')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 mt-1 flex items-center gap-1"
                >
                  <Navigation className="h-3 w-3" />
                  Get Directions
                </button>
              </div>
            </div>
          </div>

          {/* Customer Instructions */}
          {job.customerNotes && (
            <div>
              <label className="text-xs text-zinc-500 mb-1 block flex items-center gap-2">
                <AlertCircle className="h-3 w-3" />
                Customer Instructions
              </label>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-sm text-zinc-200">
                {job.customerNotes}
              </div>
            </div>
          )}

          {/* Internal Notes */}
          {job.jobInstructions && (
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Internal Notes</label>
              <div className="p-3 bg-zinc-900/50 border border-zinc-700 rounded text-sm text-zinc-300 whitespace-pre-wrap">
                {job.jobInstructions}
              </div>
            </div>
          )}

          {/* Equipment/Requirements placeholder */}
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Equipment & Requirements</label>
            <div className="p-3 bg-zinc-900/50 border border-zinc-700 rounded text-sm text-zinc-500 italic">
              No special equipment required
            </div>
          </div>
        </div>
      </div>

      {/* STATUS TIMELINE - Fixed to show ALL status changes */}
      <div className="bg-zinc-800/30 rounded-lg border border-zinc-700 p-4">
        <h3 className="text-sm font-bold text-zinc-100 mb-4">Status Timeline</h3>
        <div className="space-y-3">
          {/* Created */}
          <TimelineItem
            label="Job Created"
            timestamp={job.createdAt}
            completed={true}
            statusColor="text-blue-400"
          />

          {/* Assigned (if has assigned users) */}
          {job.assignedUsers && job.assignedUsers.length > 0 && (
            <TimelineItem
              label={`Assigned to ${job.assignedUsers.map(u => u.firstName).join(', ')}`}
              timestamp={job.createdAt}
              completed={true}
              statusColor="text-purple-400"
            />
          )}

          {/* Dispatched */}
          {job.dispatchedAt ? (
            <TimelineItem
              label="Dispatched"
              timestamp={job.dispatchedAt}
              completed={true}
              statusColor="text-emerald-400"
            />
          ) : (
            <TimelineItem
              label="Awaiting Dispatch"
              timestamp=""
              completed={false}
              statusColor="text-zinc-500"
            />
          )}

          {/* On The Way */}
          {job.onTheWayAt ? (
            <TimelineItem
              label="Team En Route"
              timestamp={job.onTheWayAt}
              completed={true}
              statusColor="text-orange-400"
            />
          ) : job.dispatchedAt ? (
            <TimelineItem
              label="Not En Route Yet"
              timestamp=""
              completed={false}
              statusColor="text-zinc-500"
            />
          ) : null}

          {/* Arrived/Started */}
          {job.arrivedAt ? (
            <TimelineItem
              label="Arrived & Work Started"
              timestamp={job.arrivedAt}
              completed={true}
              statusColor="text-yellow-400"
            />
          ) : job.onTheWayAt ? (
            <TimelineItem
              label="Not Arrived Yet"
              timestamp=""
              completed={false}
              statusColor="text-zinc-500"
            />
          ) : null}

          {/* Completed */}
          {job.completedAt ? (
            <TimelineItem
              label="Job Completed"
              timestamp={job.completedAt}
              completed={true}
              statusColor="text-green-400"
            />
          ) : job.arrivedAt ? (
            <TimelineItem
              label="In Progress"
              timestamp=""
              completed={false}
              statusColor="text-zinc-500"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ label, timestamp, completed, statusColor }: {
  label: string;
  timestamp: string;
  completed: boolean;
  statusColor?: string;
}) {
  const formatTimestamp = (ts: string) => {
    if (!ts) return '';
    return new Date(ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Determine dot color based on status
  const dotColor = completed
    ? statusColor?.replace('text-', 'bg-') || 'bg-emerald-500'
    : 'bg-zinc-600';

  return (
    <div className="flex items-start gap-3">
      <div className={`w-2 h-2 rounded-full mt-1.5 ${dotColor}`} />
      <div className="flex-1">
        <p className={`text-sm font-medium ${completed ? statusColor || 'text-zinc-200' : 'text-zinc-500'}`}>
          {label}
        </p>
        {completed && timestamp && (
          <p className="text-xs text-zinc-500">{formatTimestamp(timestamp)}</p>
        )}
      </div>
    </div>
  );
}

// PHOTOS TAB - Before/After sections only (During removed)
function PhotosTab({ beforePhotos, afterPhotos, onPhotoUploaded, jobId, jobStatus }: {
  beforePhotos: JobPhoto[];
  afterPhotos: JobPhoto[];
  onPhotoUploaded: () => void;
  jobId: string;
  jobStatus: string;
}) {
  const [uploadingType, setUploadingType] = useState<'before' | 'after' | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<JobPhoto | null>(null);

  const totalPhotos = beforePhotos.length + afterPhotos.length;
  const needsPhotos = jobStatus === 'completed' && totalPhotos === 0;

  const handlePhotoUpload = async (file: File, type: 'before' | 'after') => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploadingType(type);

    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('type', type);

      const res = await fetch(`/api/provider/jobs/${jobId}/photos`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      toast.success('Photo uploaded successfully');
      onPhotoUploaded();
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingType(null);
    }
  };

  const PhotoSection = ({ title, photos, type }: {
    title: string;
    photos: JobPhoto[];
    type: 'before' | 'after';
  }) => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          {title}
          <span className="px-2 py-0.5 bg-zinc-700 rounded text-xs">{photos.length}</span>
        </h4>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhotoUpload(file, type);
            }}
            disabled={uploadingType !== null}
          />
          <Button
            size="sm"
            variant="outline"
            className="border-zinc-700 hover:bg-zinc-800"
            disabled={uploadingType !== null}
          >
            <Camera className="h-4 w-4 mr-2" />
            {uploadingType === type ? 'Uploading...' : 'Add Photos'}
          </Button>
        </label>
      </div>

      {photos.length === 0 ? (
        <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center">
          <Camera className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">No {title.toLowerCase()} photos yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all group"
            >
              <img
                src={photo.url}
                alt={`${title} photo`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                <p className="text-xs text-white">
                  {new Date(photo.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Photo Alert for Completed Jobs */}
      {needsPhotos && (
        <div className="bg-red-500/10 border-2 border-red-500/50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-red-400 mb-1">Photos Required</h4>
            <p className="text-sm text-red-300">
              This job is marked as completed but has no photos. Please upload before/after photos to document the work.
            </p>
          </div>
        </div>
      )}

      <PhotoSection title="Before" photos={beforePhotos} type="before" />
      <PhotoSection title="After" photos={afterPhotos} type="after" />

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-4xl max-h-[90vh]">
            <img
              src={selectedPhoto.url}
              alt="Photo"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}

// HISTORY TAB - Simplified color-coded timeline (no filters)
function HistoryTab({ job }: { job: Job }) {
  // Color-coded activity types
  type ActivityType = 'scheduling' | 'field' | 'financial' | 'other';

  const typeColors = {
    scheduling: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: 'text-blue-400', dot: 'bg-blue-400' },
    field: { bg: 'bg-green-500/10', border: 'border-green-500/30', icon: 'text-green-400', dot: 'bg-green-400' },
    financial: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: 'text-yellow-400', dot: 'bg-yellow-400' },
    other: { bg: 'bg-zinc-800/30', border: 'border-zinc-700', icon: 'text-zinc-400', dot: 'bg-zinc-500' },
  };

  const activities = [
    {
      type: 'scheduling' as ActivityType,
      icon: Calendar,
      label: 'Job created',
      timestamp: job.createdAt,
      user: 'System',
    },
    ...(job.assignedUsers && job.assignedUsers.length > 0 ? [{
      type: 'scheduling' as ActivityType,
      icon: Users,
      label: `Assigned to ${job.assignedUsers.map(u => u.firstName).join(', ')}`,
      timestamp: job.createdAt,
      user: 'System',
    }] : []),
    ...(job.dispatchedAt ? [{
      type: 'field' as ActivityType,
      icon: Play,
      label: 'Job dispatched',
      timestamp: job.dispatchedAt,
      user: 'Dispatcher',
    }] : []),
    ...(job.onTheWayAt ? [{
      type: 'field' as ActivityType,
      icon: Navigation,
      label: 'Team en route',
      timestamp: job.onTheWayAt,
      user: 'Field Team',
    }] : []),
    ...(job.arrivedAt ? [{
      type: 'field' as ActivityType,
      icon: CheckCircle,
      label: 'Arrived & work started',
      timestamp: job.arrivedAt,
      user: 'Field Team',
    }] : []),
    ...(job.completedAt ? [{
      type: 'field' as ActivityType,
      icon: CheckCircle,
      label: 'Job completed',
      timestamp: job.completedAt,
      user: 'Field Team',
    }] : []),
    ...(job.actualValue ? [{
      type: 'financial' as ActivityType,
      icon: DollarSign,
      label: 'Invoice created',
      timestamp: job.completedAt || job.createdAt,
      user: 'System',
    }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-xs text-zinc-400">Scheduling</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-xs text-zinc-400">Field Activity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <span className="text-xs text-zinc-400">Financial</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-zinc-500" />
          <span className="text-xs text-zinc-400">Other</span>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-2">
        {activities.map((activity, idx) => {
          const Icon = activity.icon;
          const colors = typeColors[activity.type];
          return (
            <div key={idx} className={`flex items-start gap-3 p-3 ${colors.bg} rounded-lg border ${colors.border}`}>
              <div className={`w-2 h-2 rounded-full mt-2 ${colors.dot}`} />
              <div className="p-2 bg-zinc-900/30 rounded">
                <Icon className={`h-4 w-4 ${colors.icon}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200">{activity.label}</p>
                <p className="text-xs text-zinc-500">
                  {new Date(activity.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                  {' • '}
                  {activity.user}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// NOTES TAB - Internal and Customer notes with history
function NotesTab({ job, onJobUpdated }: { job: Job; onJobUpdated: () => void }) {
  const [internalNote, setInternalNote] = useState(job.jobInstructions || '');
  const [customerNote, setCustomerNote] = useState(job.customerNotes || '');
  const [saving, setSaving] = useState(false);
  const [customerHistory, setCustomerHistory] = useState<Array<{ notes: string; date: string; serviceType: string }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch customer notes history
  useEffect(() => {
    const fetchCustomerHistory = async () => {
      if (!job.customerId) return;

      setLoadingHistory(true);
      try {
        const res = await fetch(`/api/provider/customers/${job.customerId}/notes-history`);
        if (res.ok) {
          const data = await res.json();
          setCustomerHistory(data.history || []);
        }
      } catch (error) {
        console.error('Error fetching customer notes history:', error);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchCustomerHistory();
  }, [job.customerId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/provider/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobInstructions: internalNote,
          customerNotes: customerNote,
        }),
      });

      if (!res.ok) throw new Error('Failed to save notes');

      toast.success('Notes saved successfully');
      onJobUpdated();
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Customer Notes History */}
      {customerHistory.length > 0 && (
        <div className="bg-blue-500/5 rounded-lg border border-blue-500/20 p-4">
          <h4 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">
            <History className="h-4 w-4" />
            Past Customer Notes ({customerHistory.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {customerHistory.map((item, idx) => (
              <div key={idx} className="p-2 bg-zinc-900/50 rounded border border-zinc-700">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-xs text-emerald-400">{item.serviceType}</span>
                  <span className="text-xs text-zinc-500">
                    {new Date(item.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-xs text-zinc-300">{item.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Internal Notes */}
      <div className="bg-zinc-800/30 rounded-lg border border-zinc-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-zinc-100">Internal Notes</h4>
          <span className="text-xs text-zinc-500">Office & Tech Only</span>
        </div>
        <textarea
          value={internalNote}
          onChange={(e) => setInternalNote(e.target.value)}
          placeholder="Add internal notes, instructions, or reminders..."
          className="w-full h-32 px-3 py-2 bg-zinc-900/50 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
      </div>

      {/* Customer-Facing Notes */}
      <div className="bg-zinc-800/30 rounded-lg border border-zinc-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-zinc-100">Customer Notes</h4>
          <span className="text-xs text-blue-400">Customer can see this</span>
        </div>
        <textarea
          value={customerNote}
          onChange={(e) => setCustomerNote(e.target.value)}
          placeholder="Add notes visible to the customer..."
          className="w-full h-32 px-3 py-2 bg-zinc-900/50 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-emerald-600 hover:bg-emerald-500"
      >
        {saving ? 'Saving...' : 'Save Notes'}
      </Button>
    </div>
  );
}

function CustomerCard({ job }: { job: Job }) {
  return (
    <div className="bg-zinc-800/30 rounded-lg border border-zinc-700 p-4">
      <h3 className="text-sm font-bold text-zinc-100 mb-3 flex items-center gap-2">
        <User className="h-4 w-4" />
        Customer
      </h3>
      <div className="space-y-2">
        <p className="text-lg font-semibold text-zinc-100">{job.customerName}</p>
        {job.customerPhone && (
          <a href={`tel:${job.customerPhone}`} className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300">
            <Phone className="h-4 w-4" />
            {job.customerPhone}
          </a>
        )}
        {job.customerEmail && (
          <a href={`mailto:${job.customerEmail}`} className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300">
            <MessageCircle className="h-4 w-4" />
            {job.customerEmail}
          </a>
        )}
        <button
          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`, '_blank')}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300"
        >
          <MapPin className="h-4 w-4" />
          {job.address}
        </button>
      </div>
    </div>
  );
}

function JobValueSummary({ job }: { job: Job }) {
  const formatCurrency = (cents?: number) => {
    if (!cents) return '$0.00';
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="bg-zinc-800/30 rounded-lg border border-zinc-700 p-4">
      <h3 className="text-sm font-bold text-zinc-100 mb-3 flex items-center gap-2">
        <DollarSign className="h-4 w-4" />
        Job Value
      </h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Estimated</span>
          <span className="text-sm font-semibold text-zinc-100">{formatCurrency(job.estimatedValue)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Actual</span>
          <span className="text-sm font-semibold text-zinc-100">{formatCurrency(job.actualValue)}</span>
        </div>
        {job.status === 'completed' && !job.actualValue && (
          <Button className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500">
            Create Invoice
          </Button>
        )}
      </div>
    </div>
  );
}
