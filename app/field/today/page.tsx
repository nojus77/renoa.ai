"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Phone, Loader2, CheckCircle, Navigation, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Job {
  id: string;
  serviceType: string;
  address: string;
  startTime: string;
  endTime: string;
  status: string;
  customerNotes: string;
  internalNotes: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
}

export default function FieldTodayPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [view, setView] = useState<'today' | 'week' | 'completed'>('today');

  useEffect(() => {
    // Check if user is logged in and is a field user
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');
    const name = localStorage.getItem('userName') || 'Field Tech';

    if (!userId || userRole !== 'field') {
      router.push('/provider/login');
      return;
    }

    setUserName(name);
    fetchJobs();
  }, [view]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      // Calculate date range based on view
      let startDate = '';
      let endDate = '';

      const now = new Date();
      if (view === 'today') {
        startDate = format(now, 'yyyy-MM-dd');
        endDate = format(now, 'yyyy-MM-dd');
      } else if (view === 'week') {
        startDate = format(now, 'yyyy-MM-dd');
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() + 7);
        endDate = format(weekEnd, 'yyyy-MM-dd');
      }

      const params = new URLSearchParams({
        userId,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const res = await fetch(`/api/field/my-jobs?${params}`);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to fetch jobs');
        return;
      }

      // Filter completed jobs if in completed view
      let filteredJobs = data.jobs || [];
      if (view === 'completed') {
        filteredJobs = filteredJobs.filter((job: Job) => job.status === 'completed');
      } else {
        filteredJobs = filteredJobs.filter((job: Job) => job.status !== 'completed');
      }

      setJobs(filteredJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (jobId: string, newStatus: string) => {
    try {
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');

      const res = await fetch(`/api/provider/jobs/${jobId}/status`, {
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

      // Show success message with different text based on status
      const messages: Record<string, string> = {
        'on-the-way': "Status updated to 'On My Way'",
        'in-progress': 'Job started! Timer is running.',
        'completed': 'Job completed! Great work!',
      };
      toast.success(messages[newStatus] || 'Status updated successfully');

      fetchJobs();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Determine the next logical status based on current status
  const getNextAction = (status: string) => {
    switch (status) {
      case 'scheduled':
      case 'dispatched':
        return {
          status: 'on-the-way',
          label: "I'm On My Way",
          icon: Navigation,
          color: 'bg-orange-600 hover:bg-orange-500',
        };
      case 'on-the-way':
        return {
          status: 'in-progress',
          label: 'Arrived / Start Job',
          icon: PlayCircle,
          color: 'bg-emerald-600 hover:bg-emerald-500',
        };
      case 'in-progress':
        return {
          status: 'completed',
          label: 'Complete Job',
          icon: CheckCircle,
          color: 'bg-green-600 hover:bg-green-500',
        };
      default:
        return null;
    }
  };

  const handleNavigate = (address: string) => {
    // Open in Google Maps or Apple Maps depending on device
    const encodedAddress = encodeURIComponent(address);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    window.open(mapsUrl, '_blank');
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      dispatched: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'on-the-way': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      'in-progress': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      completed: 'bg-green-500/20 text-green-300 border-green-500/30',
      cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return colors[status as keyof typeof colors] || colors.scheduled;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      scheduled: 'Scheduled',
      dispatched: 'Dispatched',
      'on-the-way': 'On My Way',
      'in-progress': 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="px-4 py-6 bg-gradient-to-b from-emerald-900/20 to-transparent">
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">
          {view === 'today' && "Today's Jobs"}
          {view === 'week' && "This Week's Jobs"}
          {view === 'completed' && 'Completed Jobs'}
        </h1>
        <p className="text-sm text-zinc-400">
          {view === 'today' && format(new Date(), 'EEEE, MMMM d, yyyy')}
          {view === 'week' && 'Next 7 days'}
          {view === 'completed' && 'Your completed work'}
        </p>
        <p className="text-xs text-emerald-400 mt-2">Welcome, {userName}</p>
      </div>

      {/* View Selector */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-3 gap-2 bg-zinc-900/50 p-1 rounded-lg">
          <button
            onClick={() => setView('today')}
            className={`px-4 py-3 rounded-md text-sm font-medium transition-colors ${
              view === 'today'
                ? 'bg-emerald-600 text-white'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-4 py-3 rounded-md text-sm font-medium transition-colors ${
              view === 'week'
                ? 'bg-emerald-600 text-white'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setView('completed')}
            className={`px-4 py-3 rounded-md text-sm font-medium transition-colors ${
              view === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="px-4 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/30 rounded-lg border border-zinc-800">
            <CheckCircle className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">
              {view === 'completed' ? 'No completed jobs yet' : 'No jobs scheduled'}
            </p>
            <p className="text-sm text-zinc-500 mt-1">
              {view === 'today' && 'Enjoy your day off!'}
              {view === 'week' && 'Check back later for upcoming jobs'}
              {view === 'completed' && 'Completed jobs will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4"
              >
                {/* Time & Status */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-2xl font-bold text-emerald-400">
                      {format(new Date(job.startTime), 'h:mm a')}
                    </div>
                    <div className="text-sm text-zinc-500">
                      to {format(new Date(job.endTime), 'h:mm a')}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
                    {getStatusLabel(job.status)}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="border-t border-zinc-800 pt-3">
                  <h3 className="font-semibold text-zinc-100 mb-1">{job.customer.name}</h3>
                  <p className="text-sm text-emerald-400 mb-2">{job.serviceType}</p>
                  <p className="text-sm text-zinc-400 flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {job.address || job.customer.address}
                  </p>
                </div>

                {/* Notes */}
                {(job.customerNotes || job.internalNotes) && (
                  <div className="bg-zinc-800/50 rounded-lg p-3 space-y-2">
                    {job.customerNotes && (
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Customer Notes:</p>
                        <p className="text-sm text-zinc-300">{job.customerNotes}</p>
                      </div>
                    )}
                    {job.internalNotes && (
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Internal Notes:</p>
                        <p className="text-sm text-zinc-300">{job.internalNotes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleNavigate(job.address || job.customer.address)}
                    className="bg-blue-600 hover:bg-blue-500 text-white h-12"
                  >
                    <MapPin className="h-5 w-5 mr-2" />
                    Navigate
                  </Button>
                  <Button
                    onClick={() => handleCall(job.customer.phone)}
                    className="bg-green-600 hover:bg-green-500 text-white h-12"
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Call
                  </Button>
                </div>

                {/* Smart Status Action Button */}
                {job.status !== 'completed' && job.status !== 'cancelled' && (() => {
                  const nextAction = getNextAction(job.status);
                  if (!nextAction) return null;
                  const Icon = nextAction.icon;
                  return (
                    <div className="pt-2 border-t border-zinc-800">
                      <Button
                        onClick={() => handleStatusUpdate(job.id, nextAction.status)}
                        className={`w-full h-14 text-base font-semibold ${nextAction.color} text-white`}
                      >
                        <Icon className="h-5 w-5 mr-2" />
                        {nextAction.label}
                      </Button>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
