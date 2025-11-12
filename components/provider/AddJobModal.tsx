"use client"

import { useState, useEffect, useRef } from 'react';
import { X, Plus, Search, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import { toast } from 'sonner';
import { Listbox } from '@headlessui/react';

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
  onJobCreated: () => void;
  selectedDate?: Date;
  selectedHour?: number;
  providerServiceTypes?: string[];
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
  providerServiceTypes,
}: AddJobModalProps) {
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [savingCustomService, setSavingCustomService] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // New customer fields
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  // Job details - NO auto-fill, user must choose everything
  const [jobDetails, setJobDetails] = useState({
    serviceType: '',
    customServiceType: '',
    date: selectedDate ? selectedDate.toISOString().split('T')[0] : '', // NO DEFAULT
    startTime: selectedHour ? `${selectedHour.toString().padStart(2, '0')}:00` : '', // NO DEFAULT
    duration: '', // NO DEFAULT
    endTime: '',
    estimatedValue: '',
    internalNotes: '',
    customerNotes: '',
    status: 'scheduled' as 'scheduled' | 'in_progress' | 'completed',
  });

  // All available service types
  const allServiceTypes = [
    { id: 'lawn-mowing', name: 'Lawn Mowing', icon: '🌱' },
    { id: 'landscaping', name: 'Landscaping', icon: '🌳' },
    { id: 'cleanup', name: 'Cleanup', icon: '🧹' },
    { id: 'tree-service', name: 'Tree Service', icon: '🪓' },
    { id: 'snow-removal', name: 'Snow Removal', icon: '❄️' },
    { id: 'hardscaping', name: 'Hardscaping', icon: '🪨' },
    { id: 'irrigation', name: 'Irrigation', icon: '💧' },
    { id: 'fertilization', name: 'Fertilization', icon: '🌿' },
    { id: 'pest-control', name: 'Pest Control', icon: '🐛' },
    { id: 'other', name: 'Other', icon: '⚙️' },
  ];

  // Filter service types based on provider's configured services
  // Always include "Other" as a fallback option
  const serviceTypes = providerServiceTypes && providerServiceTypes.length > 0
    ? allServiceTypes.filter(service =>
        providerServiceTypes.includes(service.id) || service.id === 'other'
      )
    : allServiceTypes; // Show all if no provider services configured

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

  // Generate time options (6:00 AM to 8:00 PM in 30-minute increments)
  const timeOptions = [];
  for (let hour = 6; hour <= 20; hour++) {
    for (let minute of [0, 30]) {
      const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const period = hour >= 12 ? 'PM' : 'AM';
      const timeLabel = `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
      timeOptions.push({ value: time24, label: timeLabel });
    }
  }

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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
    const fetchCustomers = async () => {
      if (searchQuery.length >= 2) {
        setSearching(true);
        try {
          const response = await fetch(`/api/provider/customers/search?q=${encodeURIComponent(searchQuery)}&providerId=${providerId}`);
          const data = await response.json();
          if (response.ok) {
            setCustomers(data.customers || []);
            setShowDropdown(true);
          }
        } catch (error) {
          console.error('Error searching customers:', error);
          setCustomers([]);
        } finally {
          setSearching(false);
        }
      } else {
        setCustomers([]);
        setShowDropdown(false);
      }
    };

    const timeoutId = setTimeout(fetchCustomers, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [searchQuery, providerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!selectedCustomer && !showNewCustomerForm) {
      toast.error('Please select a customer or add a new one');
      return;
    }

    if (showNewCustomerForm) {
      if (!newCustomer.name || !newCustomer.phone) {
        toast.error('Please fill in customer name and phone number');
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

    // Save custom service if "Other" is selected
    if (jobDetails.serviceType === 'Other' && jobDetails.customServiceType) {
      setSavingCustomService(true);
      try {
        await fetch('/api/provider/services/custom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId,
            serviceName: jobDetails.customServiceType,
          }),
        });
      } catch (error) {
        console.error('Error saving custom service:', error);
        // Don't fail job creation if custom service save fails
      } finally {
        setSavingCustomService(false);
      }
    }

    setSubmitting(true);

    try {
      let customerId = selectedCustomer?.id;

      // If creating a new customer, create them first
      if (showNewCustomerForm) {
        const customerRes = await fetch('/api/provider/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId,
            name: newCustomer.name,
            phone: newCustomer.phone,
            email: newCustomer.email || null,
            address: newCustomer.address || '',
            tags: [],
            notes: null,
          }),
        });

        const customerData = await customerRes.json();

        if (!customerRes.ok) {
          throw new Error(customerData.error || 'Failed to create customer');
        }

        customerId = customerData.customer.id;
        toast.success('Customer created successfully');
      }

      // Now create the job with the customerId
      const startDateTime = new Date(`${jobDetails.date}T${jobDetails.startTime}`);
      const durationHours = parseFloat(jobDetails.duration);

      const payload = {
        providerId,
        customerId,
        customerAddress: showNewCustomerForm ? newCustomer.address : undefined,
        serviceType: jobDetails.serviceType === 'Other' ? jobDetails.customServiceType : jobDetails.serviceType,
        startTime: startDateTime.toISOString(),
        duration: durationHours,
        estimatedValue: jobDetails.estimatedValue ? parseFloat(jobDetails.estimatedValue) : null,
        internalNotes: jobDetails.internalNotes || null,
        customerNotes: jobDetails.customerNotes || null,
        status: jobDetails.status,
      };

      const res = await fetch('/api/provider/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create job');
      }

      // Show success animation
      setShowSuccessAnimation(true);
      toast.success('Job created successfully!');

      // Wait for animation before closing
      setTimeout(() => {
        setShowSuccessAnimation(false);
        onJobCreated();
        onClose();
        resetForm();
      }, 1500);
    } catch (error: any) {
      console.error('Error creating job:', error);
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Escape to close
      if (e.key === 'Escape') {
        onClose();
      }

      // Enter to submit (if not in textarea and form is valid)
      if (e.key === 'Enter' && !e.shiftKey && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        const isValid = (selectedCustomer || (showNewCustomerForm && newCustomer.name && newCustomer.phone)) && jobDetails.serviceType;
        if (isValid && !submitting) {
          e.preventDefault();
          handleSubmit(e as any);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedCustomer, showNewCustomerForm, newCustomer, jobDetails, submitting]);

  // Calculate form progress
  const calculateProgress = () => {
    let completed = 0;
    const total = 3; // Customer, Service, Date/Time

    if (selectedCustomer || (showNewCustomerForm && newCustomer.name && newCustomer.phone)) completed++;
    if (jobDetails.serviceType) completed++;
    if (jobDetails.date && jobDetails.startTime) completed++;

    return (completed / total) * 100;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-zinc-900 w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-hidden shadow-2xl border-t md:border border-zinc-800">
        {/* Success Animation Overlay */}
        {showSuccessAnimation && (
          <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-300">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">🎉</div>
              <p className="text-xl font-semibold text-emerald-400">Job Created!</p>
            </div>
          </div>
        )}
        {/* Header with Progress */}
        <div className="border-b border-zinc-800">
          <div className="flex items-center justify-between px-4 md:px-6 py-4 md:py-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-zinc-100">Add New Job</h2>
              <p className="text-xs text-zinc-500 mt-1">{Math.round(calculateProgress())}% complete</p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-zinc-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          {/* Progress Bar */}
          <div className="h-1 bg-zinc-800">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 ease-out"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)] overscroll-contain">
          <div className="px-4 md:px-6 py-4 md:py-6 space-y-6">
            {/* Customer Section */}
            <div>
              <h3 className="text-base md:text-lg font-semibold text-zinc-100 mb-3 md:mb-4 flex items-center gap-2">
                <User className="h-4 w-4 md:h-5 md:w-5 text-emerald-400" />
                Customer
              </h3>

              {!showNewCustomerForm ? (
                <div className="space-y-3">
                  {/* Search existing customers */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (!selectedCustomer) setShowDropdown(true);
                      }}
                      onFocus={() => {
                        if (searchQuery.length >= 2 && customers.length > 0) {
                          setShowDropdown(true);
                        }
                      }}
                      placeholder="Search customer by name, phone, or email..."
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base"
                      disabled={!!selectedCustomer}
                    />

                    {/* Dropdown with search results */}
                    {showDropdown && !selectedCustomer && searchQuery.length >= 2 && (
                      <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searching ? (
                          <div className="p-4 text-center text-sm text-zinc-400">
                            Searching...
                          </div>
                        ) : customers.length > 0 ? (
                          <>
                            {customers.map((customer) => (
                              <button
                                key={customer.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setSearchQuery(customer.name);
                                  setShowDropdown(false);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-zinc-700 border-b border-zinc-700/50 last:border-b-0 transition-colors"
                              >
                                <p className="text-sm font-medium text-zinc-100">{customer.name}</p>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                  {customer.phone} {customer.email && `• ${customer.email}`}
                                </p>
                              </button>
                            ))}
                          </>
                        ) : (
                          <div className="p-4 text-center">
                            <p className="text-sm text-zinc-400 mb-2">No customers found</p>
                            <Button
                              type="button"
                              onClick={() => {
                                setShowNewCustomerForm(true);
                                setShowDropdown(false);
                              }}
                              variant="outline"
                              size="sm"
                              className="border-zinc-700"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add New Customer
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedCustomer && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-emerald-400">{selectedCustomer.name}</p>
                        <p className="text-xs text-zinc-400">{selectedCustomer.phone} {selectedCustomer.email && `• ${selectedCustomer.email}`}</p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(null);
                          setSearchQuery('');
                        }}
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
                <div className="space-y-4 p-3 md:p-4 bg-zinc-800/30 border border-zinc-700/50 rounded-lg">
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
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base"
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Phone <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base"
                        placeholder="(555) 123-4567"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Address
                    </label>
                    <AddressAutocomplete
                      value={newCustomer.address}
                      onChange={(value) => setNewCustomer(prev => ({ ...prev, address: value }))}
                      onAddressSelect={(components) => {
                        setNewCustomer(prev => ({ ...prev, address: components.fullAddress }));
                      }}
                      placeholder="123 Main St, City, State"
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Job Details Section */}
            <div>
              <h3 className="text-base md:text-lg font-semibold text-zinc-100 mb-3 md:mb-4">Job Details</h3>

              <div className="space-y-4">
                {/* Service Type - Visual Icon Grid */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3">
                    Service Type <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                    {serviceTypes.map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setJobDetails(prev => ({ ...prev, serviceType: type.name }))}
                        className={`
                          p-3 md:p-4 rounded-lg border-2 transition-all active:scale-95 min-h-[72px] md:min-h-[80px]
                          ${jobDetails.serviceType === type.name
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600 hover:bg-zinc-800/50'
                          }
                        `}
                      >
                        <div className="text-2xl md:text-3xl mb-1">{type.icon}</div>
                        <div className="text-xs md:text-sm font-medium text-zinc-200">{type.name}</div>
                      </button>
                    ))}
                  </div>
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
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base"
                      placeholder="Enter service type"
                      required
                    />
                  </div>
                )}

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={jobDetails.date}
                      onChange={(e) => setJobDetails(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Start Time <span className="text-red-400">*</span>
                    </label>
                    <Listbox
                      value={jobDetails.startTime}
                      onChange={(value) => setJobDetails(prev => ({ ...prev, startTime: value }))}
                    >
                      <div className="relative">
                        <Listbox.Button className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base text-left">
                          {jobDetails.startTime ? timeOptions.find(t => t.value === jobDetails.startTime)?.label || jobDetails.startTime : 'Select time'}
                        </Listbox.Button>
                        <Listbox.Options className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {timeOptions.map((time) => (
                            <Listbox.Option
                              key={time.value}
                              value={time.value}
                              className={({ active }) =>
                                `cursor-pointer px-4 py-2 text-sm ${
                                  active ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-300'
                                }`
                              }
                            >
                              {time.label}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </div>
                    </Listbox>
                  </div>
                </div>

                {/* Duration - Visual Button Picker */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3">
                    Duration
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map(hours => (
                      <button
                        key={hours}
                        type="button"
                        onClick={() => setJobDetails(prev => ({ ...prev, duration: hours.toString() }))}
                        className={`
                          py-3 rounded-lg border-2 transition-all font-medium active:scale-95
                          ${jobDetails.duration === hours.toString()
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                            : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600 hover:bg-zinc-800/50 text-zinc-300'
                          }
                        `}
                      >
                        {hours}h
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setJobDetails(prev => ({ ...prev, duration: '8' }))}
                    className={`
                      w-full py-3 rounded-lg border-2 transition-all font-medium mt-2 active:scale-95
                      ${jobDetails.duration === '8'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600 hover:bg-zinc-800/50 text-zinc-300'
                      }
                    `}
                  >
                    All Day (8 hours)
                  </button>
                  {jobDetails.duration && (
                    <p className="text-xs text-zinc-500 mt-2">
                      End time: {jobDetails.endTime || 'Calculating...'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing & Notes - Collapsible Optional Sections */}
            <div className="space-y-3">
              {/* Pricing Section */}
              <details className="group bg-zinc-800/30 border border-zinc-700 rounded-lg overflow-hidden">
                <summary className="cursor-pointer px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors select-none">
                  <span className="text-sm font-medium text-zinc-300">💰 Pricing (optional)</span>
                  <span className="text-zinc-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-4 pb-4 pt-2">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Estimated Value
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                    <input
                      type="number"
                      value={jobDetails.estimatedValue}
                      onChange={(e) => setJobDetails(prev => ({ ...prev, estimatedValue: e.target.value }))}
                      className="w-full pl-8 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
              </details>

              {/* Internal Notes Section */}
              <details className="group bg-zinc-800/30 border border-zinc-700 rounded-lg overflow-hidden">
                <summary className="cursor-pointer px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors select-none">
                  <span className="text-sm font-medium text-zinc-300">📝 Internal Notes (optional)</span>
                  <span className="text-zinc-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-4 pb-4 pt-2">
                  <textarea
                    value={jobDetails.internalNotes}
                    onChange={(e) => setJobDetails(prev => ({ ...prev, internalNotes: e.target.value }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px] text-sm md:text-base resize-none"
                    placeholder="Equipment needed, special instructions, etc."
                  />
                </div>
              </details>

              {/* Customer Notes Section */}
              <details className="group bg-zinc-800/30 border border-zinc-700 rounded-lg overflow-hidden">
                <summary className="cursor-pointer px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors select-none">
                  <span className="text-sm font-medium text-zinc-300">💬 Customer Notes (optional)</span>
                  <span className="text-zinc-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-4 pb-4 pt-2">
                  <textarea
                    value={jobDetails.customerNotes}
                    onChange={(e) => setJobDetails(prev => ({ ...prev, customerNotes: e.target.value }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px] text-sm md:text-base resize-none"
                    placeholder="This will be shown to the customer"
                  />
                </div>
              </details>
            </div>

            {/* Status */}
            <div>
              <h3 className="text-base md:text-lg font-semibold text-zinc-100 mb-3 md:mb-4">Status</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                <label className="flex items-center gap-3 p-3 md:p-4 bg-zinc-800/30 border-2 border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-800/50 transition-all active:scale-95 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-500/10">
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

                <label className="flex items-center gap-3 p-3 md:p-4 bg-zinc-800/30 border-2 border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-800/50 transition-all active:scale-95 has-[:checked]:border-yellow-500 has-[:checked]:bg-yellow-500/10">
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

                <label className="flex items-center gap-3 p-3 md:p-4 bg-zinc-800/30 border-2 border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-800/50 transition-all active:scale-95 has-[:checked]:border-green-500 has-[:checked]:bg-green-500/10">
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
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex items-center justify-end gap-3 px-4 md:px-6 py-4 md:py-6 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-sm">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800 flex-1 md:flex-none min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !(selectedCustomer || (showNewCustomerForm && newCustomer.name && newCustomer.phone)) || !jobDetails.serviceType}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 flex-1 md:flex-none disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 min-h-[44px]"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                'Create Job'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
