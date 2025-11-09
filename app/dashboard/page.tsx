"use client"

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Mail,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Brain,
  Target,
  ArrowRight,
  Plus,
  Send,
  Phone,
  Star,
  Building2,
  Activity,
  RefreshCw
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  leads: any[];
  campaigns: any[];
  providers: any[];
}

interface AIInsight {
  type: 'success' | 'warning' | 'info' | 'action';
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

interface TodoItem {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  assignee: string;
  completed: boolean;
}

const QuickAction = ({
  icon,
  label,
  href,
  color = "bg-emerald-600"
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  color?: string;
}) => (
  <Link href={href}>
    <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/80 transition-all cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`${color} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          <span className="font-medium text-zinc-100">{label}</span>
        </div>
      </CardContent>
    </Card>
  </Link>
);

const AIInsightCard = ({ insight }: { insight: AIInsight }) => {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-400" />,
    info: <Brain className="h-5 w-5 text-sky-400" />,
    action: <Zap className="h-5 w-5 text-purple-400" />,
  };

  const colors = {
    success: "border-emerald-500/30 bg-emerald-500/10",
    warning: "border-amber-500/30 bg-amber-500/10",
    info: "border-sky-500/30 bg-sky-500/10",
    action: "border-purple-500/30 bg-purple-500/10",
  };

  return (
    <Card className={`${colors[insight.type]} border`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{icons[insight.type]}</div>
          <div className="flex-1">
            <h4 className="font-semibold text-zinc-100 mb-1">{insight.title}</h4>
            <p className="text-sm text-zinc-400">{insight.description}</p>
            {insight.action && (
              <Link href={insight.action.href}>
                <Button size="sm" variant="ghost" className="mt-2 text-zinc-300 hover:text-zinc-100 p-0">
                  {insight.action.label} <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TodoCard = ({ todo, onToggle }: { todo: TodoItem; onToggle: () => void }) => {
  const priorityColors = {
    high: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    low: "text-sky-400 bg-sky-500/10 border-sky-500/30",
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-zinc-800 hover:bg-zinc-800/50 transition-colors">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={onToggle}
        className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-800 cursor-pointer"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className={`text-sm font-medium ${todo.completed ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>
            {todo.title}
          </h4>
          <Badge className={`${priorityColors[todo.priority]} border text-xs`}>
            {todo.priority}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-zinc-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {todo.dueDate}
          </span>
          <span className="text-xs text-zinc-500">•</span>
          <span className="text-xs text-zinc-400">{todo.assignee}</span>
        </div>
      </div>
    </div>
  );
};

const AlertCard = ({
  title,
  count,
  href,
  icon,
  color = "text-emerald-400"
}: {
  title: string;
  count: number;
  href: string;
  icon: React.ReactNode;
  color?: string;
}) => (
  <Link href={href}>
    <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/70 transition-colors cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={color}>{icon}</div>
            <div>
              <p className="text-sm text-zinc-400">{title}</p>
              <p className="text-2xl font-bold text-zinc-100">{count}</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-zinc-600" />
        </div>
      </CardContent>
    </Card>
  </Link>
);

const ActivityFeed = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchActivities();
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const res = await fetch('/api/activity');
      const data = await res.json();
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'lead_created':
        return <Users className="h-4 w-4" />;
      case 'lead_updated':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'campaign_sent':
        return <Mail className="h-4 w-4" />;
      case 'provider_added':
        return <Building2 className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      emerald: "bg-emerald-500/20 text-emerald-400",
      sky: "bg-sky-500/20 text-sky-400",
      purple: "bg-purple-500/20 text-purple-400",
      amber: "bg-amber-500/20 text-amber-400",
      rose: "bg-rose-500/20 text-rose-400",
    };
    return colors[color] || colors.emerald;
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/30 animate-pulse">
            <div className="w-10 h-10 bg-zinc-700 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-700 rounded w-3/4" />
              <div className="h-3 bg-zinc-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <Activity className="h-12 w-12 mx-auto mb-2 text-zinc-700" />
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors"
          >
            <div className={`${getColorClasses(activity.color)} p-2 rounded-lg flex-shrink-0`}>
              {getIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">
                {activity.title}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {activity.description}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-zinc-500">{formatTimestamp(activity.timestamp)}</span>
                <span className="text-xs text-zinc-600">•</span>
                <span className="text-xs text-zinc-500">{activity.user}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="w-full text-zinc-400 hover:text-zinc-100"
        onClick={() => fetchActivities(true)}
        disabled={isRefreshing}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Refreshing...' : 'Refresh Activities'}
      </Button>
    </div>
  );
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState<TodoItem[]>([
    {
      id: '1',
      title: 'Follow up with Sarah Johnson (Score: 85)',
      priority: 'high',
      dueDate: 'Today, 2:00 PM',
      assignee: 'You',
      completed: false,
    },
    {
      id: '2',
      title: 'Review Spring Landscaping campaign results',
      priority: 'medium',
      dueDate: 'Tomorrow',
      assignee: 'Team',
      completed: false,
    },
    {
      id: '3',
      title: 'Pay commission to Top Tier Roofing',
      priority: 'high',
      dueDate: 'Oct 25',
      assignee: 'Finance',
      completed: false,
    },
    {
      id: '4',
      title: 'Schedule team meeting for Q4 planning',
      priority: 'low',
      dueDate: 'Next week',
      assignee: 'You',
      completed: false,
    },
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [leadsRes, campaignsRes, providersRes] = await Promise.all([
        fetch('/api/leads?limit=1000'),
        fetch('/api/campaigns'),
        fetch('/api/providers'),
      ]);

      const leadsData = await leadsRes.json();
      const campaigns = await campaignsRes.json();
      const providers = await providersRes.json();

      setData({
        leads: Array.isArray(leadsData.leads) ? leadsData.leads : [],
        campaigns: Array.isArray(campaigns) ? campaigns : [],
        providers: Array.isArray(providers) ? providers : [],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const aiInsights = useMemo((): AIInsight[] => {
    if (!data) return [];

    const insights: AIInsight[] = [];

    // High-value leads not contacted
    const highValueNotContacted = data.leads.filter(
      l => l.leadScore >= 70 && l.status === 'new'
    ).length;
    if (highValueNotContacted > 0) {
      insights.push({
        type: 'warning',
        title: '⚡ High-Priority Leads Need Attention',
        description: `You have ${highValueNotContacted} high-score leads (70+) that haven't been contacted yet. Quick action could improve conversion rates by up to 40%.`,
        action: {
          label: 'View High-Priority Leads',
          href: '/dashboard/leads',
        },
      });
    }

    // Campaign performance
    const activeCampaigns = data.campaigns.filter(c => c.status === 'active');
    if (activeCampaigns.length > 0) {
      insights.push({
        type: 'success',
        title: '📊 Campaigns Performing Well',
        description: `Your ${activeCampaigns.length} active campaigns are generating solid engagement. The "Move-In Concierge" campaign has the highest open rate at 18.2%.`,
        action: {
          label: 'View Campaign Analytics',
          href: '/dashboard/campaigns',
        },
      });
    }

    // Unpaid commissions
const unpaidCommissions = (data.providers || []).filter(p => {
  const commission = (Number(p.totalRevenue) || 0) * (Number(p.commissionRate) || 0);
  return commission > 0;
});

if (unpaidCommissions.length > 0) {
  const totalUnpaid = unpaidCommissions.reduce((sum, p) => {
    const commission = (Number(p.totalRevenue) || 0) * (Number(p.commissionRate) || 0);
    return sum + commission;
  }, 0);
  
  insights.push({
    type: 'action',
    title: '💰 Outstanding Commissions',
    description: `${unpaidCommissions.length} providers have unpaid commissions totaling $${totalUnpaid.toLocaleString()}. Process payments to maintain strong relationships.`,
    action: {
      label: 'Review Payments',
      href: '/dashboard/providers',
    },
  });
}

    // Conversion rate insight
    const converted = data.leads.filter(l => l.status === 'converted').length;
    const conversionRate = data.leads.length > 0 ? ((converted / data.leads.length) * 100).toFixed(1) : '0.0';
    insights.push({
      type: 'info',
      title: '📈 Conversion Rate Analysis',
      description: `Your current conversion rate is ${conversionRate}%. Industry average is 2-5%. Tier 1 leads convert 3x better - focus on lead quality to improve this metric.`,
    });

    // Response time recommendation
    const recentLeads = data.leads.filter(l => {
      const hoursSinceCreated = (Date.now() - new Date(l.createdAt).getTime()) / 3600000;
      return l.status === 'new' && hoursSinceCreated > 24;
    });
    if (recentLeads.length > 0) {
      insights.push({
        type: 'warning',
        title: '⏱️ Slow Response Time Detected',
        description: `${recentLeads.length} leads created over 24 hours ago haven't been contacted. Fast response times (under 5 minutes) increase conversion by 391%.`,
        action: {
          label: 'Contact Now',
          href: '/dashboard/leads',
        },
      });
    }

    return insights;
  }, [data]);

  const metrics = useMemo(() => {
    if (!data) return null;

    const today = new Date().toDateString();

    return {
      newLeadsToday: data.leads.filter(l => {
        const leadDate = new Date(l.createdAt).toDateString();
        return today === leadDate;
      }).length,
      highPriorityLeads: data.leads.filter(l => l.leadScore >= 70 && l.status === 'new').length,
      activeCampaigns: data.campaigns.filter(c => c.status === 'active').length,
      providersNeedingAttention: data.providers.filter(p => {
        const unpaidCommission = (Number(p.totalRevenue) || 0) * (Number(p.commissionRate) || 0);
        return p.status === 'active' && (unpaidCommission > 0 || (p.rating && p.rating < 4.0));
      }).length,
    };
  }, [data]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading || !data || !metrics) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
          <div className="text-zinc-400">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">Dashboard</h1>
          <p className="text-sm text-zinc-400 mt-1">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <Button
          onClick={fetchDashboardData}
          variant="outline"
          className="border-zinc-700 hover:bg-zinc-800"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-100 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <QuickAction
            icon={<Plus className="h-5 w-5 text-white" />}
            label="Add Lead"
            href="/dashboard/leads"
            color="bg-emerald-600"
          />
          <QuickAction
            icon={<Send className="h-5 w-5 text-white" />}
            label="Create Campaign"
            href="/dashboard/campaigns"
            color="bg-sky-600"
          />
          <QuickAction
            icon={<Phone className="h-5 w-5 text-white" />}
            label="Contact High Priority"
            href="/dashboard/leads"
            color="bg-amber-600"
          />
          <QuickAction
            icon={<Building2 className="h-5 w-5 text-white" />}
            label="Add Provider"
            href="/dashboard/providers"
            color="bg-purple-600"
          />
        </div>
      </div>

      {/* Alerts Row */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-100 mb-3">Priority Alerts</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <AlertCard
            title="New Leads Today"
            count={metrics.newLeadsToday}
            href="/dashboard/leads"
            icon={<Users className="h-5 w-5" />}
            color="text-emerald-400"
          />
          <AlertCard
            title="High Priority Leads"
            count={metrics.highPriorityLeads}
            href="/dashboard/leads"
            icon={<Star className="h-5 w-5" />}
            color="text-amber-400"
          />
          <AlertCard
            title="Active Campaigns"
            count={metrics.activeCampaigns}
            href="/dashboard/campaigns"
            icon={<Mail className="h-5 w-5" />}
            color="text-sky-400"
          />
          <AlertCard
            title="Providers Need Attention"
            count={metrics.providersNeedingAttention}
            href="/dashboard/providers"
            icon={<AlertTriangle className="h-5 w-5" />}
            color="text-rose-400"
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insights - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-zinc-100">AI Insights & Recommendations</h2>
          </div>
          <div className="space-y-3">
            {aiInsights.map((insight, idx) => (
              <AIInsightCard key={idx} insight={insight} />
            ))}
          </div>
        </div>

        {/* Todo List - Takes 1 column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-zinc-100">Team To-Dos</h2>
            </div>
            <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-zinc-100">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {todos.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onToggle={() => {
                  setTodos(todos.map(t =>
                    t.id === todo.id ? { ...t, completed: !t.completed } : t
                  ));
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-400" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-zinc-400 mb-1">Total Leads</p>
              <p className="text-2xl font-bold text-zinc-100">{data.leads.length}</p>
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +8% this week
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-400 mb-1">Conversion Rate</p>
              <p className="text-2xl font-bold text-zinc-100">
                {((data.leads.filter(l => l.status === 'converted').length / data.leads.length) * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-zinc-500 mt-1">Last 30 days</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-zinc-100">
                {formatCurrency(data.providers.reduce((sum, p) => sum + (p.totalRevenue || 0), 0))}
              </p>
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +15% this month
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-400 mb-1">Active Providers</p>
              <p className="text-2xl font-bold text-zinc-100">
                {data.providers.filter(p => p.status === 'active').length}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Out of {data.providers.length} total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Activity Feed */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-400 animate-pulse" />
              Real-time Activity Feed
            </CardTitle>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border">
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ActivityFeed />
        </CardContent>
      </Card>
    </div>
  );
}