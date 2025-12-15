'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Button } from '@/components/ui/button';
import { Search, Plus, Calendar, MapPin, DollarSign, Users, Briefcase, CheckCircle2, Clock, XCircle, MoreVertical, Trash2, Edit, Eye } from 'lucide-react';
import { toast } from 'sonner';
import AddJobModal from '@/components/provider/AddJobModal';

interface Job {
  id: string;
  customerName: string;
  customerAddress: string;
  serviceType: string;
  startTime: string;
  duration: number;
  status: string;
  estimatedValue: number | null;
  actualValue: number | null;
  assignedUsers?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    profilePhotoUrl?: string;
  }>;
  createdAt: string;
}

const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
  scheduled: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Clock },
  dispatched: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: Users },
  'on-the-way': { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: MapPin },
  'in-progress': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Clock },
  completed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle2 },
  cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle },
};

export default function ProviderJobs() {
  const router = useRouter();
  const [providerName, setProviderName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [providerServiceTypes, setProviderServiceTypes] = useState<string[]>([]);

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');

    if (!id || !name) {
      router.push('/provider/login');
      return;
    }

    setProviderId(id);
    setProviderName(name);
    fetchJobs(id);
    fetchProviderServices(id);
  }, [router]);

  const fetchProviderServices = async (id: string) => {
    try {
      const res = await fetch(`/api/provider/profile?id=${id}`);
      const data = await res.json();
      if (data.provider) {
        setProviderServiceTypes(data.provider.serviceTypes || []);
      }
    } catch (error) {
      console.error('Error fetching provider services:', error);
    }
  };

  const fetchJobs = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/provider/jobs?providerId=${id}`);
      const data = await res.json();

      if (data.jobs) {
        setJobs(data.jobs);
        applyFilters(data.jobs, filterStatus, searchQuery);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (jobList: Job[], status: string, query: string) => {
    let filtered = [...jobList];

    // Apply status filter
    if (status !== 'all') {
      filtered = filtered.filter(j => j.status === status);
    }

    // Apply search
    if (query) {
      filtered = filtered.filter(j =>
        j.customerName.toLowerCase().includes(query.toLowerCase()) ||
        j.serviceType.toLowerCase().includes(query.toLowerCase()) ||
        j.customerAddress.toLowerCase().includes(query.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
  };

  useEffect(() => {
    applyFilters(jobs, filterStatus, searchQuery);
  }, [searchQuery, filterStatus, jobs]);

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      const res = await fetch(`/api/provider/jobs/${jobId}?providerId=${providerId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete job');
      }

      toast.success('Job deleted successfully');
      fetchJobs(providerId);
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
    }
  };

  // Calculate stats
  const totalJobs = jobs.length;
  const scheduledJobs = jobs.filter(j => j.status === 'scheduled').length;
  const inProgressJobs = jobs.filter(j => j.status === 'in-progress').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const totalRevenue = jobs
    .filter(j => j.status === 'completed')
    .reduce((sum, j) => sum + (j.actualValue || j.estimatedValue || 0), 0);

  if (loading) {
    return (
      <ProviderLayout providerName={providerName}>
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout providerName={providerName}>
      <div className="min-h-screen bg-zinc-950">
        {/* Header */}
        <div className="border-b border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm">
          <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-3 md:py-6">
            <div className="flex items-start justify-between mb-3 md:mb-6">
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-zinc-100">Jobs</h1>
                <p className="text-xs md:text-sm text-zinc-400 mt-0.5 md:mt-1">Manage all your service jobs</p>
              </div>
              <Button
                onClick={() => setShowAddJobModal(true)}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm h-9 md:h-10"
              >
                <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                <span className="hidden sm:inline">Add Job</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 mb-3 md:mb-6">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-emerald-500/20 rounded-lg flex-shrink-0">
                    <Briefcase className="h-4 w-4 md:h-5 md:w-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg md:text-2xl font-bold text-zinc-100">{totalJobs}</p>
                    <p className="text-xs text-zinc-500">Total Jobs</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                    <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg md:text-2xl font-bold text-zinc-100">{scheduledJobs}</p>
                    <p className="text-xs text-zinc-500">Scheduled</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-yellow-500/20 rounded-lg flex-shrink-0">
                    <Clock className="h-4 w-4 md:h-5 md:w-5 text-yellow-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg md:text-2xl font-bold text-zinc-100">{inProgressJobs}</p>
                    <p className="text-xs text-zinc-500">In Progress</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-emerald-500/20 rounded-lg flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg md:text-2xl font-bold text-zinc-100">{completedJobs}</p>
                    <p className="text-xs text-zinc-500">Completed</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-2.5 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-purple-500/20 rounded-lg flex-shrink-0">
                    <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg md:text-2xl font-bold text-zinc-100">${Math.round(totalRevenue)}</p>
                    <p className="text-xs text-zinc-500">Revenue</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-2 md:gap-3">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search jobs..."
                  className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs md:text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {['all', 'scheduled', 'in-progress', 'completed', 'cancelled'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap transition-colors ${
                      filterStatus === status
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    {status === 'all' ? 'All' : status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-3 md:py-6">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-zinc-300 mb-2">
                {jobs.length === 0 ? 'No jobs yet' : 'No jobs match your filters'}
              </h3>
              <p className="text-zinc-500 mb-6">
                {jobs.length === 0
                  ? 'Create your first job to get started'
                  : 'Try adjusting your search or filters'}
              </p>
              {jobs.length === 0 && (
                <Button
                  onClick={() => setShowAddJobModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Job
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
              {/* Table Header - hidden on mobile */}
              <div className="hidden md:grid md:grid-cols-[1fr_120px_140px_120px_100px_80px_40px] gap-2 p-3 bg-zinc-800/50 text-xs text-zinc-400 font-medium border-b border-zinc-800">
                <div>Customer / Service</div>
                <div>Date & Time</div>
                <div>Assigned</div>
                <div>Status</div>
                <div className="text-right">Value</div>
                <div></div>
                <div></div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-zinc-800">
                {filteredJobs.map(job => (
                  <JobRow
                    key={job.id}
                    job={job}
                    onDelete={handleDeleteJob}
                    onView={() => router.push(`/provider/jobs/${job.id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Job Modal */}
      <AddJobModal
        isOpen={showAddJobModal}
        onClose={() => setShowAddJobModal(false)}
        providerId={providerId}
        providerServiceTypes={providerServiceTypes}
        onJobCreated={() => {
          setShowAddJobModal(false);
          fetchJobs(providerId);
        }}
      />
    </ProviderLayout>
  );
}

// Compact Job Row Component
function JobRow({ job, onDelete, onView }: {
  job: Job;
  onDelete: (id: string) => void;
  onView: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const statusConfig = statusColors[job.status] || statusColors.scheduled;
  const StatusIcon = statusConfig.icon;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div
      onClick={onView}
      className="p-3 hover:bg-zinc-800/50 cursor-pointer transition-colors md:grid md:grid-cols-[1fr_120px_140px_120px_100px_80px_40px] gap-2 items-center"
    >
      {/* Customer & Service - combined */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {job.customerName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-100 truncate">{job.customerName}</p>
          <p className="text-xs text-emerald-400 truncate">{job.serviceType}</p>
        </div>
      </div>

      {/* Date & Time */}
      <div className="hidden md:block">
        <p className="text-sm text-zinc-200">{formatDate(job.startTime)}</p>
        <p className="text-xs text-zinc-500">{formatTime(job.startTime)}</p>
      </div>

      {/* Assigned Users */}
      <div className="hidden md:block">
        {job.assignedUsers && job.assignedUsers.length > 0 ? (
          <div className="flex -space-x-1.5">
            {job.assignedUsers.slice(0, 3).map((user) => (
              <div
                key={user.id}
                className="h-6 w-6 rounded-full bg-emerald-500/20 border border-zinc-900 flex items-center justify-center"
                title={`${user.firstName} ${user.lastName}`}
              >
                {user.profilePhotoUrl ? (
                  <img
                    src={user.profilePhotoUrl}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-medium text-emerald-400">
                    {user.firstName[0]}{user.lastName[0]}
                  </span>
                )}
              </div>
            ))}
            {job.assignedUsers.length > 3 && (
              <div className="h-6 w-6 rounded-full bg-zinc-700 border border-zinc-900 flex items-center justify-center">
                <span className="text-[10px] font-medium text-zinc-400">+{job.assignedUsers.length - 3}</span>
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-zinc-500">Unassigned</span>
        )}
      </div>

      {/* Status */}
      <div className="hidden md:block">
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${statusConfig.bg}`}>
          <StatusIcon className={`h-3 w-3 ${statusConfig.text}`} />
          <span className={`font-medium ${statusConfig.text} capitalize`}>
            {job.status.replace('-', ' ')}
          </span>
        </div>
      </div>

      {/* Value */}
      <div className="hidden md:block text-right">
        <span className={`text-sm font-semibold ${job.status === 'completed' ? 'text-emerald-400' : 'text-zinc-100'}`}>
          ${Math.round(job.actualValue || job.estimatedValue || 0)}
        </span>
      </div>

      {/* Mobile: Show status & value inline */}
      <div className="flex items-center justify-between mt-2 md:hidden">
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${statusConfig.bg}`}>
          <StatusIcon className={`h-3 w-3 ${statusConfig.text}`} />
          <span className={`font-medium ${statusConfig.text} capitalize`}>
            {job.status.replace('-', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400">{formatDate(job.startTime)}</span>
          <span className={`text-sm font-semibold ${job.status === 'completed' ? 'text-emerald-400' : 'text-zinc-100'}`}>
            ${Math.round(job.actualValue || job.estimatedValue || 0)}
          </span>
        </div>
      </div>

      {/* Empty spacer for alignment */}
      <div className="hidden md:block"></div>

      {/* Actions */}
      <div className="relative hidden md:block" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setShowActions(!showActions)}
          className="p-1.5 hover:bg-zinc-700 rounded-lg transition-colors"
        >
          <MoreVertical className="h-4 w-4 text-zinc-400" />
        </button>

        {showActions && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowActions(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-40 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1 z-20">
              <button
                onClick={() => {
                  setShowActions(false);
                  onView();
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 w-full text-left"
              >
                <Eye className="h-3.5 w-3.5" />
                View Details
              </button>
              <button
                onClick={() => {
                  setShowActions(false);
                  onDelete(job.id);
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-800 w-full text-left"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Job
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
