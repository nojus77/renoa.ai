"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  MapPin,
  Phone,
  Navigation,
  Users,
  FileText,
  Target,
  CheckCircle2,
  PlayCircle,
  Plus,
  ChevronRight,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
}

interface TodayJob {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  address: string;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: number | null;
  workers: Worker[];
}

interface UpcomingJob {
  id: string;
  startTime: string;
  serviceType: string;
}

interface Stats {
  todaysJobsCount: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  pendingInvoicesCount: number;
  pendingInvoicesAmount: number;
  newLeadsCount: number;
  completedThisWeek: number;
  completedThisMonth: number;
}

interface RecentActivity {
  id: string;
  type: 'job' | 'invoice';
  status: string;
  customerName: string;
  serviceType?: string;
  timestamp: string;
  amount?: number;
}

interface HomeData {
  todaysJobs: TodayJob[];
  upcomingJobs: UpcomingJob[];
  stats: Stats;
  recentActivity: RecentActivity[];
}

export default function ProviderHome() {
  const router = useRouter();
  const [providerName, setProviderName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [homeData, setHomeData] = useState<HomeData | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');

    if (!id || !name) {
      router.push('/provider/login');
      return;
    }

    setProviderId(id);
    setProviderName(name);

    // Use mock data for offline preview
    const useMockData = true; // Set to false when you have good WiFi

    if (useMockData) {
      loadMockData();
    } else {
      fetchHomeData(id);
    }
  }, [router]);

  const loadMockData = () => {
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      const today = new Date();
      const mockData: HomeData = {
        todaysJobs: [
          {
            id: '1',
            customerName: 'John Smith',
            customerPhone: '(555) 123-4567',
            serviceType: 'Lawn Mowing',
            address: '123 Oak Street, Springfield, IL',
            startTime: new Date(today.setHours(9, 0, 0, 0)).toISOString(),
            endTime: new Date(today.setHours(10, 30, 0, 0)).toISOString(),
            status: 'scheduled',
            totalAmount: 85,
            workers: [
              { id: 'w1', firstName: 'Mike', lastName: 'Johnson' },
            ],
          },
          {
            id: '2',
            customerName: 'Sarah Williams',
            customerPhone: '(555) 234-5678',
            serviceType: 'Hedge Trimming',
            address: '456 Maple Ave, Springfield, IL',
            startTime: new Date(today.setHours(11, 0, 0, 0)).toISOString(),
            endTime: new Date(today.setHours(12, 30, 0, 0)).toISOString(),
            status: 'in_progress',
            totalAmount: 120,
            workers: [
              { id: 'w1', firstName: 'Mike', lastName: 'Johnson' },
              { id: 'w2', firstName: 'Carlos', lastName: 'Rodriguez' },
            ],
          },
          {
            id: '3',
            customerName: 'Robert Davis',
            customerPhone: '(555) 345-6789',
            serviceType: 'Mulching',
            address: '789 Pine Road, Springfield, IL',
            startTime: new Date(today.setHours(14, 0, 0, 0)).toISOString(),
            endTime: new Date(today.setHours(16, 0, 0, 0)).toISOString(),
            status: 'scheduled',
            totalAmount: 200,
            workers: [
              { id: 'w2', firstName: 'Carlos', lastName: 'Rodriguez' },
            ],
          },
        ],
        upcomingJobs: [
          {
            id: '4',
            serviceType: 'Spring Cleanup',
            startTime: new Date(today.getTime() + 86400000).toISOString(), // Tomorrow
          },
          {
            id: '5',
            serviceType: 'Lawn Mowing',
            startTime: new Date(today.getTime() + 172800000).toISOString(), // 2 days
          },
          {
            id: '6',
            serviceType: 'Fertilization',
            startTime: new Date(today.getTime() + 259200000).toISOString(), // 3 days
          },
        ],
        stats: {
          todaysJobsCount: 3,
          weeklyRevenue: 3250,
          monthlyRevenue: 12480,
          pendingInvoicesCount: 5,
          pendingInvoicesAmount: 1850,
          newLeadsCount: 4,
          completedThisWeek: 12,
          completedThisMonth: 48,
        },
        recentActivity: [
          {
            id: 'a1',
            type: 'job',
            status: 'completed',
            customerName: 'Jennifer Martinez',
            serviceType: 'Lawn Mowing',
            timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            amount: 85,
          },
          {
            id: 'a2',
            type: 'invoice',
            status: 'paid',
            customerName: 'Michael Brown',
            timestamp: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
            amount: 250,
          },
          {
            id: 'a3',
            type: 'job',
            status: 'completed',
            customerName: 'Lisa Anderson',
            serviceType: 'Hedge Trimming',
            timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            amount: 120,
          },
          {
            id: 'a4',
            type: 'invoice',
            status: 'sent',
            customerName: 'David Wilson',
            timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            amount: 300,
          },
        ],
      };
      setHomeData(mockData);
      setLoading(false);
    }, 500);
  };

  const fetchHomeData = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/provider/home?providerId=${id}`);
      const data = await res.json();

      if (data.success) {
        setHomeData(data.data);
      } else {
        toast.error('Failed to load home data');
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
      toast.error('Failed to load home data');
    } finally {
      setLoading(false);
    }
  };

  const handleJobAction = async (jobId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/provider/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Job ${newStatus === 'in_progress' ? 'started' : 'completed'}!`);
        fetchHomeData(providerId);
      } else {
        toast.error('Failed to update job');
      }
    } catch (error) {
      toast.error('Failed to update job status');
    }
  };

  const formatTime = (date: string) => {
    return format(new Date(date), 'h:mm a');
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
      scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      in_progress: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      sent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    };
    return colors[status] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  };

  const getActivityIcon = (activity: RecentActivity) => {
    if (activity.type === 'job') {
      if (activity.status === 'completed') return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      if (activity.status === 'in_progress') return <PlayCircle className="h-4 w-4 text-orange-400" />;
      return <Calendar className="h-4 w-4 text-blue-400" />;
    }
    if (activity.status === 'paid') return <DollarSign className="h-4 w-4 text-emerald-400" />;
    return <FileText className="h-4 w-4 text-yellow-400" />;
  };

  const getActivityMessage = (activity: RecentActivity) => {
    if (activity.type === 'job') {
      const statusText = activity.status === 'completed' ? 'Completed' :
                        activity.status === 'in_progress' ? 'Started' : 'Scheduled';
      return `${statusText} ${activity.serviceType} for ${activity.customerName}`;
    }
    const statusText = activity.status === 'paid' ? 'Payment received' : 'Invoice sent';
    return `${statusText} - ${activity.customerName} ${activity.amount ? formatCurrency(activity.amount) : ''}`;
  };

  if (loading) {
    return (
      <ProviderLayout providerName={providerName}>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </ProviderLayout>
    );
  }

  if (!homeData) {
    return (
      <ProviderLayout providerName={providerName}>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">Failed to load data</div>
        </div>
      </ProviderLayout>
    );
  }

  const { todaysJobs, upcomingJobs, stats, recentActivity } = homeData;

  return (
    <ProviderLayout providerName={providerName}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card/30">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {format(new Date(), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
              <Button
                onClick={() => router.push('/provider/calendar')}
                className="bg-blue-600 hover:bg-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Job
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-6 md:py-10">
          {/* Action Required Banner */}
          {(stats.pendingInvoicesCount > 0 || stats.newLeadsCount > 0) && (
            <div className="bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 border-2 border-orange-500/30 rounded-2xl p-6 mb-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-orange-500/20 rounded-xl">
                  <AlertCircle className="h-8 w-8 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Action Required</h2>
                  <p className="text-muted-foreground">Items that need immediate attention</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stats.pendingInvoicesCount > 0 && (
                  <button
                    onClick={() => router.push('/provider/invoices')}
                    className="p-6 border-2 border-yellow-500/40 rounded-xl hover:border-yellow-500/70 hover:bg-yellow-500/5 transition-all text-left group bg-card"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-yellow-500/20 rounded-xl">
                        <FileText className="h-7 w-7 text-yellow-400" />
                      </div>
                      <ChevronRight className="h-6 w-6 text-muted-foreground group-hover:text-yellow-400 transition-colors" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-2">
                      {formatCurrency(stats.pendingInvoicesAmount)}
                    </div>
                    <p className="text-base text-muted-foreground font-medium">
                      {stats.pendingInvoicesCount} Unpaid Invoice{stats.pendingInvoicesCount !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-2">
                      Outstanding receivables requiring follow-up
                    </p>
                  </button>
                )}
                {stats.newLeadsCount > 0 && (
                  <button
                    onClick={() => router.push('/provider/dashboard')}
                    className="p-6 border-2 border-purple-500/40 rounded-xl hover:border-purple-500/70 hover:bg-purple-500/5 transition-all text-left group bg-card"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-purple-500/20 rounded-xl">
                        <Target className="h-7 w-7 text-purple-400" />
                      </div>
                      <ChevronRight className="h-6 w-6 text-muted-foreground group-hover:text-purple-400 transition-colors" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-2">
                      {stats.newLeadsCount}
                    </div>
                    <p className="text-base text-muted-foreground font-medium">
                      New Lead{stats.newLeadsCount !== 1 ? 's' : ''} Awaiting Response
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-2">
                      Potential customers need quotes or scheduling
                    </p>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Business Performance Dashboard */}
          <div className="mb-10">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Business Performance</h2>
              <p className="text-muted-foreground">Key metrics and revenue tracking</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Revenue This Month - Largest */}
              <Card className="lg:row-span-2 bg-gradient-to-br from-blue-500/5 to-emerald-500/5 border-2 border-border hover:border-blue-500/30 transition-all">
                <CardHeader className="pb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-4 bg-emerald-500/20 rounded-2xl">
                      <DollarSign className="h-10 w-10 text-emerald-400" />
                    </div>
                    <Badge variant="outline" className="text-base px-4 py-2 bg-background">
                      MTD
                    </Badge>
                  </div>
                  <CardTitle className="text-lg text-muted-foreground font-normal">Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-6xl font-bold text-foreground mb-6">
                    {formatCurrency(stats.monthlyRevenue)}
                  </div>
                  <div className="space-y-4 pt-6 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-base text-muted-foreground">Jobs Completed</span>
                      <span className="text-2xl font-bold text-foreground">{stats.completedThisMonth}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base text-muted-foreground">Avg per Job</span>
                      <span className="text-2xl font-bold text-foreground">
                        {formatCurrency(stats.completedThisMonth > 0 ? stats.monthlyRevenue / stats.completedThisMonth : 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Revenue */}
              <Card className="bg-card border-2 border-border hover:border-emerald-500/30 transition-all">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-emerald-500/15 rounded-xl">
                      <TrendingUp className="h-8 w-8 text-emerald-400" />
                    </div>
                    <Badge variant="outline" className="text-sm px-3 py-1.5">
                      This Week
                    </Badge>
                  </div>
                  <CardTitle className="text-base text-muted-foreground font-normal">Weekly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-foreground mb-4">
                    {formatCurrency(stats.weeklyRevenue)}
                  </div>
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Jobs Completed</span>
                      <span className="text-xl font-semibold text-foreground">{stats.completedThisWeek}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Today's Operations */}
              <Card className="bg-card border-2 border-border hover:border-blue-500/30 transition-all">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-blue-500/15 rounded-xl">
                      <Calendar className="h-8 w-8 text-blue-400" />
                    </div>
                    <Badge variant="outline" className="text-sm px-3 py-1.5">
                      Today
                    </Badge>
                  </div>
                  <CardTitle className="text-base text-muted-foreground font-normal">Jobs Scheduled</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-foreground mb-4">
                    {stats.todaysJobsCount}
                  </div>
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Revenue Target</span>
                      <span className="text-xl font-semibold text-foreground">
                        {formatCurrency(todaysJobs.reduce((sum, job) => sum + (job.totalAmount || 0), 0))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Week Progress Indicator */}
              <Card className="bg-card border-2 border-border">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base text-muted-foreground font-normal">Week Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-foreground">
                        {Math.round((stats.weeklyRevenue / (stats.monthlyRevenue || 1)) * 100)}%
                      </span>
                      <span className="text-sm text-muted-foreground">of monthly</span>
                    </div>
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        On track for {formatCurrency(stats.weeklyRevenue * 4.33)} this month
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Operations Overview */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Today&apos;s Operations</h2>
              <p className="text-muted-foreground">Real-time field activity and scheduling</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Today's Schedule - Summary View */}
              <div className="xl:col-span-2">
                <Card className="bg-card border-2 border-border">
                  <CardHeader className="border-b border-border pb-5">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <Clock className="h-6 w-6 text-blue-500" />
                        </div>
                        Field Schedule
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/provider/calendar')}
                        className="text-blue-500 hover:text-blue-400 border-blue-500/30"
                      >
                        Full Calendar
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {todaysJobs.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="p-4 bg-muted/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <Calendar className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          No jobs scheduled today
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                          Take a break or add a new job to your schedule
                        </p>
                        <Button
                          onClick={() => router.push('/provider/calendar')}
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Schedule Job
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {todaysJobs.map((job) => (
                          <div
                            key={job.id}
                            className="p-4 border border-border rounded-lg hover:border-blue-500/50 transition-all cursor-pointer bg-card/50"
                            onClick={() => router.push(`/provider/jobs/${job.id}`)}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-foreground truncate">
                                    {job.customerName}
                                  </h4>
                                  <Badge className={`${getStatusColor(job.status)} border flex-shrink-0`}>
                                    {job.status === 'in_progress' ? 'In Progress' : 'Scheduled'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {job.serviceType}
                                </p>
                                {job.workers.length > 0 && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Users className="h-3 w-3" />
                                    {job.workers.map(w => `${w.firstName} ${w.lastName}`).join(', ')}
                                  </div>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0 ml-4">
                                <div className="text-lg font-semibold text-blue-500 mb-1">
                                  {formatTime(job.startTime)}
                                </div>
                                {job.totalAmount && (
                                  <div className="text-sm text-muted-foreground">
                                    {formatCurrency(job.totalAmount)}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{job.address}</span>
                            </div>

                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJobAction(
                                    job.id,
                                    job.status === 'in_progress' ? 'completed' : 'in_progress'
                                  );
                                }}
                              >
                                {job.status === 'in_progress' ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Complete
                                  </>
                                ) : (
                                  <>
                                    <PlayCircle className="h-4 w-4 mr-2" />
                                    Start
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `tel:${job.customerPhone}`;
                                }}
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`https://maps.google.com/?q=${encodeURIComponent(job.address)}`);
                                }}
                              >
                                <Navigation className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </CardContent>
              </Card>

              {/* Upcoming Jobs */}
              {upcomingJobs.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5 text-muted-foreground" />
                      Coming Up
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {upcomingJobs.map((job) => (
                        <div
                          key={job.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-blue-500/50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/provider/jobs/${job.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-lg">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm">
                                {job.serviceType}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(job.startTime), 'EEE, MMM d · h:mm a')}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Sidebar - Business Insights */}
            <div className="space-y-6">
              {/* Week At a Glance */}
              <Card className="bg-card border-2 border-border">
                <CardHeader className="pb-5 border-b border-border">
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-purple-500" />
                    </div>
                    Week at a Glance
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.weeklyRevenue)}</p>
                      </div>
                      <div className="p-3 bg-emerald-500/20 rounded-lg">
                        <DollarSign className="h-6 w-6 text-emerald-400" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Jobs Completed</p>
                        <p className="text-2xl font-bold text-foreground">{stats.completedThisWeek}</p>
                      </div>
                      <div className="p-3 bg-blue-500/20 rounded-lg">
                        <CheckCircle2 className="h-6 w-6 text-blue-400" />
                      </div>
                    </div>
                    {upcomingJobs.length > 0 && (
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Jobs Ahead</p>
                          <p className="text-2xl font-bold text-foreground">{upcomingJobs.length}</p>
                        </div>
                        <div className="p-3 bg-orange-500/20 rounded-lg">
                          <Calendar className="h-6 w-6 text-orange-400" />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Business Activity */}
              <Card className="bg-card border-2 border-border">
                <CardHeader className="pb-5 border-b border-border">
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Activity className="h-5 w-5 text-blue-500" />
                    </div>
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="space-y-3">
                    {recentActivity.slice(0, 5).map((activity) => (
                      <div key={`${activity.type}-${activity.id}`} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                        <div className="p-2 bg-muted/50 rounded-lg mt-0.5">
                          {getActivityIcon(activity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground font-medium mb-1 leading-snug">
                            {getActivityMessage(activity)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}