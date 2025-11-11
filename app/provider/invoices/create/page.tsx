'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, GripVertical, Save, Send, X } from 'lucide-react';
import { toast } from 'sonner';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const [providerName, setProviderName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);

  // Tax and discount
  const [includeTax, setIncludeTax] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [includeDiscount, setIncludeDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);

  // Notes and terms
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState(
    'Payment is due within the specified due date. Late payments may incur additional fees.'
  );
  const [paymentInstructions, setPaymentInstructions] = useState('');

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');

    if (!id || !name) {
      router.push('/provider/login');
      return;
    }

    setProviderId(id);
    setProviderName(name);
    fetchCustomers(id);
  }, [router]);

  const fetchCustomers = async (id: string) => {
    try {
      const res = await fetch(`/api/provider/customers?providerId=${id}`);
      const data = await res.json();

      if (data.customers) {
        setCustomers(data.customers);
      }
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const addLineItem = () => {
    const newId = String(lineItems.length + 1);
    setLineItems([
      ...lineItems,
      { id: newId, description: '', quantity: 1, unitPrice: 0, total: 0 },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length === 1) {
      toast.error('At least one line item is required');
      return;
    }
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updated.total = updated.quantity * updated.unitPrice;
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = includeTax ? (subtotal * taxRate) / 100 : 0;
  const discountAmount = includeDiscount
    ? discountType === 'percentage'
      ? (subtotal * discountValue) / 100
      : discountValue
    : 0;
  const total = subtotal + taxAmount - discountAmount;

  const handleSave = async (sendImmediately: boolean) => {
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }

    if (lineItems.some((item) => !item.description || item.quantity <= 0 || item.unitPrice < 0)) {
      toast.error('Please fill out all line items correctly');
      return;
    }

    setSaving(true);

    try {
      const invoiceData = {
        providerId,
        customerId: selectedCustomer,
        invoiceDate,
        dueDate,
        lineItems: lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        taxRate: includeTax ? taxRate : 0,
        discountType: includeDiscount ? discountType : null,
        discountValue: includeDiscount ? discountValue : 0,
        notes,
        terms,
        paymentInstructions,
        status: sendImmediately ? 'sent' : 'draft',
      };

      const res = await fetch('/api/provider/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });

      if (!res.ok) throw new Error('Failed to create invoice');

      const invoice = await res.json();

      if (sendImmediately) {
        const sendRes = await fetch(`/api/provider/invoices/${invoice.id}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: true }),
        });

        if (!sendRes.ok) {
          toast.warning('Invoice created but failed to send');
        } else {
          toast.success('Invoice created and sent!');
        }
      } else {
        toast.success('Invoice saved as draft');
      }

      router.push('/provider/invoices');
    } catch (error) {
      toast.error('Failed to create invoice');
    } finally {
      setSaving(false);
    }
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
          <div className="max-w-[1200px] mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-zinc-100">Create Invoice</h1>
                <p className="text-sm text-zinc-400 mt-1">Fill out the details to create a new invoice</p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/provider/invoices')}
                className="border-zinc-700"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="space-y-6">
            {/* Customer and Dates */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100">Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Customer *
                    </label>
                    <select
                      value={selectedCustomer}
                      onChange={(e) => setSelectedCustomer(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select a customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.firstName} {customer.lastName} ({customer.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Invoice Date *
                    </label>
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-zinc-100">Line Items</CardTitle>
                  <Button
                    onClick={addLineItem}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Line Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lineItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-lg"
                    >
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-5">
                          <label className="block text-xs font-medium text-zinc-400 mb-1">
                            Description *
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              updateLineItem(item.id, 'description', e.target.value)
                            }
                            placeholder="E.g., Lawn mowing service"
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-zinc-400 mb-1">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) =>
                              updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-zinc-400 mb-1">
                            Unit Price *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-zinc-400 mb-1">
                            Total
                          </label>
                          <div className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-emerald-400 font-medium">
                            ${item.total.toFixed(2)}
                          </div>
                        </div>

                        <div className="md:col-span-1 flex items-end">
                          <Button
                            onClick={() => removeLineItem(item.id)}
                            size="sm"
                            variant="outline"
                            className="border-red-700 text-red-400 hover:bg-red-900/20 w-full"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tax and Discount */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100">Tax & Discount</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="includeTax"
                    checked={includeTax}
                    onChange={(e) => setIncludeTax(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 bg-zinc-900 border-zinc-700 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="includeTax" className="text-sm font-medium text-zinc-300">
                    Add Tax
                  </label>
                </div>

                {includeTax && (
                  <div className="ml-7">
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-full md:w-48 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="includeDiscount"
                    checked={includeDiscount}
                    onChange={(e) => setIncludeDiscount(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 bg-zinc-900 border-zinc-700 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="includeDiscount" className="text-sm font-medium text-zinc-300">
                    Add Discount
                  </label>
                </div>

                {includeDiscount && (
                  <div className="ml-7 space-y-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => setDiscountType('percentage')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          discountType === 'percentage'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}
                      >
                        Percentage (%)
                      </button>
                      <button
                        onClick={() => setDiscountType('fixed')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          discountType === 'fixed'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}
                      >
                        Fixed Amount ($)
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Discount {discountType === 'percentage' ? 'Percentage' : 'Amount'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                        className="w-full md:w-48 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Totals Summary */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Subtotal:</span>
                    <span className="text-zinc-200">${subtotal.toFixed(2)}</span>
                  </div>
                  {includeTax && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Tax ({taxRate}%):</span>
                      <span className="text-zinc-200">${taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {includeDiscount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">
                        Discount ({discountType === 'percentage' ? `${discountValue}%` : `$${discountValue}`}):
                      </span>
                      <span className="text-red-400">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-zinc-800 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-zinc-100">Total:</span>
                      <span className="text-2xl font-bold text-emerald-400">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes and Terms */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Notes (visible to customer)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Add any notes for the customer..."
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Terms (visible to customer)
                  </label>
                  <textarea
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Payment Instructions (visible to customer)
                  </label>
                  <textarea
                    value={paymentInstructions}
                    onChange={(e) => setPaymentInstructions(e.target.value)}
                    rows={3}
                    placeholder="Add payment instructions..."
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => handleSave(false)}
                disabled={saving}
                variant="outline"
                className="border-zinc-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                <Send className="h-4 w-4 mr-2" />
                {saving ? 'Sending...' : 'Send Invoice'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}
