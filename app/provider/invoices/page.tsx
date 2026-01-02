'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Search,
  Plus,
  DollarSign,
  Eye,
  Send,
  CheckCircle,
  Trash2,
  AlertCircle,
  Clock,
  TrendingUp,
  MoreVertical,
  Calendar,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { PageLoadingSkeleton } from '@/components/ui/loading-skeleton';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  } | null;
  jobId?: string;
  jobs?: {
    id: string;
    serviceType: string;
    address: string;
    customer?: {
      id: string;
      name: string;
    };
  } | null;
  total: number;
  amountPaid: number;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  invoiceDate: string;
  dueDate: string;
  paidDate?: string;
  lineItems: LineItem[];
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Stats {
  outstanding: number;
  paidThisMonth: number;
  overdue: number;
}

export default function ProviderInvoices() {
  const router = useRouter();
  const [providerName, setProviderName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [loading, setLoading] = useState(true);

  // Invoices state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<Stats>({ outstanding: 0, paidThisMonth: 0, overdue: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue' | 'draft'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'thisMonth' | 'lastMonth' | 'custom'>('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');

    if (!id || !name) {
      router.push('/provider/login');
      return;
    }

    setProviderId(id);
    setProviderName(name);
    fetchInvoices(id);
  }, [router]);

  const fetchInvoices = async (id: string) => {
    try {
      // Calculate date range based on filter
      let dateFrom = '';
      let dateTo = '';

      if (dateFilter === 'thisMonth') {
        const now = new Date();
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      } else if (dateFilter === 'lastMonth') {
        const now = new Date();
        dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        dateTo = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      } else if (dateFilter === 'custom') {
        dateFrom = customDateFrom;
        dateTo = customDateTo;
      }

      const params = new URLSearchParams({
        providerId: id,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });

      const res = await fetch(`/api/provider/invoices?${params}`);
      const data = await res.json();

      if (data.invoices && data.stats) {
        setInvoices(data.invoices);
        setFilteredInvoices(data.invoices);
        setStats(data.stats);
      }
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    if (providerId) {
      fetchInvoices(providerId);
    }
  }, [searchQuery, statusFilter, dateFilter, customDateFrom, customDateTo]);

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/provider/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: true }),
      });

      if (!res.ok) throw new Error('Failed to send invoice');

      toast.success('Invoice sent to customer!');
      fetchInvoices(providerId);
    } catch (error) {
      toast.error('Failed to send invoice');
    }
  };

  const handleMarkPaid = async (invoiceId: string) => {
    try {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) return;

      const remainingAmount = invoice.total - invoice.amountPaid;

      const res = await fetch(`/api/provider/invoices/${invoiceId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: remainingAmount,
          paymentDate: new Date().toISOString(),
          paymentMethod: 'other',
          notes: 'Marked as paid manually',
        }),
      });

      if (!res.ok) throw new Error('Failed to mark as paid');

      toast.success('Invoice marked as paid!');
      fetchInvoices(providerId);
    } catch (error) {
      toast.error('Failed to mark invoice as paid');
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const res = await fetch(`/api/provider/invoices/${invoiceId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete invoice');
      }

      toast.success('Invoice deleted');
      fetchInvoices(providerId);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete invoice');
    }
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
      paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      partial: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      sent: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      viewed: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      overdue: 'bg-red-500/20 text-red-400 border-red-500/30',
      draft: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
      cancelled: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    };
    return colors[status] || colors.draft;
  };

  if (loading) {
    return (
      <ProviderLayout providerName={providerName}>
        <PageLoadingSkeleton statsCount={3} tableRows={8} />
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout providerName={providerName}>
      <div className="min-h-screen bg-zinc-950">
        {/* Header */}
        <div className="border-b border-zinc-800 bg-zinc-900/30 backdrop-blur-sm">
          <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-3 md:py-6">
            <div className="flex items-center justify-between mb-3 md:mb-6">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-zinc-100">Invoices</h1>
                <p className="text-xs md:text-sm text-zinc-400 mt-0.5 md:mt-1">Manage your billing and payments</p>
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm h-9 md:h-10"
              >
                <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                <span className="hidden sm:inline">Create Invoice</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </div>

            {/* Stats Cards - Inline on mobile */}
            <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-4">
              <Card className="bg-red-500/10 border-red-500/30 relative group">
                <CardContent className="pt-3 md:pt-6 pb-3 md:pb-6">
                  <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-red-500/20 rounded-lg">
                      <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-400" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <p className="text-xs md:text-sm text-zinc-400 hidden md:block">Outstanding</p>
                      <p className="text-xs md:text-sm text-zinc-400 md:hidden">Due</p>
                      <p className="text-base md:text-2xl font-bold text-red-400">
                        {formatCurrency(stats.outstanding)}
                      </p>
                    </div>
                    <div className="absolute top-3 right-3 hidden md:block">
                      <Info className="h-3 w-3 text-red-600/50 cursor-help" />
                      <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        Total amount waiting to be paid
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-emerald-500/10 border-emerald-500/30 relative group">
                <CardContent className="pt-3 md:pt-6 pb-3 md:pb-6">
                  <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-emerald-500/20 rounded-lg">
                      <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <p className="text-xs md:text-sm text-zinc-400 hidden md:block">Paid This Month</p>
                      <p className="text-xs md:text-sm text-zinc-400 md:hidden">Paid</p>
                      <p className="text-base md:text-2xl font-bold text-emerald-400">
                        {formatCurrency(stats.paidThisMonth)}
                      </p>
                    </div>
                    <div className="absolute top-3 right-3 hidden md:block">
                      <Info className="h-3 w-3 text-emerald-600/50 cursor-help" />
                      <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        Payments received this month
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-500/10 border-orange-500/30 relative group">
                <CardContent className="pt-3 md:pt-6 pb-3 md:pb-6">
                  <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-orange-500/20 rounded-lg">
                      <Clock className="h-4 w-4 md:h-5 md:w-5 text-orange-400" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <p className="text-xs md:text-sm text-zinc-400">Overdue</p>
                      <p className="text-base md:text-2xl font-bold text-orange-400">
                        {formatCurrency(stats.overdue)}
                      </p>
                    </div>
                    <div className="absolute top-3 right-3 hidden md:block">
                      <Info className="h-3 w-3 text-orange-600/50 cursor-help" />
                      <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        Invoices past their due date
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-4 md:py-8">
          {/* Search and Filters */}
          <div className="flex flex-col gap-3 mb-4 md:mb-6">
            {/* Row 1: Search + Status Filters */}
            <div className="flex flex-col md:flex-row gap-2 md:gap-3">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search invoices..."
                  className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs md:text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Status Filter - Horizontal scroll on mobile */}
              <div className="flex gap-1.5 md:gap-2 overflow-x-auto pb-2 md:pb-0 -mx-3 px-3 md:mx-0 md:px-0">
                {(['all', 'paid', 'unpaid', 'overdue', 'draft'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium rounded-lg transition-colors capitalize flex-shrink-0 min-h-[44px] md:min-h-0 ${
                      statusFilter === status
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: Date Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-500 hidden md:block" />
              <div className="flex gap-1.5 md:gap-2 overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
                {([
                  { value: 'all', label: 'All Time' },
                  { value: 'thisMonth', label: 'This Month' },
                  { value: 'lastMonth', label: 'Last Month' },
                  { value: 'custom', label: 'Custom' },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDateFilter(option.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex-shrink-0 ${
                      dateFilter === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Range Inputs */}
              {dateFilter === 'custom' && (
                <div className="flex items-center gap-2 ml-2">
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-zinc-500 text-xs">to</span>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Invoices List */}
          {filteredInvoices.length === 0 ? (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="py-12">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-400 font-medium mb-2">
                    {searchQuery || statusFilter !== 'all'
                      ? 'No invoices match your filters'
                      : 'No invoices yet'}
                  </p>
                  <p className="text-sm text-zinc-500 mb-4">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Create your first invoice to get started'}
                  </p>
                  {!searchQuery && statusFilter === 'all' && (
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-emerald-600 hover:bg-emerald-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Invoice
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
              {/* Table Header - hidden on mobile */}
              <div className="hidden md:grid md:grid-cols-[1fr_100px_100px_100px_100px_40px] gap-2 p-3 bg-zinc-800/50 text-xs text-zinc-400 font-medium border-b border-zinc-800">
                <div>Customer / Invoice</div>
                <div className="text-right">Amount</div>
                <div>Status</div>
                <div>Paid</div>
                <div>Issued</div>
                <div></div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-zinc-800">
                {filteredInvoices.map((invoice) => (
                  <InvoiceRow
                    key={invoice.id}
                    invoice={invoice}
                    onView={() => router.push(`/provider/invoices/${invoice.id}`)}
                    onSend={() => handleSendInvoice(invoice.id)}
                    onMarkPaid={() => handleMarkPaid(invoice.id)}
                    onDelete={() => handleDeleteInvoice(invoice.id)}
                    formatCurrency={formatCurrency}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Invoice Modal - Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-zinc-900 border-zinc-800 max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-zinc-100">Create Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400 mb-4">
                Create invoice functionality will open in a new page
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowCreateModal(false)}
                  variant="outline"
                  className="flex-1 border-zinc-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowCreateModal(false);
                    router.push('/provider/invoices/create');
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </ProviderLayout>
  );
}

// Compact Invoice Row Component
function InvoiceRow({
  invoice,
  onView,
  onSend,
  onMarkPaid,
  onDelete,
  formatCurrency,
  getStatusColor,
}: {
  invoice: Invoice;
  onView: () => void;
  onSend: () => void;
  onMarkPaid: () => void;
  onDelete: () => void;
  formatCurrency: (amount: number) => string;
  getStatusColor: (status: string) => string;
}) {
  const [showActions, setShowActions] = useState(false);

  // Get customer name from either direct customer or job's customer
  const customerName = invoice.customer?.name
    || invoice.jobs?.customer?.name
    || 'Walk-in Customer';

  // Get service type from job if available
  const serviceType = invoice.jobs?.serviceType || null;

  const formatShortDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      onClick={onView}
      className="p-3 hover:bg-zinc-800/50 cursor-pointer transition-colors md:grid md:grid-cols-[1fr_100px_100px_100px_100px_40px] gap-2 items-center"
    >
      {/* Customer & Invoice - combined */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {customerName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-100 truncate">{customerName}</p>
          <p className="text-xs text-zinc-500 truncate">
            {invoice.invoiceNumber}
            {serviceType && <span className="text-zinc-600"> · {serviceType}</span>}
          </p>
        </div>
      </div>

      {/* Amount */}
      <div className="hidden md:block text-right">
        <span className="text-sm font-semibold text-emerald-400">
          {formatCurrency(invoice.total)}
        </span>
        {invoice.amountPaid > 0 && invoice.status !== 'paid' && (
          <p className="text-xs text-zinc-500">Paid: {formatCurrency(invoice.amountPaid)}</p>
        )}
      </div>

      {/* Status */}
      <div className="hidden md:block">
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border ${getStatusColor(invoice.status)}`}>
          <span className="font-medium capitalize">{invoice.status}</span>
        </div>
      </div>

      {/* Paid/Due Date */}
      <div className="hidden md:block">
        <p className="text-sm text-zinc-200">
          {invoice.status === 'paid' && invoice.paidDate
            ? formatShortDate(invoice.paidDate)
            : formatShortDate(invoice.dueDate)}
        </p>
        <p className="text-xs text-zinc-500">
          {invoice.status === 'paid' ? 'Paid' : 'Due'}
        </p>
      </div>

      {/* Issued Date */}
      <div className="hidden md:block">
        <p className="text-sm text-zinc-200">{formatShortDate(invoice.invoiceDate)}</p>
      </div>

      {/* Mobile: Show status & amount inline */}
      <div className="flex items-center justify-between mt-2 md:hidden">
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border ${getStatusColor(invoice.status)}`}>
          <span className="font-medium capitalize">{invoice.status}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400">{formatShortDate(invoice.invoiceDate)}</span>
          <span className="text-sm font-semibold text-emerald-400">
            {formatCurrency(invoice.total)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="relative hidden md:block" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setShowActions(!showActions)}
          className="p-1.5 hover:bg-zinc-700 rounded-lg transition-colors"
        >
          <MoreVertical className="h-4 w-4 text-zinc-400" />
        </button>

        {showActions && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowActions(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-40 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1 z-20">
              <button
                onClick={() => {
                  setShowActions(false);
                  onView();
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 w-full text-left"
              >
                <Eye className="h-3.5 w-3.5" />
                View Details
              </button>
              {invoice.status !== 'paid' && (
                <>
                  <button
                    onClick={() => {
                      setShowActions(false);
                      onSend();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:bg-zinc-800 w-full text-left"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send Invoice
                  </button>
                  <button
                    onClick={() => {
                      setShowActions(false);
                      onMarkPaid();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-400 hover:bg-zinc-800 w-full text-left"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Mark Paid
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setShowActions(false);
                  onDelete();
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-800 w-full text-left"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
