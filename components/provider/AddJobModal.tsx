"use client"

import { useState, useEffect, useRef } from 'react';
import { X, Plus, Search, User, Sparkles, Users, Pencil } from 'lucide-react';
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

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  profilePhotoUrl?: string;
}

interface Crew {
  id: string;
  name: string;
  userIds: string[];
  users: TeamMember[];
  memberCount: number;
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
  const [conflict, setConflict] = useState<string | null>(null);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Team assignment state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(false);

  // Customer note templates
  const [noteTemplates, setNoteTemplates] = useState<string[]>([]);
  const [showManageTemplates, setShowManageTemplates] = useState(false);
  const [newTemplate, setNewTemplate] = useState('');
  const [savingTemplates, setSavingTemplates] = useState(false);

  // New customer fields
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  // Edit customer state
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Job details - NO auto-fill, user must choose everything
  const [jobDetails, setJobDetails] = useState({
    serviceType: '',
    customServiceType: '',
    appointmentType: 'anytime' as 'fixed' | 'anytime' | 'window', // Scheduling flexibility - determines date/time UI
    date: selectedDate ? selectedDate.toISOString().split('T')[0] : '', // NO DEFAULT
    startTime: selectedHour ? `${selectedHour.toString().padStart(2, '0')}:00` : '', // NO DEFAULT
    duration: '', // NO DEFAULT - in minutes for consistency
    endTime: '',
    windowStart: '08:00', // For window appointments
    windowEnd: '12:00', // For window appointments
    estimatedValue: '',
    internalNotes: '',
    customerNotes: '',
    status: 'scheduled' as 'scheduled' | 'in_progress' | 'completed',
    isRecurring: false,
    recurringFrequency: '',
    recurringEndDate: '',
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

  // Fetch customer note templates
  useEffect(() => {
    if (isOpen && providerId) {
      const fetchTemplates = async () => {
        try {
          const res = await fetch(`/api/provider/settings/note-templates?providerId=${providerId}`);
          const data = await res.json();
          if (data.templates && data.templates.length > 0) {
            setNoteTemplates(data.templates);
          } else {
            // Default templates if none saved
            setNoteTemplates([
              "We'll arrive within your scheduled time window. Please ensure access to the work area.",
              "Payment is due upon completion of service.",
              "Please secure pets before our arrival.",
              "Gate code required - please provide before appointment.",
              "We'll text when our technician is on the way.",
            ]);
          }
        } catch (error) {
          console.error('Failed to fetch note templates:', error);
          // Use defaults on error
          setNoteTemplates([
            "We'll arrive within your scheduled time window. Please ensure access to the work area.",
            "Payment is due upon completion of service.",
            "Please secure pets before our arrival.",
          ]);
        }
      };
      fetchTemplates();
    }
  }, [isOpen, providerId]);

  // Save templates
  const handleSaveTemplates = async () => {
    setSavingTemplates(true);
    try {
      const res = await fetch('/api/provider/settings/note-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, templates: noteTemplates }),
      });
      if (res.ok) {
        toast.success('Templates saved');
        setShowManageTemplates(false);
      } else {
        toast.error('Failed to save templates');
      }
    } catch (error) {
      toast.error('Failed to save templates');
    } finally {
      setSavingTemplates(false);
    }
  };

  const handleAddTemplate = () => {
    if (newTemplate.trim() && noteTemplates.length < 20) {
      setNoteTemplates([...noteTemplates, newTemplate.trim()]);
      setNewTemplate('');
    }
  };

  const handleRemoveTemplate = (index: number) => {
    setNoteTemplates(noteTemplates.filter((_, i) => i !== index));
  };

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

  // Check for conflicts when date/time/duration/workers changes
  // Only check conflicts when workers are assigned
  useEffect(() => {
    const checkConflicts = async () => {
      // Only check for conflicts if workers are assigned
      if (!jobDetails.date || !jobDetails.startTime || !jobDetails.duration || selectedUserIds.length === 0) {
        setConflict(null);
        return;
      }

      setCheckingConflict(true);
      try {
        const startDateTime = new Date(`${jobDetails.date}T${jobDetails.startTime}`);
        const durationMinutes = parseFloat(jobDetails.duration) * 60;

        const res = await fetch('/api/provider/jobs/check-conflicts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId,
            startTime: startDateTime.toISOString(),
            duration: durationMinutes,
            workerIds: selectedUserIds,
          })
        });

        const result = await res.json();

        if (result.hasConflict) {
          setConflict(result.message);
        } else {
          setConflict(null);
        }
      } catch (error) {
        console.error('Error checking conflicts:', error);
        setConflict(null); // Don't block on error
      } finally {
        setCheckingConflict(false);
      }
    };

