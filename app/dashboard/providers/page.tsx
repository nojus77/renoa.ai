"use client"

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Search,
  Filter,
  Download,
  Plus,
  Mail,
  Phone,
  MapPin,
  Building2,
  DollarSign,
  Star,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Provider {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  serviceTypes: string[];
  serviceAreas: string[];
  yearsInBusiness: number;
  website: string | null;
  rating: number;
  totalRevenue: number;
  commissionRate: number;
  status: string;
  leadCapacity: number;
  currentLeadCount: number;
  totalLeadsSent: number;
  leadsAccepted: number;
  leadsConverted: number;
  averageJobValue: number;
  notes: string | null;
  createdAt: string;
}

const COLORS = {
  primary: '#10b981',
  secondary: '#06b6d4',
  tertiary: '#8b5cf6',
  warning: '#f59e0b',
  danger: '#ef4444',
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    paused: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    inactive: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  };

  return (
    <Badge className={`${colors[status] || colors.active} border capitalize`}>
      {status}
    </Badge>
  );
};

const MetricCard = ({
  title,
  value,
  subtitle,
  change,
  icon,
  trend
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
}) => {
  const isPositive = trend === 'up' || (change && change > 0);

  return (
    <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/70 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-zinc-100">{value}</div>
        {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
        {change !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{Math.abs(change)}% from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [newProviderOpen, setNewProviderOpen] = useState(false);
  const [editProviderOpen, setEditProviderOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiInsights, setAIInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const [filters, setFilters] = useState({
    serviceType: 'all',
    status: 'all',
    minRating: 0,
  });

  const [newProviderForm, setNewProviderForm] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    serviceTypes: [] as string[],
    address: '',
    city: '',
    state: 'IL',
    zip: '',
    website: '',
    commissionRate: '15',
    notes: '',
  });

  const [editProviderForm, setEditProviderForm] = useState({
    id: '',
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    serviceTypes: [] as string[],
    address: '',
    city: '',
    state: '',
    zip: '',
    website: '',
    commissionRate: '15',
    notes: '',
    status: 'active',
  });

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/providers?limit=1000");
      const data = await res.json();
      console.log('📦 Received providers data:', data);
      console.log('📊 Number of providers:', data.providers?.length);
      console.log('🔍 Providers array:', data.providers);

      if (data.providers && Array.isArray(data.providers)) {
        setProviders(data.providers);
        console.log('✅ Set providers state:', data.providers.length, 'providers');
      } else {
        console.error('❌ Invalid providers data structure:', data);
        toast.error('Failed to load providers');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const loadAIInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await fetch('/api/providers/insights');
      const data = await res.json();
      setAIInsights(data.insights);
    } catch (error) {
      toast.error('Failed to generate insights');
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleCreateProvider = async () => {
    if (!newProviderForm.businessName || !newProviderForm.contactName || !newProviderForm.email || !newProviderForm.phone || newProviderForm.serviceTypes.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProviderForm,
          commissionRate: parseFloat(newProviderForm.commissionRate) / 100,
          status: 'active',
        }),
      });

      if (!res.ok) throw new Error('Failed to create provider');

      toast.success('Provider created successfully!');
      setNewProviderOpen(false);
      setNewProviderForm({
        businessName: '',
        contactName: '',
        email: '',
        phone: '',
        serviceTypes: [],
        address: '',
        city: '',
        state: 'IL',
        zip: '',
        website: '',
        commissionRate: '15',
        notes: '',
      });
      fetchProviders();
    } catch (error) {
      toast.error('Failed to create provider');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProvider = async () => {
    if (!editProviderForm.businessName || !editProviderForm.contactName || !editProviderForm.email || !editProviderForm.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/providers/${editProviderForm.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editProviderForm,
          commissionRate: parseFloat(editProviderForm.commissionRate) / 100,
        }),
      });

      if (!res.ok) throw new Error('Failed to update provider');

      toast.success('Provider updated successfully!');
      setEditProviderOpen(false);
      setDetailOpen(false);
      fetchProviders();
    } catch (error) {
      toast.error('Failed to update provider');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleServiceType = (service: string) => {
    if (newProviderForm.serviceTypes.includes(service)) {
      setNewProviderForm({
        ...newProviderForm,
        serviceTypes: newProviderForm.serviceTypes.filter(s => s !== service)
      });
    } else {
      setNewProviderForm({
        ...newProviderForm,
        serviceTypes: [...newProviderForm.serviceTypes, service]
      });
    }
  };

  const toggleEditServiceType = (service: string) => {
    if (editProviderForm.serviceTypes.includes(service)) {
      setEditProviderForm({
        ...editProviderForm,
        serviceTypes: editProviderForm.serviceTypes.filter(s => s !== service)
      });
    } else {
      setEditProviderForm({
        ...editProviderForm,
        serviceTypes: [...editProviderForm.serviceTypes, service]
      });
    }
  };

  const calculateCommission = (provider: Provider) => {
    return (Number(provider.totalRevenue) || 0) * (Number(provider.commissionRate) || 0);
  };

  const filteredProviders = providers.filter(p => {
    const matchesSearch =
      p.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.serviceTypes.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesService = filters.serviceType === 'all' ||
      p.serviceTypes.some(s => s.toLowerCase() === filters.serviceType.toLowerCase());

    const matchesStatus = filters.status === 'all' || p.status === filters.status;
    const matchesRating = !p.rating || p.rating >= filters.minRating;

    return matchesSearch && matchesService && matchesStatus && matchesRating;
  });

  const totalRevenue = providers.reduce((sum, p) => sum + (Number(p.totalRevenue) || 0), 0);
  const totalUnpaid = providers.reduce((sum, p) => {
    const revenue = Number(p.totalRevenue) || 0;
    const rate = Number(p.commissionRate) || 0;
    return sum + (revenue * rate);
  }, 0);
  const activeProviders = providers.filter(p => p.status === 'active').length;
  const avgRating = providers.length > 0 ? providers.reduce((sum, p) => sum + (Number(p.rating) || 0), 0) / providers.length : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const revenueData = [
    { month: 'Jul', revenue: 45000 },
    { month: 'Aug', revenue: 52000 },
    { month: 'Sep', revenue: 49000 },
    { month: 'Oct', revenue: 61000 },
    { month: 'Nov', revenue: 58000 },
    { month: 'Dec', revenue: 67000 },
  ];

  const serviceDistribution = [
    { name: 'Landscaping', value: 35, color: COLORS.primary },
    { name: 'Roofing', value: 25, color: COLORS.secondary },
    { name: 'HVAC', value: 20, color: COLORS.tertiary },
    { name: 'Other', value: 20, color: COLORS.warning },
  ];

  const topProviders = [...providers]
    .sort((a, b) => (Number(b.totalRevenue) || 0) - (Number(a.totalRevenue) || 0))
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">Providers</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage your service provider network
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-zinc-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-500"
            onClick={() => setNewProviderOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Provider
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Active Providers"
          value={activeProviders}
          subtitle={`${providers.length} total`}
          change={8}
          trend="up"
          icon={<Building2 className="h-4 w-4 text-zinc-400" />}
        />
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          subtitle="All-time"
          change={15}
          trend="up"
          icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
        />
        <MetricCard
          title="Unpaid Commission"
          value={formatCurrency(totalUnpaid)}
          subtitle="Needs payment"
          icon={<AlertCircle className="h-4 w-4 text-amber-400" />}
        />
        <MetricCard
          title="Average Rating"
          value={avgRating.toFixed(1)}
          subtitle="Out of 5.0"
          icon={<Star className="h-4 w-4 text-amber-400" />}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-zinc-900/30 border border-zinc-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-zinc-100">All Providers ({filteredProviders.length})</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-zinc-700"
                      onClick={() => setFilters({ serviceType: 'all', status: 'all', minRating: 0 })}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                      placeholder="Search providers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-zinc-800 border-zinc-700 text-zinc-100"
                    />
                  </div>

                  <select
                    value={filters.serviceType}
                    onChange={(e) => setFilters({ ...filters, serviceType: e.target.value })}
                    className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">All Services</option>
                    <option value="landscaping">Landscaping</option>
                    <option value="roofing">Roofing</option>
                    <option value="hvac">HVAC</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="painting">Painting</option>
                  </select>

                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  <select
                    value={filters.minRating}
                    onChange={(e) => setFilters({ ...filters, minRating: Number(e.target.value) })}
                    className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="0">All Ratings</option>
                    <option value="4">4+ Stars</option>
                    <option value="4.5">4.5+ Stars</option>
                    <option value="5">5 Stars</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">Business</TableHead>
                    <TableHead className="text-zinc-400">Contact</TableHead>
                    <TableHead className="text-zinc-400">Services</TableHead>
                    <TableHead className="text-zinc-400">Location</TableHead>
                    <TableHead className="text-zinc-400">Rating</TableHead>
                    <TableHead className="text-zinc-400">Revenue</TableHead>
                    <TableHead className="text-zinc-400">Commission</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-zinc-400">
                        Loading providers...
                      </TableCell>
                    </TableRow>
                  ) : filteredProviders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-zinc-400">
                        No providers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProviders.map((provider) => (
                      <TableRow
                        key={provider.id}
                        className="border-zinc-800 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                        onClick={() => {
                          setSelectedProvider(provider);
                          setDetailOpen(true);
                        }}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium text-zinc-100 flex items-center gap-2">
                              {provider.businessName}
                              {provider.rating && provider.rating >= 4.5 && (
                                <Award className="h-4 w-4 text-amber-400" />
                              )}
                            </div>
                            <div className="text-xs text-zinc-400 mt-1">{provider.ownerName}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-zinc-300">
                            <Mail className="h-3 w-3" />
                            <span className="text-sm">{provider.email}</span>
                          </div>
                          <div className="flex items-center gap-1 text-zinc-400 mt-1">
                            <Phone className="h-3 w-3" />
                            <span className="text-xs">{provider.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {provider.serviceTypes.slice(0, 2).map((service, idx) => (
                              <Badge key={idx} variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs capitalize">
                                {service}
                              </Badge>
                            ))}
                            {provider.serviceTypes.length > 2 && (
                              <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs">
                                +{provider.serviceTypes.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-zinc-300">
                            <MapPin className="h-3 w-3" />
                            <span className="text-sm">
                              {(provider.serviceAreas || []).filter(Boolean).slice(0, 2).join(', ') || 'No location'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                            <span className="text-zinc-100 font-medium">
                              {(provider.rating || 0).toFixed(1)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-zinc-100 font-medium">{formatCurrency(Number(provider.totalRevenue) || 0)}</div>
                          <div className="text-xs text-zinc-500 mt-1">
                            {provider.leadsConverted || 0} conversions
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-amber-400 font-medium">
                            {formatCurrency(calculateCommission(provider))}
                          </div>
                          <div className="text-xs text-zinc-500 mt-1">
                            {((Number(provider.commissionRate) || 0) * 100).toFixed(0)}% rate
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={provider.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100">Outstanding Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">Provider</TableHead>
                    <TableHead className="text-zinc-400">Total Revenue</TableHead>
                    <TableHead className="text-zinc-400">Commission Rate</TableHead>
                    <TableHead className="text-zinc-400">Amount Due</TableHead>
                    <TableHead className="text-zinc-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.filter(p => calculateCommission(p) > 0).map((provider) => (
                    <TableRow key={provider.id} className="border-zinc-800">
                      <TableCell>
                        <div className="font-medium text-zinc-100">{provider.businessName}</div>
                        <div className="text-xs text-zinc-400 mt-1">{provider.ownerName}</div>
                      </TableCell>
                      <TableCell className="text-zinc-100">
                        {formatCurrency(Number(provider.totalRevenue) || 0)}
                      </TableCell>
                      <TableCell className="text-zinc-300">
                        {((Number(provider.commissionRate) || 0) * 100).toFixed(0)}%
                      </TableCell>
                      <TableCell className="text-amber-400 font-semibold">
                        {formatCurrency(calculateCommission(provider))}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-500"
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/providers/${provider.id}/pay`, {
                                method: 'POST',
                              });
                              if (!res.ok) throw new Error('Failed to mark as paid');
                              toast.success('Commission marked as paid!');
                              fetchProviders();
                            } catch (error) {
                              toast.error('Failed to mark commission as paid');
                            }
                          }}
                        >
                          Mark as Paid
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {providers.filter(p => calculateCommission(p) > 0).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-zinc-400">
                        No outstanding payments
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100 flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-400" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProviders.map((provider, idx) => {
                    const conversionRate = provider.totalLeadsSent > 0
                      ? (provider.leadsConverted / provider.totalLeadsSent) * 100
                      : 0;
                    
                    return (
                      <div key={provider.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 font-semibold">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-medium text-zinc-100">{provider.businessName}</div>
                            <div className="text-xs text-zinc-400">
                              {provider.leadsConverted || 0} conversions • {conversionRate.toFixed(1)}% rate
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-emerald-400">{formatCurrency(Number(provider.totalRevenue) || 0)}</div>
                          <div className="flex items-center gap-1 text-xs text-amber-400">
                            <Star className="h-3 w-3 fill-amber-400" />
                            {(provider.rating || 0).toFixed(1)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100">Conversion Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topProviders.map(p => {
                    const rate = p.totalLeadsSent > 0
                      ? ((p.leadsConverted / p.totalLeadsSent) * 100)
                      : 0;
                    return {
                      name: p.businessName.split(' ')[0],
                      rate: rate,
                    };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                    <YAxis stroke="#71717a" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="rate" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <svg className="h-5 w-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingInsights ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                  <span className="ml-3 text-zinc-400">Analyzing provider data...</span>
                </div>
              ) : aiInsights ? (
                <div className="prose prose-invert max-w-none">
                  <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {aiInsights}
                  </div>
                </div>
              ) : (
                <Button
                  onClick={loadAIInsights}
                  className="bg-purple-600 hover:bg-purple-500"
                >
                  Generate AI Insights
                </Button>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
                    <YAxis stroke="#71717a" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      dot={{ fill: COLORS.primary }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100">Service Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={serviceDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {serviceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="bg-zinc-950 text-zinc-100 border-l border-zinc-800 w-full sm:max-w-xl overflow-y-auto">
          {selectedProvider && (
            <>
              <SheetHeader>
                <SheetTitle className="text-zinc-100 text-2xl">{selectedProvider.businessName}</SheetTitle>
                <SheetDescription className="text-zinc-400">
                  Provider details and performance metrics
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="pt-4">
                      <div className="text-xs text-zinc-400 mb-1">Total Revenue</div>
                      <div className="text-2xl font-bold text-emerald-400">
                        {formatCurrency(Number(selectedProvider.totalRevenue) || 0)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="pt-4">
                      <div className="text-xs text-zinc-400 mb-1">Unpaid Commission</div>
                      <div className="text-2xl font-bold text-amber-400">
                        {formatCurrency(calculateCommission(selectedProvider))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm text-zinc-200">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Mail className="h-4 w-4 text-zinc-500" />
                      <a href={`mailto:${selectedProvider.email}`} className="hover:text-emerald-400">
                        {selectedProvider.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Phone className="h-4 w-4 text-zinc-500" />
                      <a href={`tel:${selectedProvider.phone}`} className="hover:text-emerald-400">
                        {selectedProvider.phone}
                      </a>
                    </div>
                    <div className="flex items-start gap-2 text-zinc-300">
                      <MapPin className="h-4 w-4 text-zinc-500 mt-0.5" />
                      <span>
                        {(selectedProvider.serviceAreas || []).filter(Boolean).join(', ') || 'No service areas'}
                      </span>
                    </div>
                    {selectedProvider.website && (
  <div className="flex items-center gap-2 text-zinc-300">
    <ExternalLink className="h-4 w-4 text-zinc-500" />
    <a href={selectedProvider.website} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400">
      {selectedProvider.website}
    </a>
  </div>
)}
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm text-zinc-200">Services Offered</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedProvider.serviceTypes.map((service, idx) => (
                        <Badge key={idx} className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 capitalize">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm text-zinc-200">Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Leads Sent</span>
                      <span className="text-zinc-100 font-semibold">{selectedProvider.totalLeadsSent || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Leads Converted</span>
                      <span className="text-zinc-100 font-semibold">{selectedProvider.leadsConverted || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Conversion Rate</span>
                      <span className="text-zinc-100 font-semibold">
                        {selectedProvider.totalLeadsSent > 0
                          ? `${((selectedProvider.leadsConverted / selectedProvider.totalLeadsSent) * 100).toFixed(1)}%`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                        <span className="text-zinc-100 font-semibold">
                          {(selectedProvider.rating || 0).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Member Since</span>
                      <span className="text-zinc-200">{formatDate(selectedProvider.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>

                {selectedProvider.notes && (
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-sm text-zinc-200">Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-zinc-300 text-sm">{selectedProvider.notes}</p>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2">
                  {calculateCommission(selectedProvider) > 0 && (
  <Button 
    className="flex-1 bg-emerald-600 hover:bg-emerald-500"
    onClick={async () => {
      try {
        const res = await fetch(`/api/providers/${selectedProvider.id}/pay`, {
          method: 'POST',
        });
        
        if (!res.ok) throw new Error('Failed to mark as paid');
        
        toast.success('Commission marked as paid!');
        setDetailOpen(false);
        fetchProviders();
      } catch (error) {
        toast.error('Failed to mark commission as paid');
      }
    }}
  >
    Pay Commission ({formatCurrency(calculateCommission(selectedProvider))})
  </Button>
)}
                  <Button
                    variant="outline"
                    className="border-zinc-700"
                    onClick={() => {
                      setEditProviderForm({
                        id: selectedProvider.id,
                        businessName: selectedProvider.businessName,
                        contactName: selectedProvider.ownerName,
                        email: selectedProvider.email,
                        phone: selectedProvider.phone,
                        serviceTypes: selectedProvider.serviceTypes,
                        address: '',
                        city: selectedProvider.serviceAreas[0] || '',
                        state: '',
                        zip: '',
                        website: selectedProvider.website || '',
                        commissionRate: ((Number(selectedProvider.commissionRate) || 0) * 100).toString(),
                        notes: selectedProvider.notes || '',
                        status: selectedProvider.status,
                      });
                      setEditProviderOpen(true);
                    }}
                  >
                    Edit Provider
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={newProviderOpen} onOpenChange={setNewProviderOpen}>
        <DialogContent className="bg-zinc-950 text-zinc-100 border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Provider</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Add a new service provider to your network
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-zinc-200">Business Name *</Label>
                <Input
                  id="businessName"
                  value={newProviderForm.businessName}
                  onChange={(e) => setNewProviderForm({ ...newProviderForm, businessName: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                  placeholder="ABC Landscaping LLC"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactName" className="text-zinc-200">Contact Name *</Label>
                <Input
                  id="contactName"
                  value={newProviderForm.contactName}
                  onChange={(e) => setNewProviderForm({ ...newProviderForm, contactName: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                  placeholder="John Smith"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-200">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newProviderForm.email}
                  onChange={(e) => setNewProviderForm({ ...newProviderForm, email: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                  placeholder="contact@abclandscaping.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-zinc-200">Phone *</Label>
                <Input
                  id="phone"
                  value={newProviderForm.phone}
                  onChange={(e) => setNewProviderForm({ ...newProviderForm, phone: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                  placeholder="(312) 555-0100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-200">Service Types *</Label>
              <div className="grid grid-cols-3 gap-2">
                {['landscaping', 'roofing', 'hvac', 'plumbing', 'electrical', 'painting'].map((service) => (
                  <Button
                    key={service}
                    type="button"
                    size="sm"
                    variant={newProviderForm.serviceTypes.includes(service) ? "default" : "outline"}
                    className={newProviderForm.serviceTypes.includes(service) ? "bg-emerald-600" : "border-zinc-700"}
                    onClick={() => toggleServiceType(service)}
                  >
                    {service.charAt(0).toUpperCase() + service.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-zinc-200">Address</Label>
              <Input
                id="address"
                value={newProviderForm.address}
                onChange={(e) => setNewProviderForm({ ...newProviderForm, address: e.target.value })}
                className="bg-zinc-900 border-zinc-800"
                placeholder="123 Business Ave"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-zinc-200">City</Label>
                <Input
                  id="city"
                  value={newProviderForm.city}
                  onChange={(e) => setNewProviderForm({ ...newProviderForm, city: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                  placeholder="Chicago"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state" className="text-zinc-200">State</Label>
                <Input
                  id="state"
                  value={newProviderForm.state}
                  onChange={(e) => setNewProviderForm({ ...newProviderForm, state: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                  placeholder="IL"
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip" className="text-zinc-200">ZIP</Label>
                <Input
                  id="zip"
                  value={newProviderForm.zip}
                  onChange={(e) => setNewProviderForm({ ...newProviderForm, zip: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                  placeholder="60614"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website" className="text-zinc-200">Website</Label>
                <Input
                  id="website"
                  value={newProviderForm.website}
                  onChange={(e) => setNewProviderForm({ ...newProviderForm, website: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                  placeholder="https://abclandscaping.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissionRate" className="text-zinc-200">Commission Rate (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  value={newProviderForm.commissionRate}
                  onChange={(e) => setNewProviderForm({ ...newProviderForm, commissionRate: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                  placeholder="15"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-zinc-200">Notes</Label>
              <Textarea
                id="notes"
                value={newProviderForm.notes}
                onChange={(e) => setNewProviderForm({ ...newProviderForm, notes: e.target.value })}
                className="bg-zinc-900 border-zinc-800 min-h-[100px]"
                placeholder="Additional information about the provider..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setNewProviderOpen(false)}
              className="border-zinc-700"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProvider}
              className="bg-emerald-600 hover:bg-emerald-500"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Provider'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editProviderOpen} onOpenChange={setEditProviderOpen}>
        <DialogContent className="bg-zinc-950 text-zinc-100 border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Provider</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Update provider information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editBusinessName" className="text-zinc-200">Business Name *</Label>
                <Input
                  id="editBusinessName"
                  value={editProviderForm.businessName}
                  onChange={(e) => setEditProviderForm({ ...editProviderForm, businessName: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editContactName" className="text-zinc-200">Contact Name *</Label>
                <Input
                  id="editContactName"
                  value={editProviderForm.contactName}
                  onChange={(e) => setEditProviderForm({ ...editProviderForm, contactName: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editEmail" className="text-zinc-200">Email *</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editProviderForm.email}
                  onChange={(e) => setEditProviderForm({ ...editProviderForm, email: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editPhone" className="text-zinc-200">Phone *</Label>
                <Input
                  id="editPhone"
                  value={editProviderForm.phone}
                  onChange={(e) => setEditProviderForm({ ...editProviderForm, phone: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-200">Service Types *</Label>
              <div className="grid grid-cols-3 gap-2">
                {['landscaping', 'roofing', 'hvac', 'plumbing', 'electrical', 'painting'].map((service) => (
                  <Button
                    key={service}
                    type="button"
                    size="sm"
                    variant={editProviderForm.serviceTypes.includes(service) ? "default" : "outline"}
                    className={editProviderForm.serviceTypes.includes(service) ? "bg-emerald-600" : "border-zinc-700"}
                    onClick={() => toggleEditServiceType(service)}
                  >
                    {service.charAt(0).toUpperCase() + service.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editAddress" className="text-zinc-200">Address</Label>
              <Input
                id="editAddress"
                value={editProviderForm.address}
                onChange={(e) => setEditProviderForm({ ...editProviderForm, address: e.target.value })}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editCity" className="text-zinc-200">City</Label>
                <Input
                  id="editCity"
                  value={editProviderForm.city}
                  onChange={(e) => setEditProviderForm({ ...editProviderForm, city: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editState" className="text-zinc-200">State</Label>
                <Input
                  id="editState"
                  value={editProviderForm.state}
                  onChange={(e) => setEditProviderForm({ ...editProviderForm, state: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editZip" className="text-zinc-200">ZIP</Label>
                <Input
                  id="editZip"
                  value={editProviderForm.zip}
                  onChange={(e) => setEditProviderForm({ ...editProviderForm, zip: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editWebsite" className="text-zinc-200">Website</Label>
                <Input
                  id="editWebsite"
                  value={editProviderForm.website}
                  onChange={(e) => setEditProviderForm({ ...editProviderForm, website: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editCommissionRate" className="text-zinc-200">Commission Rate (%)</Label>
                <Input
                  id="editCommissionRate"
                  type="number"
                  value={editProviderForm.commissionRate}
                  onChange={(e) => setEditProviderForm({ ...editProviderForm, commissionRate: e.target.value })}
                  className="bg-zinc-900 border-zinc-800"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editStatus" className="text-zinc-200">Status</Label>
              <select
                id="editStatus"
                value={editProviderForm.status}
                onChange={(e) => setEditProviderForm({ ...editProviderForm, status: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editNotes" className="text-zinc-200">Notes</Label>
              <Textarea
                id="editNotes"
                value={editProviderForm.notes}
                onChange={(e) => setEditProviderForm({ ...editProviderForm, notes: e.target.value })}
                className="bg-zinc-900 border-zinc-800 min-h-[100px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEditProviderOpen(false)}
              className="border-zinc-700"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditProvider}
              className="bg-emerald-600 hover:bg-emerald-500"
              disabled={submitting}
            >
              {submitting ? 'Updating...' : 'Update Provider'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}