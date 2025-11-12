"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Star,
  Calendar,
  MessageCircle,
  Briefcase,
  FileText,
  Trash2,
  Plus,
  TrendingUp,
  Clock,
  DollarSign,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';

interface Job {
  id: string;
  serviceType: string;
  address: string;
  startTime: string;
  endTime: string;
  status: string;
  estimatedValue: number | null;
  actualValue: number | null;
  photos: any[];
}

interface CustomerDetails {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string;
  source: 'renoa' | 'own';
  createdAt: string;
  tags: string[];
  notes: string | null;
  jobs: Job[];
  stats: {
    totalJobs: number;
    completedJobs: number;
    totalSpent: number;
    averageJobValue: number;
    daysSinceLastJob: number | null;
  };
}

type TabType = 'jobs' | 'notes';

export default function CustomerDetailPage({ params }: { params: { customerId: string } }) {
  const router = useRouter();
  const [providerName, setProviderName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('jobs');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');

    if (!id || !name) {
      router.push('/provider/login');
      return;
    }

    setProviderId(id);
    setProviderName(name);
    fetchCustomerDetails(params.customerId);
  }, [router, params.customerId]);

  const fetchCustomerDetails = async (customerId: string) => {
    try {
      const res = await fetch(`/api/provider/customers/${customerId}`);
      const data = await res.json();

      if (data.success && data.customer) {
        setCustomer(data.customer);
        setNoteContent(data.customer.notes || '');
      } else {
        toast.error('Customer not found');
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!customer) return;

    try {
      const res = await fetch(`/api/provider/customers/${params.customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: noteContent }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Notes saved successfully');
        setIsEditingNotes(false);
        fetchCustomerDetails(params.customerId);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error saving notes:', error);
      toast.error(error.message || 'Failed to save notes');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customer) return;

    try {
      const res = await fetch(`/api/provider/customers/${params.customerId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Customer deleted successfully');
        router.push('/provider/customers');
      } else {
        throw new Error(data.error || 'Failed to delete customer');
      }
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast.error(error.message || 'Failed to delete customer');
    }
  };

  if (loading) {
    return (
      <ProviderLayout providerName={providerName}>
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </ProviderLayout>
    );
  }

  if (!customer) {
    return (
      <ProviderLayout providerName={providerName}>
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="text-center">
            <p className="text-zinc-400 mb-4">Customer not found</p>
            <Button onClick={() => router.push('/provider/customers')}>
              Back to Customers
            </Button>
          </div>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout providerName={providerName}>
      <div className="min-h-screen bg-zinc-950">
        {/* Header */}
        <div className="border-b border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm">
          <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-3 md:py-4">
            {/* Mobile: Single column layout */}
            <div className="md:hidden space-y-3">
              {/* Back button + Name */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => router.push('/provider/customers')}
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 hover:bg-zinc-800 px-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-zinc-100 truncate">{customer.name}</h1>
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                    customer.source === 'renoa'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600'
                  }`}>
                    {customer.source === 'renoa' ? 'Renoa' : 'Own'}
                  </span>
                </div>
              </div>

              {/* Action buttons: 2x2 grid */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => window.location.href = `tel:${customer.phone}`}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
                {customer.email && (
                  <Button
                    onClick={() => window.location.href = `mailto:${customer.email}`}
                    size="sm"
                    variant="outline"
                    className="border-zinc-700 hover:bg-zinc-800"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                )}
                <Button
                  onClick={() => window.location.href = `sms:${customer.phone}`}
                  size="sm"
                  variant="outline"
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Text
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  size="sm"
                  variant="outline"
                  className="border-red-700 hover:bg-red-900/20 text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>

            {/* Desktop: Original horizontal layout */}
            <div className="hidden md:flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => router.push('/provider/customers')}
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Customers
                </Button>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-zinc-100">{customer.name}</h1>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      customer.source === 'renoa'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600'
                    }`}>
                      {customer.source === 'renoa' ? 'Renoa Lead' : 'Own Client'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => window.location.href = `tel:${customer.phone}`}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
                {customer.email && (
                  <Button
                    onClick={() => window.location.href = `mailto:${customer.email}`}
                    size="sm"
                    variant="outline"
                    className="border-zinc-700 hover:bg-zinc-800"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                )}
                <Button
                  onClick={() => window.location.href = `sms:${customer.phone}`}
                  size="sm"
                  variant="outline"
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Text
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  size="sm"
                  variant="outline"
                  className="border-red-700 hover:bg-red-900/20 text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-3 md:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
            {/* Profile Card - Left 1/3 */}
            <div className="lg:col-span-1">
              {/* Mobile: Compact horizontal layout */}
              <div className="md:hidden bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-3">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-lg font-bold">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold text-zinc-100 mb-1">{customer.name}</h2>
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div className="flex items-center gap-2 truncate">
                        <Phone className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                        <span>{customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats - inline */}
                {customer.stats && (
                  <div className="text-xs text-zinc-400 border-t border-zinc-800 pt-3">
                    <span className="font-semibold text-zinc-300">{customer.stats.totalJobs}</span> Jobs
                    <span className="mx-2">|</span>
                    <span className="font-semibold text-zinc-300">${customer.stats.totalSpent.toLocaleString()}</span> Spent
                    {customer.stats.daysSinceLastJob !== null && (
                      <>
                        <span className="mx-2">|</span>
                        Last: <span className="font-semibold text-zinc-300">{customer.stats.daysSinceLastJob}d ago</span>
                      </>
                    )}
                  </div>
                )}

                {/* Tags */}
                {customer.tags && customer.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3 border-t border-zinc-800 pt-3">
                    {customer.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop: Original card layout */}
              <div className="hidden md:block bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 sticky top-6">
                {/* Avatar */}
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-3xl font-bold">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* Name */}
                <h2 className="text-xl font-bold text-zinc-100 text-center mb-6">{customer.name}</h2>

                {/* Contact Info */}
                <div className="space-y-3 mb-6">
                  <a
                    href={`tel:${customer.phone}`}
                    className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-colors"
                  >
                    <Phone className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-zinc-300">{customer.phone}</span>
                  </a>

                  {customer.email && (
                    <a
                      href={`mailto:${customer.email}`}
                      className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-colors"
                    >
                      <Mail className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm text-zinc-300 truncate">{customer.email}</span>
                    </a>
                  )}

                  {customer.address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-colors"
                    >
                      <MapPin className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm text-zinc-300">{customer.address}</span>
                    </a>
                  )}
                </div>

                {/* Tags */}
                {customer.tags && customer.tags.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="h-4 w-4 text-zinc-500" />
                      <p className="text-xs font-medium text-zinc-500 uppercase">Tags</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {customer.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customer Since */}
                <div className="pt-6 border-t border-zinc-800">
                  <p className="text-xs font-medium text-zinc-500 uppercase mb-1">Customer Since</p>
                  <p className="text-sm text-zinc-300">
                    {new Date(customer.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content - Right 2/3 */}
            <div className="lg:col-span-2">
              {/* Tabs */}
              <div className="flex items-center gap-2 mb-6 border-b border-zinc-800">
                {(['jobs', 'notes'] as TabType[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                      activeTab === tab
                        ? 'text-emerald-400'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {tab === 'jobs' && <Briefcase className="h-4 w-4" />}
                      {tab === 'notes' && <FileText className="h-4 w-4" />}
                      <span className="capitalize">{tab}</span>
                    </div>
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'jobs' && (
                <div>
                  {/* Stats Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Briefcase className="h-4 w-4 text-zinc-500" />
                        <p className="text-xs text-zinc-500">Total Jobs</p>
                      </div>
                      <p className="text-2xl font-bold text-zinc-100">{customer.stats.totalJobs}</p>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        <p className="text-xs text-zinc-500">Total Spent</p>
                      </div>
                      <p className="text-2xl font-bold text-emerald-400">
                        ${Math.round(customer.stats.totalSpent).toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        <p className="text-xs text-zinc-500">Avg Job Value</p>
                      </div>
                      <p className="text-2xl font-bold text-zinc-100">
                        ${Math.round(customer.stats.averageJobValue)}
                      </p>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <p className="text-xs text-zinc-500">Last Job</p>
                      </div>
                      <p className="text-sm font-semibold text-zinc-100">
                        {customer.stats.daysSinceLastJob !== null
                          ? `${customer.stats.daysSinceLastJob} days ago`
                          : 'Never'}
                      </p>
                    </div>
                  </div>

                  {/* Job Timeline */}
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-zinc-100">Job History</h3>
                      <Button
                        onClick={() => router.push('/provider/calendar')}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-500"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Schedule New Job
                      </Button>
                    </div>

                    {customer.jobs.length === 0 ? (
                      <div className="text-center py-8">
                        <Briefcase className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                        <p className="text-zinc-500 text-sm mb-4">No jobs yet. Schedule their first job!</p>
                        <Button
                          onClick={() => router.push('/provider/calendar')}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-500"
                        >
                          Schedule Job
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {customer.jobs.map((job) => (
                          <JobTimelineCard key={job.id} job={job} router={router} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-zinc-100">Provider Notes</h3>
                    {!isEditingNotes && (
                      <Button
                        onClick={() => setIsEditingNotes(true)}
                        size="sm"
                        variant="outline"
                        className="border-zinc-700 hover:bg-zinc-800"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Notes
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-zinc-500 mb-6">
                    Private notes visible only to you
                  </p>

                  {isEditingNotes ? (
                    <div className="mb-6 p-4 bg-zinc-800/30 border border-zinc-700 rounded-lg">
                      <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Add notes about this customer (e.g., preferences, special instructions, payment terms...)"
                        className="w-full min-h-[200px] px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 resize-none mb-3"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleSaveNotes}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-500"
                        >
                          Save Notes
                        </Button>
                        <Button
                          onClick={() => {
                            setIsEditingNotes(false);
                            setNoteContent(customer.notes || '');
                          }}
                          size="sm"
                          variant="outline"
                          className="border-zinc-700 hover:bg-zinc-800"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {customer.notes ? (
                        <div className="p-4 bg-zinc-800/30 border border-zinc-700 rounded-lg">
                          <p className="text-sm text-zinc-300 whitespace-pre-wrap">{customer.notes}</p>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                          <p className="text-zinc-500 text-sm mb-4">No notes yet</p>
                          <Button
                            onClick={() => setIsEditingNotes(true)}
                            size="sm"
                            variant="outline"
                            className="border-zinc-700 hover:bg-zinc-800"
                          >
                            Add Notes
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-zinc-100 mb-2">Delete Customer?</h3>
              <p className="text-sm text-zinc-400 mb-6">
                {customer.stats.totalJobs > 0
                  ? `This customer has ${customer.stats.totalJobs} job${customer.stats.totalJobs > 1 ? 's' : ''} associated with them. You cannot delete a customer with existing jobs.`
                  : 'Are you sure you want to delete this customer? This action cannot be undone.'}
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  className="flex-1 border-zinc-700 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                {customer.stats.totalJobs === 0 && (
                  <Button
                    onClick={handleDeleteCustomer}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white"
                  >
                    Delete Customer
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProviderLayout>
  );
}

// Job Timeline Card Component
function JobTimelineCard({ job, router }: { job: Job; router: any }) {
  const statusColors = {
    scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    in_progress: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const jobValue = job.actualValue || job.estimatedValue || 0;

  return (
    <div className="flex items-center justify-between p-4 bg-zinc-800/30 border border-zinc-700 rounded-lg hover:bg-zinc-800/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Briefcase className="h-4 w-4 text-zinc-500" />
          <p className="text-sm font-medium text-zinc-200">
            {job.serviceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </p>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${statusColors[job.status as keyof typeof statusColors] || statusColors.scheduled}`}>
            {job.status.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Calendar className="h-3 w-3" />
          {new Date(job.startTime).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-zinc-100 mb-1">
          ${jobValue.toFixed(2)}
        </p>
        <button
          onClick={() => router.push(`/provider/jobs/${job.id}`)}
          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          View Details →
        </button>
      </div>
    </div>
  );
}
