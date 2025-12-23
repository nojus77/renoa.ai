"use client"

import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Plus, Search, User, Sparkles, Users, Pencil, AlertTriangle, Check, ChevronDown } from 'lucide-react';
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
  address?: string;
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  profilePhotoUrl?: string;
  workerSkills?: Array<{ skillId: string; skill: { id: string; name: string } }>;
}

interface Crew {
  id: string;
  name: string;
  userIds: string[];
  users: TeamMember[];
  memberCount: number;
}

interface SkillInfo {
  id: string;
  name: string;
  category: string | null;
}

interface ServiceConfig {
  id: string;
  serviceType: string;
  durationMinutes: number; // in hours
  crewSizeMin: number;
  crewSizeMax: number;
  requiredSkillIds: string[];
  preferredSkillIds: string[];
  requiredSkills: SkillInfo[];
  preferredSkills: SkillInfo[];
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Service configuration state
  const [serviceConfigs, setServiceConfigs] = useState<ServiceConfig[]>([]);
  const [allSkills, setAllSkills] = useState<SkillInfo[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [selectedServiceConfig, setSelectedServiceConfig] = useState<ServiceConfig | null>(null);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showCreateService, setShowCreateService] = useState(false);

  // New service form
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState(60);
  const [newServiceWorkers, setNewServiceWorkers] = useState(1);
  const [newServiceSkills, setNewServiceSkills] = useState<string[]>([]);
  const [creatingService, setCreatingService] = useState(false);

  // Team assignment state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(false);

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

  // Duration picker state
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [customDurationValue, setCustomDurationValue] = useState('');
  const [averageDuration, setAverageDuration] = useState<{ average: number; count: number } | null>(null);
  const DURATION_OPTIONS = [
    { minutes: 30, label: '30min' },
    { minutes: 45, label: '45min' },
    { minutes: 60, label: '1h' },
    { minutes: 90, label: '1h 30min' },
    { minutes: 120, label: '2h' },
    { minutes: 150, label: '2h 30min' },
    { minutes: 180, label: '3h' },
  ];

  // Job details - structured fields
  const [jobDetails, setJobDetails] = useState({
    // From service config
    durationMinutes: 60,
    requiredWorkerCount: 1,
    requiredSkillIds: [] as string[],
    preferredSkillIds: [] as string[],
    bufferMinutes: 15,
    // Override settings
    allowUnqualified: false,
    unqualifiedReason: '',
    // Scheduling
    appointmentType: 'anytime' as 'fixed' | 'anytime' | 'window',
    date: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
    startTime: selectedHour ? `${selectedHour.toString().padStart(2, '0')}:00` : '',
    windowStart: '08:00',
    windowEnd: '12:00',
    // Notes - separated
    customerNotes: '',
    jobInstructions: '',
    // Other
    estimatedValue: '',
    status: 'scheduled' as 'scheduled' | 'in_progress' | 'completed',
    isRecurring: false,
    recurringFrequency: '',
    recurringEndDate: '',
  });

