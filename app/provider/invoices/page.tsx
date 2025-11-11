'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Plus,
  DollarSign,
  Eye,
  Send,
  CheckCircle,
  Trash2,
  Filter,
  Download,
  AlertCircle,
  Clock,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  jobId?: string;
  jobReference?: string;
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
      const params = new URLSearchParams({
        providerId: id,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
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
  }, [searchQuery, statusFilter]);

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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout providerName={providerName}>
      <div className="min-h-screen bg-zinc-950">
        {/* Header */}
        <div className="border-b border-zinc-800 bg-zinc-900/30 backdrop-blur-sm">
          <div className="max-w-[1600px] mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-zinc-100">Invoices</h1>
                <p className="text-sm text-zinc-400 mt-1">Manage your billing and payments</p>
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-red-500/10 border-red-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-zinc-400">Outstanding</p>
                      <p className="text-2xl font-bold text-red-400">
                        {formatCurrency(stats.outstanding)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-emerald-500/10 border-emerald-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-zinc-400">Paid This Month</p>
                      <p className="text-2xl font-bold text-emerald-400">
                        {formatCurrency(stats.paidThisMonth)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-500/10 border-orange-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <Clock className="h-5 w-5 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-zinc-400">Overdue</p>
                      <p className="text-2xl font-bold text-orange-400">
                        {formatCurrency(stats.overdue)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer name or invoice number..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {(['all', 'paid', 'unpaid', 'overdue', 'draft'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors capitalize ${
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
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => (
                <Card
                  key={invoice.id}
                  className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/70 transition-colors"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      {/* Left Section */}
                      <div className="flex items-center gap-6 flex-1">
                        <div className="min-w-[120px]">
                          <p className="text-sm text-zinc-500 mb-1">Invoice</p>
                          <p className="font-semibold text-zinc-100">{invoice.invoiceNumber}</p>
                        </div>

                        <div className="flex-1">
                          <p className="text-sm text-zinc-500 mb-1">Customer</p>
                          <p className="font-medium text-zinc-100">{invoice.customer.firstName} {invoice.customer.lastName}</p>
                          {invoice.jobReference && (
                            <Link
                              href={`/provider/calendar`}
                              className="text-xs text-blue-400 hover:text-blue-300"
                            >
                              {invoice.jobReference}
                            </Link>
                          )}
                        </div>

                        <div className="min-w-[140px]">
                          <p className="text-sm text-zinc-500 mb-1">Amount</p>
                          <p className="text-lg font-bold text-emerald-400">
                            {formatCurrency(invoice.total)}
                          </p>
                          {invoice.amountPaid > 0 && invoice.status !== 'paid' && (
                            <p className="text-xs text-zinc-500">
                              Paid: {formatCurrency(invoice.amountPaid)}
                            </p>
                          )}
                        </div>

                        <div className="min-w-[100px]">
                          <p className="text-sm text-zinc-500 mb-1">Status</p>
                          <Badge className={`${getStatusColor(invoice.status)} border capitalize`}>
                            {invoice.status}
                          </Badge>
                        </div>

                        <div className="min-w-[120px]">
                          <p className="text-sm text-zinc-500 mb-1">
                            {invoice.status === 'paid' ? 'Paid' : 'Due'}
                          </p>
                          <div className="flex items-center gap-1 text-sm text-zinc-300">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(invoice.status === 'paid' && invoice.paidDate ? invoice.paidDate : invoice.dueDate)}</span>
                          </div>
                        </div>

                        <div className="min-w-[100px]">
                          <p className="text-sm text-zinc-500 mb-1">Issued</p>
                          <div className="flex items-center gap-1 text-sm text-zinc-300">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(invoice.invoiceDate)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-700 hover:bg-zinc-800"
                          onClick={() => router.push(`/provider/invoices/${invoice.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>

                        {invoice.status !== 'paid' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-500"
                              onClick={() => handleSendInvoice(invoice.id)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Send
                            </Button>

                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-500"
                              onClick={() => handleMarkPaid(invoice.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Mark Paid
                            </Button>
                          </>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-700 text-red-400 hover:bg-red-900/20"
                          onClick={() => handleDeleteInvoice(invoice.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