    const timeoutId = setTimeout(checkConflicts, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [jobDetails.date, jobDetails.startTime, jobDetails.duration, selectedUserIds, providerId]);

  // Load team members and crews when modal opens
  useEffect(() => {
    const fetchTeamData = async () => {
      if (!isOpen) return;

      setLoadingTeam(true);
      try {
        // Fetch team members
        const teamRes = await fetch(`/api/provider/team?providerId=${providerId}`);
        const teamData = await teamRes.json();
        if (teamRes.ok) {
          setTeamMembers(teamData.users || []);
        }

        // Fetch crews
        const crewsRes = await fetch(`/api/provider/crews?providerId=${providerId}`);
        const crewsData = await crewsRes.json();
        if (crewsRes.ok) {
          setCrews(crewsData.crews || []);
        }
      } catch (error) {
        console.error('Error loading team data:', error);
      } finally {
        setLoadingTeam(false);
      }
    };

    fetchTeamData();
  }, [isOpen, providerId]);

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

  // Handle edit customer
  const openEditCustomerModal = () => {
    if (selectedCustomer) {
      setEditCustomerData({
        name: selectedCustomer.name || '',
        phone: selectedCustomer.phone || '',
        email: selectedCustomer.email || '',
        address: '', // Will need to fetch if stored
      });
      setShowEditCustomerModal(true);
    }
  };

