"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AddJobModal from '@/components/provider/AddJobModal';
import OnboardingModal from '@/components/provider/OnboardingModal';
import {
  Mail,
  Phone,
  MapPin,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  Target,
  Award,
  Eye,
  EyeOff,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Plus,
  Navigation,
  PlayCircle,
  MessageCircle,
  ArrowRight,
  Activity,
  Star,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface LeadNote {
  id: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

interface Job {
  id: string;
  customerName: string;
  serviceType: string;
  address: string;
  city: string;
  state: string;
  startTime: string;
  endTime: string;
  status: string;
  phone: string;
  estimatedValue: number;
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  serviceInterest: string;
  leadScore: number;
  propertyValue: number | null;
  contractValue: number | null;
  notes: string | null;
  providerNotes: LeadNote[];
  status: string;
  createdAt: string;
  customerPreferredDate: string | null;
  providerProposedDate: string | null;
  schedulingStatus: string | null;
  schedulingNotes: string | null;
}

interface RecentActivity {
  id: string;
  type: 'proposal' | 'payment' | 'review' | 'job' | 'lead';
  message: string;
  timestamp: string;
  icon: any;
  color: string;
}

export default function ProviderDashboard() {
  const router = useRouter();
  const [providerName, setProviderName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [providerServiceTypes, setProviderServiceTypes] = useState<string[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [todaysJobs, setTodaysJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState<Record<string, string>>({});
  const [contractValues, setContractValues] = useState<Record<string, string>>({});

  // Modal states
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState<string | null>(null);
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [showAllActivity, setShowAllActivity] = useState(false);

  // Stats
  const [weeklyEarnings, setWeeklyEarnings] = useState(0);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [avgJobValue, setAvgJobValue] = useState(0);
  const [avgResponseTime, setAvgResponseTime] = useState(8);

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');

    if (!id || !name) {
      router.push('/provider/login');
      return;
    }

    setProviderId(id);
    setProviderName(name);

    fetchProviderDetails(id);
    fetchLeads(id);
    fetchTodaysJobs(id);
    fetchStats(id);
  }, [router]);

  const fetchProviderDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/provider/details?providerId=${id}`);
      const data = await res.json();

      if (data.provider) {
        if (data.provider.serviceTypes) {
          setProviderServiceTypes(data.provider.serviceTypes);
        }

        // Show onboarding modal based purely on database field
        setShowOnboardingModal(!data.provider.onboardingCompleted);
      }
    } catch (error) {
      console.error('Failed to load provider details:', error);
    }
  };

  const fetchLeads = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/provider/leads?providerId=${id}`);
      const data = await res.json();

      if (data.leads) {
        setLeads(data.leads);
      }
    } catch (error) {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaysJobs = async (id: string) => {
    try {
      const res = await fetch(`/api/provider/jobs?providerId=${id}`);
      const data = await res.json();

      if (data.jobs) {
        // Filter for today's jobs
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const jobsToday = data.jobs.filter((job: any) => {
          const jobDate = new Date(job.startTime);
          return jobDate >= today && jobDate < tomorrow &&
                 (job.status === 'scheduled' || job.status === 'in_progress');
        });

        setTodaysJobs(jobsToday.map((job: any) => ({
          id: job.id,
          customerName: job.customerName,
          serviceType: job.serviceType,
          address: job.address,
          city: job.customer?.address?.split(',')[1]?.trim() || '',
          state: job.customer?.address?.split(',')[2]?.trim() || '',
          startTime: job.startTime,
          endTime: job.endTime,
          status: job.status,
          phone: job.customerPhone || job.customer?.phone,
          estimatedValue: job.estimatedValue || 0
        })));
      }
    } catch (error) {
      console.error('Failed to fetch jobs');
    }
  };

  const fetchStats = async (id: string) => {
    try {
      const res = await fetch(`/api/provider/stats?providerId=${id}`);
      const stats = await res.json();

      if (stats) {
        // Calculate weekly earnings (approximate from monthly revenue)
        const weeklyEarnings = stats.revenue ? Math.round(stats.revenue / 4) : 0;
        const avgJobValue = stats.completedJobs > 0 ? Math.round(stats.revenue / stats.completedJobs) : 0;

        setWeeklyEarnings(weeklyEarnings);
        setMonthlyEarnings(stats.revenue || 0);
        setAvgJobValue(avgJobValue);
        setAvgResponseTime(stats.avgResponseTime || 8);
      }
    } catch (error) {
      // Use default values if API fails
      setWeeklyEarnings(0);
      setMonthlyEarnings(0);
      setAvgJobValue(0);
      setAvgResponseTime(8);
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, newStatus: string, contractValue?: number) => {
    try {
      const body: any = { status: newStatus };
      if (contractValue) {
        body.contractValue = contractValue;
      }

      const res = await fetch(`/api/provider/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to update status');

      toast.success(
        newStatus === 'accepted'
          ? 'Lead accepted! Contact info revealed.'
          : newStatus === 'converted'
          ? '🎉 Deal closed! Revenue tracked.'
          : 'Lead status updated!'
      );

      if (contractValue) {
        setContractValues({ ...contractValues, [leadId]: '' });
      }

      fetchLeads(providerId);
      fetchStats(providerId);
    } catch (error) {
      toast.error('Failed to update lead status');
    }
  };

  const handleUpdateNotes = async (leadId: string, note: string) => {
    if (!note.trim()) return;

    try {
      const res = await fetch(`/api/provider/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: note,
          providerId: providerId
        }),
      });

      if (!res.ok) throw new Error('Failed to save note');

      toast.success('Note saved!');
      setNoteText({ ...noteText, [`modal-${leadId}`]: '' });
      fetchLeads(providerId);
    } catch (error) {
      console.error('Failed to save note');
      toast.error('Failed to save note');
    }
  };

  const handleScheduleAction = async (leadId: string, action: 'confirm' | 'propose') => {
    try {
      const body: any = { action };

      if (action === 'propose') {
        if (!proposedDate || !proposedTime) {
          toast.error('Please select both date and time');
          return;
        }
        body.proposedDate = `${proposedDate}T${proposedTime}:00`;
      }

      const response = await fetch(`/api/provider/leads/${leadId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to update schedule');

      const data = await response.json();
      toast.success(data.message);

      setShowScheduleModal(null);
      setProposedDate('');
      setProposedTime('');
      fetchLeads(providerId);
      fetchTodaysJobs(providerId);

    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Failed to update schedule');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLongDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    const start = formatTime(startTime);
    const end = new Date(endTime);
    end.setHours(end.getHours() + 1.5); // Assume 1.5hr jobs
    return `${start} - ${formatTime(end.toISOString())}`;
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  const getEstimatedValue = (lead: Lead) => {
    if (lead.contractValue) return `$${lead.contractValue}`;
    if (lead.propertyValue) {
      const low = Math.floor(lead.propertyValue * 0.002);
      const high = Math.floor(lead.propertyValue * 0.005);
      return `$${low}-${high}`;
    }
    return '$150-250';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      matched: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      accepted: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      converted: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      unqualified: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      in_progress: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    };
    return colors[status] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  };

  const blurText = (text: string, showLength: number = 4) => {
    return text.substring(0, showLength) + '•'.repeat(Math.max(text.length - showLength, 8));
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate stats
  const convertedCount = leads.filter(l => l.status === 'converted').length;
  const totalCompleted = leads.filter(l => l.status === 'converted' || l.status === 'unqualified').length;
  const conversionRate = totalCompleted > 0 ? Math.round((convertedCount / totalCompleted) * 100) : 0;
  const lastWeekRate = 45; // Mock data for trend
  const rateTrend = conversionRate >= lastWeekRate ? 'up' : 'down';

  // Recent activity (mock data - would come from API in production)
  const recentActivity: RecentActivity[] = [
    { id: '1', type: 'proposal', message: 'Sarah J. accepted your proposal', timestamp: new Date(Date.now() - 7200000).toISOString(), icon: CheckCircle2, color: 'text-emerald-400' },
    { id: '2', type: 'payment', message: 'Payment received: $250 from Mike T.', timestamp: new Date(Date.now() - 18000000).toISOString(), icon: DollarSign, color: 'text-green-400' },
    { id: '3', type: 'review', message: 'New review: 5 stars from Jane D.', timestamp: new Date(Date.now() - 86400000).toISOString(), icon: Star, color: 'text-yellow-400' },
    { id: '4', type: 'lead', message: 'New lead matched: Pool Cleaning', timestamp: new Date(Date.now() - 172800000).toISOString(), icon: Target, color: 'text-blue-400' },
    { id: '5', type: 'job', message: 'Job completed: Lawn Mowing for John S.', timestamp: new Date(Date.now() - 259200000).toISOString(), icon: CheckCircle2, color: 'text-emerald-400' },
  ];

  if (loading) {
    return (
      <ProviderLayout providerName={providerName}>
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="text-zinc-400">Loading...</div>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout providerName={providerName}>
      <div className="min-h-screen bg-background text-foreground">
        {/* Page Header */}
        <div className="border-b border-border bg-card/50">
          <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-3 md:py-6">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Your daily command center</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-4 md:py-8">
          {/* COMPACT STATS - PRIORITY #1 - Key metrics */}
          <div className="grid grid-cols-4 gap-1.5 md:gap-3 mb-4">
            <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/70 transition-colors">
              <CardHeader className="pb-1 px-2 pt-2 md:pb-2 md:px-4 md:pt-4">
                <CardTitle className="text-[10px] md:text-xs text-zinc-400 flex items-center gap-1">
                  <Target className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0" />
                  <span className="truncate">Leads</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2 px-2 pt-0 md:pb-4 md:px-4">
                <div className="text-xl md:text-3xl font-bold text-blue-400">
                  {leads.filter(l => ['new', 'contacted', 'replied', 'matched'].includes(l.status)).length}
                </div>
                <p className="text-[9px] md:text-xs text-zinc-500 mt-0.5 md:mt-1 truncate">New</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/70 transition-colors">
              <CardHeader className="pb-1 px-2 pt-2 md:pb-2 md:px-4 md:pt-4">
                <CardTitle className="text-[10px] md:text-xs text-zinc-400 flex items-center gap-1">
                  <Clock className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0" />
                  <span className="truncate">Jobs</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2 px-2 pt-0 md:pb-4 md:px-4">
                <div className="text-xl md:text-3xl font-bold text-amber-400">
                  {todaysJobs.length}
                </div>
                <p className="text-[9px] md:text-xs text-zinc-500 mt-0.5 md:mt-1 truncate">Today</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/70 transition-colors">
              <CardHeader className="pb-1 px-2 pt-2 md:pb-2 md:px-4 md:pt-4">
                <CardTitle className="text-[10px] md:text-xs text-zinc-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0" />
                  <span className="truncate">Conv.</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2 px-2 pt-0 md:pb-4 md:px-4">
                <div className="text-xl md:text-3xl font-bold text-emerald-400">
                  {convertedCount}
                </div>
                <p className="text-[9px] md:text-xs text-emerald-400 mt-0.5 md:mt-1 truncate">
                  {formatCurrency(leads.filter(l => l.status === 'converted').reduce((sum, l) => sum + (l.contractValue || 0), 0))}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/70 transition-colors">
              <CardHeader className="pb-1 px-2 pt-2 md:pb-2 md:px-4 md:pt-4">
                <CardTitle className="text-[10px] md:text-xs text-zinc-400 flex items-center gap-1">
                  <Award className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0" />
                  <span className="truncate">Rate</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2 px-2 pt-0 md:pb-4 md:px-4">
                <div className="flex items-center gap-1">
                  <div className="text-xl md:text-3xl font-bold text-blue-400">
                    {conversionRate}%
                  </div>
                  {rateTrend === 'up' ? (
                    <TrendingUp className="h-3 w-3 md:h-5 md:w-5 text-emerald-400" />
                  ) : (
                    <TrendingDown className="h-3 w-3 md:h-5 md:w-5 text-red-400" />
                  )}
                </div>
                <p className="text-[9px] md:text-xs text-zinc-500 mt-0.5 md:mt-1 truncate">
                  {rateTrend === 'up' ? '↑' : '↓'} {Math.abs(conversionRate - lastWeekRate)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* TODAY'S SCHEDULE - PRIORITY #2 - What's happening NOW */}
          <Card className="bg-card border-border mb-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Today</div>
                  <CardTitle className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
                    {format(new Date(), 'EEEE, MMM d')}
                  </CardTitle>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {todaysJobs.length} job{todaysJobs.length !== 1 ? 's' : ''} scheduled
                  </p>
                </div>
                <Button
                  onClick={() => setShowAddJobModal(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Add Job</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {todaysJobs.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-400 font-medium mb-2">No jobs scheduled today</p>
                  <p className="text-sm text-zinc-500 mb-4">Enjoy your free day or add a new job</p>
                  <Button
                    onClick={() => router.push('/provider/calendar')}
                    variant="outline"
                    className="border-zinc-700 hover:bg-zinc-800"
                  >
                    View Calendar
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaysJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => router.push(`/provider/jobs/${job.id}`)}
                      className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-800/70 hover:border-emerald-600 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-zinc-100 truncate">{job.customerName || 'Unknown Customer'}</h4>
                            <Badge className={`${getStatusColor(job.status)} border text-xs flex-shrink-0`}>
                              {job.status === 'in_progress' ? 'In Progress' : 'Scheduled'}
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-400 truncate">{job.serviceType}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className="text-sm font-semibold text-blue-400">
                            {formatTimeRange(job.startTime, job.endTime)}
                          </p>
                          {job.estimatedValue > 0 && (
                            <p className="text-xs text-zinc-500 mt-1">
                              ~{formatCurrency(job.estimatedValue)}
                            </p>
                          )}
                        </div>
                      </div>

                      {(job.address || job.city || job.state) && (
                        <div className="flex items-center gap-2 mb-2 text-sm text-zinc-400">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {[job.address, job.city, job.state].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}

                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                          onClick={async (e) => {
                            e.stopPropagation();
                            // Update job status
                            const newStatus = job.status === 'in_progress' ? 'completed' : 'in_progress';
                            try {
                              const res = await fetch(`/api/provider/jobs/${job.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: newStatus }),
                              });

                              if (res.ok) {
                                toast.success(`Job ${newStatus === 'in_progress' ? 'started' : 'completed'}!`);
                                fetchTodaysJobs(providerId);
                              }
                            } catch (error) {
                              toast.error('Failed to update job status');
                            }
                          }}
                        >
                          {job.status === 'in_progress' ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Complete
                            </>
                          ) : (
                            <>
                              <PlayCircle className="h-4 w-4 mr-1" />
                              Start
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-700 hover:bg-zinc-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `tel:${job.phone}`;
                          }}
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-700 hover:bg-zinc-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://maps.google.com/?q=${encodeURIComponent(job.address + ', ' + job.city)}`);
                          }}
                        >
                          <Navigation className="h-4 w-4 mr-1" />
                          Navigate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* NEW LEADS - PRIORITY #3 - Conditional (only if leads exist) */}
          {leads.filter(l => ['new', 'contacted', 'replied', 'matched'].includes(l.status)).length > 0 && (
            <Card className="bg-zinc-900/50 border-zinc-800 mb-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-zinc-100 flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-400" />
                    New Leads ({leads.filter(l => ['new', 'contacted', 'replied', 'matched'].includes(l.status)).length})
                  </CardTitle>
                  <Button
                    onClick={() => router.push('/provider/leads')}
                    size="sm"
                    variant="outline"
                    className="border-zinc-700 hover:bg-zinc-800"
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leads
                    .filter(l => ['new', 'contacted', 'replied', 'matched'].includes(l.status))
                    .slice(0, 3)
                    .map((lead) => {
                      const isBlurred = lead.status !== 'accepted' && lead.status !== 'converted';
                      return (
                        <Card key={lead.id} className="bg-zinc-800/30 border-zinc-700">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-zinc-100 mb-1 flex items-center gap-2">
                                  {isBlurred ? blurText(`${lead.firstName} ${lead.lastName}`, 5) : `${lead.firstName} ${lead.lastName}`}
                                </h4>
                                <div className="flex items-center gap-3 text-xs text-zinc-400">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{getTimeAgo(lead.createdAt)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    <span>{getEstimatedValue(lead)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex-shrink-0">
                                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                <span className="text-xs font-semibold text-emerald-400">{lead.leadScore}% match</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1 bg-blue-600 hover:bg-blue-500"
                                onClick={() => handleUpdateLeadStatus(lead.id, 'accepted')}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Accept Lead
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-zinc-700 hover:bg-zinc-800"
                              >
                                Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* RECENT ACTIVITY - PRIORITY #4 - Collapsed by default */}
          <details className="group mb-4">
            <summary className="cursor-pointer bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-900/70 transition-colors flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-zinc-400" />
                <span className="font-semibold text-zinc-100">Recent Activity</span>
                <span className="text-sm text-zinc-500">({recentActivity.length})</span>
              </div>
              <span className="text-zinc-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <Card className="bg-zinc-900/50 border-zinc-800 mt-2 border-t-0 rounded-t-none">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {recentActivity.slice(0, showAllActivity ? recentActivity.length : 5).map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="p-2 bg-zinc-800/50 rounded-lg">
                          <Icon className={`h-4 w-4 ${activity.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-300 leading-snug">{activity.message}</p>
                          <p className="text-xs text-zinc-500 mt-1">{getTimeAgo(activity.timestamp)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {recentActivity.length > 5 && (
                  <button
                    onClick={() => setShowAllActivity(!showAllActivity)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-4"
                  >
                    {showAllActivity ? 'Show Less ↑' : 'View All →'}
                  </button>
                )}
              </CardContent>
            </Card>
          </details>

          {/* REVENUE CHART - PRIORITY #5 - Collapsed by default */}
          <details className="group mb-4">
            <summary className="cursor-pointer bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-900/70 transition-colors flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                <span className="font-semibold text-zinc-100">Revenue Stats</span>
              </div>
              <span className="text-zinc-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <Card className="bg-zinc-900/50 border-zinc-800 mt-2 border-t-0 rounded-t-none">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-emerald-400" />
                      <p className="text-xs font-medium text-zinc-400">This Week</p>
                    </div>
                    <div className="text-xl font-bold text-emerald-400">
                      {formatCurrency(weeklyEarnings)}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">+18% from last week</p>
                  </div>

                  <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-blue-400" />
                      <p className="text-xs font-medium text-zinc-400">This Month</p>
                    </div>
                    <div className="text-xl font-bold text-zinc-100">
                      {formatCurrency(monthlyEarnings)}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">On track for ${Math.floor(monthlyEarnings * 1.5)}</p>
                  </div>

                  <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-purple-400" />
                      <p className="text-xs font-medium text-zinc-400">Avg Job Value</p>
                    </div>
                    <div className="text-xl font-bold text-zinc-100">
                      {formatCurrency(avgJobValue)}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">Across {convertedCount} jobs</p>
                  </div>

                  <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-yellow-400" />
                      <p className="text-xs font-medium text-zinc-400">Response Time</p>
                    </div>
                    <div className="text-xl font-bold text-zinc-100">
                      {avgResponseTime} min
                    </div>
                    <p className="text-xs text-emerald-400 mt-1">↓ 2 min faster</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </details>

          {/* LEGACY Two Column Layout - Keep for compatibility */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 hidden">
            {/* Left Column - Today's Schedule & Leads */}
            <div className="lg:col-span-2 space-y-6">
              {/* Today's Schedule Section - NEW */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-zinc-100 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-400" />
                        Today - {getTodayDate()}
                      </CardTitle>
                      <p className="text-sm text-zinc-400 mt-1">
                        {todaysJobs.length} job{todaysJobs.length !== 1 ? 's' : ''} scheduled
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowAddJobModal(true)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Job
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {todaysJobs.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                      <p className="text-zinc-400 font-medium mb-2">No jobs scheduled today</p>
                      <p className="text-sm text-zinc-500 mb-4">Enjoy your free day or add a new job</p>
                      <Button
                        onClick={() => router.push('/provider/calendar')}
                        variant="outline"
                        className="border-zinc-700 hover:bg-zinc-800"
                      >
                        View Calendar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todaysJobs.map((job) => (
                        <div
                          key={job.id}
                          className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-800/70 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-zinc-100">{job.customerName}</h4>
                                <Badge className={`${getStatusColor(job.status)} border text-xs`}>
                                  {job.status === 'in_progress' ? 'In Progress' : 'Scheduled'}
                                </Badge>
                              </div>
                              <p className="text-sm text-zinc-400">{job.serviceType}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-blue-400">
                                {formatTimeRange(job.startTime, job.endTime)}
                              </p>
                              {job.estimatedValue > 0 && (
                                <p className="text-xs text-zinc-500 mt-1">
                                  ~{formatCurrency(job.estimatedValue)}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-3 text-sm text-zinc-400">
                            <MapPin className="h-4 w-4" />
                            <span>{job.address}, {job.city}, {job.state}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                              onClick={() => router.push(`/provider/jobs/${job.id}`)}
                            >
                              {job.status === 'in_progress' ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Mark Complete
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="h-4 w-4 mr-1" />
                                  Start Job
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-zinc-700 hover:bg-zinc-800"
                              onClick={() => window.location.href = `tel:${job.phone}`}
                            >
                              <Phone className="h-4 w-4 mr-1" />
                              Call
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-zinc-700 hover:bg-zinc-800"
                              onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(job.address + ', ' + job.city)}`)}
                            >
                              <Navigation className="h-4 w-4 mr-1" />
                              Navigate
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Leads Section - Enhanced */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-zinc-100">New Leads</CardTitle>
                    {/* TODO: Implement /provider/leads page */}
                    {/* <Link
                      href="/provider/leads"
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      View All <ArrowRight className="h-4 w-4" />
                    </Link> */}
                  </div>
                </CardHeader>
                <CardContent>
                  {leads.filter(l => l.status === 'matched').length === 0 ? (
                    <div className="text-center py-12">
                      <Target className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                      <p className="text-zinc-400">No new leads</p>
                      <p className="text-sm text-zinc-500 mt-2">New leads will appear here when matched</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {leads
                        .filter(l => l.status === 'matched')
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 3)
                        .map((lead) => {
                          const isBlurred = lead.status === 'matched';
                          return (
                            <Card key={lead.id} className="bg-zinc-800/50 border-zinc-700">
                              <CardContent className="pt-6">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-zinc-100 mb-1">
                                      {lead.firstName} {lead.lastName}
                                    </h3>
                                    <p className="text-sm text-zinc-400 capitalize mb-2">{lead.serviceInterest} Service</p>

                                    {/* NEW: Enhanced metadata */}
                                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        <span>2.3 miles away</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{getTimeAgo(lead.createdAt)}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <DollarSign className="h-3 w-3" />
                                        <span>{getEstimatedValue(lead)}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                      <span className="text-xs font-semibold text-emerald-400">{lead.leadScore}% match</span>
                                    </div>
                                    <Badge className={`${getStatusColor(lead.status)} border capitalize text-xs`}>
                                      New
                                    </Badge>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                  <div className="flex items-center gap-2 text-zinc-300">
                                    <Mail className="h-4 w-4 text-zinc-500" />
                                    <span className="text-sm">
                                      {isBlurred ? blurText(lead.email, 3) : lead.email}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-zinc-300">
                                    <Phone className="h-4 w-4 text-zinc-500" />
                                    <span className="text-sm">
                                      {isBlurred ? blurText(lead.phone, 3) : lead.phone}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-zinc-300 md:col-span-2">
                                    <MapPin className="h-4 w-4 text-zinc-500" />
                                    <span className="text-sm">
                                      {isBlurred ? blurText(lead.address, 3) : `${lead.address}, ${lead.city}, ${lead.state}`}
                                    </span>
                                  </div>
                                </div>

                                {lead.notes && (
                                  <div className="mb-4 p-3 bg-zinc-900/50 rounded-lg border border-zinc-700">
                                    <p className="text-sm text-zinc-400">
                                      <strong className="text-zinc-300">Notes:</strong> {lead.notes}
                                    </p>
                                  </div>
                                )}

                                {isBlurred && (
                                  <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                                    <p className="text-sm text-blue-400 flex items-center gap-2">
                                      <EyeOff className="h-4 w-4" />
                                      Contact information will be revealed when you accept this lead
                                    </p>
                                  </div>
                                )}

                                <div className="flex gap-2 pt-4 border-t border-zinc-700">
                                  <Button
                                    size="sm"
                                    className="flex-1 bg-blue-600 hover:bg-blue-500"
                                    onClick={() => handleUpdateLeadStatus(lead.id, 'accepted')}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Accept Lead
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-zinc-700 hover:bg-zinc-800"
                                  >
                                    Details
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Quick Actions & Recent Activity */}
            <div className="space-y-6">
              {/* Quick Actions Widget - NEW */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-zinc-100 text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => router.push('/provider/calendar')}
                      className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors text-center"
                    >
                      <Calendar className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                      <p className="text-xs font-medium text-zinc-300">Calendar</p>
                    </button>
                    <button
                      onClick={() => setShowAddJobModal(true)}
                      className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors text-center"
                    >
                      <Plus className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                      <p className="text-xs font-medium text-zinc-300">Add Job</p>
                    </button>
                    <button
                      onClick={() => router.push('/provider/customers')}
                      className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors text-center"
                    >
                      <Users className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                      <p className="text-xs font-medium text-zinc-300">Customers</p>
                    </button>
                    <button
                      onClick={() => router.push('/provider/analytics')}
                      className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors text-center"
                    >
                      <BarChart3 className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                      <p className="text-xs font-medium text-zinc-300">Analytics</p>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity Feed - NEW */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-zinc-100 text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Recent Activity
                    </CardTitle>
                    <button
                      onClick={() => setShowAllActivity(!showAllActivity)}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      {showAllActivity ? 'Show Less ↑' : 'View All →'}
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.slice(0, showAllActivity ? recentActivity.length : 5).map((activity) => {
                      const Icon = activity.icon;
                      return (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div className="p-2 bg-zinc-800/50 rounded-lg">
                            <Icon className={`h-4 w-4 ${activity.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-300 leading-snug">{activity.message}</p>
                            <p className="text-xs text-zinc-500 mt-1">{getTimeAgo(activity.timestamp)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Chart - Revenue */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-zinc-100 text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Revenue (Last 7 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Generate revenue data from converted leads
                    const last7Days = [...Array(7)].map((_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() - (6 - i));
                      return {
                        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        revenue: 0
                      };
                    });

                    // Aggregate revenue by day from converted leads
                    leads
                      .filter(l => l.status === 'converted' && l.contractValue)
                      .forEach(lead => {
                        const leadDate = new Date(lead.createdAt);
                        const dayKey = leadDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        const dayEntry = last7Days.find(d => d.date === dayKey);
                        if (dayEntry) {
                          dayEntry.revenue += lead.contractValue || 0;
                        }
                      });

                    const hasData = last7Days.some(d => d.revenue > 0);

                    return hasData ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={last7Days}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis
                            dataKey="date"
                            stroke="#71717a"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#71717a"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#18181b',
                              border: '1px solid #3f3f46',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                            formatter={(value: any) => [`$${value}`, 'Revenue']}
                          />
                          <Bar
                            dataKey="revenue"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[180px] flex items-center justify-center">
                        <div className="text-center">
                          <BarChart3 className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                          <p className="text-xs text-zinc-500">No revenue data yet</p>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => {
          setShowOnboardingModal(false);
        }}
        providerId={providerId}
        onComplete={() => {
          setShowOnboardingModal(false);
          fetchProviderDetails(providerId);
        }}
      />

      {/* Add Job Modal */}
      <AddJobModal
        isOpen={showAddJobModal}
        providerId={providerId}
        providerServiceTypes={providerServiceTypes}
        onClose={() => setShowAddJobModal(false)}
        onJobCreated={() => {
          fetchTodaysJobs(providerId);
          fetchStats(providerId);
          setShowAddJobModal(false);
        }}
      />

      {/* Scheduling Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-zinc-100 mb-4">Propose New Date/Time</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={proposedTime}
                  onChange={(e) => setProposedTime(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowScheduleModal(null);
                  setProposedDate('');
                  setProposedTime('');
                }}
                variant="outline"
                className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleScheduleAction(showScheduleModal, 'propose')}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
              >
                Propose Date
              </Button>
            </div>
          </div>
        </div>
      )}
    </ProviderLayout>
  );
}
