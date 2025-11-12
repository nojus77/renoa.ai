'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Loader2, AlertCircle, Briefcase, RefreshCw } from 'lucide-react';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import BookAgainModal from '@/components/customer/BookAgainModal';

interface Job {
  id: string;
  serviceType: string;
  address: string;
  startTime: string;
  endTime: string;
  status: string;
  estimatedValue: number | null;
  actualValue: number | null;
  provider: {
    businessName: string;
  };
}

export default function CustomerJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'completed'>('all');
  const [bookAgainJob, setBookAgainJob] = useState<Job | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer/jobs');

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/customer-portal/login');
          return;
        }
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      toast.error(error.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_progress':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    return job.status === filter;
  });

  return (
    <CustomerLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Your Jobs</h1>
        <p className="text-zinc-600">Track all your service appointments</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All Jobs', count: jobs.length },
          { key: 'scheduled', label: 'Scheduled', count: jobs.filter(j => j.status === 'scheduled').length },
          { key: 'in_progress', label: 'In Progress', count: jobs.filter(j => j.status === 'in_progress').length },
          { key: 'completed', label: 'Completed', count: jobs.filter(j => j.status === 'completed').length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === key
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
          <Briefcase className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">
            No {filter !== 'all' ? getStatusLabel(filter) : ''} jobs found
          </h3>
          <p className="text-zinc-600">
            {filter === 'all'
              ? "You don't have any service appointments yet"
              : `You don't have any ${getStatusLabel(filter).toLowerCase()} jobs`
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => router.push(`/customer-portal/jobs/${job.id}`)}
              className="bg-white rounded-xl border border-zinc-200 p-6 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-zinc-900">{job.serviceType}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
                      {getStatusLabel(job.status)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600">{job.provider.businessName}</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-zinc-600">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm font-medium">{formatDate(job.startTime)}</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-600">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm">{formatTime(job.startTime)} - {formatTime(job.endTime)}</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-600">
                  <MapPin className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm">{job.address}</span>
                </div>
              </div>

              {(job.estimatedValue || job.actualValue) && (
                <div className="mt-4 pt-4 border-t border-zinc-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600">
                      {job.actualValue ? 'Final Amount' : 'Estimated'}
                    </span>
                    <span className="text-lg font-bold text-emerald-600">
                      ${(job.actualValue || job.estimatedValue)!.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Book Again Button for Completed Jobs */}
              {job.status === 'completed' && (
                <div className="mt-4 pt-4 border-t border-zinc-200">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setBookAgainJob(job);
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Book Again
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Book Again Modal */}
      {bookAgainJob && (
        <BookAgainModal
          isOpen={!!bookAgainJob}
          onClose={() => setBookAgainJob(null)}
          onSuccess={() => {
            setBookAgainJob(null);
            toast.success('Service booked successfully!');
            fetchJobs();
          }}
          serviceType={bookAgainJob.serviceType}
          providerId={bookAgainJob.provider.businessName}
          providerName={bookAgainJob.provider.businessName}
          address={bookAgainJob.address}
          estimatedValue={bookAgainJob.actualValue || bookAgainJob.estimatedValue || 150}
          bookingSource="rebook_jobs_list"
        />
      )}
    </CustomerLayout>
  );
}