  const handleSaveCustomer = async () => {
    if (!selectedCustomer) return;

    setSavingCustomer(true);
    try {
      const res = await fetch(`/api/provider/customers/${selectedCustomer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          name: editCustomerData.name,
          phone: editCustomerData.phone,
          email: editCustomerData.email,
          address: editCustomerData.address || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to update customer');

      // Update the selected customer with new data
      setSelectedCustomer({
        ...selectedCustomer,
        name: editCustomerData.name,
        phone: editCustomerData.phone,
        email: editCustomerData.email,
      });

      toast.success('Customer updated');
      setShowEditCustomerModal(false);
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer');
    } finally {
      setSavingCustomer(false);
    }
  };

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
      // Calculate start/end times based on appointment type
      let startDateTime: Date;
      let endDateTime: Date;
      const durationHours = jobDetails.duration ? parseFloat(jobDetails.duration) : 2; // Default 2 hours

      if (jobDetails.appointmentType === 'fixed') {
        // Fixed: use exact start time
        startDateTime = new Date(`${jobDetails.date}T${jobDetails.startTime || '09:00'}`);
        endDateTime = new Date(startDateTime.getTime() + durationHours * 60 * 60 * 1000);
      } else if (jobDetails.appointmentType === 'anytime') {
        // Anytime: set to business hours (8am-5pm) but mark as flexible
        startDateTime = new Date(`${jobDetails.date}T08:00`);
        endDateTime = new Date(`${jobDetails.date}T17:00`);
      } else if (jobDetails.appointmentType === 'window') {
        // Window: use the window start time
        startDateTime = new Date(`${jobDetails.date}T${jobDetails.windowStart || '08:00'}`);
        endDateTime = new Date(`${jobDetails.date}T${jobDetails.windowEnd || '12:00'}`);
      } else {
        // Fallback
        startDateTime = new Date(`${jobDetails.date}T${jobDetails.startTime || '09:00'}`);
        endDateTime = new Date(startDateTime.getTime() + durationHours * 60 * 60 * 1000);
      }

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
        appointmentType: jobDetails.appointmentType,
        arrivalWindowStart: jobDetails.appointmentType === 'window' ? startDateTime.toISOString() : null,
        arrivalWindowEnd: jobDetails.appointmentType === 'window' ? endDateTime.toISOString() : null,
        estimatedDuration: durationHours * 60, // Send in minutes
        isRecurring: jobDetails.isRecurring,
        recurringFrequency: jobDetails.isRecurring ? jobDetails.recurringFrequency : null,
        recurringEndDate: jobDetails.isRecurring && jobDetails.recurringEndDate ? jobDetails.recurringEndDate : null,
        assignedUserIds: selectedUserIds,
      };

      const res = await fetch('/api/provider/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('📥 Job creation response:', {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        headers: Object.fromEntries(res.headers.entries()),
      });

      let data;
      try {
        const responseText = await res.text();
        console.log('📄 Response body:', responseText.substring(0, 200));
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        throw new Error('Invalid response from server. Please check console for details.');
      }

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
      appointmentType: 'anytime',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      duration: '2',
      endTime: '',
      windowStart: '08:00',
      windowEnd: '12:00',
      estimatedValue: '',
      internalNotes: '',
      customerNotes: '',
      status: 'scheduled',
      isRecurring: false,
      recurringFrequency: '',
      recurringEndDate: '',
    });
    setSelectedUserIds([]);
    setSelectedCrew(null);
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
      <div className="bg-zinc-900 w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-hidden shadow-2xl border-t md:border border-zinc-800 flex flex-col">
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
        <div className="flex-shrink-0 border-b border-zinc-800">
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

        {/* Context Banner - shows when adding from calendar */}
        {selectedDate && (
          <div className="mx-4 md:mx-6 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-sm font-medium text-emerald-400">
              📅 Adding job for {new Date(jobDetails.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
              {selectedHour !== undefined && (
                <span className="ml-2">
                  at {selectedHour > 12 ? selectedHour - 12 : selectedHour}:00 {selectedHour >= 12 ? 'PM' : 'AM'}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
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
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          onClick={openEditCustomerModal}
                          variant="ghost"
                          size="sm"
                          className="text-zinc-400 hover:text-zinc-100 px-2"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
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

                {/* Appointment Type - FIRST, determines date/time UI */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3">
                    Appointment Type <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'fixed', label: 'Fixed Time', icon: '📌', desc: 'Exact time required' },
                      { value: 'anytime', label: 'Anytime', icon: '🔄', desc: 'Flexible within day' },
                      { value: 'window', label: 'Time Window', icon: '⏰', desc: 'Arrival range' },
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setJobDetails(prev => ({ ...prev, appointmentType: type.value as 'fixed' | 'anytime' | 'window' }))}
                        className={`
                          p-3 rounded-lg border-2 transition-all text-left active:scale-95
                          ${jobDetails.appointmentType === type.value
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600 hover:bg-zinc-800/50'
                          }
                        `}
                      >
                        <div className="text-xl mb-1">{type.icon}</div>
                        <div className="text-xs font-medium text-zinc-200">{type.label}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{type.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Date & Time - Based on Appointment Type */}
                <div className="space-y-4 p-4 bg-zinc-800/30 border border-zinc-700 rounded-lg">
                  {/* FIXED TIME appointments */}
                  {jobDetails.appointmentType === 'fixed' && (
                    <>
                      <p className="text-sm text-zinc-400">Customer expects you at the exact scheduled time</p>
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
                            Exact Time <span className="text-red-400">*</span>
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
                    </>
                  )}

                  {/* ANYTIME appointments */}
                  {jobDetails.appointmentType === 'anytime' && (
                    <>
                      <p className="text-sm text-zinc-400">Flexible - just needs to be done this day. Route optimization will find the best order.</p>
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
                    </>
                  )}

                  {/* WINDOW appointments */}
                  {jobDetails.appointmentType === 'window' && (
                    <>
                      <p className="text-sm text-zinc-400">Customer expects arrival within a time range</p>
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
                          Arrival Window <span className="text-red-400">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">From</label>
                            <Listbox
                              value={jobDetails.windowStart}
                              onChange={(value) => setJobDetails(prev => ({ ...prev, windowStart: value, startTime: value }))}
                            >
                              <div className="relative">
                                <Listbox.Button className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-left">
                                  {timeOptions.find(t => t.value === jobDetails.windowStart)?.label || jobDetails.windowStart}
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
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">To</label>
                            <Listbox
                              value={jobDetails.windowEnd}
                              onChange={(value) => setJobDetails(prev => ({ ...prev, windowEnd: value }))}
                            >
                              <div className="relative">
                                <Listbox.Button className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-left">
                                  {timeOptions.find(t => t.value === jobDetails.windowEnd)?.label || jobDetails.windowEnd}
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
                        {/* Quick window presets */}
                        <div className="flex gap-2 flex-wrap mt-2">
                          {[
                            { label: 'Morning (8-12)', start: '08:00', end: '12:00' },
                            { label: 'Afternoon (12-5)', start: '12:00', end: '17:00' },
                            { label: 'All Day (8-5)', start: '08:00', end: '17:00' },
                          ].map(preset => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => {
                                setJobDetails(prev => ({
                                  ...prev,
                                  windowStart: preset.start,
                                  windowEnd: preset.end,
                                  startTime: preset.start,
                                }));
                              }}
                              className="px-3 py-1.5 rounded-lg bg-zinc-700/50 text-zinc-400 hover:bg-zinc-600/50 text-xs"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Conflict Warning */}
                {conflict && (
                  <div className="p-3 md:p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-red-400 text-lg">⚠️</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-400">Time Conflict Detected</p>
                        <p className="text-xs text-red-300 mt-1">{conflict}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Checking Conflict Indicator */}
                {checkingConflict && (
                  <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-xs text-yellow-400">Checking availability...</p>
                  </div>
                )}

                {/* Duration - Visual Button Picker */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3">
                    Estimated Duration
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

                {/* Recurring Job Options */}
                <div className="p-4 bg-zinc-800/30 border border-zinc-700 rounded-lg">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={jobDetails.isRecurring}
                      onChange={(e) => {
                        setJobDetails(prev => ({
                          ...prev,
                          isRecurring: e.target.checked,
                          recurringFrequency: e.target.checked ? 'weekly' : '',
                          recurringEndDate: '',
                        }));
                      }}
                      className="w-5 h-5 rounded border-zinc-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-zinc-200 group-hover:text-zinc-100">
                        ↻ Make this a recurring job
                      </span>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Automatically create this job on a schedule
                      </p>
                    </div>
                  </label>

                  {jobDetails.isRecurring && (
                    <div className="mt-4 space-y-3 pl-8 border-l-2 border-emerald-500/30">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Repeat Frequency
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'weekly', label: 'Weekly' },
                            { value: 'biweekly', label: 'Every 2 Weeks' },
                            { value: 'monthly', label: 'Monthly' },
                            { value: 'quarterly', label: 'Quarterly' },
                          ].map((freq) => (
                            <button
                              key={freq.value}
                              type="button"
                              onClick={() => setJobDetails(prev => ({ ...prev, recurringFrequency: freq.value }))}
                              className={`
                                py-2.5 px-3 rounded-lg border-2 transition-all text-sm font-medium active:scale-95
                                ${jobDetails.recurringFrequency === freq.value
                                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                  : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 text-zinc-300'
                                }
                              `}
                            >
                              {freq.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          End Date (optional)
                        </label>
                        <input
                          type="date"
                          value={jobDetails.recurringEndDate}
                          onChange={(e) => setJobDetails(prev => ({ ...prev, recurringEndDate: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                          placeholder="Leave empty for no end date"
                        />
                        <p className="text-xs text-zinc-500 mt-1.5">
                          Leave empty to continue indefinitely
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Team Assignment Section */}
            <div>
              <h3 className="text-base md:text-lg font-semibold text-zinc-100 mb-3 md:mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-emerald-400" />
                Assign Team (optional)
              </h3>

              <div className="space-y-4">
                {/* Crew Quick Select */}
                {crews.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Select Crew
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {crews.map((crew) => (
                        <button
                          key={crew.id}
                          type="button"
                          onClick={() => {
                            setSelectedCrew(crew);
                            setSelectedUserIds(crew.userIds);
                          }}
                          className={`
                            p-3 rounded-lg border-2 transition-all text-left active:scale-95
                            ${selectedCrew?.id === crew.id
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600'
                            }
                          `}
                        >
                          <p className="text-sm font-medium text-zinc-200">{crew.name}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{crew.memberCount} members</p>
                        </button>
                      ))}
                    </div>
                    <div className="text-center my-2">
                      <span className="text-xs text-zinc-500">or select individual members</span>
                    </div>
                  </div>
                )}

                {/* Individual Team Members */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Team Members
                  </label>
                  {loadingTeam ? (
                    <div className="p-4 text-center text-sm text-zinc-400">
                      Loading team members...
                    </div>
                  ) : teamMembers.length === 0 ? (
                    <div className="p-4 bg-zinc-800/30 border border-zinc-700 rounded-lg text-center">
                      <p className="text-sm text-zinc-400">No team members found</p>
                      <p className="text-xs text-zinc-500 mt-1">Add team members in Team Management</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-zinc-700 rounded-lg p-2">
                      {teamMembers.map((member) => {
                        const isSelected = selectedUserIds.includes(member.id);
                        return (
                          <label
                            key={member.id}
                            className={`
                              flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all
                              ${isSelected
                                ? 'bg-emerald-500/10 border-2 border-emerald-500/30'
                                : 'bg-zinc-800/30 border-2 border-transparent hover:bg-zinc-800/50'
                              }
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUserIds([...selectedUserIds, member.id]);
                                  setSelectedCrew(null); // Clear crew selection when manually selecting
                                } else {
                                  setSelectedUserIds(selectedUserIds.filter(id => id !== member.id));
                                  setSelectedCrew(null);
                                }
                              }}
                              className="w-4 h-4 rounded border-zinc-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900"
                            />
                            <div className="flex items-center gap-2 flex-1">
                              <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                {member.profilePhotoUrl ? (
                                  <img
                                    src={member.profilePhotoUrl}
                                    alt={`${member.firstName} ${member.lastName}`}
                                    className="h-8 w-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-medium text-emerald-400">
                                    {member.firstName[0]}{member.lastName[0]}
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-zinc-200">
                                  {member.firstName} {member.lastName}
                                </p>
                                <p className="text-xs text-zinc-500 capitalize">{member.role}</p>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected Users Summary */}
                {selectedUserIds.length > 0 && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <p className="text-xs text-emerald-400 font-medium mb-2">
                      {selectedUserIds.length} team member{selectedUserIds.length !== 1 ? 's' : ''} assigned
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectedUserIds.map(userId => {
                        const member = teamMembers.find(m => m.id === userId);
                        if (!member) return null;
                        return (
                          <button
                            key={userId}
                            type="button"
                            onClick={() => {
                              setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
                              setSelectedCrew(null);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                          >
                            {member.firstName} {member.lastName}
                            <X className="h-3 w-3" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                  {/* Quick-select templates header */}
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-zinc-500">Quick templates:</span>
                    <button
                      type="button"
                      onClick={() => setShowManageTemplates(true)}
                      className="text-xs text-emerald-500 hover:text-emerald-400 hover:underline"
                    >
                      Manage
                    </button>
                  </div>
                  {/* Quick-select templates */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {noteTemplates.map((template, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setJobDetails(prev => ({
                          ...prev,
                          customerNotes: prev.customerNotes ? `${prev.customerNotes}\n${template}` : template
                        }))}
                        className="text-xs px-2 py-1 bg-zinc-700/50 hover:bg-zinc-600/50 rounded text-zinc-400 hover:text-zinc-300 transition-colors"
                      >
                        + {template.slice(0, 20)}...
                      </button>
                    ))}
                  </div>
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
          <div className="flex-shrink-0 flex items-center justify-end gap-3 px-4 md:px-6 py-4 md:py-6 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-sm">
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
              disabled={submitting || !!conflict || !(selectedCustomer || (showNewCustomerForm && !!newCustomer.name && !!newCustomer.phone)) || !jobDetails.serviceType}
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

      {/* Edit Customer Modal */}
      {showEditCustomerModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowEditCustomerModal(false)} />
          <div className="relative bg-zinc-900 w-full max-w-md rounded-xl border border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">Edit Customer</h2>
              <button onClick={() => setShowEditCustomerModal(false)} className="p-1 hover:bg-zinc-800 rounded">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Name</label>
                <input
                  type="text"
                  value={editCustomerData.name}
                  onChange={(e) => setEditCustomerData({ ...editCustomerData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Phone</label>
                <input
                  type="tel"
                  value={editCustomerData.phone}
                  onChange={(e) => setEditCustomerData({ ...editCustomerData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
                <input
                  type="email"
                  value={editCustomerData.email}
                  onChange={(e) => setEditCustomerData({ ...editCustomerData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Address</label>
                <input
                  type="text"
                  value={editCustomerData.address}
                  onChange={(e) => setEditCustomerData({ ...editCustomerData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-zinc-800">
              <Button
                variant="outline"
                className="flex-1 border-zinc-700"
                onClick={() => setShowEditCustomerModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                onClick={handleSaveCustomer}
                disabled={savingCustomer || !editCustomerData.name}
              >
                {savingCustomer ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Templates Modal */}
      {showManageTemplates && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowManageTemplates(false)} />
          <div
            className="relative bg-zinc-900 w-full max-w-lg rounded-xl border border-zinc-800 overflow-hidden max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">Manage Note Templates</h2>
              <button onClick={() => setShowManageTemplates(false)} className="p-1 hover:bg-zinc-800 rounded">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <p className="text-sm text-zinc-400">
                Add custom templates that will appear as quick-select options when creating jobs.
              </p>

              {/* Add new template */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTemplate}
                  onChange={(e) => setNewTemplate(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTemplate()}
                  placeholder="Enter a new template message..."
                  className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                />
                <Button
                  type="button"
                  onClick={handleAddTemplate}
                  disabled={!newTemplate.trim() || noteTemplates.length >= 20}
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Existing templates */}
              <div className="space-y-2">
                {noteTemplates.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">
                    No templates yet. Add your first template above.
                  </p>
                ) : (
                  noteTemplates.map((template, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg"
                    >
                      <span className="flex-1 text-sm text-zinc-200">{template}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTemplate(index)}
                        className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {noteTemplates.length >= 20 && (
                <p className="text-xs text-amber-400">Maximum of 20 templates reached.</p>
              )}
            </div>
            <div className="flex gap-3 p-4 border-t border-zinc-800">
              <Button
                variant="outline"
                className="flex-1 border-zinc-700"
                onClick={() => setShowManageTemplates(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                onClick={handleSaveTemplates}
                disabled={savingTemplates}
              >
                {savingTemplates ? 'Saving...' : 'Save Templates'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