  // Generate time options (6:00 AM to 8:00 PM in 30-minute increments)
  const timeOptions = useMemo(() => {
    const options = [];
    for (let hour = 6; hour <= 20; hour++) {
      for (const minute of [0, 30]) {
        const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const period = hour >= 12 ? 'PM' : 'AM';
        const timeLabel = `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
        options.push({ value: time24, label: timeLabel });
      }
    }
    return options;
  }, []);

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Fetch service configs and skills when modal opens
  useEffect(() => {
    const fetchServiceConfigs = async () => {
      if (!isOpen || !providerId) return;

      setLoadingConfigs(true);
      try {
        const res = await fetch(`/api/provider/services/config?providerId=${providerId}`);
        const data = await res.json();
        if (res.ok) {
          setServiceConfigs(data.configs || []);
          setAllSkills(data.skills || []);
        }
      } catch (error) {
        console.error('Error fetching service configs:', error);
      } finally {
        setLoadingConfigs(false);
      }
    };

    fetchServiceConfigs();
  }, [isOpen, providerId]);

  // Filter services based on search
  const filteredServices = useMemo(() => {
    if (!serviceSearchQuery) return serviceConfigs;
    const query = serviceSearchQuery.toLowerCase();
    return serviceConfigs.filter(c =>
      c.serviceType.toLowerCase().includes(query)
    );
  }, [serviceConfigs, serviceSearchQuery]);

  // Check worker qualification
  const getWorkerQualification = (member: TeamMember): { qualified: boolean; missingSkills: string[] } => {
    if (!selectedServiceConfig || jobDetails.requiredSkillIds.length === 0) {
      return { qualified: true, missingSkills: [] };
    }

    const workerSkillIds = member.workerSkills?.map(ws => ws.skillId) || [];
    const missingSkillIds = jobDetails.requiredSkillIds.filter(id => !workerSkillIds.includes(id));
    const missingSkillNames = missingSkillIds.map(id => {
      const skill = allSkills.find(s => s.id === id);
      return skill?.name || id;
    });

    return {
      qualified: missingSkillIds.length === 0,
      missingSkills: missingSkillNames,
    };
  };

  // Handle service selection
  const handleSelectService = async (config: ServiceConfig) => {
    setSelectedServiceConfig(config);
    setShowServiceDropdown(false);
    setServiceSearchQuery('');
    setShowCustomDuration(false);
    setCustomDurationValue('');
    setAverageDuration(null);

    // Auto-fill from config
    setJobDetails(prev => ({
      ...prev,
      durationMinutes: Math.round(config.durationMinutes * 60),
      requiredWorkerCount: config.crewSizeMin,
      requiredSkillIds: config.requiredSkillIds,
      preferredSkillIds: config.preferredSkillIds,
    }));

    // Fetch average duration for this service type
    try {
      const res = await fetch(`/api/provider/services/average-duration?providerId=${providerId}&serviceType=${encodeURIComponent(config.serviceType)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.average && data.count >= 3) {
          setAverageDuration({ average: data.average, count: data.count });
        }
      }
    } catch (error) {
      // Silently fail - average hint is optional
      console.error('Error fetching average duration:', error);
    }
  };

  // Create new service
  const handleCreateService = async () => {
    if (!newServiceName.trim()) {
      toast.error('Service name is required');
      return;
    }

    setCreatingService(true);
    try {
      const res = await fetch('/api/provider/services/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          serviceType: newServiceName.trim(),
          durationMinutes: newServiceDuration,
          crewSizeMin: newServiceWorkers,
          requiredSkillIds: newServiceSkills,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create service');
      }

      // Add to configs and select it
      const newConfig: ServiceConfig = {
        id: data.config.id,
        serviceType: data.config.serviceType,
        durationMinutes: data.config.durationMinutes,
        crewSizeMin: data.config.crewSizeMin || newServiceWorkers,
        crewSizeMax: data.config.crewSizeMax || 4,
        requiredSkillIds: data.config.requiredSkillIds || newServiceSkills,
        preferredSkillIds: data.config.preferredSkillIds || [],
        requiredSkills: data.config.requiredSkills || [],
        preferredSkills: data.config.preferredSkills || [],
      };

      setServiceConfigs(prev => [...prev, newConfig]);
      handleSelectService(newConfig);

      // Reset form
      setShowCreateService(false);
      setNewServiceName('');
      setNewServiceDuration(60);
      setNewServiceWorkers(1);
      setNewServiceSkills([]);

      toast.success('Service created successfully');
    } catch (error: any) {
      console.error('Error creating service:', error);
      toast.error(error.message || 'Failed to create service');
    } finally {
      setCreatingService(false);
    }
  };

  // Remove skill from requirements
  const handleRemoveSkill = (skillId: string) => {
    setJobDetails(prev => ({
      ...prev,
      requiredSkillIds: prev.requiredSkillIds.filter(id => id !== skillId),
    }));
  };

  // Add skill to requirements
  const handleAddSkill = (skillId: string) => {
    if (!jobDetails.requiredSkillIds.includes(skillId)) {
      setJobDetails(prev => ({
        ...prev,
        requiredSkillIds: [...prev.requiredSkillIds, skillId],
      }));
    }
  };

  // Check for conflicts when date/time/duration/workers changes
  useEffect(() => {
    const checkConflicts = async () => {
      if (!jobDetails.date || !jobDetails.durationMinutes || selectedUserIds.length === 0) {
        setConflict(null);
        return;
      }

      // Only check for fixed appointments
      if (jobDetails.appointmentType !== 'fixed' || !jobDetails.startTime) {
        setConflict(null);
        return;
      }

      setCheckingConflict(true);
      try {
        const startDateTime = new Date(`${jobDetails.date}T${jobDetails.startTime}`);

        const res = await fetch('/api/provider/jobs/check-conflicts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId,
            startTime: startDateTime.toISOString(),
            duration: jobDetails.durationMinutes,
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
        setConflict(null);
      } finally {
        setCheckingConflict(false);
      }
    };

    const timeoutId = setTimeout(checkConflicts, 500);
    return () => clearTimeout(timeoutId);
  }, [jobDetails.date, jobDetails.startTime, jobDetails.durationMinutes, jobDetails.appointmentType, selectedUserIds, providerId]);

  // Load team members and crews when modal opens
  useEffect(() => {
    const fetchTeamData = async () => {
      if (!isOpen) return;

      setLoadingTeam(true);
      try {
        const teamRes = await fetch(`/api/provider/team?providerId=${providerId}`);
        const teamData = await teamRes.json();
        if (teamRes.ok) {
          setTeamMembers(teamData.users || []);
        }

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

    const timeoutId = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, providerId]);

  // Handle edit customer
  const openEditCustomerModal = () => {
    if (selectedCustomer) {
      setEditCustomerData({
        name: selectedCustomer.name || '',
        phone: selectedCustomer.phone || '',
        email: selectedCustomer.email || '',
        address: selectedCustomer.address || '',
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

      setSelectedCustomer({
        ...selectedCustomer,
        name: editCustomerData.name,
        phone: editCustomerData.phone,
        email: editCustomerData.email,
        address: editCustomerData.address,
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

    if (!selectedServiceConfig) {
      toast.error('Please select a service type');
      return;
    }

    if (!jobDetails.durationMinutes || jobDetails.durationMinutes <= 0) {
      toast.error('Please specify a valid duration');
      return;
    }

    if (!jobDetails.date) {
      toast.error('Please select a date');
      return;
    }

    // Check if worker selected but unqualified without override
    if (selectedUserIds.length > 0 && !jobDetails.allowUnqualified) {
      for (const userId of selectedUserIds) {
        const member = teamMembers.find(m => m.id === userId);
        if (member) {
          const { qualified, missingSkills } = getWorkerQualification(member);
          if (!qualified) {
            toast.error(`${member.firstName} is missing required skills: ${missingSkills.join(', ')}. Check "Allow unqualified" to proceed.`);
            return;
          }
        }
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

      // Calculate start/end times based on appointment type
      let startDateTime: Date;
      const durationHours = jobDetails.durationMinutes / 60;

      if (jobDetails.appointmentType === 'fixed') {
        startDateTime = new Date(`${jobDetails.date}T${jobDetails.startTime || '09:00'}`);
      } else if (jobDetails.appointmentType === 'anytime') {
        // Anytime: set to business hours start
        startDateTime = new Date(`${jobDetails.date}T08:00`);
      } else if (jobDetails.appointmentType === 'window') {
        startDateTime = new Date(`${jobDetails.date}T${jobDetails.windowStart || '08:00'}`);
      } else {
        startDateTime = new Date(`${jobDetails.date}T${jobDetails.startTime || '09:00'}`);
      }

      const payload = {
        providerId,
        customerId,
        customerAddress: showNewCustomerForm ? newCustomer.address : selectedCustomer?.address,
        // Structured service data
        serviceType: selectedServiceConfig.serviceType,
        serviceTypeConfigId: selectedServiceConfig.id,
        // Skill requirements
        requiredSkillIds: jobDetails.requiredSkillIds,
        preferredSkillIds: jobDetails.preferredSkillIds,
        requiredWorkerCount: jobDetails.requiredWorkerCount,
        bufferMinutes: jobDetails.bufferMinutes,
        // Override
        allowUnqualified: jobDetails.allowUnqualified,
        unqualifiedOverrideReason: jobDetails.allowUnqualified ? jobDetails.unqualifiedReason : null,
        // Time
        startTime: startDateTime.toISOString(),
        duration: durationHours,
        durationMinutes: jobDetails.durationMinutes,
        appointmentType: jobDetails.appointmentType,
        arrivalWindowStart: jobDetails.appointmentType === 'window'
          ? new Date(`${jobDetails.date}T${jobDetails.windowStart}`).toISOString()
          : null,
        arrivalWindowEnd: jobDetails.appointmentType === 'window'
          ? new Date(`${jobDetails.date}T${jobDetails.windowEnd}`).toISOString()
          : null,
        // Notes - separated
        customerNotes: jobDetails.customerNotes || null,
        jobInstructions: jobDetails.jobInstructions || null,
        // Other
        estimatedValue: jobDetails.estimatedValue ? parseFloat(jobDetails.estimatedValue) : null,
        status: jobDetails.status,
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

      let data;
      try {
        const responseText = await res.text();
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid response from server');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create job');
      }

      setShowSuccessAnimation(true);
      toast.success('Job created successfully!');

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
    setSelectedServiceConfig(null);
    setServiceSearchQuery('');
    setNewCustomer({ name: '', phone: '', email: '', address: '' });
    setJobDetails({
      durationMinutes: 60,
      requiredWorkerCount: 1,
      requiredSkillIds: [],
      preferredSkillIds: [],
      bufferMinutes: 15,
      allowUnqualified: false,
      unqualifiedReason: '',
      appointmentType: 'anytime',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      windowStart: '08:00',
      windowEnd: '12:00',
      customerNotes: '',
      jobInstructions: '',
      estimatedValue: '',
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

      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Calculate form progress
  const calculateProgress = () => {
    let completed = 0;
    const total = 3;

    if (selectedCustomer || (showNewCustomerForm && newCustomer.name && newCustomer.phone)) completed++;
    if (selectedServiceConfig) completed++;
    if (jobDetails.date) completed++;

    return (completed / total) * 100;
  };

  // Format duration display
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-zinc-900 w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-hidden shadow-2xl border-t md:border border-zinc-800 flex flex-col">
        {/* Success Animation Overlay */}
        {showSuccessAnimation && (
          <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-300">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">✓</div>
              <p className="text-xl font-semibold text-emerald-400">Job Created!</p>
            </div>
          </div>
        )}

        {/* Header with Progress */}
        <div className="flex-shrink-0 border-b border-zinc-800">
          <div className="flex items-center justify-between px-4 md:px-6 py-4 md:py-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-zinc-100">New Job</h2>
              <p className="text-xs text-zinc-500 mt-1">{Math.round(calculateProgress())}% complete</p>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="h-1 bg-zinc-800">
            <div className="h-full bg-emerald-500 transition-all duration-300 ease-out" style={{ width: `${calculateProgress()}%` }} />
          </div>
        </div>

        {/* Context Banner */}
        {selectedDate && (
          <div className="mx-4 md:mx-6 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-sm font-medium text-emerald-400">
              Adding job for {new Date(jobDetails.date).toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
              })}
              {selectedHour !== undefined && (
                <span className="ml-2">at {selectedHour > 12 ? selectedHour - 12 : selectedHour}:00 {selectedHour >= 12 ? 'PM' : 'AM'}</span>
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
                Customer <span className="text-red-400">*</span>
              </h3>

              {!showNewCustomerForm ? (
                <div className="space-y-3">
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
                        if (searchQuery.length >= 2 && customers.length > 0) setShowDropdown(true);
                      }}
                      placeholder="Search customer by name, phone, or email..."
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base"
                      disabled={!!selectedCustomer}
                    />

                    {showDropdown && !selectedCustomer && searchQuery.length >= 2 && (
                      <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searching ? (
                          <div className="p-4 text-center text-sm text-zinc-400">Searching...</div>
                        ) : customers.length > 0 ? (
                          customers.map((customer) => (
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
                          ))
                        ) : (
                          <div className="p-4 text-center">
                            <p className="text-sm text-zinc-400 mb-2">No customers found</p>
                            <Button
                              type="button"
                              onClick={() => { setShowNewCustomerForm(true); setShowDropdown(false); }}
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
                        <Button type="button" onClick={openEditCustomerModal} variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100 px-2">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button type="button" onClick={() => { setSelectedCustomer(null); setSearchQuery(''); }} variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100">
                          Change
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="text-center"><span className="text-sm text-zinc-500">or</span></div>

                  <Button type="button" onClick={() => setShowNewCustomerForm(true)} variant="outline" className="w-full border-zinc-700 hover:bg-zinc-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Customer
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 p-3 md:p-4 bg-zinc-800/30 border border-zinc-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-zinc-300">New Customer Details</p>
                    <Button type="button" onClick={() => setShowNewCustomerForm(false)} variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100 text-xs">
                      Cancel
                    </Button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Name <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Phone <span className="text-red-400">*</span></label>
                      <input
                        type="tel"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
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
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Address</label>
                    <AddressAutocomplete
                      value={newCustomer.address}
                      onChange={(value) => setNewCustomer(prev => ({ ...prev, address: value }))}
                      onAddressSelect={(components) => setNewCustomer(prev => ({ ...prev, address: components.fullAddress }))}
                      placeholder="123 Main St, City, State"
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Service Type Section - Structured */}
            <div>
              <h3 className="text-base md:text-lg font-semibold text-zinc-100 mb-3 md:mb-4">
                Service Type <span className="text-red-400">*</span>
              </h3>

              {!showCreateService ? (
                <div className="space-y-4">
                  {/* Service Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {selectedServiceConfig ? (
                        <span className="text-zinc-100">{selectedServiceConfig.serviceType}</span>
                      ) : (
                        <span className="text-zinc-500">Search or select service...</span>
                      )}
                      <ChevronDown className={`h-5 w-5 text-zinc-400 transition-transform ${showServiceDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showServiceDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg max-h-80 overflow-hidden">
                        {/* Search input */}
                        <div className="p-2 border-b border-zinc-700">
                          <input
                            type="text"
                            value={serviceSearchQuery}
                            onChange={(e) => setServiceSearchQuery(e.target.value)}
                            placeholder="Search services..."
                            className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-600 rounded text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            autoFocus
                          />
                        </div>

                        <div className="max-h-60 overflow-y-auto">
                          {loadingConfigs ? (
                            <div className="p-4 text-center text-sm text-zinc-400">Loading services...</div>
                          ) : filteredServices.length > 0 ? (
                            filteredServices.map((config) => (
                              <button
                                key={config.id}
                                type="button"
                                onClick={() => handleSelectService(config)}
                                className="w-full text-left px-4 py-3 hover:bg-zinc-700 border-b border-zinc-700/50 last:border-b-0 transition-colors"
                              >
                                <p className="text-sm font-medium text-zinc-100">{config.serviceType}</p>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                  {formatDuration(Math.round(config.durationMinutes * 60))} • {config.crewSizeMin} worker{config.crewSizeMin !== 1 ? 's' : ''}
                                  {config.requiredSkills.length > 0 && ` • ${config.requiredSkills.length} skill${config.requiredSkills.length !== 1 ? 's' : ''} required`}
                                </p>
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center text-sm text-zinc-400">
                              No services found
                            </div>
                          )}
                        </div>

                        {/* Create Custom Service */}
                        <div className="border-t border-zinc-700">
                          <button
                            type="button"
                            onClick={() => { setShowServiceDropdown(false); setShowCreateService(true); }}
                            className="w-full px-4 py-3 text-left hover:bg-zinc-700/50 transition-colors flex items-center gap-2 text-emerald-400"
                          >
                            <Plus className="h-4 w-4" />
                            <span className="text-sm font-medium">Create Custom Service</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected Service Details */}
                  {selectedServiceConfig && (
                    <div className="space-y-4 p-4 bg-zinc-800/30 border border-zinc-700 rounded-lg">
                      {/* Duration Quick Buttons */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Estimated Duration <span className="text-red-400">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {DURATION_OPTIONS.map(opt => {
                            const isSelected = jobDetails.durationMinutes === opt.minutes && !showCustomDuration;
                            const isDefault = selectedServiceConfig && Math.round(selectedServiceConfig.durationMinutes * 60) === opt.minutes;
                            return (
                              <button
                                key={opt.minutes}
                                type="button"
                                onClick={() => {
                                  setJobDetails(prev => ({ ...prev, durationMinutes: opt.minutes }));
                                  setShowCustomDuration(false);
                                  setCustomDurationValue('');
                                }}
                                className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  isSelected
                                    ? 'bg-emerald-500 text-white'
                                    : isDefault
                                      ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
                                      : 'bg-zinc-700/50 border border-zinc-600 text-zinc-300 hover:bg-zinc-700'
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => {
                              setShowCustomDuration(true);
                              setCustomDurationValue(jobDetails.durationMinutes.toString());
                            }}
                            className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              showCustomDuration
                                ? 'bg-emerald-500 text-white'
                                : 'bg-zinc-700/50 border border-zinc-600 text-zinc-300 hover:bg-zinc-700'
                            }`}
                          >
                            Custom
                          </button>
                        </div>

                        {/* Custom duration input */}
                        {showCustomDuration && (
                          <div className="flex items-center gap-2 mt-3">
                            <input
                              type="number"
                              value={customDurationValue}
                              onChange={(e) => {
                                setCustomDurationValue(e.target.value);
                                const val = parseInt(e.target.value);
                                if (val && val >= 15 && val <= 480) {
                                  setJobDetails(prev => ({ ...prev, durationMinutes: val }));
                                }
                              }}
                              placeholder="Enter minutes"
                              className="w-32 px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              min="15"
                              max="480"
                            />
                            <span className="text-sm text-zinc-400">min (15-480)</span>
                          </div>
                        )}

                        {/* Average duration hint */}
                        {averageDuration && (
                          <div className="mt-3 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <p className="text-xs text-blue-300">
                              Similar jobs average: {averageDuration.average} min ({averageDuration.count} jobs)
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Workers Needed */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Workers Needed</label>
                        <select
                          value={jobDetails.requiredWorkerCount}
                          onChange={(e) => setJobDetails(prev => ({ ...prev, requiredWorkerCount: parseInt(e.target.value) }))}
                          className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {[1, 2, 3, 4, 5, 6].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>

                      {/* Multi-worker warning */}
                      {jobDetails.requiredWorkerCount > 1 && (
                        <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                          <p className="text-xs text-amber-300">Multi-worker jobs require manual coordination (no auto-assign)</p>
                        </div>
                      )}

                      {/* Required Skills */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Required Skills</label>
                        <div className="flex flex-wrap gap-2">
                          {jobDetails.requiredSkillIds.map(skillId => {
                            const skill = allSkills.find(s => s.id === skillId);
                            return (
                              <span
                                key={skillId}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs text-emerald-300"
                              >
                                {skill?.name || skillId}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSkill(skillId)}
                                  className="hover:text-emerald-100"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            );
                          })}

                          {/* Add skill dropdown */}
                          {allSkills.filter(s => !jobDetails.requiredSkillIds.includes(s.id)).length > 0 && (
                            <Listbox value="" onChange={(skillId) => handleAddSkill(skillId)}>
                              <div className="relative">
                                <Listbox.Button className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-700/50 border border-zinc-600 rounded text-xs text-zinc-300 hover:bg-zinc-700">
                                  <Plus className="h-3 w-3" />
                                  Add
                                </Listbox.Button>
                                <Listbox.Options className="absolute z-10 mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                  {allSkills.filter(s => !jobDetails.requiredSkillIds.includes(s.id)).map(skill => (
                                    <Listbox.Option
                                      key={skill.id}
                                      value={skill.id}
                                      className={({ active }) => `cursor-pointer px-3 py-2 text-xs ${active ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-300'}`}
                                    >
                                      {skill.name}
                                    </Listbox.Option>
                                  ))}
                                </Listbox.Options>
                              </div>
                            </Listbox>
                          )}
                        </div>
                      </div>

                      {/* Allow Unqualified */}
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={jobDetails.allowUnqualified}
                          onChange={(e) => setJobDetails(prev => ({ ...prev, allowUnqualified: e.target.checked }))}
                          className="mt-0.5 w-4 h-4 rounded border-zinc-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900"
                        />
                        <div>
                          <span className="text-sm text-zinc-300 group-hover:text-zinc-100">Allow unqualified worker assignment</span>
                          <p className="text-xs text-zinc-500 mt-0.5">Workers without required skills can be assigned</p>
                        </div>
                      </label>

                      {jobDetails.allowUnqualified && (
                        <div>
                          <label className="block text-xs font-medium text-zinc-400 mb-1">Override Reason</label>
                          <input
                            type="text"
                            value={jobDetails.unqualifiedReason}
                            onChange={(e) => setJobDetails(prev => ({ ...prev, unqualifiedReason: e.target.value }))}
                            placeholder="Why are unqualified workers allowed?"
                            className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Create Custom Service Form */
                <div className="space-y-4 p-4 bg-zinc-800/30 border border-emerald-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-emerald-400">Create Custom Service</h4>
                    <Button type="button" onClick={() => setShowCreateService(false)} variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100 text-xs">
                      Cancel
                    </Button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Service Name <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      placeholder="e.g., Holiday Light Install"
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Duration (min)</label>
                      <input
                        type="number"
                        value={newServiceDuration}
                        onChange={(e) => setNewServiceDuration(parseInt(e.target.value) || 60)}
                        className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        min="15"
                        step="15"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Workers Needed</label>
                      <select
                        value={newServiceWorkers}
                        onChange={(e) => setNewServiceWorkers(parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {[1, 2, 3, 4, 5, 6].map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Required Skills</label>
                    <div className="flex flex-wrap gap-2">
                      {newServiceSkills.map(skillId => {
                        const skill = allSkills.find(s => s.id === skillId);
                        return (
                          <span key={skillId} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs text-emerald-300">
                            {skill?.name || skillId}
                            <button type="button" onClick={() => setNewServiceSkills(prev => prev.filter(id => id !== skillId))} className="hover:text-emerald-100">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        );
                      })}
                      {allSkills.filter(s => !newServiceSkills.includes(s.id)).length > 0 && (
                        <Listbox value="" onChange={(skillId: string) => setNewServiceSkills(prev => [...prev, skillId])}>
                          <div className="relative">
                            <Listbox.Button className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-700/50 border border-zinc-600 rounded text-xs text-zinc-300 hover:bg-zinc-700">
                              <Plus className="h-3 w-3" /> Add
                            </Listbox.Button>
                            <Listbox.Options className="absolute z-10 mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                              {allSkills.filter(s => !newServiceSkills.includes(s.id)).map(skill => (
                                <Listbox.Option key={skill.id} value={skill.id} className={({ active }) => `cursor-pointer px-3 py-2 text-xs ${active ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-300'}`}>
                                  {skill.name}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </div>
                        </Listbox>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="button" onClick={() => setShowCreateService(false)} variant="outline" className="flex-1 border-zinc-700">
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleCreateService} disabled={creatingService || !newServiceName.trim()} className="flex-1 bg-emerald-600 hover:bg-emerald-500">
                      {creatingService ? 'Creating...' : 'Create & Select'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Schedule Section */}
            <div>
              <h3 className="text-base md:text-lg font-semibold text-zinc-100 mb-3 md:mb-4">
                Schedule <span className="text-red-400">*</span>
              </h3>

              <div className="space-y-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Date <span className="text-red-400">*</span></label>
                  <input
                    type="date"
                    value={jobDetails.date}
                    onChange={(e) => setJobDetails(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base"
                    required
                  />
                </div>

                {/* Appointment Type */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3">Scheduling</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'anytime', label: 'Anytime', desc: 'Flexible within day' },
                      { value: 'fixed', label: 'Fixed Time', desc: 'Exact time required' },
                      { value: 'window', label: 'Time Window', desc: 'Arrival range' },
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setJobDetails(prev => ({ ...prev, appointmentType: type.value as 'fixed' | 'anytime' | 'window' }))}
                        className={`p-3 rounded-lg border-2 transition-all text-left active:scale-95 ${
                          jobDetails.appointmentType === type.value
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600 hover:bg-zinc-800/50'
                        }`}
                      >
                        <div className="text-xs font-medium text-zinc-200">{type.label}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{type.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time selection based on appointment type */}
                <div className="p-4 bg-zinc-800/30 border border-zinc-700 rounded-lg">
                  {jobDetails.appointmentType === 'anytime' && (
                    <div className="text-center py-2">
                      <p className="text-sm text-zinc-400">
                        Duration: <span className="text-emerald-400 font-medium">{formatDuration(jobDetails.durationMinutes)}</span>
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">Scheduled by optimizer within business hours</p>
                    </div>
                  )}

                  {jobDetails.appointmentType === 'fixed' && (
                    <div className="space-y-3">
                      <p className="text-sm text-zinc-400">Customer expects you at the exact scheduled time</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-zinc-400 mb-1">Start Time</label>
                          <Listbox value={jobDetails.startTime} onChange={(value) => setJobDetails(prev => ({ ...prev, startTime: value }))}>
                            <div className="relative">
                              <Listbox.Button className="w-full px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-left">
                                {jobDetails.startTime ? timeOptions.find(t => t.value === jobDetails.startTime)?.label || jobDetails.startTime : 'Select time'}
                              </Listbox.Button>
                              <Listbox.Options className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {timeOptions.map((time) => (
                                  <Listbox.Option key={time.value} value={time.value} className={({ active }) => `cursor-pointer px-4 py-2 text-sm ${active ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-300'}`}>
                                    {time.label}
                                  </Listbox.Option>
                                ))}
                              </Listbox.Options>
                            </div>
                          </Listbox>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-400 mb-1">End Time (calculated)</label>
                          <div className="px-4 py-2 bg-zinc-800/30 border border-zinc-700 rounded-lg text-zinc-400 text-sm">
                            {jobDetails.startTime && jobDetails.durationMinutes ? (() => {
                              const [hours, minutes] = jobDetails.startTime.split(':').map(Number);
                              const startMinutes = hours * 60 + minutes;
                              const endMinutes = startMinutes + jobDetails.durationMinutes;
                              const endHours = Math.floor(endMinutes / 60) % 24;
                              const endMins = endMinutes % 60;
                              const hour12 = endHours > 12 ? endHours - 12 : endHours === 0 ? 12 : endHours;
                              const period = endHours >= 12 ? 'PM' : 'AM';
                              return `${hour12}:${endMins.toString().padStart(2, '0')} ${period}`;
                            })() : '--:--'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {jobDetails.appointmentType === 'window' && (
                    <div className="space-y-3">
                      <p className="text-sm text-zinc-400">Customer expects arrival within a time range</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-zinc-500 mb-1 block">From</label>
                          <Listbox value={jobDetails.windowStart} onChange={(value) => setJobDetails(prev => ({ ...prev, windowStart: value }))}>
                            <div className="relative">
                              <Listbox.Button className="w-full px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-left">
                                {timeOptions.find(t => t.value === jobDetails.windowStart)?.label || jobDetails.windowStart}
                              </Listbox.Button>
                              <Listbox.Options className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {timeOptions.map((time) => (
                                  <Listbox.Option key={time.value} value={time.value} className={({ active }) => `cursor-pointer px-4 py-2 text-sm ${active ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-300'}`}>
                                    {time.label}
                                  </Listbox.Option>
                                ))}
                              </Listbox.Options>
                            </div>
                          </Listbox>
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500 mb-1 block">To</label>
                          <Listbox value={jobDetails.windowEnd} onChange={(value) => setJobDetails(prev => ({ ...prev, windowEnd: value }))}>
                            <div className="relative">
                              <Listbox.Button className="w-full px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-left">
                                {timeOptions.find(t => t.value === jobDetails.windowEnd)?.label || jobDetails.windowEnd}
                              </Listbox.Button>
                              <Listbox.Options className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {timeOptions.map((time) => (
                                  <Listbox.Option key={time.value} value={time.value} className={({ active }) => `cursor-pointer px-4 py-2 text-sm ${active ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-300'}`}>
                                    {time.label}
                                  </Listbox.Option>
                                ))}
                              </Listbox.Options>
                            </div>
                          </Listbox>
                        </div>
                      </div>
                      {/* Quick window presets */}
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { label: 'Morning (8-12)', start: '08:00', end: '12:00' },
                          { label: 'Afternoon (12-5)', start: '12:00', end: '17:00' },
                          { label: 'All Day (8-5)', start: '08:00', end: '17:00' },
                        ].map(preset => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setJobDetails(prev => ({ ...prev, windowStart: preset.start, windowEnd: preset.end }))}
                            className="px-3 py-1.5 rounded-lg bg-zinc-700/50 text-zinc-400 hover:bg-zinc-600/50 text-xs"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Conflict Warning */}
                {conflict && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-400">Time Conflict Detected</p>
                      <p className="text-xs text-red-300 mt-1">{conflict}</p>
                    </div>
                  </div>
                )}

                {checkingConflict && (
                  <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-xs text-yellow-400">Checking availability...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Team Assignment Section - with skill checking */}
            <div>
              <h3 className="text-base md:text-lg font-semibold text-zinc-100 mb-3 md:mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-emerald-400" />
                Assign To (optional)
              </h3>

              <div className="space-y-4">
                {/* Crew Quick Select */}
                {crews.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Select Crew</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {crews.map((crew) => (
                        <button
                          key={crew.id}
                          type="button"
                          onClick={() => { setSelectedCrew(crew); setSelectedUserIds(crew.userIds); }}
                          className={`p-3 rounded-lg border-2 transition-all text-left active:scale-95 ${
                            selectedCrew?.id === crew.id
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600'
                          }`}
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

                {/* Individual Team Members with skill status */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Team Members</label>
                  {loadingTeam ? (
                    <div className="p-4 text-center text-sm text-zinc-400">Loading team members...</div>
                  ) : teamMembers.length === 0 ? (
                    <div className="p-4 bg-zinc-800/30 border border-zinc-700 rounded-lg text-center">
                      <p className="text-sm text-zinc-400">No team members found</p>
                      <p className="text-xs text-zinc-500 mt-1">Add team members in Team Management</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-zinc-700 rounded-lg p-2">
                      {/* "Leave for dispatcher" option */}
                      <label className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                        selectedUserIds.length === 0
                          ? 'bg-emerald-500/10 border-2 border-emerald-500/30'
                          : 'bg-zinc-800/30 border-2 border-transparent hover:bg-zinc-800/50'
                      }`}>
                        <input
                          type="radio"
                          name="worker-selection"
                          checked={selectedUserIds.length === 0}
                          onChange={() => { setSelectedUserIds([]); setSelectedCrew(null); }}
                          className="w-4 h-4 border-zinc-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900"
                        />
                        <div>
                          <p className="text-sm font-medium text-zinc-200">Leave for dispatcher</p>
                          <p className="text-xs text-zinc-500">Auto-assign by optimizer</p>
                        </div>
                      </label>

                      {teamMembers.map((member) => {
                        const isSelected = selectedUserIds.includes(member.id);
                        const { qualified, missingSkills } = getWorkerQualification(member);

                        return (
                          <label
                            key={member.id}
                            className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-emerald-500/10 border-2 border-emerald-500/30'
                                : 'bg-zinc-800/30 border-2 border-transparent hover:bg-zinc-800/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUserIds([...selectedUserIds, member.id]);
                                  setSelectedCrew(null);
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
                                  <img src={member.profilePhotoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                                ) : (
                                  <span className="text-sm font-medium text-emerald-400">{member.firstName[0]}{member.lastName[0]}</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-zinc-200">
                                    {member.firstName} {member.lastName}
                                  </p>
                                  {qualified ? (
                                    <Check className="h-4 w-4 text-emerald-400" />
                                  ) : (
                                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                                  )}
                                </div>
                                <p className="text-xs text-zinc-500 capitalize">
                                  {member.role}
                                  {!qualified && <span className="text-amber-400 ml-1">(missing: {missingSkills.join(', ')})</span>}
                                </p>
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
                            onClick={() => { setSelectedUserIds(selectedUserIds.filter(id => id !== userId)); setSelectedCrew(null); }}
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

            {/* Notes Section - Separated */}
            <div className="space-y-3">
              <details className="group bg-zinc-800/30 border border-zinc-700 rounded-lg overflow-hidden">
                <summary className="cursor-pointer px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors select-none">
                  <span className="text-sm font-medium text-zinc-300">Customer Notes (visible to worker)</span>
                  <span className="text-zinc-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-4 pb-4 pt-2">
                  <textarea
                    value={jobDetails.customerNotes}
                    onChange={(e) => setJobDetails(prev => ({ ...prev, customerNotes: e.target.value }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px] text-sm resize-none"
                    placeholder="Notes about the job location, access instructions, etc."
                  />
                </div>
              </details>

              <details className="group bg-zinc-800/30 border border-zinc-700 rounded-lg overflow-hidden">
                <summary className="cursor-pointer px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors select-none">
                  <span className="text-sm font-medium text-zinc-300">Internal Notes (office only)</span>
                  <span className="text-zinc-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-4 pb-4 pt-2">
                  <textarea
                    value={jobDetails.jobInstructions}
                    onChange={(e) => setJobDetails(prev => ({ ...prev, jobInstructions: e.target.value }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px] text-sm resize-none"
                    placeholder="Internal notes, equipment needed, special instructions..."
                  />
                </div>
              </details>

              <details className="group bg-zinc-800/30 border border-zinc-700 rounded-lg overflow-hidden">
                <summary className="cursor-pointer px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors select-none">
                  <span className="text-sm font-medium text-zinc-300">Pricing (optional)</span>
                  <span className="text-zinc-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-4 pb-4 pt-2">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Estimated Value</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                    <input
                      type="number"
                      value={jobDetails.estimatedValue}
                      onChange={(e) => setJobDetails(prev => ({ ...prev, estimatedValue: e.target.value }))}
                      className="w-full pl-8 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
              </details>
            </div>

            {/* Recurring Options */}
            <div className="p-4 bg-zinc-800/30 border border-zinc-700 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={jobDetails.isRecurring}
                  onChange={(e) => setJobDetails(prev => ({ ...prev, isRecurring: e.target.checked, recurringFrequency: e.target.checked ? 'weekly' : '' }))}
                  className="w-5 h-5 rounded border-zinc-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-zinc-200 group-hover:text-zinc-100">Make this a recurring job</span>
                  <p className="text-xs text-zinc-500 mt-0.5">Automatically create this job on a schedule</p>
                </div>
              </label>

              {jobDetails.isRecurring && (
                <div className="mt-4 space-y-3 pl-8 border-l-2 border-emerald-500/30">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Repeat Frequency</label>
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
                          className={`py-2.5 px-3 rounded-lg border-2 transition-all text-sm font-medium active:scale-95 ${
                            jobDetails.recurringFrequency === freq.value
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                              : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 text-zinc-300'
                          }`}
                        >
                          {freq.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">End Date (optional)</label>
                    <input
                      type="date"
                      value={jobDetails.recurringEndDate}
                      onChange={(e) => setJobDetails(prev => ({ ...prev, recurringEndDate: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                    <p className="text-xs text-zinc-500 mt-1.5">Leave empty to continue indefinitely</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex items-center justify-end gap-3 px-4 md:px-6 py-4 md:py-6 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-sm">
            <Button type="button" onClick={onClose} variant="outline" className="border-zinc-700 hover:bg-zinc-800 flex-1 md:flex-none min-h-[44px]">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !!conflict || !(selectedCustomer || (showNewCustomerForm && !!newCustomer.name && !!newCustomer.phone)) || !selectedServiceConfig || !jobDetails.date}
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
              <Button variant="outline" className="flex-1 border-zinc-700" onClick={() => setShowEditCustomerModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white" onClick={handleSaveCustomer} disabled={savingCustomer || !editCustomerData.name}>
                {savingCustomer ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
