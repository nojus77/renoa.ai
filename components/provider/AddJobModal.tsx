"use client"

import { useState, useEffect } from 'react';
import { X, Plus, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import { toast } from 'sonner';

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
  onJobCreated: () => void;
  selectedDate?: Date;
  selectedHour?: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export default function AddJobModal({
  isOpen,
  onClose,
  providerId,
  onJobCreated,
  selectedDate,
  selectedHour,
}: AddJobModalProps) {
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // New customer fields
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  // Job details
  const [jobDetails, setJobDetails] = useState({
    serviceType: '',
    customServiceType: '',
    date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    startTime: selectedHour ? `${selectedHour.toString().padStart(2, '0')}:00` : '09:00',
    duration: '2', // hours
    endTime: '',
    estimatedValue: '',
    internalNotes: '',
    customerNotes: '',
    status: 'scheduled' as 'scheduled' | 'in_progress' | 'completed',
  });

  const serviceTypes = [
    'Lawn Mowing',
    'Landscaping',
    'Cleanup',
    'Design',
    'Hardscaping',
    'Tree Service',
    'Other',
  ];

  const durations = [
    { value: '0.5', label: '30 min' },
    { value: '1', label: '1 hr' },
    { value: '1.5', label: '1.5 hr' },
    { value: '2', label: '2 hr' },
    { value: '3', label: '3 hr' },
    { value: '4', label: '4 hr' },
    { value: '6', label: '6 hr' },
    { value: '8', label: '8 hr' },
    { value: '24', label: 'All day' },
  ];

  // Calculate end time when start time or duration changes
  useEffect(() => {
    if (jobDetails.startTime && jobDetails.duration) {
      const [hours, minutes] = jobDetails.startTime.split(':').map(Number);
      const durationHours = parseFloat(jobDetails.duration);

      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + (durationHours * 60);

      const endHours = Math.floor(endMinutes / 60) % 24;
      const endMins = Math.floor(endMinutes % 60);

      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
      setJobDetails(prev => ({ ...prev, endTime }));
    }
  }, [jobDetails.startTime, jobDetails.duration]);

  // Load customers when searching
  useEffect(() => {
    if (searchQuery.length >= 2) {
      // TODO: Fetch customers from API
      // For now, empty array
      setCustomers([]);
    }
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!selectedCustomer && !showNewCustomerForm) {
      toast.error('Please select a customer or add a new one');
      return;
    }

    if (showNewCustomerForm) {
      if (!newCustomer.name || !newCustomer.phone || !newCustomer.email || !newCustomer.address) {
        toast.error('Please fill in all required customer fields');
        return;
      }
    }

    if (!jobDetails.serviceType) {
      toast.error('Please select a service type');
      return;
    }

    if (jobDetails.serviceType === 'Other' && !jobDetails.customServiceType) {
      toast.error('Please specify the custom service type');
      return;
    }

    setSubmitting(true);

    try {
      // Combine date and time to create ISO string
      const startDateTime = new Date(`${jobDetails.date}T${jobDetails.startTime}`);
      const endDateTime = new Date(`${jobDetails.date}T${jobDetails.endTime}`);

      const payload = {
        providerId,
        // Customer info
        ...(showNewCustomerForm ? {
          customerName: newCustomer.name,
          customerEmail: newCustomer.email,
          customerPhone: newCustomer.phone,
          customerAddress: newCustomer.address,
        } : {
          customerId: selectedCustomer?.id,
        }),
        // Job details
        serviceType: jobDetails.serviceType === 'Other' ? jobDetails.customServiceType : jobDetails.serviceType,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        estimatedValue: jobDetails.estimatedValue ? parseFloat(jobDetails.estimatedValue) : null,
        internalNotes: jobDetails.internalNotes || null,
        customerNotes: jobDetails.customerNotes || null,
        status: jobDetails.status,
        source: 'own_client',
      };

      const res = await fetch('/api/provider/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create job');
      }

      toast.success('Job created successfully!');
      onJobCreated();
      onClose();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create job');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowNewCustomerForm(false);
    setSearchQuery('');
    setSelectedCustomer(null);
    setNewCustomer({ name: '', phone: '', email: '', address: '' });
    setJobDetails({
      serviceType: '',
      customServiceType: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      duration: '2',
      endTime: '',
      estimatedValue: '',
      internalNotes: '',
      customerNotes: '',
      status: 'scheduled',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-2xl font-bold text-zinc-100">Add New Job</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-zinc-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6 space-y-6">
            {/* Customer Section */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-400" />
                Customer
              </h3>

              {!showNewCustomerForm ? (
                <div className="space-y-3">
                  {/* Search existing customers */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for existing customer..."
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {selectedCustomer && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-emerald-400">{selectedCustomer.name}</p>
                        <p className="text-xs text-zinc-400">{selectedCustomer.email} • {selectedCustomer.phone}</p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => setSelectedCustomer(null)}
                        variant="ghost"
                        size="sm"
                        className="text-zinc-400 hover:text-zinc-100"
                      >
                        Change
                      </Button>
                    </div>
                  )}

                  <div className="text-center">
                    <span className="text-sm text-zinc-500">or</span>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setShowNewCustomerForm(true)}
                    variant="outline"
                    className="w-full border-zinc-700 hover:bg-zinc-800"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Customer
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 p-4 bg-zinc-800/30 border border-zinc-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-zinc-300">New Customer Details</p>
                    <Button
                      type="button"
                      onClick={() => setShowNewCustomerForm(false)}
                      variant="ghost"
                      size="sm"
                      className="text-zinc-400 hover:text-zinc-100 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Phone <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="(555) 123-4567"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Address <span className="text-red-400">*</span>
                    </label>
                    <AddressAutocomplete
                      value={newCustomer.address}
                      onChange={(value) => setNewCustomer(prev => ({ ...prev, address: value }))}
                      onAddressSelect={(components) => {
                        setNewCustomer(prev => ({ ...prev, address: components.fullAddress }));
                      }}
                      placeholder="123 Main St, City, State"
                      className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Job Details Section */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-4">Job Details</h3>

              <div className="space-y-4">
                {/* Service Type */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Service Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={jobDetails.serviceType}
                    onChange={(e) => setJobDetails(prev => ({ ...prev, serviceType: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">Select service...</option>
                    {serviceTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Custom Service Type (if Other selected) */}
                {jobDetails.serviceType === 'Other' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Specify Service <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={jobDetails.customServiceType}
                      onChange={(e) => setJobDetails(prev => ({ ...prev, customServiceType: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Enter service type"
                      required
                    />
                  </div>
                )}

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={jobDetails.date}
                      onChange={(e) => setJobDetails(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Start Time <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="time"
                      value={jobDetails.startTime}
                      onChange={(e) => setJobDetails(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                {/* Duration and End Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Duration
                    </label>
                    <select
                      value={jobDetails.duration}
                      onChange={(e) => setJobDetails(prev => ({ ...prev, duration: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {durations.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={jobDetails.endTime}
                      onChange={(e) => setJobDetails(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing & Notes */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-4">Pricing & Notes</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Estimated Value
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                    <input
                      type="number"
                      value={jobDetails.estimatedValue}
                      onChange={(e) => setJobDetails(prev => ({ ...prev, estimatedValue: e.target.value }))}
                      className="w-full pl-8 pr-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Internal Notes
                  </label>
                  <textarea
                    value={jobDetails.internalNotes}
                    onChange={(e) => setJobDetails(prev => ({ ...prev, internalNotes: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
                    placeholder="Equipment needed, special instructions, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Customer-Visible Notes
                  </label>
                  <textarea
                    value={jobDetails.customerNotes}
                    onChange={(e) => setJobDetails(prev => ({ ...prev, customerNotes: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
                    placeholder="This will be shown to the customer"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-4">Status</h3>

              <div className="flex gap-4">
                <label className="flex items-center gap-3 flex-1 p-4 bg-zinc-800/30 border-2 border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-800/50 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-500/10">
                  <input
                    type="radio"
                    name="status"
                    value="scheduled"
                    checked={jobDetails.status === 'scheduled'}
                    onChange={(e) => setJobDetails(prev => ({ ...prev, status: e.target.value as any }))}
                    className="text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-zinc-200">Scheduled</span>
                </label>

                <label className="flex items-center gap-3 flex-1 p-4 bg-zinc-800/30 border-2 border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-800/50 transition-colors has-[:checked]:border-yellow-500 has-[:checked]:bg-yellow-500/10">
                  <input
                    type="radio"
                    name="status"
                    value="in_progress"
                    checked={jobDetails.status === 'in_progress'}
                    onChange={(e) => setJobDetails(prev => ({ ...prev, status: e.target.value as any }))}
                    className="text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className="text-sm font-medium text-zinc-200">In Progress</span>
                </label>

                <label className="flex items-center gap-3 flex-1 p-4 bg-zinc-800/30 border-2 border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-800/50 transition-colors has-[:checked]:border-green-500 has-[:checked]:bg-green-500/10">
                  <input
                    type="radio"
                    name="status"
                    value="completed"
                    checked={jobDetails.status === 'completed'}
                    onChange={(e) => setJobDetails(prev => ({ ...prev, status: e.target.value as any }))}
                    className="text-green-500 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-zinc-200">Completed</span>
                </label>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-zinc-700/50 text-zinc-300 border border-zinc-600 rounded">
                  Source: Own Client
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800 bg-zinc-900/50">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6"
            >
              {submitting ? 'Creating...' : 'Create Job'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
