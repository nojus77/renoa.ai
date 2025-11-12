'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { FileText, DollarSign, Calendar, Loader2, AlertCircle, Eye, CreditCard, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  invoiceDate: string;
  dueDate: string;
  total: number;
  amountPaid: number;
  provider: {
    businessName: string;
  };
}

export default function CustomerInvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer/invoices');

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/customer-portal/login');
          return;
        }
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      setInvoices(data.invoices);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast.error(error.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'sent':
      case 'viewed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'overdue':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'draft':
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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

  if (invoices.length === 0) {
    return (
      <CustomerLayout>
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-zinc-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">No Invoices Yet</h2>
          <p className="text-zinc-600">Your invoices will appear here once services are completed</p>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Invoices</h1>
        <p className="text-zinc-600">View and pay your service invoices</p>
      </div>

      <div className="grid gap-4">
        {invoices.map((invoice) => {
          const balance = invoice.total - invoice.amountPaid;
          const isPaid = invoice.status === 'paid';
          const isOverdue = invoice.status === 'overdue';

          return (
            <div
              key={invoice.id}
              className="bg-white rounded-xl border border-zinc-200 p-6 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => router.push(`/customer-portal/invoices/${invoice.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-zinc-900">
                      Invoice #{invoice.invoiceNumber}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </div>
                  <p className="text-zinc-600">{invoice.provider.businessName}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-zinc-900">
                    {formatCurrency(invoice.total)}
                  </p>
                  {!isPaid && balance > 0 && (
                    <p className="text-sm text-zinc-600">
                      Balance: {formatCurrency(balance)}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-zinc-600">
                  <Calendar className="h-4 w-4" />
                  <div>
                    <p className="text-xs text-zinc-500">Invoice Date</p>
                    <p className="text-sm font-medium">{formatDate(invoice.invoiceDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-zinc-600">
                  <Clock className="h-4 w-4" />
                  <div>
                    <p className="text-xs text-zinc-500">Due Date</p>
                    <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                      {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/customer-portal/invoices/${invoice.id}`);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  <span className="text-sm font-medium">View Details</span>
                </button>
                {!isPaid && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/customer-portal/invoices/${invoice.id}?pay=true`);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span className="text-sm font-medium">Pay Now</span>
                  </button>
                )}
                {isPaid && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Paid in Full</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </CustomerLayout>
  );
}
