'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import CustomerLayout from '@/components/customer/CustomerLayout';
import QuickReviewModal from '@/components/customer/QuickReviewModal';
import BookAgainModal from '@/components/customer/BookAgainModal';
import PaymentModal from '@/components/customer/PaymentModal';
import { ArrowLeft, Download, Mail, Phone, MapPin, Calendar, CreditCard, Loader2, AlertCircle, CheckCircle, DollarSign, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number | null;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  notes: string | null;
  terms: string | null;
  paymentInstructions: string | null;
  provider: {
    id: string;
    businessName: string;
    ownerName: string;
    email: string;
    phone: string;
  };
  customer: {
    name: string;
    email: string | null;
    phone: string;
    address: string;
  };
  lineItems: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
  }>;
  jobs: Array<{
    id: string;
    serviceType: string;
    status: string;
  }>;
}

export default function CustomerInvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const invoiceId = params.id as string;
  const shouldOpenPayment = searchParams?.get('pay') === 'true';

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showBookAgainModal, setShowBookAgainModal] = useState(false);

  const fetchInvoiceDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customer/invoices/${invoiceId}`);

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/customer-portal/login');
          return;
        }
        throw new Error('Failed to fetch invoice details');
      }

      const data = await response.json();
      setInvoice(data.invoice);
    } catch (error: any) {
      console.error('Error fetching invoice:', error);
      toast.error(error.message || 'Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  }, [invoiceId, router]);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceDetails();
    }
  }, [invoiceId, fetchInvoiceDetails]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
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
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  const handleDownloadPDF = async () => {
    try {
      toast.loading('Generating PDF...');

      const res = await fetch(`/api/customer/invoices/${invoiceId}/download`);

      if (!res.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the PDF blob
      const blob = await res.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice?.invoiceNumber || invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.dismiss();
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to download PDF');
    }
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

  if (!invoice) {
    return (
      <CustomerLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-900 mb-2">Invoice not found</h2>
          <p className="text-zinc-600 mb-4">This invoice doesn&apos;t exist or you don&apos;t have access to it</p>
          <Button onClick={() => router.push('/customer-portal/invoices')}>
            Back to Invoices
          </Button>
        </div>
      </CustomerLayout>
    );
  }

  const balance = invoice.total - invoice.amountPaid;
  const isPaid = invoice.status === 'paid';
  const job = invoice.jobs && invoice.jobs.length > 0 ? invoice.jobs[0] : null;

  return (
    <CustomerLayout>
      {/* Back Button */}
      <button
        onClick={() => router.push('/customer-portal/invoices')}
        className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 mb-6 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Invoices</span>
      </button>

      {/* Invoice Header */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">
              Invoice #{invoice.invoiceNumber}
            </h1>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(invoice.status)}`}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-500 mb-1">Amount Due</p>
            <p className="text-4xl font-bold text-emerald-600">
              {formatCurrency(balance)}
            </p>
          </div>
        </div>

        {/* Provider & Customer Info */}
        <div className="grid grid-cols-2 gap-8 py-6 border-t border-zinc-200">
          <div>
            <h3 className="text-sm font-semibold text-zinc-500 uppercase mb-3">From</h3>
            <p className="text-lg font-semibold text-zinc-900">{invoice.provider.businessName}</p>
            <p className="text-zinc-600">{invoice.provider.ownerName}</p>
            <div className="flex items-center gap-2 text-zinc-600 mt-2">
              <Mail className="h-4 w-4" />
              <span className="text-sm">{invoice.provider.email}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-600 mt-1">
              <Phone className="h-4 w-4" />
              <span className="text-sm">{invoice.provider.phone}</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-500 uppercase mb-3">Bill To</h3>
            <p className="text-lg font-semibold text-zinc-900">{invoice.customer.name}</p>
            <div className="flex items-center gap-2 text-zinc-600 mt-2">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{invoice.customer.address}</span>
            </div>
            {invoice.customer.email && (
              <div className="flex items-center gap-2 text-zinc-600 mt-1">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{invoice.customer.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-zinc-600 mt-1">
              <Phone className="h-4 w-4" />
              <span className="text-sm">{invoice.customer.phone}</span>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 py-6 border-t border-zinc-200">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500 uppercase font-medium">Invoice Date</p>
              <p className="font-semibold text-zinc-900">{formatDate(invoice.invoiceDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500 uppercase font-medium">Due Date</p>
              <p className="font-semibold text-zinc-900">{formatDate(invoice.dueDate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-zinc-900 mb-4">Services</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Description</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-700">Qty</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-700">Price</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item) => (
                <tr key={item.id} className="border-b border-zinc-100">
                  <td className="py-3 px-4 text-zinc-900">{item.description}</td>
                  <td className="py-3 px-4 text-right text-zinc-600">{item.quantity}</td>
                  <td className="py-3 px-4 text-right text-zinc-600">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-zinc-900">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-zinc-200">
                <td colSpan={3} className="py-3 px-4 text-right font-semibold text-zinc-700">Subtotal</td>
                <td className="py-3 px-4 text-right font-semibold text-zinc-900">{formatCurrency(invoice.subtotal)}</td>
              </tr>
              {invoice.discountAmount > 0 && (
                <tr>
                  <td colSpan={3} className="py-2 px-4 text-right text-zinc-600">Discount</td>
                  <td className="py-2 px-4 text-right text-green-600">-{formatCurrency(invoice.discountAmount)}</td>
                </tr>
              )}
              {invoice.taxAmount > 0 && (
                <tr>
                  <td colSpan={3} className="py-2 px-4 text-right text-zinc-600">
                    Tax {invoice.taxRate ? `(${invoice.taxRate}%)` : ''}
                  </td>
                  <td className="py-2 px-4 text-right text-zinc-900">{formatCurrency(invoice.taxAmount)}</td>
                </tr>
              )}
              <tr className="border-t-2 border-zinc-200">
                <td colSpan={3} className="py-4 px-4 text-right text-lg font-bold text-zinc-900">Total</td>
                <td className="py-4 px-4 text-right text-2xl font-bold text-emerald-600">{formatCurrency(invoice.total)}</td>
              </tr>
              {invoice.amountPaid > 0 && (
                <tr>
                  <td colSpan={3} className="py-2 px-4 text-right text-zinc-600">Amount Paid</td>
                  <td className="py-2 px-4 text-right text-green-600">-{formatCurrency(invoice.amountPaid)}</td>
                </tr>
              )}
              {balance > 0 && (
                <tr className="border-t border-zinc-200">
                  <td colSpan={3} className="py-3 px-4 text-right text-lg font-bold text-zinc-900">Balance Due</td>
                  <td className="py-3 px-4 text-right text-2xl font-bold text-red-600">{formatCurrency(balance)}</td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payment Instructions & Notes */}
      {(invoice.paymentInstructions || invoice.notes || invoice.terms) && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 mb-6">
          {invoice.paymentInstructions && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-zinc-700 uppercase mb-2">Payment Instructions</h3>
              <p className="text-zinc-600 whitespace-pre-wrap">{invoice.paymentInstructions}</p>
            </div>
          )}
          {invoice.notes && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-zinc-700 uppercase mb-2">Notes</h3>
              <p className="text-zinc-600 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
          {invoice.terms && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-700 uppercase mb-2">Terms & Conditions</h3>
              <p className="text-zinc-600 whitespace-pre-wrap">{invoice.terms}</p>
            </div>
          )}
        </div>
      )}

      {/* Payment History */}
      {invoice.payments.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-zinc-900 mb-4">Payment History</h2>
          <div className="space-y-3">
            {invoice.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-zinc-900">{formatCurrency(payment.amount)}</p>
                    <p className="text-sm text-zinc-600">{formatDate(payment.paymentDate)}</p>
                  </div>
                </div>
                <span className="text-sm text-zinc-600 capitalize">{payment.paymentMethod.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!isPaid && balance > 0 && (
          <Button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500"
          >
            <CreditCard className="h-4 w-4" /> Pay {formatCurrency(balance)} Now
          </Button>
        )}
        {isPaid && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Invoice Paid in Full</span>
          </div>
        )}
        {isPaid && invoice.job && (
          <Button
            onClick={() => setShowBookAgainModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Book Service Again
          </Button>
        )}
        <Button
          variant="outline"
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 border-zinc-900"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* Review Modal */}
      {showReviewModal && invoice.job && (
        <QuickReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          jobId={invoice.job.id}
          providerId={invoice.provider.id}
          providerName={invoice.provider.businessName}
          serviceType={invoice.job.serviceType}
        />
      )}

      {/* Book Again Modal */}
      {showBookAgainModal && invoice.job && (
        <BookAgainModal
          isOpen={showBookAgainModal}
          onClose={() => setShowBookAgainModal(false)}
          onSuccess={() => {
            setShowBookAgainModal(false);
            toast.success('Service booked successfully!');
            router.push('/customer-portal/jobs');
          }}
          serviceType={invoice.job.serviceType}
          providerId={invoice.provider.id}
          providerName={invoice.provider.businessName}
          address={invoice.customer.address}
          estimatedValue={invoice.total}
          bookingSource="rebook_invoice"
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && invoice && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={async () => {
            setShowPaymentModal(false);
            await fetchInvoiceDetails();

            // Show review modal if this invoice is linked to a job
            if (invoice.job) {
              setTimeout(() => setShowReviewModal(true), 500);
            }
          }}
          invoiceId={invoice.id}
          amount={balance}
          invoiceNumber={invoice.invoiceNumber}
          providerName={invoice.provider.businessName}
        />
      )}
    </CustomerLayout>
  );
}
