'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  AlertCircle,
  Briefcase,
  FileText,
  MessageSquare,
  Phone,
  Mail,
  CheckCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import SubscriptionWidget from '@/components/customer/SubscriptionWidget';
import SubscriptionSetupModal from '@/components/customer/SubscriptionSetupModal';
import BookAgainModal from '@/components/customer/BookAgainModal';
import RecommendationsWidget from '@/components/customer/RecommendationsWidget';
import ReferralWidget from '@/components/customer/ReferralWidget';
import ServiceBundlesWidget from '@/components/customer/ServiceBundlesWidget';
import PromoBanner from '@/components/customer/PromoBanner';
import WinbackModal from '@/components/customer/WinbackModal';

interface Job {
  id: string;
  serviceType: string;
  address: string;
  startTime: string;
  endTime: string;
  status: string;
  estimatedValue: number | null;
  provider: {
    businessName: string;
    phone?: string;
    email?: string;
  };
}

interface DashboardData {
  nextJob: Job | null;
  activeJobsCount: number;
  recentJobs: Job[];
  unpaidInvoicesCount: number;
  totalUnpaid: number;
  provider: {
    id: string;
    businessName: string;
    phone: string;
    email: string;
  };
}

export default function CustomerDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [bookAgainJob, setBookAgainJob] = useState<Job | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer/dashboard');

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/customer-portal/login');
          return;
        }
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (error: any) {
      console.error('Error fetching dashboard:', error);
      toast.error(error.message || 'Failed to load dashboard');
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

  const getTimeUntil = (dateString: string) => {
    const now = new Date();
    const target = new Date(dateString);
    const diff = target.getTime() - now.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    return 'soon';
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

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </CustomerLayout>
    );
  }

  if (!data) {
    return (
      <CustomerLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
          <p className="text-zinc-600">Failed to load dashboard</p>
          <Button onClick={fetchDashboardData} className="mt-4">
            Try Again
          </Button>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Welcome back!</h1>
        <p className="text-zinc-600">
          Here&apos;s what&apos;s happening with your service from{' '}
          <span className="font-semibold text-zinc-900">{data.provider.businessName}</span>
        </p>
      </div>

      {/* Promo Banner */}
      <PromoBanner />

      {/* Alert for Unpaid Invoices */}
      {data.unpaidInvoicesCount > 0 && (
        <div className="mb-6 p-4 bg-orange-50 border-2 border-orange-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-orange-900 mb-1">
              You have {data.unpaidInvoicesCount} unpaid invoice{data.unpaidInvoicesCount > 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-orange-700 mb-3">
              Total amount due: <span className="font-bold">${data.totalUnpaid.toFixed(2)}</span>
            </p>
            <Button
              onClick={() => router.push('/customer-portal/invoices')}
              className="bg-orange-600 hover:bg-orange-500 text-white"
              size="sm"
            >
              View & Pay Invoices
            </Button>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        {/* Active Jobs Card */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-orange-600" />
            </div>
            <span className="text-2xl font-bold text-zinc-900">{data.activeJobsCount}</span>
          </div>
          <h3 className="text-sm font-medium text-zinc-600 mb-1">Active Jobs</h3>
          <p className="text-xs text-zinc-500">Work in progress</p>
        </div>

        {/* Unpaid Invoices Card */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-red-600" />
            </div>
            <span className="text-2xl font-bold text-zinc-900">{data.unpaidInvoicesCount}</span>
          </div>
          <h3 className="text-sm font-medium text-zinc-600 mb-1">Unpaid Invoices</h3>
          <p className="text-xs text-zinc-500">${data.totalUnpaid.toFixed(2)} due</p>
        </div>

        {/* Next Service Card */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>
            {data.nextJob && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                {getTimeUntil(data.nextJob.startTime)}
              </span>
            )}
          </div>
          <h3 className="text-sm font-medium text-zinc-600 mb-1">Next Service</h3>
          <p className="text-xs text-zinc-500">
            {data.nextJob ? formatDate(data.nextJob.startTime) : 'No upcoming services'}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Next Job & Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Job Card */}
          {data.nextJob ? (
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                <h2 className="text-lg font-bold text-zinc-900 mb-1">Your Next Service</h2>
                <p className="text-sm text-zinc-600">Scheduled appointment details</p>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🏡</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-zinc-900 mb-1">
                      {data.nextJob.serviceType}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(data.nextJob.status)}`}>
                        {getStatusLabel(data.nextJob.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-zinc-600">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    <span className="font-medium">{formatDate(data.nextJob.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-600">
                    <Clock className="h-4 w-4 text-zinc-400" />
                    <span>{formatTime(data.nextJob.startTime)} - {formatTime(data.nextJob.endTime)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-600">
                    <MapPin className="h-4 w-4 text-zinc-400" />
                    <span>{data.nextJob.address}</span>
                  </div>
                  {data.nextJob.estimatedValue && (
                    <div className="flex items-center gap-3 text-zinc-600">
                      <DollarSign className="h-4 w-4 text-zinc-400" />
                      <span>Estimated: ${data.nextJob.estimatedValue.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => router.push(`/customer-portal/jobs/${data.nextJob!.id}`)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                  >
                    View Details
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button
                    onClick={() => router.push('/customer-portal/messages')}
                    variant="outline"
                    className="border-zinc-300"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-12 text-center">
              <Calendar className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">No upcoming services</h3>
              <p className="text-zinc-600 mb-4">Contact your provider to schedule a service</p>
              <Button
                onClick={() => router.push('/customer-portal/messages')}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Message Provider
              </Button>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm">
            <div className="p-6 border-b border-zinc-200">
              <h2 className="text-lg font-bold text-zinc-900">Recent Activity</h2>
            </div>
            <div className="divide-y divide-zinc-200">
              {data.recentJobs.length > 0 ? (
                data.recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 hover:bg-zinc-50 transition-colors"
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => router.push(`/customer-portal/jobs/${job.id}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-zinc-900">{job.serviceType}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
                            {getStatusLabel(job.status)}
                          </span>
                          {job.status === 'completed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setBookAgainJob(job);
                              }}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                              title="Book this service again"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-zinc-600 flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(job.startTime)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-600">
                  <p>No recent activity</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-zinc-200">
              <Link
                href="/customer-portal/jobs"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-2"
              >
                View All Jobs
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Service Bundles Widget */}
          <ServiceBundlesWidget />

          {/* Service Recommendations Widget */}
          <RecommendationsWidget />

          {/* Referral Widget */}
          <ReferralWidget />

          {/* Subscription Widget */}
          <SubscriptionWidget
            providerName={data.provider.businessName}
            serviceType={data.nextJob?.serviceType || 'Lawn Care'}
            averageJobPrice={data.nextJob?.estimatedValue || 150}
            onSetupClick={() => setSetupModalOpen(true)}
          />
        </div>

        {/* Right Column - Quick Actions & Provider Info */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-zinc-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/customer-portal/jobs')}
                variant="outline"
                className="w-full justify-start border-zinc-300"
              >
                <Briefcase className="h-4 w-4 mr-3" />
                View All Jobs
              </Button>
              <Button
                onClick={() => router.push('/customer-portal/invoices')}
                variant="outline"
                className="w-full justify-start border-zinc-300"
              >
                <FileText className="h-4 w-4 mr-3" />
                View Invoices
              </Button>
              <Button
                onClick={() => router.push('/customer-portal/messages')}
                variant="outline"
                className="w-full justify-start border-zinc-300"
              >
                <MessageSquare className="h-4 w-4 mr-3" />
                Message Provider
              </Button>
              <Button
                onClick={() => router.push('/customer-portal/subscriptions')}
                variant="outline"
                className="w-full justify-start border-zinc-300"
              >
                <CheckCircle className="h-4 w-4 mr-3" />
                My Subscriptions
              </Button>
            </div>
          </div>

          {/* Provider Info */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-zinc-900 mb-4">Your Service Provider</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-zinc-600 mb-1">Business Name</p>
                <p className="font-semibold text-zinc-900">{data.provider.businessName}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-2">Contact</p>
                <a
                  href={`tel:${data.provider.phone}`}
                  className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-2"
                >
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{data.provider.phone}</span>
                </a>
                <a
                  href={`mailto:${data.provider.email}`}
                  className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700"
                >
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{data.provider.email}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Setup Modal */}
      {data && (
        <SubscriptionSetupModal
          isOpen={setupModalOpen}
          onClose={() => setSetupModalOpen(false)}
          providerId={data.provider.id}
          providerName={data.provider.businessName}
          serviceTypes={['Lawn Care', 'Landscaping', 'Tree Service', 'House Cleaning']}
          averageJobPrice={data.nextJob?.estimatedValue || 150}
        />
      )}

      {/* Book Again Modal */}
      {bookAgainJob && (
        <BookAgainModal
          isOpen={!!bookAgainJob}
          onClose={() => setBookAgainJob(null)}
          onSuccess={() => {
            setBookAgainJob(null);
            toast.success('Service booked successfully!');
            fetchDashboardData();
          }}
          serviceType={bookAgainJob.serviceType}
          providerId={bookAgainJob.provider.businessName}
          providerName={bookAgainJob.provider.businessName}
          address={bookAgainJob.address}
          estimatedValue={bookAgainJob.estimatedValue || 150}
          bookingSource="rebook_dashboard"
        />
      )}

      {/* Winback Modal */}
      <WinbackModal isOpen={false} onClose={() => {}} />
    </CustomerLayout>
  );
}
