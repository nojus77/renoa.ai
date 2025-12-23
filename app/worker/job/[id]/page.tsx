'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import WorkerLayout from '@/components/worker/WorkerLayout';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  Navigation,
  CheckCircle2,
  Loader2,
  Calendar,
  User,
  Users,
  FileText,
  AlertCircle,
  XCircle,
  Image as ImageIcon,
  Camera,
  Plus,
  Send,
  History,
  X,
  ChevronRight,
  Wrench,
  Package,
  DollarSign,
  ChevronDown,
  Trash2,
  Timer,
  Banknote,
  CreditCard,
  MessageSquare,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { PropertyPhoto } from '@/components/PropertyPhoto';
import JobCompletionFlow from '@/components/worker/JobCompletionFlow';

// Renoa Design System - Lime green brand color
const LIME_GREEN = '#C4F542';

// Services by category - matches OnboardingModal
const SERVICES_BY_CATEGORY: Record<string, string[]> = {
  'Landscaping & Lawn Care': [
    'Lawn Mowing', 'Leaf Removal', 'Tree Trimming', 'Landscape Design', 'Irrigation',
    'Fertilization', 'Mulching', 'Snow Removal', 'Hedge Trimming', 'Sod Installation',
  ],
  'Electrical': [
    'Wiring & Rewiring', 'Panel Upgrades', 'Outlet Installation', 'Lighting Installation',
    'Ceiling Fans', 'Generator Installation', 'EV Charger Install', 'Troubleshooting', 'Code Corrections',
  ],
  'Plumbing': [
    'Drain Cleaning', 'Leak Repair', 'Water Heater', 'Fixture Installation', 'Pipe Repair',
    'Sewer Line', 'Garbage Disposal', 'Bathroom Remodel', 'Water Filtration',
  ],
  'HVAC': [
    'AC Installation', 'AC Repair', 'Heating Repair', 'Furnace Install', 'Duct Cleaning',
    'Thermostat Install', 'Maintenance Plans', 'Air Quality', 'Heat Pump',
  ],
  'Roofing': [
    'Shingle Repair', 'Roof Replacement', 'Gutter Install', 'Gutter Cleaning', 'Roof Inspection',
    'Leak Repair', 'Flat Roof', 'Metal Roofing', 'Skylight Install',
  ],
  'Painting': [
    'Interior Painting', 'Exterior Painting', 'Cabinet Painting', 'Deck Staining',
    'Wallpaper', 'Pressure Washing', 'Drywall Repair', 'Color Consulting',
  ],
  'Home Remodeling': [
    'Kitchen Remodel', 'Bathroom Remodel', 'Basement Finishing', 'Room Additions',
    'Flooring', 'Tile Work', 'Custom Carpentry', 'Deck Building',
  ],
  'Fencing': [
    'Wood Fence', 'Vinyl Fence', 'Chain Link', 'Iron/Metal Fence',
    'Gate Installation', 'Fence Repair', 'Privacy Fence',
  ],
  'Flooring': [
    'Hardwood Install', 'Laminate', 'Tile', 'Carpet', 'Vinyl/LVP',
    'Floor Refinishing', 'Subfloor Repair',
  ],
  'Cleaning Services': [
    'Regular Cleaning', 'Deep Cleaning', 'Move-in/Move-out', 'Window Cleaning',
    'Carpet Cleaning', 'Pressure Washing', 'Post-Construction',
  ],
  'General Contracting': [
    'Project Management', 'Permit Handling', 'Full Renovations',
    'New Construction', 'Commercial Build-out',
  ],
};

interface Coworker {
  id: string;
  name: string;
  phone: string | null;
  profilePhotoUrl: string | null;
}

interface Job {
  id: string;
  serviceType: string;
  address: string;
  startTime: string;
  endTime: string;
  status: string;
  onTheWayAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  customerNotes: string | null;
  internalNotes: string | null;
  estimatedValue: number | null;
  estimatedDuration: number | null;
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  workLogs: {
    id: string;
    clockIn: string;
    clockOut: string | null;
    hoursWorked: number | null;
    earnings: number | null;
  }[];
  assignedCrew?: {
    id: string;
    name: string;
    color: string;
  } | null;
  coworkers?: Coworker[];
  numWorkers?: number;
  userPayInfo?: {
    payType: 'hourly' | 'commission' | null;
    hourlyRate: number | null;
    commissionRate: number | null;
  } | null;
}

interface JobNote {
  id: string;
  content: string;
  author: string;
  authorRole: 'worker' | 'dispatcher';
  createdAt: string;
}

interface JobMedia {
  id: string;
  url: string;
  type: 'photo' | 'video' | 'before' | 'after' | 'check';
  caption?: string;
  createdAt: string;
}

interface CustomerJob {
  id: string;
  serviceType: string;
  date: string;
  amount: number;
  status: string;
  workerName?: string;
  duration?: number;
  workPerformed?: string;
  partsUsed?: string[];
  hasPhotos?: boolean;
  notes?: string;
}

interface SelectedService {
  id: string;
  serviceId: string | null;
  serviceName: string;
  price: number;
  customNotes: string;
  isCustom: boolean;
  showNotes: boolean;
}

interface Part {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  paidBy: 'office' | 'worker';
}

