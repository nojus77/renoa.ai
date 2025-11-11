'use client'

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
  Upload,
  Plus,
  TrendingUp,
  Clock,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

interface CustomerDetails {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  source: 'renoa' | 'own';
  isActive: boolean;
  createdAt: string;
  tags: string[];
  rating?: number;
  isFavorite: boolean;
  totalJobs: number;
  totalRevenue: number;
  averageJobValue: number;
  lastJobDate?: string;
  jobs: Job[];
  notes: Note[];
}

interface Job {
  id: string;
  date: string;
  serviceType: string;
  status: string;
  value: number;
}

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

type TabType = 'jobs' | 'notes' | 'communication' | 'documents';

export default function CustomerDetailPage({ params }: { params: { customerId: string } }) {
  const router = useRouter();
  const [providerName, setProviderName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('jobs');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');

    if (!id || !name) {
      router.push('/provider/login');
      return;
    }

    setProviderId(id);
    setProviderName(name);
    fetchCustomerDetails(id, params.customerId);
  }, [router, params.customerId]);

  const fetchCustomerDetails = async (providerId: string, customerId: string) => {
    try {
      const res = await fetch(`/api/provider/customers/${customerId}?providerId=${providerId}`);
      const data = await res.json();

      if (data.customer) {
        setCustomer(data.customer);
      }
    } catch (error) {
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!customer) return;

    try {
      const res = await fetch(`/api/provider/customers/${params.customerId}/favorite`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !customer.isFavorite }),
      });

      if (!res.ok) throw new Error('Failed to toggle favorite');

      setCustomer({ ...customer, isFavorite: !customer.isFavorite });
      toast.success(customer.isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      toast.error('Failed to update favorite status');
    }
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim()) return;

    try {
      const res = await fetch(`/api/provider/customers/${params.customerId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent, providerId }),
      });

      if (!res.ok) throw new Error('Failed to save note');

      toast.success('Note saved successfully');
      setNoteContent('');
      setIsEditingNotes(false);
      fetchCustomerDetails(providerId, params.customerId);
    } catch (error) {
      toast.error('Failed to save note');
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
          <div className="max-w-[1600px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => router.push('/provider/customers')}
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
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
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      customer.isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-700/50 text-zinc-500 border border-zinc-600'
                    }`}>
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => toast.info('Edit profile coming soon')}
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  onClick={() => window.location.href = `tel:${customer.phone}`}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
                <Button
                  onClick={() => window.location.href = `sms:${customer.phone}`}
                  size="sm"
                  variant="outline"
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button
                  onClick={() => toast.info('Schedule job coming soon')}
                  size="sm"
                  variant="outline"
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Job
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card - Left 1/3 */}
            <div className="lg:col-span-1">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 sticky top-6">
                {/* Avatar */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-3xl font-bold">
                      {customer.firstName[0]}{customer.lastName[0]}
                    </div>
                    <button
                      onClick={handleToggleFavorite}
                      className={`absolute -top-1 -right-1 p-2 rounded-full transition-colors ${
                        customer.isFavorite
                          ? 'bg-yellow-500 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      <Star className={`h-4 w-4 ${customer.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Name */}
                <h2 className="text-xl font-bold text-zinc-100 text-center mb-4">{customer.name}</h2>

                {/* Rating */}
                {customer.rating && (
                  <div className="flex items-center justify-center gap-1 mb-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < customer.rating!
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-zinc-700'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-zinc-400 ml-2">{customer.rating.toFixed(1)}</span>
                  </div>
                )}

                {/* Contact Info */}
                <div className="space-y-3 mb-6">
                  <a
                    href={`tel:${customer.phone}`}
                    className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-colors"
                  >
                    <Phone className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-zinc-300">{customer.phone}</span>
                  </a>

                  <a
                    href={`mailto:${customer.email}`}
                    className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-colors"
                  >
                    <Mail className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-zinc-300 truncate">{customer.email}</span>
                  </a>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-colors"
                  >
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-zinc-300">{customer.address}</span>
                  </a>
                </div>

                {/* Tags */}
                {customer.tags.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-medium text-zinc-500 uppercase mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {customer.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs font-medium bg-zinc-800 text-zinc-300 rounded-md"
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
                {(['jobs', 'notes', 'communication', 'documents'] as TabType[]).map((tab) => (
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
                      {tab === 'communication' && <MessageCircle className="h-4 w-4" />}
                      {tab === 'documents' && <Upload className="h-4 w-4" />}
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
                      <p className="text-2xl font-bold text-zinc-100">{customer.totalJobs}</p>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        <p className="text-xs text-zinc-500">Total Revenue</p>
                      </div>
                      <p className="text-2xl font-bold text-emerald-400">
                        ${customer.totalRevenue.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        <p className="text-xs text-zinc-500">Avg Job Value</p>
                      </div>
                      <p className="text-2xl font-bold text-zinc-100">
                        ${customer.averageJobValue.toFixed(0)}
                      </p>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <p className="text-xs text-zinc-500">Last Job</p>
                      </div>
                      <p className="text-sm font-semibold text-zinc-100">
                        {customer.lastJobDate
                          ? `${Math.floor((Date.now() - new Date(customer.lastJobDate).getTime()) / (1000 * 60 * 60 * 24))} days ago`
                          : 'Never'}
                      </p>
                    </div>
                  </div>

                  {/* Job Timeline */}
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-zinc-100">Job History</h3>
                      <Button
                        onClick={() => toast.info('Schedule new job coming soon')}
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
                        <p className="text-zinc-500 text-sm">No jobs yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {customer.jobs.map((job) => (
                          <JobTimelineCard key={job.id} job={job} />
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
                    <Button
                      onClick={() => setIsEditingNotes(true)}
                      size="sm"
                      variant="outline"
                      className="border-zinc-700 hover:bg-zinc-800"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </div>

                  <p className="text-xs text-zinc-500 mb-6">
                    Private notes visible only to you
                  </p>

                  {isEditingNotes && (
                    <div className="mb-6 p-4 bg-zinc-800/30 border border-zinc-700 rounded-lg">
                      <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Add a note about this customer..."
                        className="w-full min-h-[120px] px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 resize-none mb-3"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleSaveNote}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-500"
                        >
                          Save Note
                        </Button>
                        <Button
                          onClick={() => {
                            setIsEditingNotes(false);
                            setNoteContent('');
                          }}
                          size="sm"
                          variant="outline"
                          className="border-zinc-700 hover:bg-zinc-800"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {customer.notes.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                      <p className="text-zinc-500 text-sm">No notes yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {customer.notes.map((note) => (
                        <div key={note.id} className="p-4 bg-zinc-800/30 border border-zinc-700 rounded-lg">
                          <p className="text-sm text-zinc-300 mb-2">{note.content}</p>
                          <p className="text-xs text-zinc-600">
                            {new Date(note.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'communication' && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-zinc-100 mb-4">Communication History</h3>
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-400 mb-2">Communication tracking coming soon</p>
                    <p className="text-sm text-zinc-600">
                      Track emails, SMS messages, and call logs
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-zinc-100 mb-4">Documents</h3>
                  <div className="border-2 border-dashed border-zinc-700 rounded-xl p-12 text-center hover:border-emerald-500 transition-colors cursor-pointer">
                    <Upload className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                    <p className="text-zinc-400 mb-2">Drag & drop files here</p>
                    <p className="text-sm text-zinc-600">or click to browse</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}

// Job Timeline Card Component
function JobTimelineCard({ job }: { job: Job }) {
  const statusColors = {
    scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    in_progress: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <div className="flex items-center justify-between p-4 bg-zinc-800/30 border border-zinc-700 rounded-lg hover:bg-zinc-800/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-zinc-200">{job.serviceType.replace(/_/g, ' ')}</p>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${statusColors[job.status as keyof typeof statusColors] || statusColors.scheduled}`}>
            {job.status.replace('_', ' ')}
          </span>
        </div>
        <p className="text-xs text-zinc-500">
          {new Date(job.date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-zinc-100">${job.value.toFixed(2)}</p>
        <button className="text-xs text-emerald-400 hover:text-emerald-300">
          View Details
        </button>
      </div>
    </div>
  );
}
