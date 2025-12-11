'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Download,
  Send,
  DollarSign,
  Edit,
  Copy,
  Trash2,
  CheckCircle,
  Calendar,
  Mail,
  Phone,
} from 'lucide-react';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  provider: {
    id: string;
    businessName: string;
    ownerName: string;
    email: string;
    phone: string;
  };
  lineItems: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  taxRate: number | null;
  taxAmount: number;
  discountType: string | null;
  discountValue: number | null;
  discountAmount: number;
  total: number;
  amountPaid: number;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  invoiceDate: string;
  dueDate: string;
  paidDate: string | null;
  notes: string | null;
  terms: string | null;
  paymentInstructions: string | null;
  sentAt: string | null;
  payments: {
    id: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    notes: string | null;
  }[];
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [providerName, setProviderName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');

    if (!id || !name) {
      router.push('/provider/login');
      return;
    }

    setProviderId(id);
    setProviderName(name);
    fetchInvoice();
  }, [router, invoiceId]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/provider/invoices/${invoiceId}`);
      const data = await res.json();

      if (data.error) {
        toast.error(data.error);
        router.push('/provider/invoices');
        return;
      }

      setInvoice(data);
    } catch (error) {
      toast.error('Failed to load invoice');
      router.push('/provider/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async () => {
    try {
      const res = await fetch(`/api/provider/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: true }),
      });

      if (!res.ok) throw new Error('Failed to send invoice');

      toast.success('Invoice sent to customer!');
      fetchInvoice();
    } catch (error) {
      toast.error('Failed to send invoice');
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      const res = await fetch(`/api/provider/invoices/${invoiceId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          paymentDate: new Date().toISOString(),
          paymentMethod,
          notes: paymentNotes || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to record payment');

      toast.success('Payment recorded successfully!');
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentNotes('');
      fetchInvoice();
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  const handleDeleteInvoice = async () => {
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
      router.push('/provider/invoices');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete invoice');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      toast.loading('Generating PDF...');

      const res = await fetch(`/api/provider/invoices/${invoiceId}/download`);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
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

  if (!invoice) {
    return null;
  }

  const remainingBalance = invoice.total - invoice.amountPaid;

  return (
    <ProviderLayout providerName={providerName}>
      <div className="min-h-screen bg-zinc-950">
        {/* Header */}
        <div className="border-b border-zinc-800 bg-zinc-900/30 backdrop-blur-sm">
          <div className="max-w-[1200px] mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/provider/invoices')}
                  className="border-zinc-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-zinc-100">
                    Invoice {invoice.invoiceNumber}
                  </h1>
                  <p className="text-sm text-zinc-400 mt-1">
                    Created {formatDate(invoice.invoiceDate)}
                  </p>
                </div>
              </div>
              <Badge className={`${getStatusColor(invoice.status)} border capitalize text-base px-3 py-1`}>
                {invoice.status}
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-zinc-700"
                onClick={handleDownloadPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>

              {(invoice.status === 'draft' || invoice.status === 'sent') && (
                <Button
                  size="sm"
                  onClick={handleSendInvoice}
                  className="bg-blue-600 hover:bg-blue-500"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {invoice.status === 'draft' ? 'Send to Customer' : 'Resend'}
                </Button>
              )}

              {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                <Button
                  size="sm"
                  onClick={() => {
                    setPaymentAmount(remainingBalance.toString());
                    setShowPaymentModal(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              )}

              {invoice.status !== 'paid' && invoice.status !== 'partial' && (
                <>
                  <Button size="sm" variant="outline" className="border-zinc-700">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleDeleteInvoice}
                    variant="outline"
                    className="border-red-700 text-red-400 hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}

              <Button size="sm" variant="outline" className="border-zinc-700">
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
            </div>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Invoice */}
            <div className="lg:col-span-2">
              <Card className="bg-white border-zinc-200">
                <CardContent className="p-8">
                  {/* Invoice Header */}
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h2>
                      <p className="text-gray-600">#{invoice.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      <h3 className="text-xl font-bold text-gray-900">
                        {invoice.provider.businessName}
                      </h3>
                      <p className="text-gray-600">{invoice.provider.ownerName}</p>
                      <p className="text-gray-600">{invoice.provider.email}</p>
                      <p className="text-gray-600">{invoice.provider.phone}</p>
                    </div>
                  </div>

                  {/* Bill To */}
                  <div className="mb-8">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                      Bill To:
                    </h4>
                    <div className="text-gray-900">
                      <p className="font-semibold">
                        {invoice.customer.firstName} {invoice.customer.lastName}
                      </p>
                      <p>{invoice.customer.email}</p>
                      <p>{invoice.customer.phone}</p>
                      <p>
                        {invoice.customer.address}, {invoice.customer.city}, {invoice.customer.state}{' '}
                        {invoice.customer.zip}
                      </p>
                    </div>
                  </div>

                  {/* Invoice Details */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div>
                      <p className="text-sm text-gray-500">Invoice Date</p>
                      <p className="font-medium text-gray-900">{formatDate(invoice.invoiceDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Due Date</p>
                      <p className="font-medium text-gray-900">{formatDate(invoice.dueDate)}</p>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="mb-8">
                    <table className="w-full">
                      <thead className="border-b-2 border-gray-300">
                        <tr>
                          <th className="text-left py-3 text-sm font-semibold text-gray-700 uppercase">
                            Description
                          </th>
                          <th className="text-right py-3 text-sm font-semibold text-gray-700 uppercase">
                            Qty
                          </th>
                          <th className="text-right py-3 text-sm font-semibold text-gray-700 uppercase">
                            Price
                          </th>
                          <th className="text-right py-3 text-sm font-semibold text-gray-700 uppercase">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.lineItems.map((item) => (
                          <tr key={item.id} className="border-b border-gray-200">
                            <td className="py-3 text-gray-900">{item.description}</td>
                            <td className="py-3 text-right text-gray-900">{item.quantity}</td>
                            <td className="py-3 text-right text-gray-900">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="py-3 text-right font-medium text-gray-900">
                              {formatCurrency(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end mb-8">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-gray-700">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(invoice.subtotal)}</span>
                      </div>
                      {invoice.taxRate && invoice.taxRate > 0 && (
                        <div className="flex justify-between text-gray-700">
                          <span>Tax ({invoice.taxRate}%):</span>
                          <span>{formatCurrency(invoice.taxAmount)}</span>
                        </div>
                      )}
                      {invoice.discountAmount > 0 && (
                        <div className="flex justify-between text-gray-700">
                          <span>
                            Discount (
                            {invoice.discountType === 'percentage'
                              ? `${invoice.discountValue}%`
                              : formatCurrency(invoice.discountValue || 0)}
                            ):
                          </span>
                          <span className="text-red-600">-{formatCurrency(invoice.discountAmount)}</span>
                        </div>
                      )}
                      <div className="border-t-2 border-gray-300 pt-2 flex justify-between text-xl font-bold text-gray-900">
                        <span>Total:</span>
                        <span>{formatCurrency(invoice.total)}</span>
                      </div>
                      {invoice.amountPaid > 0 && (
                        <>
                          <div className="flex justify-between text-gray-700">
                            <span>Amount Paid:</span>
                            <span className="text-emerald-600">
                              {formatCurrency(invoice.amountPaid)}
                            </span>
                          </div>
                          <div className="flex justify-between text-lg font-semibold text-gray-900">
                            <span>Balance Due:</span>
                            <span>{formatCurrency(remainingBalance)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Notes and Terms */}
                  {invoice.notes && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 uppercase mb-2">Notes:</h4>
                      <p className="text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
                    </div>
                  )}

                  {invoice.terms && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 uppercase mb-2">Terms:</h4>
                      <p className="text-gray-600 whitespace-pre-wrap">{invoice.terms}</p>
                    </div>
                  )}

                  {invoice.paymentInstructions && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 uppercase mb-2">
                        Payment Instructions:
                      </h4>
                      <p className="text-gray-600 whitespace-pre-wrap">
                        {invoice.paymentInstructions}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Payment History */}
              {invoice.payments.length > 0 && (
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold text-zinc-100 mb-4">Payment History</h3>
                    <div className="space-y-3">
                      {invoice.payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-emerald-400" />
                              <span className="font-medium text-emerald-400">
                                {formatCurrency(payment.amount)}
                              </span>
                            </div>
                            <span className="text-xs text-zinc-500 capitalize">
                              {payment.paymentMethod}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400">
                            {formatDate(payment.paymentDate)}
                          </p>
                          {payment.notes && (
                            <p className="text-xs text-zinc-500 mt-1">{payment.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Invoice Info */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-zinc-100 mb-4">Invoice Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-zinc-500" />
                      <div>
                        <p className="text-zinc-500">Invoice Date</p>
                        <p className="text-zinc-200">{formatDate(invoice.invoiceDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-zinc-500" />
                      <div>
                        <p className="text-zinc-500">Due Date</p>
                        <p className="text-zinc-200">{formatDate(invoice.dueDate)}</p>
                      </div>
                    </div>
                    {invoice.paidDate && (
                      <div className="flex items-center gap-3 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                        <div>
                          <p className="text-zinc-500">Paid Date</p>
                          <p className="text-emerald-400">{formatDate(invoice.paidDate)}</p>
                        </div>
                      </div>
                    )}
                    {invoice.sentAt && (
                      <div className="flex items-center gap-3 text-sm">
                        <Send className="h-4 w-4 text-zinc-500" />
                        <div>
                          <p className="text-zinc-500">Sent At</p>
                          <p className="text-zinc-200">{formatDate(invoice.sentAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="bg-zinc-900 border-zinc-800 max-w-md w-full">
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold text-zinc-100 mb-4">Record Payment</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Amount *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      Remaining balance: {formatCurrency(remainingBalance)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Payment Method *
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="check">Check</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="online">Online</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                      placeholder="Add any notes about this payment..."
                    />
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={() => setShowPaymentModal(false)}
                      variant="outline"
                      className="flex-1 border-zinc-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRecordPayment}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                    >
                      Record Payment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ProviderLayout>
  );
}
