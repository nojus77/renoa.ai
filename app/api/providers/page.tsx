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
  contactName: string;
  email: string;
  phone: string;
  serviceTypes: string[];
  address: string;
  city: string;
  state: string;
  zip: string;
  website: string | null;
  rating: number | null;
  totalRevenue: number;
  commissionRate: number;
  unpaidCommission: number;
  status: string;
  leadsReceived: number;
  leadsConverted: number;
  responseTime: number | null;
  conversionRate: number | null;
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
  const [submitting, setSubmitting] = useState(false);
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

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/providers");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProviders(data);
      }
    } catch (err) {
      toast.error('Failed to fetch providers');
    } finally {
      setLoading(false);
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

  const filteredProviders = providers.filter(p =>
    p.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.serviceTypes.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalRevenue = providers.reduce((sum, p) => sum + p.totalRevenue, 0);
  const totalUnpaid = providers.reduce((sum, p) => sum + p.unpaidCommission, 0);
  const activeProviders = providers.filter(p => p.status === 'active').length;
  const avgRating = providers.length > 0 ? providers.reduce((sum, p) => sum + (p.rating || 0), 0) / providers.length : 0;

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

  // Mock data for charts
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
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  const ProviderRow = ({ provider }: { provider: Provider }) => (
    <TableRow
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
          <div className="text-xs text-zinc-400 mt-1">{provider.contactName}</div>
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
          <span className="text-sm">{provider.city}, {provider.state}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
          <span className="text-zinc-100 font-medium">
            {provider.rating?.toFixed(1) || 'N/A'}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-zinc-100 font-medium">{formatCurrency(provider.totalRevenue)}</div>
        <div className="text-xs text-zinc-500 mt-1">
          {provider.leadsConverted} conversions
        </div>
      </TableCell>
      <TableCell>
        <div className="text-amber-400 font-medium">
          {formatCurrency(provider.unpaidCommission)}
        </div>
        <div className="text-xs text-zinc-500 mt-1">
          {(provider.commissionRate * 100).toFixed(0)}% rate
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={provider.status} />
      </TableCell>
    </TableRow>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
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

      {/* Metrics */}
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

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-zinc-900/30 border border-zinc-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-zinc-100">All Providers ({filteredProviders.length})</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input
                    placeholder="Search providers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
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
                      <ProviderRow key={provider.id} provider={provider} />
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
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
                  {providers.filter(p => p.unpaidCommission > 0).map((provider) => (
                    <TableRow key={provider.id} className="border-zinc-800">
                      <TableCell>
                        <div className="font-medium text-zinc-100">{provider.businessName}</div>
                        <div className="text-xs text-zinc-400 mt-1">{provider.contactName}</div>
                      </TableCell>
                      <TableCell className="text-zinc-100">
                        {formatCurrency(provider.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-zinc-300">
                        {(provider.commissionRate * 100).toFixed(0)}%
                      </TableCell>
                      <TableCell className="text-amber-400 font-semibold">
                        {formatCurrency(provider.unpaidCommission)}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500">
                          Mark as Paid
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {providers.filter(p => p.unpaidCommission > 0).length === 0 && (
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

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100">Top Performing Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">Rank</TableHead>
                    <TableHead className="text-zinc-400">Provider</TableHead>
                    <TableHead className="text-zinc-400">Revenue</TableHead>
                    <TableHead className="text-zinc-400">Leads</TableHead>
                    <TableHead className="text-zinc-400">Conversion</TableHead>
                    <TableHead className="text-zinc-400">Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProviders.map((provider, idx) => (
                    <TableRow key={provider.id} className="border-zinc-800">
                      <TableCell>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800">
                          <span className="font-semibold text-zinc-100">#{idx + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-zinc-100 flex items-center gap-2">
                          {provider.businessName}
                          {idx === 0 && <Award className="h-4 w-4 text-amber-400" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-emerald-400 font-semibold">
                        {formatCurrency(provider.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-zinc-100">
                        {provider.leadsReceived} received
                      </TableCell>
                      <TableCell>
                        <div className="text-zinc-100 font-medium">
                          {provider.conversionRate ? `${(provider.conversionRate * 100).toFixed(1)}%` : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                          <span className="text-zinc-100 font-medium">
                            {provider.rating?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
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

            {/* Service Distribution */}
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

      {/* Provider Detail Slideout */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-zinc-950 text-zinc-200 border-l border-zinc-800 overflow-y-auto">
          {selectedProvider && (
            <>
              <SheetHeader className="sticky top-0 bg-zinc-950/95 backdrop-blur-sm z-10 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <SheetTitle className="text-2xl font-bold text-zinc-100">
                      {selectedProvider.businessName}
                    </SheetTitle>
                    <SheetDescription className="text-zinc-400 mt-1">
                      {selectedProvider.contactName} • {selectedProvider.serviceTypes.join(', ')}
                    </SheetDescription>
                  </div>
                  <StatusBadge status={selectedProvider.status} />
                </div>

                <div className="flex gap-2 mt-4">
                  <a href={`mailto:${selectedProvider.email}`}>
                    <Button size="sm" variant="outline" className="border-zinc-700">
                      <Mail className="h-4 w-4 mr-2" />Email
                    </Button>
                  </a>
                  <a href={`tel:${selectedProvider.phone}`}>
                    <Button size="sm" variant="outline" className="border-zinc-700">
                      <Phone className="h-4 w-4 mr-2" />Call
                    </Button>
                  </a>
                  {selectedProvider.website && (
                    <a href={selectedProvider.website} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="border-zinc-700">
                        <ExternalLink className="h-4 w-4 mr-2" />Website
                      </Button>
                    </a>
                  )}
                </div>
              </SheetHeader>

              <div className="space-y-6 py-6">
                {/* Contact Info */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm text-zinc-200">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-zinc-500 mt-0.5" />
                      <div>
                        <p className="text-zinc-400">Email</p>
                        <p className="text-zinc-200">{selectedProvider.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-zinc-500 mt-0.5" />
                      <div>
                        <p className="text-zinc-400">Phone</p>
                        <p className="text-zinc-200">{selectedProvider.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-zinc-500 mt-0.5" />
                      <div>
                        <p className="text-zinc-400">Location</p>
                        <p className="text-zinc-200">
                          {selectedProvider.address && `${selectedProvider.address}, `}
                          {selectedProvider.city}, {selectedProvider.state} {selectedProvider.zip}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm text-zinc-200">Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Total Revenue</span>
                      <span className="text-emerald-400 font-semibold text-lg">
                        {formatCurrency(selectedProvider.totalRevenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Unpaid Commission</span>
                      <span className="text-amber-400 font-semibold">
                        {formatCurrency(selectedProvider.unpaidCommission)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Commission Rate</span>
                      <span className="text-zinc-200">
                        {(selectedProvider.commissionRate * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Leads Received</span>
                      <span className="text-zinc-200">{selectedProvider.leadsReceived}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Leads Converted</span>
                      <span className="text-zinc-200">{selectedProvider.leadsConverted}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Conversion Rate</span>
                      <span className="text-zinc-100 font-semibold">
                        {selectedProvider.conversionRate
                          ? `${(selectedProvider.conversionRate * 100).toFixed(1)}%`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                        <span className="text-zinc-100 font-semibold">
                          {selectedProvider.rating?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Member Since</span>
                      <span className="text-zinc-200">{formatDate(selectedProvider.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
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

                {/* Actions */}
                <div className="flex gap-2">
                  {selectedProvider.unpaidCommission > 0 && (
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-500">
                      Pay Commission ({formatCurrency(selectedProvider.unpaidCommission)})
                    </Button>
                  )}
                  <Button variant="outline" className="border-zinc-700">
                    Edit Provider
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* New Provider Dialog */}
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
    </div>
  );
}