type TimerState = 'idle' | 'traveling' | 'working' | 'completed';

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [userId, setUserId] = useState<string>('');
  const [providerId, setProviderId] = useState<string>('');
  const [providerCategory, setProviderCategory] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Live date/time
  const [currentTime, setCurrentTime] = useState(new Date());

  // Timer system
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [travelTime, setTravelTime] = useState<number>(0);
  const [onSiteTime, setOnSiteTime] = useState<number>(0);
  const [travelStartTime, setTravelStartTime] = useState<number | null>(null);
  const [onSiteStartTime, setOnSiteStartTime] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Notes state
  const [notes, setNotes] = useState<JobNote[]>([]);
  const [dispatcherInstructions, setDispatcherInstructions] = useState<string>('');
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Media state
  const [media, setMedia] = useState<JobMedia[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<JobMedia | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const checkPhotoInputRef = useRef<HTMLInputElement>(null);

  // Customer history state
  const [showCustomerHistory, setShowCustomerHistory] = useState(false);
  const [customerJobs, setCustomerJobs] = useState<CustomerJob[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Invoice state - removed for workers, handled by office

  // Service selection state
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showCustomServiceInput, setShowCustomServiceInput] = useState(false);
  const [customServiceName, setCustomServiceName] = useState('');
  const [savedCustomServices, setSavedCustomServices] = useState<string[]>([]);

  // Parts state
  const [parts, setParts] = useState<Part[]>([]);
  const [showAddPart, setShowAddPart] = useState(false);
  const [newPartName, setNewPartName] = useState('');
  const [newPartQty, setNewPartQty] = useState('1');
  const [newPartPrice, setNewPartPrice] = useState('');
  const [partQtyInputs, setPartQtyInputs] = useState<Record<string, string>>({});

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<string>('');

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // New completion flow state
  const [showCompletionFlow, setShowCompletionFlow] = useState(false);

  // Provider settings for completion flow
  const [requireCompletionPhotos, setRequireCompletionPhotos] = useState(false);

  // Actual duration tracking
  const [actualDurationMinutes, setActualDurationMinutes] = useState<number | null>(null);
  const [showCustomActualDuration, setShowCustomActualDuration] = useState(false);
  const [customActualDuration, setCustomActualDuration] = useState('');
  const DURATION_OPTIONS = [30, 45, 60, 90, 120, 150, 180];

  // Customer info modal state
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Timer update effect
  useEffect(() => {
    if (timerState === 'traveling' && travelStartTime) {
      timerRef.current = setInterval(() => {
        setTravelTime(Math.floor((Date.now() - travelStartTime) / 1000));
      }, 1000);
    } else if (timerState === 'working' && onSiteStartTime) {
      timerRef.current = setInterval(() => {
        setOnSiteTime(Math.floor((Date.now() - onSiteStartTime) / 1000));
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerState, travelStartTime, onSiteStartTime]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (jobId && (selectedServices.length > 0 || parts.length > 0)) {
      const draft = {
        selectedServices,
        parts,
        travelTime,
        onSiteTime,
        timerState,
      };
      localStorage.setItem(`jobDraft_${jobId}`, JSON.stringify(draft));
    }
  }, [jobId, selectedServices, parts, travelTime, onSiteTime, timerState]);

  // Load draft from localStorage
  useEffect(() => {
    if (jobId) {
      const savedDraft = localStorage.getItem(`jobDraft_${jobId}`);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (draft.selectedServices) setSelectedServices(draft.selectedServices);
          if (draft.parts) setParts(draft.parts);
          if (draft.travelTime) setTravelTime(draft.travelTime);
          if (draft.onSiteTime) setOnSiteTime(draft.onSiteTime);
          if (draft.timerState === 'completed') setTimerState('completed');
        } catch (e) {
          console.error('Error loading draft:', e);
        }
      }
    }
  }, [jobId]);

  // Pre-fill services from job estimate (only if no draft and no services selected)
  useEffect(() => {
    if (job && selectedServices.length === 0 && job.status !== 'completed') {
      // Check if there's an existing draft
      const savedDraft = localStorage.getItem(`jobDraft_${jobId}`);
      if (!savedDraft) {
        // Pre-fill with job's serviceType and estimatedValue
        const prefillService: SelectedService = {
          id: `prefill-${Date.now()}`,
          serviceId: null,
          serviceName: job.serviceType,
          price: job.estimatedValue || 0,
          customNotes: '',
          isCustom: false,
          showNotes: false,
        };
        setSelectedServices([prefillService]);
      }
    }
  }, [job, jobId, selectedServices.length]);

  // Format current time for display
  const formatCurrentTime = () => {
    return currentTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }) + ', ' + currentTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format timer display
  const formatTimerDisplay = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  // Format time for pills/display (shorter format)
  const formatTimePill = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const fetchJob = useCallback(async (uid: string, jid: string) => {
    try {
      console.log('Fetching job:', { jobId: jid, userId: uid });
      // Use direct job endpoint for reliable fetching
      const res = await fetch(`/api/worker/jobs/${jid}?userId=${uid}`);
      const data = await res.json();
      console.log('Job fetch response:', { status: res.status, data });

      if (res.ok && data.job) {
        const foundJob = data.job;
        setJob(foundJob);
        // Set provider settings for completion flow
        if (data.providerSettings) {
          setRequireCompletionPhotos(data.providerSettings.requireCompletionPhotos ?? false);
        }
        // Initialize timer state based on job state
        if (foundJob.completedAt) {
          setTimerState('completed');
        } else if (foundJob.workLogs?.some((l: { clockIn: string; clockOut: string | null }) => l.clockIn && !l.clockOut)) {
          setTimerState('working');
          const activeLog = foundJob.workLogs.find((l: { clockIn: string; clockOut: string | null }) => l.clockIn && !l.clockOut);
          if (activeLog) {
            setOnSiteStartTime(new Date(activeLog.clockIn).getTime());
          }
        } else if (foundJob.onTheWayAt && !foundJob.arrivedAt) {
          setTimerState('traveling');
          setTravelStartTime(new Date(foundJob.onTheWayAt).getTime());
        }
      } else {
        console.error('Job not found - API response:', data);
        toast.error(data.error || 'Job not found');
        // Stay on page to show error instead of redirecting immediately
        setTimeout(() => {
          router.push('/worker/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchNotes = useCallback(async (jid: string) => {
    try {
      const res = await fetch(`/api/worker/jobs/${jid}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
        setDispatcherInstructions(data.dispatcherInstructions || '');
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  }, []);

  const fetchMedia = useCallback(async (jid: string) => {
    try {
      const res = await fetch(`/api/worker/jobs/${jid}/media`);
      if (res.ok) {
        const data = await res.json();
        setMedia(data.media || []);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  }, []);

  useEffect(() => {
    const uid = localStorage.getItem('workerUserId');
    const pid = localStorage.getItem('workerProviderId');

    if (!uid || !pid) {
      router.push('/provider/login');
      return;
    }

    setUserId(uid);
    setProviderId(pid);
    if (jobId) {
      fetchJob(uid, jobId);
      fetchNotes(jobId);
      fetchMedia(jobId);
    }

    // Fetch provider category for service filtering
    const fetchProviderCategory = async () => {
      try {
        const res = await fetch(`/api/worker/profile?userId=${uid}`);
        if (res.ok) {
          const data = await res.json();
          setProviderCategory(data.user?.provider?.primaryCategory || null);
        }
      } catch (error) {
        console.error('Error fetching provider category:', error);
      }
    };
    fetchProviderCategory();

    // Fetch saved custom services
    const fetchCustomServices = async () => {
      try {
        const res = await fetch(`/api/worker/services?userId=${uid}`);
        if (res.ok) {
          const data = await res.json();
          setSavedCustomServices(data.customServices?.map((s: { name: string }) => s.name) || []);
        }
      } catch (error) {
        console.error('Error fetching custom services:', error);
      }
    };
    fetchCustomServices();
  }, [router, jobId, fetchJob, fetchNotes, fetchMedia]);

  const getJobStatus = (j: Job) => {
    if (j.completedAt) return 'completed';
    if (j.workLogs?.some((l) => l.clockIn && !l.clockOut)) return 'working';
    if (j.arrivedAt) return 'arrived';
    if (j.onTheWayAt) return 'on_the_way';
    return 'scheduled';
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatShortDate = (dateStr: string) => {
    // Handle "Unknown" or invalid dates
    if (!dateStr || dateStr === 'Unknown') return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Timer action handlers
  const handleOnMyWay = async () => {
    if (!job) return;
    setActionLoading('on_the_way');

    try {
      const res = await fetch('/api/worker/jobs/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, userId, action: 'on_the_way' }),
      });

      const data = await res.json();

      if (data.success) {
        setTimerState('traveling');
        setTravelStartTime(Date.now());
        setTravelTime(0);
        toast.success('On your way!');
        fetchJob(userId, jobId);
      } else {
        toast.error(data.error || 'Action failed');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Something went wrong');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartJob = async () => {
    if (!job) return;
    setActionLoading('start');

    try {
      // First mark as arrived
      await fetch('/api/worker/jobs/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, userId, action: 'arrived', travelDuration: travelTime }),
      });

      // Then clock in
      const res = await fetch('/api/worker/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, userId, providerId }),
      });

      const data = await res.json();

      if (data.success) {
        // Stop travel timer, save final time
        const finalTravelTime = travelStartTime ? Math.floor((Date.now() - travelStartTime) / 1000) : travelTime;
        setTravelTime(finalTravelTime);
        setTravelStartTime(null);

        // Start on-site timer
        setTimerState('working');
        setOnSiteStartTime(Date.now());
        setOnSiteTime(0);

        toast.success('Job started!');
        fetchJob(userId, jobId);
      } else {
        toast.error(data.error || 'Action failed');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Something went wrong');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteJobClick = () => {
    if (!job) return;

    // Validate: require at least one service with price
    if (selectedServices.length === 0 || totalPrice === 0) {
      toast.error('Add services with pricing before completing the job');
      document.getElementById('job-details-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Validate: require payment method
    if (!paymentMethod) {
      toast.error('Please select how customer paid');
      document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Validate: require check photo if payment method is check
    if (paymentMethod === 'check') {
      const hasCheckPhoto = media.some(m => m.type === 'check');
      if (!hasCheckPhoto) {
        toast.error('Please upload a photo of the check before completing');
        document.getElementById('media-section')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // Pre-fill actual duration from on-site timer (convert seconds to minutes)
    const currentOnSiteTime = onSiteStartTime
      ? Math.floor((Date.now() - onSiteStartTime) / 1000)
      : onSiteTime;
    const suggestedMinutes = Math.round(currentOnSiteTime / 60);

    // Find closest duration option or use custom
    const closestOption = DURATION_OPTIONS.reduce((prev, curr) =>
      Math.abs(curr - suggestedMinutes) < Math.abs(prev - suggestedMinutes) ? curr : prev
    );

    if (Math.abs(closestOption - suggestedMinutes) <= 10) {
      setActualDurationMinutes(closestOption);
      setShowCustomActualDuration(false);
    } else if (suggestedMinutes >= 15) {
      setActualDurationMinutes(suggestedMinutes);
      setShowCustomActualDuration(true);
      setCustomActualDuration(suggestedMinutes.toString());
    }

    // Show completion flow (includes checklist, photos, signature)
    setShowCompletionFlow(true);
  };

  // Handler for completion flow result
  const handleCompletionFlowComplete = async (data: {
    checklistCompleted: Record<string, boolean>;
    completionPhotos: string[];
    actualDurationMinutes: number | null;
    signatureDataUrl: string | null;
    signedByName: string | null;
    skipSignature: boolean;
    completionNotes: string;
  }) => {
    if (!job) return;

    setShowCompletionFlow(false);
    setActionLoading('complete');

    try {
      // Save final job value before completing
      await updateJobValue(totalPrice);

      // Stop on-site timer
      const finalOnSiteTime = onSiteStartTime ? Math.floor((Date.now() - onSiteStartTime) / 1000) : onSiteTime;

      // Call the new complete API endpoint
      const completeRes = await fetch(`/api/provider/jobs/${job.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          completedByUserId: userId,
          createInvoice: true,
        }),
      });

      if (!completeRes.ok) {
        throw new Error('Failed to save completion data');
      }

      // Also call clock-out to handle earnings and work logs
      const res = await fetch('/api/worker/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          userId,
          travelDuration: travelTime,
          onSiteDuration: finalOnSiteTime,
          paymentMethod,
          tipAmount: parseFloat(tipAmount) || 0,
          actualDurationMinutes: data.actualDurationMinutes || undefined,
        }),
      });

      const clockOutData = await res.json();

      if (clockOutData.success) {
        setOnSiteTime(finalOnSiteTime);
        setOnSiteStartTime(null);
        setTimerState('completed');

        // Handle card payment - send payment link
        if (paymentMethod === 'card') {
          try {
            const paymentRes = await fetch(`/api/worker/jobs/${job.id}/send-payment-link`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amount: totalPrice,
                tipAmount: parseFloat(tipAmount) || 0,
              }),
            });
            const paymentData = await paymentRes.json();
            if (paymentData.success) {
              toast.success('Job completed! Payment link sent to customer.');
            } else {
              toast.success(`Job completed! Earned $${clockOutData.earnings?.toFixed(2) || '0.00'}. Note: Payment link could not be sent.`);
            }
          } catch (paymentError) {
            console.error('Error sending payment link:', paymentError);
            toast.success(`Job completed! Earned $${clockOutData.earnings?.toFixed(2) || '0.00'}. Note: Payment link could not be sent.`);
          }
        } else {
          toast.success(`Job completed! Earned $${clockOutData.earnings?.toFixed(2) || '0.00'}`);
        }

        fetchJob(userId, jobId);

        // Clear draft since job is done
        localStorage.removeItem(`jobDraft_${jobId}`);
      } else {
        toast.error(clockOutData.error || 'Action failed');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Something went wrong');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteJob = async () => {
    if (!job) return;

    setShowConfirmModal(false);
    setActionLoading('complete');

    try {
      // Save final job value before completing
      await updateJobValue(totalPrice);

      // Stop on-site timer
      const finalOnSiteTime = onSiteStartTime ? Math.floor((Date.now() - onSiteStartTime) / 1000) : onSiteTime;

      console.log('Completing job:', {
        jobId: job.id,
        totalPrice,
        servicesCount: selectedServices.length,
        partsCount: parts.length,
        paymentMethod,
        tipAmount: parseFloat(tipAmount) || 0,
        actualDurationMinutes,
      });

      const res = await fetch('/api/worker/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          userId,
          travelDuration: travelTime,
          onSiteDuration: finalOnSiteTime,
          paymentMethod,
          tipAmount: parseFloat(tipAmount) || 0,
          actualDurationMinutes: actualDurationMinutes || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setOnSiteTime(finalOnSiteTime);
        setOnSiteStartTime(null);
        setTimerState('completed');

        // Handle card payment - send payment link
        if (paymentMethod === 'card') {
          try {
            const paymentRes = await fetch(`/api/worker/jobs/${job.id}/send-payment-link`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amount: totalPrice,
                tipAmount: parseFloat(tipAmount) || 0,
              }),
            });
            const paymentData = await paymentRes.json();
            if (paymentData.success) {
              toast.success('Job completed! Payment link sent to customer.');
            } else {
              // Job completed but payment link failed - just show warning, not both success and error
              toast.success(`Job completed! Earned $${data.earnings?.toFixed(2) || '0.00'}. Note: Payment link could not be sent.`);
            }
          } catch (paymentError) {
            console.error('Error sending payment link:', paymentError);
            // Job completed but payment link failed - just show warning, not both success and error
            toast.success(`Job completed! Earned $${data.earnings?.toFixed(2) || '0.00'}. Note: Payment link could not be sent.`);
          }
        } else {
          toast.success(`Job completed! Earned $${data.earnings?.toFixed(2) || '0.00'}`);
        }

        fetchJob(userId, jobId);

        // Clear draft since job is done
        localStorage.removeItem(`jobDraft_${jobId}`);
      } else {
        toast.error(data.error || 'Action failed');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Something went wrong');
    } finally {
      setActionLoading(null);
    }
  };

  // Service handlers
  const handleAddService = (serviceId: string, serviceName: string) => {
    const newService: SelectedService = {
      id: `service-${Date.now()}`,
      serviceId,
      serviceName,
      price: 0,
      customNotes: '',
      isCustom: false,
      showNotes: false,
    };
    setSelectedServices([...selectedServices, newService]);
    setShowServiceDropdown(false);
  };

  const handleAddCustomService = async () => {
    if (!customServiceName.trim()) return;

    const serviceName = customServiceName.trim();

    const newService: SelectedService = {
      id: `custom-${Date.now()}`,
      serviceId: null,
      serviceName,
      price: 0,
      customNotes: '',
      isCustom: true,
      showNotes: false,
    };
    setSelectedServices([...selectedServices, newService]);
    setCustomServiceName('');
    setShowCustomServiceInput(false);

    // Save custom service for future use
    if (!savedCustomServices.includes(serviceName)) {
      try {
        const res = await fetch('/api/worker/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, serviceName }),
        });
        if (res.ok) {
          const data = await res.json();
          setSavedCustomServices(data.customServices?.map((s: { name: string }) => s.name) || []);
        }
      } catch (error) {
        console.error('Error saving custom service:', error);
      }
    }
  };

  const handleRemoveService = (serviceId: string) => {
    const service = selectedServices.find(s => s.id === serviceId);
    if (service?.customNotes && !confirm('This service has notes. Remove anyway?')) {
      return;
    }
    setSelectedServices(selectedServices.filter(s => s.id !== serviceId));
  };

  const handleUpdateServicePrice = (serviceId: string, price: number) => {
    setSelectedServices(selectedServices.map(s =>
      s.id === serviceId ? { ...s, price: Math.max(0, price) } : s
    ));
  };

  const handleUpdateServiceNotes = (serviceId: string, notes: string) => {
    setSelectedServices(selectedServices.map(s =>
      s.id === serviceId ? { ...s, customNotes: notes } : s
    ));
  };

  const handleToggleServiceNotes = (serviceId: string) => {
    setSelectedServices(selectedServices.map(s =>
      s.id === serviceId ? { ...s, showNotes: !s.showNotes } : s
    ));
  };

  // Parts handlers
  const handleAddPart = () => {
    if (!newPartName.trim()) return;

    const qty = parseInt(newPartQty, 10) || 1;
    const price = parseFloat(newPartPrice) || 0;

    const newPart: Part = {
      id: `part-${Date.now()}`,
      name: newPartName.trim(),
      quantity: Math.max(1, qty),
      unitPrice: Math.max(0, price),
      paidBy: 'office',
    };
    setParts([...parts, newPart]);
    setPartQtyInputs(prev => ({ ...prev, [newPart.id]: String(newPart.quantity) }));
    setNewPartName('');
    setNewPartQty('1');
    setNewPartPrice('');
    setShowAddPart(false);
  };

  const handleRemovePart = (partId: string) => {
    setParts(parts.filter(p => p.id !== partId));
    setPartQtyInputs(prev => {
      const { [partId]: _, ...rest } = prev;
      return rest;
    });
  };

  const updatePartQuantity = (partId: string, quantity: number) => {
    setParts(parts.map(p => p.id === partId ? { ...p, quantity } : p));
  };

  const updatePartPaidBy = (partId: string, paidBy: 'office' | 'worker') => {
    setParts(parts.map(p => p.id === partId ? { ...p, paidBy } : p));
  };

  // Price calculations
  const servicesSubtotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const partsSubtotal = parts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
  const totalPrice = servicesSubtotal + partsSubtotal;

  const servicesWithoutPrice = selectedServices.filter(s => s.price === 0);

  // Update job actualValue when services/parts change
  const updateJobValue = useCallback(async (total: number) => {
    if (!job || total === 0) return;
    try {
      await fetch(`/api/worker/jobs/${job.id}/value`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actualValue: total, userId }),
      });
    } catch (error) {
      console.error('Error updating job value:', error);
    }
  }, [job, userId]);

  // Auto-save job value when total changes
  useEffect(() => {
    if (totalPrice > 0 && job) {
      const debounceTimer = setTimeout(() => {
        updateJobValue(totalPrice);
      }, 1000); // Debounce to avoid too many API calls
      return () => clearTimeout(debounceTimer);
    }
  }, [totalPrice, updateJobValue, job]);

  // Note handlers
  const handleAddNote = async () => {
    if (!newNote.trim() || !job) return;
    setAddingNote(true);

    try {
      const res = await fetch(`/api/worker/jobs/${job.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNote.trim(),
          userId,
          customerId: job.customer.id,
        }),
      });

      if (res.ok) {
        toast.success('Note added');
        setNewNote('');
        fetchNotes(job.id);
      } else {
        toast.error('Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];

    const files = e.target.files;
    if (!files || files.length === 0 || !job) {
      console.log('No files selected or no job');
      return;
    }

    // Validate files before upload
    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`Photo too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is 5MB.`);
        continue;
      }

      // Check file type
      if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
        toast.error(`Unsupported file type. Use JPG, PNG, GIF, or MP4.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    console.log('Uploading files:', validFiles.length);
    toast.info(`Uploading ${validFiles.length} file(s)...`);

    const formData = new FormData();
    validFiles.forEach((file, index) => {
      console.log(`File ${index + 1}:`, file.name, file.type, file.size);
      formData.append('files', file);
    });
    formData.append('jobId', job.id);
    formData.append('userId', userId);

    try {
      const res = await fetch(`/api/worker/jobs/${job.id}/media`, {
        method: 'POST',
        body: formData,
      });

      console.log('Upload response status:', res.status);

      if (res.ok) {
        const data = await res.json();
        console.log('Upload success:', data);
        toast.success('Media uploaded successfully');
        fetchMedia(job.id);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Upload failed:', res.status, errorData);

        // Better error messages based on status code
        if (res.status === 413) {
          toast.error('File too large. Maximum size is 5MB.');
        } else if (res.status === 403) {
          toast.error('You don\'t have permission to upload to this job.');
        } else if (res.status === 404) {
          toast.error('Job not found.');
        } else {
          toast.error(errorData.error || 'Failed to upload media');
        }
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error('Upload failed. Check your internet connection.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCheckPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    const file = e.target.files?.[0];
    if (!file || !job) {
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Photo too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is 5MB.`);
      if (checkPhotoInputRef.current) {
        checkPhotoInputRef.current.value = '';
      }
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      if (checkPhotoInputRef.current) {
        checkPhotoInputRef.current.value = '';
      }
      return;
    }

    toast.info('Uploading check photo...');

    const formData = new FormData();
    formData.append('files', file);
    formData.append('jobId', job.id);
    formData.append('userId', userId);
    formData.append('photoType', 'check');

    try {
      const res = await fetch(`/api/worker/jobs/${job.id}/media`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast.success('Check photo uploaded');
        fetchMedia(job.id);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to upload check photo');
      }
    } catch (error) {
      console.error('Error uploading check photo:', error);
      toast.error('Upload failed');
    }

    if (checkPhotoInputRef.current) {
      checkPhotoInputRef.current.value = '';
    }
  };

  const handleViewCustomerHistory = async () => {
    if (!job) return;
    setShowCustomerHistory(true);
    setLoadingHistory(true);

    try {
      const res = await fetch(`/api/worker/customers/${job.customer.id}/jobs`);
      if (res.ok) {
        const data = await res.json();
        setCustomerJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching customer history:', error);
      toast.error('Failed to load customer history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const openMaps = (address: string) => {
    const encoded = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
  };

  const callPhone = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
      scheduled: {
        bg: 'bg-lime-500/20',
        text: 'text-lime-400',
        label: 'Scheduled',
        icon: <Calendar className="w-4 h-4" />,
      },
      on_the_way: {
        bg: 'bg-amber-500/20',
        text: 'text-amber-400',
        label: 'On the Way',
        icon: <Navigation className="w-4 h-4" />,
      },
      arrived: {
        bg: 'bg-orange-500/20',
        text: 'text-orange-400',
        label: 'Arrived',
        icon: <MapPin className="w-4 h-4" />,
      },
      working: {
        bg: 'bg-lime-500/20',
        text: 'text-lime-400',
        label: 'In Progress',
        icon: <Clock className="w-4 h-4" />,
      },
      completed: {
        bg: 'bg-purple-500/20',
        text: 'text-purple-400',
        label: 'Completed',
        icon: <CheckCircle2 className="w-4 h-4" />,
      },
      cancelled: {
        bg: 'bg-red-500/20',
        text: 'text-red-400',
        label: 'Cancelled',
        icon: <XCircle className="w-4 h-4" />,
      },
    };
    return configs[status] || configs.scheduled;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-purple-500/20 text-purple-400';
      case 'in_progress':
        return 'bg-lime-500/20 text-lime-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-zinc-700 text-zinc-300';
    }
  };

  const renderActionButton = () => {
    if (!job) return null;
    const isLoading = (action: string) => actionLoading === action;

    switch (timerState) {
      case 'idle':
        return (
          <button
            onClick={handleOnMyWay}
            disabled={!!actionLoading}
            className="flex-1 py-4 text-zinc-900 font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            style={{ backgroundColor: LIME_GREEN }}
          >
            {isLoading('on_the_way') ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Navigation className="w-5 h-5" />
                On My Way
              </>
            )}
          </button>
        );
      case 'traveling':
        return (
          <button
            onClick={handleStartJob}
            disabled={!!actionLoading}
            className="flex-1 py-4 text-zinc-900 font-semibold rounded-xl flex flex-col items-center justify-center gap-1 disabled:opacity-50 transition-colors"
            style={{ backgroundColor: LIME_GREEN }}
          >
            {isLoading('start') ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span className="flex items-center gap-2">
                  <Timer className="w-5 h-5" />
                  Start Job
                </span>
                <span className="text-xs opacity-80">En Route: {formatTimerDisplay(travelTime)}</span>
              </>
            )}
          </button>
        );
      case 'working':
        return (
          <button
            onClick={handleCompleteJobClick}
            disabled={!!actionLoading}
            className="flex-1 py-4 text-zinc-900 font-semibold rounded-xl flex flex-col items-center justify-center gap-1 disabled:opacity-50 transition-colors"
            style={{ backgroundColor: LIME_GREEN }}
          >
            {isLoading('complete') ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Complete Job
                </span>
                <span className="text-xs opacity-80">Working: {formatTimerDisplay(onSiteTime)}</span>
              </>
            )}
          </button>
        );
      case 'completed':
        return (
          <div className="flex-1 py-4 bg-[#2A2A2A] text-purple-400 font-semibold rounded-xl flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Job Completed
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <WorkerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: LIME_GREEN }} />
        </div>
      </WorkerLayout>
    );
  }

  if (!job) {
    return (
      <WorkerLayout>
        <div className="p-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="bg-[#1F1F1F] rounded-xl p-8 text-center border border-[#2A2A2A]">
            <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">Job not found</p>
          </div>
        </div>
      </WorkerLayout>
    );
  }

  const status = getJobStatus(job);
  const statusConfig = getStatusConfig(status);

  // Section visibility based on status
  // Status values: 'scheduled', 'on_the_way', 'arrived', 'working', 'completed'
  const isPreArrival = ['scheduled', 'on_the_way'].includes(status);
  const isWorkingOrCompleted = ['working', 'arrived', 'completed'].includes(status);
  const canEditJobDetails = ['working', 'arrived'].includes(status);
  const canAddMedia = isWorkingOrCompleted;

  return (
    <WorkerLayout>
      <div className="p-4 pb-44 space-y-4">
        {/* Header with Date/Time */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 bg-[#2A2A2A] rounded-lg hover:bg-[#3A3A3A] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Job Details</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-400">{formatCurrentTime()}</p>
          </div>
        </div>

        {/* Compact Job Summary - Only for Completed Jobs */}
        {status === 'completed' && job.completedAt && (
          <div className="bg-[#2D2D2D] rounded-xl border border-[#3A3A3A] p-4">
            {/* Header with scheduled time */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Job Summary
              </h3>
              <span className="text-zinc-400 text-sm">
                {formatTime(job.startTime)} - {formatTime(job.endTime)}
              </span>
            </div>

            {/* Time stats - horizontal compact */}
            <div className="flex gap-4 text-sm mb-3 pb-3 border-b border-[#3A3A3A]">
              {job.workLogs?.[0]?.hoursWorked && (
                <div>
                  <span className="text-zinc-500">Duration:</span>
                  <span className="text-white ml-1">
                    {job.workLogs[0].hoursWorked >= 1
                      ? `${Math.floor(job.workLogs[0].hoursWorked)}h ${Math.round((job.workLogs[0].hoursWorked % 1) * 60)}m`
                      : `${Math.round(job.workLogs[0].hoursWorked * 60)}m`
                    }
                  </span>
                </div>
              )}
              {job.arrivedAt && job.completedAt && (
                <div>
                  <span className="text-zinc-500">On Site:</span>
                  <span className="text-white ml-1">{getDuration(job.arrivedAt, job.completedAt)}</span>
                </div>
              )}
            </div>

            {/* Financial breakdown - compact */}
            <div className="space-y-1.5 text-sm">
              {/* Services */}
              <div className="flex justify-between">
                <span className="text-zinc-400">Services</span>
                <span className="text-white">${totalPrice.toFixed(2)}</span>
              </div>

              {/* Parts - only show if exists */}
              {parts.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Parts ({parts.length})</span>
                  <span className="text-white">${parts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0).toFixed(2)}</span>
                </div>
              )}

              {/* Tip - only show if exists */}
              {parseFloat(tipAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Tip</span>
                  <span className="text-emerald-500">+${parseFloat(tipAmount).toFixed(2)}</span>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between pt-2 border-t border-[#3A3A3A]">
                <span className="text-white font-medium">Total</span>
                <span className="text-white font-medium">
                  ${(totalPrice + parts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0) + (parseFloat(tipAmount) || 0)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Your earnings - highlighted */}
            {job.workLogs?.[0]?.earnings !== undefined && job.workLogs?.[0]?.earnings !== null && (
              <div className="mt-3 pt-3 border-t border-[#3A3A3A] flex justify-between items-center">
                <div>
                  <span className="text-zinc-400 text-sm">Your Earnings</span>
                  {job.userPayInfo && (
                    <span className="text-xs text-zinc-500 ml-2">
                      ({job.userPayInfo.payType === 'commission'
                        ? `${job.userPayInfo.commissionRate}%`
                        : job.userPayInfo.hourlyRate
                          ? `$${job.userPayInfo.hourlyRate}/hr`
                          : 'Hourly'})
                    </span>
                  )}
                </div>
                <span className="font-bold text-lg" style={{ color: LIME_GREEN }}>
                  ${job.workLogs[0].earnings.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Main Job Info Card */}
        <div className="bg-[#1F1F1F] rounded-xl border border-[#2A2A2A] overflow-hidden">
          {/* Service Type Header with Status Badge */}
          <div className="p-4 border-b border-[#2A2A2A]">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">{job.serviceType}</h2>
                {job.estimatedValue && (
                  <p className="text-sm mt-1" style={{ color: LIME_GREEN }}>
                    ${job.estimatedValue.toFixed(2)} estimated
                  </p>
                )}
              </div>
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm ${statusConfig.bg}`}
              >
                <span className={statusConfig.text}>{statusConfig.icon}</span>
                <span className={`font-medium ${statusConfig.text}`}>{statusConfig.label}</span>
              </div>
            </div>
          </div>

          {/* Property Photo with Customer Info Overlay - Clickable for customer info */}
          <button
            onClick={() => setShowCustomerModal(true)}
            className="relative rounded-lg overflow-hidden h-48 w-full text-left"
          >
            <PropertyPhoto
              address={job.address || job.customer.address || ''}
              customerId={job.customer.id}
              className="w-full h-full"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{job.customer.name}</p>
                  <p className="text-white/70 text-sm">{job.address || job.customer.address || 'No address'}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/70" />
              </div>
            </div>
          </button>

          {/* Quick Actions */}
          <div className="p-4 border-b border-[#2A2A2A] flex gap-2">
            {job.customer.phone && (
              <button
                onClick={() => callPhone(job.customer.phone!)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors"
                style={{ backgroundColor: LIME_GREEN }}
              >
                <Phone className="w-4 h-4 text-zinc-900" />
                <span className="text-zinc-900 font-medium text-sm">Call</span>
              </button>
            )}
            <button
              onClick={() => openMaps(job.address || job.customer.address || '')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded-lg transition-colors"
            >
              <Navigation className="w-4 h-4" style={{ color: LIME_GREEN }} />
              <span className="text-zinc-300 text-sm">Navigate</span>
            </button>
          </div>

          {/* Date & Time */}
          <div className="p-4 border-b border-[#2A2A2A]">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-zinc-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-zinc-300">{formatDate(job.startTime)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 mt-3">
              <Clock className="w-5 h-5 text-zinc-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-zinc-300">
                  {formatTime(job.startTime)} - {formatTime(job.endTime)}
                </p>
                <p className="text-zinc-500 text-sm">
                  Estimated Duration: {getDuration(job.startTime, job.endTime)}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Crew / Coworkers Section */}
        {(job.assignedCrew || (job.coworkers && job.coworkers.length > 0)) && (
          <div className="bg-[#2D2D2D] rounded-xl border border-[#3A3A3A] overflow-hidden">
            <div className="p-4 border-b border-[#3A3A3A]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" style={{ color: job.assignedCrew?.color || LIME_GREEN }} />
                <h3 className="font-medium text-white">
                  {job.assignedCrew ? job.assignedCrew.name : 'Working With'}
                </h3>
                {job.assignedCrew && (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${job.assignedCrew.color}20`,
                      color: job.assignedCrew.color
                    }}
                  >
                    Crew
                  </span>
                )}
              </div>
            </div>
            <div className="p-4">
              {job.coworkers && job.coworkers.length > 0 ? (
                <div className="space-y-2">
                  {job.coworkers.map((coworker) => (
                    <div
                      key={coworker.id}
                      className="flex items-center justify-between bg-zinc-800/50 rounded-xl px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        {coworker.profilePhotoUrl ? (
                          <img
                            src={coworker.profilePhotoUrl}
                            alt={coworker.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                            style={{ backgroundColor: job.assignedCrew?.color || LIME_GREEN }}
                          >
                            {coworker.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                        <span className="text-sm text-zinc-300">{coworker.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {coworker.phone && (
                          <>
                            <a
                              href={`sms:${coworker.phone}`}
                              className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MessageSquare className="w-4 h-4 text-zinc-300" />
                            </a>
                            <a
                              href={`tel:${coworker.phone}`}
                              className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="w-4 h-4 text-zinc-300" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-sm">You are the only worker assigned to this job.</p>
              )}
            </div>
          </div>
        )}

        {/* Job Instructions Section - Dispatcher notes for workers */}
        {dispatcherInstructions && (
          <div className="bg-[#2D2D2D] rounded-xl border border-[#3A3A3A] overflow-hidden">
            <div className="p-4 border-b border-[#3A3A3A]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" style={{ color: LIME_GREEN }} />
                <h3 className="font-medium text-white">Job Instructions</h3>
              </div>
            </div>
            <div className="p-4">
              <p className="text-[#9CA3AF] text-sm whitespace-pre-wrap">{dispatcherInstructions}</p>
            </div>
          </div>
        )}

        {/* JOB DETAILS SECTION - Only show when arrived/working */}
        {canEditJobDetails && (
        <div id="job-details-section" className="bg-[#1F1F1F] rounded-xl border border-[#2A2A2A] overflow-hidden">
          <div className="p-4 border-b border-[#2A2A2A]">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5" style={{ color: LIME_GREEN }} />
              <h3 className="font-medium text-white">Job Details</h3>
            </div>
          </div>

          <div className="p-4 space-y-6">
            {/* SERVICES PERFORMED */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">Services Performed</label>

              {/* Selected Services List */}
              {selectedServices.length > 0 && (
                <div className="space-y-3 mb-3">
                  {selectedServices.map((service) => (
                    <div key={service.id} className="bg-[#2A2A2A] rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-white">{service.serviceName}</p>
                          {service.isCustom && (
                            <span className="text-xs text-zinc-500">Custom service</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveService(service.id)}
                          className="p-1 text-zinc-500 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Price Input */}
                      <div className="mt-2">
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={service.price || ''}
                            onChange={(e) => handleUpdateServicePrice(service.id, parseFloat(e.target.value) || 0)}
                            placeholder="Enter price"
                            className="w-full bg-zinc-700 border border-zinc-600 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-lime-500"
                          />
                        </div>
                        {service.price === 0 && (
                          <p className="text-xs text-amber-400 mt-1">Enter price for this service</p>
                        )}
                      </div>

                      {/* Notes Toggle */}
                      <button
                        onClick={() => handleToggleServiceNotes(service.id)}
                        className="flex items-center gap-1 text-xs text-zinc-400 mt-2 hover:text-zinc-300"
                      >
                        <ChevronDown className={`w-3 h-3 transition-transform ${service.showNotes ? 'rotate-180' : ''}`} />
                        {service.showNotes ? 'Hide notes' : 'Add notes'}
                      </button>

                      {/* Notes Input */}
                      {service.showNotes && (
                        <textarea
                          value={service.customNotes}
                          onChange={(e) => handleUpdateServiceNotes(service.id, e.target.value)}
                          placeholder="Add custom description or notes..."
                          className="w-full mt-2 bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-lime-500 resize-none"
                          rows={2}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Service Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-sm text-zinc-300 hover:border-zinc-600"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Service
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showServiceDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showServiceDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg shadow-xl max-h-64 overflow-y-auto">
                    {/* Saved Custom Services - show first */}
                    {savedCustomServices.length > 0 && (
                      <div>
                        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider bg-[#1F1F1F]/50" style={{ color: LIME_GREEN }}>
                          Your Saved Services
                        </div>
                        {savedCustomServices.map((serviceName, index) => (
                          <button
                            key={`saved-${index}`}
                            onClick={() => handleAddService(`saved-${index}`, serviceName)}
                            className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-[#3A3A3A]"
                          >
                            {serviceName}
                          </button>
                        ))}
                      </div>
                    )}
                    {(() => {
                      // Use provider's primaryCategory if available
                      const services = providerCategory ? SERVICES_BY_CATEGORY[providerCategory] : null;

                      if (services && services.length > 0) {
                        // Show only services for the provider's category
                        return (
                          <div>
                            <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-[#1F1F1F]/50">
                              {providerCategory} Services
                            </div>
                            {services.map((serviceName, index) => (
                              <button
                                key={`${providerCategory}-${index}`}
                                onClick={() => handleAddService(`${providerCategory}-${index}`, serviceName)}
                                className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-[#3A3A3A]"
                              >
                                {serviceName}
                              </button>
                            ))}
                          </div>
                        );
                      }

                      // Fallback: show all categories if no provider category set
                      return Object.entries(SERVICES_BY_CATEGORY).map(([category, categoryServices]) => (
                        <div key={category}>
                          <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-[#1F1F1F]/50">
                            {category}
                          </div>
                          {categoryServices.map((serviceName, index) => (
                            <button
                              key={`${category}-${index}`}
                              onClick={() => handleAddService(`${category}-${index}`, serviceName)}
                              className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-[#3A3A3A]"
                            >
                              {serviceName}
                            </button>
                          ))}
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>

              {/* Custom Service Button */}
              {!showCustomServiceInput ? (
                <button
                  onClick={() => setShowCustomServiceInput(true)}
                  className="mt-2 flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300"
                >
                  <Plus className="w-4 h-4" />
                  Add Custom Service
                </button>
              ) : (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={customServiceName}
                    onChange={(e) => setCustomServiceName(e.target.value)}
                    placeholder="Custom service name..."
                    className="flex-1 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-lime-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomService()}
                  />
                  <button
                    onClick={handleAddCustomService}
                    disabled={!customServiceName.trim()}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-zinc-900 disabled:opacity-50"
                    style={{ backgroundColor: LIME_GREEN }}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomServiceInput(false);
                      setCustomServiceName('');
                    }}
                    className="px-3 py-2 bg-[#2A2A2A] rounded-lg text-sm text-zinc-400"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* PARTS USED */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">Parts Used</label>

              {/* Parts List */}
              {parts.length > 0 && (
                <div className="space-y-2 mb-3">
                  {parts.map((part) => (
                    <div key={part.id} className="bg-[#2A2A2A] rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <Package className="w-4 h-4 text-zinc-500" />
                          <span className="text-sm text-white">{part.name}</span>
                        </div>
                        <span className="text-sm text-zinc-300">${(part.quantity * part.unitPrice).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Qty Input */}
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-zinc-500">Qty:</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={partQtyInputs[part.id] ?? String(part.quantity)}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setPartQtyInputs(prev => ({ ...prev, [part.id]: val }));
                            }}
                            onBlur={(e) => {
                              const qty = parseInt(e.target.value, 10);
                              if (isNaN(qty) || qty < 1) {
                                setPartQtyInputs(prev => ({ ...prev, [part.id]: '1' }));
                                updatePartQuantity(part.id, 1);
                              } else {
                                updatePartQuantity(part.id, qty);
                              }
                            }}
                            className="w-12 h-7 text-center bg-zinc-700 border border-zinc-600 rounded text-sm text-white focus:outline-none focus:border-[#C4F542]"
                          />
                        </div>

                        {/* Who Paid Toggle */}
                        <div className="flex text-xs rounded-lg overflow-hidden border border-zinc-700">
                          <button
                            type="button"
                            onClick={() => updatePartPaidBy(part.id, 'office')}
                            className={`px-2 py-1 transition-colors ${part.paidBy === 'office' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}
                          >
                            Office
                          </button>
                          <button
                            type="button"
                            onClick={() => updatePartPaidBy(part.id, 'worker')}
                            className={`px-2 py-1 transition-colors ${part.paidBy === 'worker' ? 'bg-amber-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}
                          >
                            I Paid
                          </button>
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => handleRemovePart(part.id)}
                          className="p-1 text-zinc-500 hover:text-red-400 ml-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Part Form */}
              {showAddPart ? (
                <div className="bg-[#2A2A2A] rounded-lg p-3 space-y-3">
                  <input
                    type="text"
                    value={newPartName}
                    onChange={(e) => setNewPartName(e.target.value)}
                    placeholder="Part name"
                    className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-zinc-500">Qty</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={newPartQty}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setNewPartQty(val);
                        }}
                        className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-zinc-500">Unit Price</label>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
                        <input
                          type="text"
                          inputMode="decimal"
                          value={newPartPrice}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            setNewPartPrice(val);
                          }}
                          placeholder="0.00"
                          className="w-full bg-zinc-700 border border-zinc-600 rounded-lg pl-6 pr-3 py-2 text-sm text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddPart}
                      disabled={!newPartName.trim()}
                      className="flex-1 py-2 rounded-lg text-sm font-medium text-zinc-900 disabled:opacity-50"
                      style={{ backgroundColor: LIME_GREEN }}
                    >
                      Add Part
                    </button>
                    <button
                      onClick={() => {
                        setShowAddPart(false);
                        setNewPartName('');
                        setNewPartQty('1');
                        setNewPartPrice('');
                      }}
                      className="px-4 py-2 bg-zinc-700 rounded-lg text-sm text-zinc-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddPart(true)}
                  className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300"
                >
                  <Plus className="w-4 h-4" />
                  Add Part
                </button>
              )}
            </div>

            {/* LABOR TIME (Only show after completion) */}
            {timerState === 'completed' && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">Labor Time</label>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2A2A2A] rounded-full text-sm text-zinc-300">
                    <Clock className="w-3 h-3" />
                    Travel: {formatTimePill(travelTime)}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2A2A2A] rounded-full text-sm text-zinc-300">
                    <Clock className="w-3 h-3" />
                    On-Site: {formatTimePill(onSiteTime)}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium text-zinc-900"
                    style={{ backgroundColor: LIME_GREEN }}
                  >
                    <Timer className="w-4 h-4" />
                    Total: {formatTimePill(travelTime + onSiteTime)}
                  </span>
                </div>
              </div>
            )}

            {/* PRICE BREAKDOWN */}
            <div className="border-t border-[#2A2A2A] pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Services</span>
                  <span className="text-zinc-300">${servicesSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Parts</span>
                  <span className="text-zinc-300">${partsSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-[#2A2A2A]">
                  <span className="text-white">Total</span>
                  <span style={{ color: LIME_GREEN }}>${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Warning for services without price */}
              {servicesWithoutPrice.length > 0 && (
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-amber-400">
                    {servicesWithoutPrice.length} service{servicesWithoutPrice.length > 1 ? 's' : ''} missing price
                  </p>
                </div>
              )}
            </div>

            {/* PAYMENT METHOD SECTION */}
            <div id="payment-section" className="border-t border-[#2A2A2A] pt-4">
              <label className="block text-sm font-medium text-zinc-300 mb-3">How did customer pay?</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cash', label: 'Cash', Icon: Banknote },
                  { id: 'check', label: 'Check', Icon: FileText },
                  { id: 'card', label: 'Card', Icon: CreditCard },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 transition-colors ${
                      paymentMethod === method.id
                        ? 'border-[#C4F542] bg-[#C4F542]/20 text-white'
                        : 'border-[#3A3A3A] text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <method.Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{method.label}</span>
                  </button>
                ))}
              </div>

              {/* Check Photo Upload - Only show when check is selected */}
              {paymentMethod === 'check' && (
                <div className="mt-4 p-3 bg-[#2A2A2A]/50 rounded-lg border border-[#3A3A3A]">
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">Photo of Check (Required)</label>
                  {media.some(m => m.type === 'check') ? (
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#2A2A2A] flex-shrink-0">
                        <img
                          src={media.find(m => m.type === 'check')?.url}
                          alt="Check"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm flex items-center gap-1" style={{ color: LIME_GREEN }}>
                          <CheckCircle2 className="w-4 h-4" />
                          Check photo uploaded
                        </p>
                        <button
                          onClick={() => checkPhotoInputRef.current?.click()}
                          className="text-xs text-zinc-400 hover:text-white mt-1"
                        >
                          Upload different photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => checkPhotoInputRef.current?.click()}
                      className="w-full py-3 px-4 border-2 border-dashed border-zinc-600 rounded-lg text-zinc-400 hover:border-[#C4F542] hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <Camera className="w-5 h-5" />
                      <span>Take Photo of Check</span>
                    </button>
                  )}
                  <input
                    ref={checkPhotoInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleCheckPhotoUpload}
                  />
                </div>
              )}

              {/* Card Payment Info */}
              {paymentMethod === 'card' && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-400">
                    A payment link will be sent to the customer when you complete the job.
                  </p>
                </div>
              )}

              {/* Tip Amount */}
              <div className="mt-4">
                <label className="text-sm text-zinc-400">Tip (optional)</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-zinc-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg px-4 py-3 w-32 text-base text-white focus:outline-none focus:border-[#C4F542]"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>

              {/* Total with tip */}
              {parseFloat(tipAmount) > 0 && (
                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-zinc-400">Total + Tip</span>
                  <span style={{ color: LIME_GREEN }} className="font-bold">
                    ${(totalPrice + parseFloat(tipAmount)).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Note: Invoice sending is handled by office staff */}
          </div>
        </div>
        )}

        {/* Notes Section */}
        <div className="bg-[#2D2D2D] rounded-xl border border-[#3A3A3A] overflow-hidden">
          <div className="p-4 border-b border-[#3A3A3A]">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" style={{ color: LIME_GREEN }} />
              <h3 className="font-medium text-white">Notes</h3>
              {notes.length > 0 && (
                <span className="text-xs text-[#6B7280] bg-[#3A3A3A] px-2 py-0.5 rounded-full">
                  {notes.length}
                </span>
              )}
            </div>
          </div>
          <div className="p-4 space-y-3">
            {notes.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className={`rounded-lg p-3 ${
                      note.authorRole === 'dispatcher'
                        ? 'bg-[#3A3A3A] border-l-2 border-l-[#C4F542]'
                        : 'bg-[#1F1F1F] border-l-2 border-l-[#6B7280]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{note.author}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            note.authorRole === 'dispatcher'
                              ? 'bg-[#C4F542]/15 text-[#C4F542]'
                              : 'bg-[#6B7280]/15 text-[#6B7280]'
                          }`}
                        >
                          {note.authorRole === 'dispatcher' ? 'Dispatcher' : 'Worker'}
                        </span>
                      </div>
                      {formatShortDate(note.createdAt) && (
                        <span className="text-xs text-[#6B7280]">
                          {formatShortDate(note.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-[#9CA3AF] text-sm">{note.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <FileText className="w-8 h-8 text-[#4B5563] mx-auto mb-2" />
                <p className="text-[#6B7280] text-sm">No notes yet</p>
              </div>
            )}

            {/* Only show add note when working (not for scheduled/on_the_way/completed) */}
            {canEditJobDetails && (
              <div className="flex gap-2 pt-2 border-t border-[#3A3A3A]">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1 bg-[#1F1F1F] border border-[#3A3A3A] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-[#C4F542] resize-none transition-colors"
                  rows={2}
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || addingNote}
                  className="p-3 rounded-lg transition-colors disabled:bg-[#3A3A3A] disabled:text-[#6B7280]"
                  style={{ backgroundColor: newNote.trim() ? LIME_GREEN : undefined }}
                >
                  {addingNote ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <Send className="w-5 h-5 text-zinc-900" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Media Section - Only show when working or completed */}
        {canAddMedia && (
        <div id="media-section" className="bg-[#1F1F1F] rounded-xl border border-[#2A2A2A] overflow-hidden">
          <div className="p-4 border-b border-[#2A2A2A]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5" style={{ color: LIME_GREEN }} />
                <h3 className="font-medium text-white">Media</h3>
              </div>
              {status !== 'completed' && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-sm"
                style={{ color: LIME_GREEN }}
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
              )}
            </div>
          </div>
          <div className="p-4">
            {/* Filter out check photos - they appear in payment section */}
            {media.filter(m => m.type !== 'check').length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {media.filter(m => m.type !== 'check').map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedMedia(item)}
                    className="aspect-square bg-[#2A2A2A] rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                  >
                    {item.type === 'photo' ? (
                      <img
                        src={item.url}
                        alt="Job media"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-zinc-500" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <ImageIcon className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">No media yet</p>
                {status !== 'completed' && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 px-4 py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-zinc-300 text-sm rounded-lg transition-colors"
                >
                  Add Photos/Videos
                </button>
                )}
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleMediaUpload}
          />
        </div>
        )}

        {/* Customer History Button */}
        <button
          onClick={handleViewCustomerHistory}
          className="w-full bg-[#1F1F1F] rounded-xl border border-[#2A2A2A] p-4 flex items-center justify-between hover:bg-[#2A2A2A]/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center">
              <History className="w-5 h-5 text-zinc-400" />
            </div>
            <span className="font-medium text-white">View Customer History</span>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-500" />
        </button>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-[#1F1F1F] border-t border-[#2A2A2A] p-4 z-40">
        <div className="max-w-lg mx-auto flex gap-3">
          {/* Navigate Button */}
          {timerState !== 'completed' && (
            <button
              onClick={() => openMaps(job.address || job.customer.address || '')}
              className="p-4 rounded-xl transition-colors"
              style={{ backgroundColor: LIME_GREEN }}
            >
              <Navigation className="w-5 h-5 text-zinc-900" />
            </button>
          )}

          {/* Call Button */}
          {job.customer.phone && timerState !== 'completed' && (
            <button
              onClick={() => callPhone(job.customer.phone!)}
              className="p-4 rounded-xl transition-colors"
              style={{ backgroundColor: LIME_GREEN }}
            >
              <Phone className="w-5 h-5 text-zinc-900" />
            </button>
          )}

          {/* Main Action Button */}
          {renderActionButton()}
        </div>
      </div>

      {/* Media Lightbox */}
      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-4 right-4 p-2 bg-[#2A2A2A] rounded-full"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          {selectedMedia.type === 'photo' ? (
            <img
              src={selectedMedia.url}
              alt="Job media"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <video
              src={selectedMedia.url}
              controls
              className="max-w-full max-h-full"
            />
          )}
        </div>
      )}

      {/* Customer History Modal */}
      {showCustomerHistory && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-[#1F1F1F] w-full max-w-md max-h-[85vh] rounded-2xl border border-[#2A2A2A] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A] shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-white">Customer History</h2>
                <p className="text-sm text-zinc-500">{job?.customer.name}</p>
              </div>
              <button
                onClick={() => setShowCustomerHistory(false)}
                className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto flex-1">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: LIME_GREEN }} />
                </div>
              ) : customerJobs.length > 0 ? (
                <div className="space-y-3">
                  {customerJobs.map((cJob) => (
                    <div
                      key={cJob.id}
                      className="bg-[#2A2A2A]/50 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-white">{cJob.serviceType}</p>
                          <p className="text-zinc-500 text-sm">{formatShortDate(cJob.date)}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(cJob.status)}`}>
                          {cJob.status}
                        </span>
                      </div>

                      {cJob.workerName && (
                        <p className="text-zinc-400 text-sm">
                          <span className="text-zinc-500">Worker:</span> {cJob.workerName}
                        </p>
                      )}

                      {cJob.workPerformed && (
                        <p className="text-zinc-400 text-sm">
                          <span className="text-zinc-500">Work:</span> {cJob.workPerformed}
                        </p>
                      )}

                      {cJob.partsUsed && cJob.partsUsed.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-zinc-500 text-sm">Parts:</span>
                          {cJob.partsUsed.map((part, i) => (
                            <span key={i} className="text-xs bg-zinc-700 px-2 py-0.5 rounded text-zinc-300">
                              {part}
                            </span>
                          ))}
                        </div>
                      )}

                      {cJob.notes && (
                        <p className="text-zinc-400 text-sm italic">&quot;{cJob.notes}&quot;</p>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <p className="font-medium" style={{ color: LIME_GREEN }}>
                          ${cJob.amount.toFixed(2)}
                        </p>
                        {cJob.hasPhotos && (
                          <span className="text-xs text-zinc-500 flex items-center gap-1">
                            <Camera className="w-3 h-3" /> Photos
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                  <p className="text-zinc-500">No previous jobs with this customer</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#2A2A2A] shrink-0">
              <button
                onClick={() => setShowCustomerHistory(false)}
                className="w-full py-3 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-zinc-300 font-medium rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Info Modal */}
      {showCustomerModal && job && (
        <div
          className="fixed inset-0 bg-black/80 z-[70] flex items-end justify-center"
          onClick={() => setShowCustomerModal(false)}
        >
          <div
            className="bg-[#1F1F1F] w-full max-w-md rounded-t-2xl border-t border-x border-[#2A2A2A] shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-zinc-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-[#2A2A2A]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center">
                  <User className="w-6 h-6 text-zinc-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{job.customer.name}</h2>
                  <p className="text-zinc-400 text-sm">Customer</p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="p-4 space-y-3">
              {job.customer.phone && (
                <div className="flex items-center justify-between p-3 bg-[#2A2A2A]/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-zinc-400" />
                    <div>
                      <p className="text-zinc-400 text-xs">Phone</p>
                      <p className="text-white">{job.customer.phone}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`sms:${job.customer.phone}`}
                      className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 text-zinc-300" />
                    </a>
                    <a
                      href={`tel:${job.customer.phone}`}
                      className="p-2 rounded-lg transition-colors"
                      style={{ backgroundColor: LIME_GREEN }}
                    >
                      <Phone className="w-4 h-4 text-zinc-900" />
                    </a>
                  </div>
                </div>
              )}

              {job.customer.email && (
                <div className="flex items-center justify-between p-3 bg-[#2A2A2A]/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-zinc-400" />
                    <div>
                      <p className="text-zinc-400 text-xs">Email</p>
                      <p className="text-white text-sm">{job.customer.email}</p>
                    </div>
                  </div>
                  <a
                    href={`mailto:${job.customer.email}`}
                    className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
                  >
                    <Mail className="w-4 h-4 text-zinc-300" />
                  </a>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 bg-[#2A2A2A]/50 rounded-xl">
                <MapPin className="w-5 h-5 text-zinc-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-zinc-400 text-xs">Address</p>
                  <p className="text-white text-sm">{job.address || job.customer.address || 'No address'}</p>
                </div>
                <button
                  onClick={() => openMaps(job.address || job.customer.address || '')}
                  className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
                >
                  <Navigation className="w-4 h-4" style={{ color: LIME_GREEN }} />
                </button>
              </div>
            </div>

            {/* Close Button */}
            <div className="p-4 border-t border-[#2A2A2A]">
              <button
                onClick={() => setShowCustomerModal(false)}
                className="w-full py-3 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-zinc-300 font-medium rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Completion Flow (Photos, Duration, Signature for card payments) */}
      {showCompletionFlow && job && (
        <JobCompletionFlow
          isOpen={showCompletionFlow}
          onClose={() => setShowCompletionFlow(false)}
          onComplete={handleCompletionFlowComplete}
          jobId={job.id}
          serviceType={job.serviceType}
          providerId={providerId}
          customerId={job.customer.id}
          customerName={job.customer.name}
          estimatedDuration={job.estimatedDuration ?? undefined}
          existingPhotos={media.filter(m => m.type === 'after').map(m => m.url)}
          requireCompletionPhotos={requireCompletionPhotos}
          paymentMethod={paymentMethod}
        />
      )}

      {/* Job Completion Confirmation Modal */}
      {showConfirmModal && job && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4">
          <div className="bg-[#1F1F1F] w-full max-w-md rounded-2xl border border-[#2A2A2A] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 pb-4 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: `${LIME_GREEN}20` }}>
                <CheckCircle2 className="w-8 h-8" style={{ color: LIME_GREEN }} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Complete This Job?</h2>
              <p className="text-zinc-400 text-sm">Please confirm the details below before completing.</p>
            </div>

            {/* Job Summary */}
            <div className="px-6 pb-4 space-y-3">
              <div className="bg-[#2A2A2A]/50 rounded-lg p-4 space-y-3">
                {/* Customer & Job Type */}
                <div className="flex justify-between text-sm pb-2 border-b border-[#3A3A3A]">
                  <div>
                    <p className="text-zinc-400 text-xs">Customer</p>
                    <p className="text-white font-medium">{job.customer.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-400 text-xs">Service Type</p>
                    <p className="text-white font-medium">{job.serviceType}</p>
                  </div>
                </div>

                {/* Services Performed */}
                {selectedServices.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-zinc-400 text-xs font-medium">Services Performed</p>
                    {selectedServices.map((service, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-zinc-300">{service.serviceName}</span>
                        <span className="text-white">${service.price.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm pt-1">
                      <span className="text-zinc-400">Subtotal</span>
                      <span className="text-white font-medium">${servicesSubtotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Parts Added */}
                {parts.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-[#3A3A3A]">
                    <p className="text-zinc-400 text-xs font-medium">Parts</p>
                    {parts.map((part, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-zinc-300">{part.name} x{part.quantity}</span>
                        <span className="text-white">${(part.quantity * part.unitPrice).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm pt-1">
                      <span className="text-zinc-400">Subtotal</span>
                      <span className="text-white font-medium">${partsSubtotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Payment & Tip */}
                <div className="pt-2 border-t border-[#3A3A3A] space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Payment Method</span>
                    <span className="text-white capitalize">{paymentMethod}</span>
                  </div>
                  {parseFloat(tipAmount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Tip</span>
                      <span className="text-white">${parseFloat(tipAmount).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Grand Total */}
                <div className="pt-3 border-t border-[#3A3A3A] flex justify-between items-center">
                  <span className="font-semibold text-white">Grand Total</span>
                  <span className="font-bold text-xl" style={{ color: LIME_GREEN }}>
                    ${(totalPrice + (parseFloat(tipAmount) || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              {media.length === 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-xs text-amber-400 text-center">
                    No photos added to this job
                  </p>
                </div>
              )}

              {/* Actual Duration Input */}
              <div className="bg-[#2A2A2A]/50 rounded-lg p-4">
                <p className="text-zinc-400 text-xs font-medium mb-3">Actual Time Spent (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map(mins => {
                    const isSelected = actualDurationMinutes === mins && !showCustomActualDuration;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => {
                          setActualDurationMinutes(mins);
                          setShowCustomActualDuration(false);
                          setCustomActualDuration('');
                        }}
                        className={`min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? 'text-zinc-900'
                            : 'bg-[#3A3A3A] text-zinc-300 hover:bg-[#4A4A4A]'
                        }`}
                        style={isSelected ? { backgroundColor: LIME_GREEN } : undefined}
                      >
                        {mins}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomActualDuration(true);
                      setCustomActualDuration(actualDurationMinutes?.toString() || '');
                    }}
                    className={`min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      showCustomActualDuration
                        ? 'text-zinc-900'
                        : 'bg-[#3A3A3A] text-zinc-300 hover:bg-[#4A4A4A]'
                    }`}
                    style={showCustomActualDuration ? { backgroundColor: LIME_GREEN } : undefined}
                  >
                    Custom
                  </button>
                </div>
                {showCustomActualDuration && (
                  <div className="flex items-center gap-2 mt-3">
                    <input
                      type="number"
                      value={customActualDuration}
                      onChange={(e) => {
                        setCustomActualDuration(e.target.value);
                        const val = parseInt(e.target.value);
                        if (val && val >= 15 && val <= 480) {
                          setActualDurationMinutes(val);
                        }
                      }}
                      placeholder="Minutes"
                      className="w-24 px-3 py-2 bg-[#3A3A3A] border border-[#4A4A4A] rounded-lg text-white text-sm focus:outline-none focus:ring-2"
                      style={{ focusRingColor: LIME_GREEN } as any}
                      min="15"
                      max="480"
                    />
                    <span className="text-xs text-zinc-400">min</span>
                  </div>
                )}
                <p className="text-xs text-zinc-500 mt-2">Helps improve future job estimates</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-[#2A2A2A] flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-zinc-300 font-medium rounded-xl transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleCompleteJob}
                className="flex-1 py-3 font-semibold rounded-xl transition-colors text-zinc-900"
                style={{ backgroundColor: LIME_GREEN }}
              >
                Confirm & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </WorkerLayout>
  );
}
