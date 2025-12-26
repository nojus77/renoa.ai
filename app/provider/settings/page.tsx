'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Briefcase,
  Clock,
  DollarSign,
  Bell,
  CreditCard,
  Link2,
  Shield,
  Save,
  Plus,
  Trash2,
  Upload,
  Check,
  X,
  AlertTriangle,
  MapPin,
  Award,
  Sparkles,
  Loader2,
  Phone,
  Building2,
  Calendar,
  CalendarX,
  Monitor,
  Smartphone,
  Mail,
  MessageSquare,
  Globe,
  Instagram,
  Facebook,
  Send,
  LogOut,
  Users,
  Moon,
  Sun,
} from 'lucide-react';
import { toast } from 'sonner';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { validateImage, MAX_FILE_SIZE, ALLOWED_TYPES } from '@/lib/image-upload';

type TabType = 'profile' | 'availability' | 'services' | 'team' | 'notifications' | 'payments' | 'integrations' | 'security';

interface BlockedDate {
  date: string;
  reason: string;
}

const DAYS_OF_WEEK = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

interface TimeSlot {
  start: string;
  end: string;
}

interface WorkingHours {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

const SERVICE_CATEGORIES = [
  'Landscaping & Lawn Care',
  'Home Remodeling',
  'HVAC',
  'Plumbing',
  'Electrical',
  'Roofing',
  'Fencing',
  'Painting',
  'Flooring',
  'Cleaning Services',
  'General Contracting',
  'Other',
];

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

const BUSINESS_ENTITIES = [
  { value: 'Sole Proprietorship', label: 'Sole Proprietorship' },
  { value: 'LLC', label: 'LLC (Limited Liability Company)' },
  { value: 'Corporation', label: 'Corporation' },
  { value: 'Partnership', label: 'Partnership' },
];

const EMPLOYEE_COUNTS = ['1', '2-5', '6-10', '11-25', '26-50', '50+'];

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' }, { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' }, { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' }, { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' }, { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' }, { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' }, { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' }, { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
];

const TRAVEL_DISTANCE_OPTIONS = [
  { value: '10', label: 'Within 10 miles' },
  { value: '25', label: 'Within 25 miles' },
  { value: '50', label: 'Within 50 miles' },
  { value: 'city', label: 'Within my city only' },
  { value: 'statewide', label: 'Anywhere in my state' },
];

const DURATION_OPTIONS = [
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: '120', label: '2 hours' },
  { value: '180', label: '3 hours' },
  { value: '240', label: '4 hours' },
  { value: '360', label: 'Half day' },
  { value: '480', label: 'Full day' },
];

const PAYMENT_TERMS_OPTIONS = [
  { value: 'due_on_receipt', label: 'Due on Receipt' },
  { value: 'net_7', label: 'Net 7' },
  { value: 'net_14', label: 'Net 14' },
  { value: 'net_30', label: 'Net 30' },
];

export default function ProviderSettings() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [providerName, setProviderName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [enhancingDescription, setEnhancingDescription] = useState(false);

  // Profile / Business Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [yearsInBusiness, setYearsInBusiness] = useState(0);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCertification, setNewCertification] = useState('');
  const [avatar, setAvatar] = useState('');
  const [uploading, setUploading] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [primaryCategory, setPrimaryCategory] = useState('');
  const [otherCategory, setOtherCategory] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [businessEntity, setBusinessEntity] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');

  // Service Area (ZIP-based - matching onboarding)
  const [businessZipCode, setBusinessZipCode] = useState('');
  const [travelDistance, setTravelDistance] = useState('');
  const [primaryCity, setPrimaryCity] = useState('');

  // Credentials
  const [licenseNumber, setLicenseNumber] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');

  // Photo cropping
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);

  // Legacy fields for other tabs
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessCity, setBusinessCity] = useState('');
  const [businessState, setBusinessState] = useState('');
  const [businessZip, setBusinessZip] = useState('');
  const [taxId, setTaxId] = useState('');
  const [serviceRadius, setServiceRadius] = useState(25);
  const [website, setWebsite] = useState('');
  const [businessHours, setBusinessHours] = useState('Mon-Fri: 9 AM - 5 PM');
  const [timeZone, setTimeZone] = useState('America/Chicago');

  // Availability
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    monday: [{ start: '09:00', end: '17:00' }],
    tuesday: [{ start: '09:00', end: '17:00' }],
    wednesday: [{ start: '09:00', end: '17:00' }],
    thursday: [{ start: '09:00', end: '17:00' }],
    friday: [{ start: '09:00', end: '17:00' }],
    saturday: [],
    sunday: [],
  });
  const [workingDays, setWorkingDays] = useState<Record<string, boolean>>({
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: false,
    sun: false,
  });
  const [workingHoursStart, setWorkingHoursStart] = useState('08:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState('17:00');
  const [bufferTime, setBufferTime] = useState(30);
  const [maxJobsPerDay, setMaxJobsPerDay] = useState(8);
  const [advanceBooking, setAdvanceBooking] = useState(14);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [newBlockedReason, setNewBlockedReason] = useState('');

  // Services (loaded from provider's actual services)
  interface ServicePricing {
    name: string;
    enabled: boolean;
    startingPrice: number;
    duration: string;
  }
  const [servicePricing, setServicePricing] = useState<ServicePricing[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [depositRequired, setDepositRequired] = useState(false);
  const [depositPercentage, setDepositPercentage] = useState(25);

  // Payment settings
  const [lateFeeEnabled, setLateFeeEnabled] = useState(false);
  const [lateFeePercentage, setLateFeePercentage] = useState(5);
  const [acceptBankTransfer, setAcceptBankTransfer] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeAccountEmail, setStripeAccountEmail] = useState('');

  // Online Presence (for merged Business into Profile)
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [googleBusinessUrl, setGoogleBusinessUrl] = useState('');

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState({
    newLead: true,
    jobReminders: true,
    paymentReceived: true,
    customerMessages: true,
    weeklySummary: true,
  });
  const [smsNotifications, setSmsNotifications] = useState({
    newLeadAlert: true,
    sameDayReminders: false,
    urgentMessagesOnly: true,
  });
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietHoursStart, setQuietHoursStart] = useState('21:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  // Payments
  const [paymentTerms, setPaymentTerms] = useState('net_7');
  const [acceptCreditCard, setAcceptCreditCard] = useState(true);
  const [acceptCash, setAcceptCash] = useState(true);
  const [acceptCheck, setAcceptCheck] = useState(false);
  const [autoInvoice, setAutoInvoice] = useState(true);

  // Team / Worker Permissions
  const [workersCanCreateJobs, setWorkersCanCreateJobs] = useState(false);
  const [workerJobsNeedApproval, setWorkerJobsNeedApproval] = useState(true);
  const [workersCanEditSkills, setWorkersCanEditSkills] = useState(false);
  const [workersCanEditAvailability, setWorkersCanEditAvailability] = useState(true);
  const [workersCanViewTeamSchedule, setWorkersCanViewTeamSchedule] = useState(false);
  const [requireCompletionPhotos, setRequireCompletionPhotos] = useState(false);

  // Handle theme mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');

    if (!id || !name) {
      router.push('/provider/login');
      return;
    }

    setProviderId(id);
    setProviderName(name);
    loadSettings(id);
  }, [router]);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const loadSettings = async (id: string) => {
    setLoading(true);
    try {
      // Load profile settings
      const profileRes = await fetch(`/api/provider/profile?providerId=${id}`);
      const profileData = await profileRes.json();

      if (profileData.provider) {
        const provider = profileData.provider;
        setBusinessName(provider.businessName || '');
        setEmail(provider.email || '');
        setPhone(provider.phone || '');
        setBio(provider.bio || '');
        setYearsInBusiness(provider.yearsInBusiness || 0);
        setCertifications(provider.certifications || []);
        setAvatar(provider.avatar || '');

        // New onboarding fields
        setPrimaryCategory(provider.primaryCategory || '');
        setBusinessEntity(provider.businessEntity || '');
        setBusinessZipCode(provider.businessZipCode || '');
        setTravelDistance(provider.travelDistance || '');
        setPrimaryCity(provider.city || '');
        setLicenseNumber(provider.taxId || '');
        setInsuranceProvider(provider.insuranceProvider || '');
        setSelectedServices(provider.serviceTypes || []);

        // Build servicePricing from provider's selected services
        const providerServices = provider.serviceTypes || [];
        if (providerServices.length > 0) {
          setServicePricing(providerServices.map((svc: string) => ({
            name: svc,
            enabled: true,
            startingPrice: 0,
            duration: '60',
          })));
        }

        // Map activeSeats back to employeeCount
        const seats = provider.activeSeats || 1;
        if (seats >= 50) setEmployeeCount('50+');
        else if (seats >= 26) setEmployeeCount('26-50');
        else if (seats >= 11) setEmployeeCount('11-25');
        else if (seats >= 6) setEmployeeCount('6-10');
        else if (seats >= 2) setEmployeeCount('2-5');
        else setEmployeeCount('1');

        // Split ownerName into firstName and lastName
        if (provider.ownerName) {
          const nameParts = provider.ownerName.trim().split(' ');
          if (nameParts.length === 1) {
            setFirstName(nameParts[0]);
            setLastName('');
          } else {
            setFirstName(nameParts[0]);
            setLastName(nameParts.slice(1).join(' '));
          }
        }
      }

      // Load business settings
      const businessRes = await fetch(`/api/provider/settings/business?providerId=${id}`);
      const businessData = await businessRes.json();

      if (businessData.provider) {
        const provider = businessData.provider;
        setBusinessAddress(provider.businessAddress || '');
        setBusinessCity(provider.city || '');
        setBusinessState(provider.state || '');
        setBusinessZip(provider.zipCode || '');
        setTaxId(provider.taxId || '');
        setServiceRadius(provider.serviceRadius || 25);
        setWebsite(provider.website || '');
        setBusinessHours(provider.businessHours || 'Mon-Fri: 9 AM - 5 PM');
        setTimeZone(provider.timeZone || 'America/Chicago');
      }

      // Load availability settings
      const res = await fetch(`/api/provider/availability?providerId=${id}`);
      const data = await res.json();

      if (data.workingHours) setWorkingHours(data.workingHours);
      if (data.bufferTime) setBufferTime(data.bufferTime);
      if (data.advanceBooking) setAdvanceBooking(data.advanceBooking);

      // Load team/worker permissions
      const teamRes = await fetch(`/api/provider/settings/team?providerId=${id}`);
      const teamData = await teamRes.json();

      if (teamData.provider) {
        const p = teamData.provider;
        setWorkersCanCreateJobs(p.workersCanCreateJobs ?? false);
        setWorkerJobsNeedApproval(p.workerJobsNeedApproval ?? true);
        setWorkersCanEditSkills(p.workersCanEditSkills ?? false);
        setWorkersCanEditAvailability(p.workersCanEditAvailability ?? true);
        setWorkersCanViewTeamSchedule(p.workersCanViewTeamSchedule ?? false);
        setRequireCompletionPhotos(p.requireCompletionPhotos ?? false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnhanceDescription = async () => {
    if (!bio || bio.trim().length < 3) {
      toast.error('Please enter a brief description first');
      return;
    }

    setEnhancingDescription(true);
    try {
      const res = await fetch('/api/ai/enhance-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: bio,
          businessName: businessName,
          category: primaryCategory,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to enhance description');
      }

      setBio(data.enhancedDescription);
      toast.success('Description enhanced!');
    } catch (error) {
      console.error('Error enhancing description:', error);
      toast.error('Failed to enhance description');
    } finally {
      setEnhancingDescription(false);
    }
  };

  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const getAvailableServices = () => {
    if (primaryCategory === 'Other') return [];
    return SERVICES_BY_CATEGORY[primaryCategory] || [];
  };

  const saveProfileSettings = async () => {
    setSaving(true);
    try {
      // Combine firstName and lastName into ownerName
      const ownerName = `${firstName.trim()} ${lastName.trim()}`.trim();

      // Determine actual category
      const actualCategory = primaryCategory === 'Other' ? otherCategory : primaryCategory;

      const res = await fetch('/api/provider/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          businessName,
          ownerName,
          bio,
          phone,
          yearsInBusiness,
          certifications,
          avatar,
          primaryCategory: actualCategory,
          serviceTypes: selectedServices,
          businessEntity,
          employeeCount,
          // Service area (ZIP-based)
          businessZipCode,
          travelDistance,
          primaryCity,
          // Credentials
          licenseNumber,
          insuranceProvider,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }

      toast.success('Profile settings saved');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile settings';
      console.error('Error saving profile:', error);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!file) return;

    // Use shared validation
    const validation = validateImage(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('No 2d context');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg');
    });
  };

  const handleCropComplete = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setUploading(true);
    toast.loading('Uploading photo...');

    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

      const formDataObj = new FormData();
      formDataObj.append('file', croppedBlob, 'profile-photo.jpg');
      formDataObj.append('providerId', providerId);

      const res = await fetch('/api/provider/profile/photo/upload', {
        method: 'POST',
        body: formDataObj,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to upload photo');

      setAvatar(data.url);
      toast.dismiss();
      toast.success('Photo uploaded successfully!');

      setShowCropModal(false);
      setSelectedImage(null);
      setImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);

      window.location.reload();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload photo';
      console.error('Error uploading photo:', error);
      toast.dismiss();
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoDelete = async () => {
    if (!avatar) return;

    try {
      toast.loading('Deleting photo...');

      const res = await fetch('/api/provider/profile/photo/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to delete photo');

      setAvatar('');
      toast.dismiss();
      toast.success('Photo deleted successfully!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete photo';
      console.error('Error deleting photo:', error);
      toast.dismiss();
      toast.error(errorMessage);
    }
  };

  const saveAvailabilitySettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/provider/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          workingHours,
          bufferTime,
          advanceBooking,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');
      toast.success('Availability settings saved');
    } catch (error) {
      toast.error('Failed to save availability settings');
    } finally {
      setSaving(false);
    }
  };

  const saveServicesSettings = async () => {
    setSaving(true);
    try {
      // Build services data from servicePricing state
      const servicesData = servicePricing.reduce((acc, service) => {
        acc[service.name] = {
          enabled: service.enabled,
          startingPrice: service.startingPrice,
          duration: service.duration,
        };
        return acc;
      }, {} as Record<string, { enabled: boolean; startingPrice: number; duration: string }>);

      const res = await fetch('/api/provider/settings/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          servicePricing: servicesData,
          depositRequired,
          depositPercentage,
        }),
      });

      if (!res.ok) throw new Error('Failed to save services settings');

      toast.success('Services settings saved');
    } catch (error) {
      console.error('Error saving services settings:', error);
      toast.error('Failed to save services settings');
    } finally {
      setSaving(false);
    }
  };

  const saveNotificationSettings = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Notification settings saved');
    } catch (error) {
      toast.error('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const savePaymentSettings = async () => {
    setSaving(true);
    try {
      const acceptedMethods: string[] = [];
      if (acceptCreditCard) acceptedMethods.push('credit_card');
      if (acceptCash) acceptedMethods.push('cash');
      if (acceptCheck) acceptedMethods.push('check');

      const res = await fetch('/api/provider/settings/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          paymentTerms,
          acceptedPaymentMethods: acceptedMethods,
          autoInvoiceOnCompletion: autoInvoice,
        }),
      });

      if (!res.ok) throw new Error('Failed to save payment settings');

      toast.success('Payment settings saved');
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast.error('Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  const saveTeamSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/provider/settings/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          workersCanCreateJobs,
          workerJobsNeedApproval,
          workersCanEditSkills,
          workersCanEditAvailability,
          workersCanViewTeamSchedule,
          requireCompletionPhotos,
        }),
      });

      if (!res.ok) throw new Error('Failed to save team settings');

      toast.success('Team settings saved');
    } catch (error) {
      console.error('Error saving team settings:', error);
      toast.error('Failed to save team settings');
    } finally {
      setSaving(false);
    }
  };

  const saveBusinessLocation = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/provider/settings/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          businessName,
          businessAddress,
          city: businessCity,
          state: businessState,
          zipCode: businessZip,
          taxId,
          businessEntity,
          serviceRadius,
          website,
          businessHours,
          timeZone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save business location');
      }

      toast.success('Business location saved');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save business location';
      console.error('Error saving business location:', error);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile' as TabType, name: 'Profile', icon: User },
    { id: 'availability' as TabType, name: 'Availability', icon: Clock },
    { id: 'services' as TabType, name: 'Services & Pricing', icon: DollarSign },
    { id: 'team' as TabType, name: 'Team', icon: Users },
    { id: 'notifications' as TabType, name: 'Notifications', icon: Bell },
    { id: 'payments' as TabType, name: 'Payments', icon: CreditCard },
    { id: 'integrations' as TabType, name: 'Integrations', icon: Link2 },
    { id: 'security' as TabType, name: 'Security', icon: Shield },
  ];

  const addBlockedDate = () => {
    if (!newBlockedDate) {
      toast.error('Please select a date');
      return;
    }
    const dateExists = blockedDates.some(bd => bd.date === newBlockedDate);
    if (dateExists) {
      toast.error('This date is already blocked');
      return;
    }
    setBlockedDates([...blockedDates, { date: newBlockedDate, reason: newBlockedReason || 'Unavailable' }]);
    setNewBlockedDate('');
    setNewBlockedReason('');
    toast.success('Date blocked successfully');
  };

  const removeBlockedDate = (date: string) => {
    setBlockedDates(blockedDates.filter(bd => bd.date !== date));
    toast.success('Blocked date removed');
  };

  const formatBlockedDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSendTestEmail = async () => {
    setSendingTestEmail(true);
    try {
      // Mock sending test email
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`Test email sent to ${email}`);
    } catch {
      toast.error('Failed to send test email');
    } finally {
      setSendingTestEmail(false);
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
          <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-3 md:py-6">
            <h1 className="text-xl md:text-2xl font-bold text-zinc-100">Settings</h1>
            <p className="text-xs md:text-sm text-zinc-400 mt-0.5 md:mt-1">Manage your account and preferences</p>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-4 md:py-8">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {/* Mobile: Dropdown Selector */}
            <div className="md:hidden">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as TabType)}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop: Sidebar Tabs */}
            <div className="hidden md:block w-64 flex-shrink-0">
              <div className="sticky top-6 space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                        activeTab === tab.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{tab.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-4 md:space-y-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Business Profile Section */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-emerald-400" />
                        Business Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Photo Upload */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-3">
                          Business Logo / Avatar
                        </label>
                        <div className="flex items-center gap-6">
                          {avatar ? (
                            <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-emerald-500">
                              <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-zinc-700 flex items-center justify-center bg-zinc-900">
                              <Upload className="h-8 w-8 text-zinc-600" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex gap-3">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handlePhotoUpload(file);
                                }}
                                id="avatar-upload"
                                className="hidden"
                              />
                              <label
                                htmlFor="avatar-upload"
                                className="inline-flex items-center px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-700 transition-colors"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                {uploading ? 'Uploading...' : avatar ? 'Change Photo' : 'Upload Photo'}
                              </label>
                              {avatar && !uploading && (
                                <button
                                  onClick={handlePhotoDelete}
                                  className="inline-flex items-center px-4 py-2 bg-red-900/20 border border-red-800 text-red-400 rounded-lg hover:bg-red-900/40 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 mt-2">PNG, JPG up to 5MB</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Business Name */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Business Name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                            placeholder="Your Business Name"
                          />
                        </div>

                        {/* Business Phone */}
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                            <Phone className="h-4 w-4 text-blue-400" />
                            Business Phone <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                            placeholder="(555) 123-4567"
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={email}
                            disabled
                            className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-400 cursor-not-allowed"
                          />
                        </div>

                        {/* Owner Name */}
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            First Name
                          </label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                            placeholder="John"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                            placeholder="Doe"
                          />
                        </div>
                      </div>

                      {/* Business Description */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-zinc-300">
                            Business Description
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleEnhanceDescription}
                            disabled={enhancingDescription || !bio.trim()}
                            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 text-xs h-7"
                          >
                            {enhancingDescription ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Enhancing...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 mr-1" />
                                Enhance with AI
                              </>
                            )}
                          </Button>
                        </div>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                          placeholder="Brief description of your business and services..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Primary Category */}
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Primary Service Category <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={primaryCategory}
                            onChange={(e) => {
                              setPrimaryCategory(e.target.value);
                              setSelectedServices([]);
                              setOtherCategory('');
                            }}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="">Select a category</option>
                            {SERVICE_CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          {primaryCategory === 'Other' && (
                            <input
                              type="text"
                              value={otherCategory}
                              onChange={(e) => setOtherCategory(e.target.value)}
                              className="w-full px-3 py-2 mt-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                              placeholder="Specify your service type"
                            />
                          )}
                        </div>

                        {/* Business Entity */}
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Business Entity Type <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={businessEntity}
                            onChange={(e) => setBusinessEntity(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="">Select entity type</option>
                            {BUSINESS_ENTITIES.map(entity => (
                              <option key={entity.value} value={entity.value}>{entity.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Years in Business */}
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Years in Business <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="number"
                            value={yearsInBusiness}
                            onChange={(e) => setYearsInBusiness(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                            placeholder="5"
                            min="0"
                          />
                        </div>

                        {/* Employee Count */}
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Number of Employees <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={employeeCount}
                            onChange={(e) => setEmployeeCount(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="">Select employee count</option>
                            {EMPLOYEE_COUNTS.map(count => (
                              <option key={count} value={count}>{count}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Services Multi-Select */}
                      {primaryCategory && primaryCategory !== 'Other' && (
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-3">
                            Services You Provide
                            <span className="text-zinc-500 font-normal ml-2">
                              ({selectedServices.length} selected)
                            </span>
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {getAvailableServices().map(service => (
                              <label
                                key={service}
                                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                                  selectedServices.includes(service)
                                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                    : 'bg-zinc-800/30 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedServices.includes(service)}
                                  onChange={() => toggleService(service)}
                                  className="sr-only"
                                />
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                  selectedServices.includes(service)
                                    ? 'bg-emerald-500 border-emerald-500'
                                    : 'border-zinc-600'
                                }`}>
                                  {selectedServices.includes(service) && (
                                    <Check className="w-3 h-3 text-white" />
                                  )}
                                </div>
                                <span className="text-sm">{service}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Service Area Section */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-orange-400" />
                        Service Area
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Business Location ZIP Code <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={businessZipCode}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                              setBusinessZipCode(value);
                            }}
                            className={`w-full px-3 py-2 bg-zinc-900 border rounded-lg text-zinc-200 focus:outline-none transition-all ${
                              businessZipCode && !/^\d{5}$/.test(businessZipCode)
                                ? 'border-red-500 focus:border-red-500'
                                : 'border-zinc-800 focus:border-emerald-500'
                            }`}
                            placeholder="e.g., 78701"
                            maxLength={5}
                          />
                          {businessZipCode && !/^\d{5}$/.test(businessZipCode) && (
                            <p className="text-xs text-red-400 mt-1">Please enter a valid 5-digit ZIP code</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            How far do you travel for jobs? <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={travelDistance}
                            onChange={(e) => setTravelDistance(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="">Select travel distance</option>
                            {TRAVEL_DISTANCE_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Primary City <span className="text-zinc-500 font-normal">(Optional - for display purposes)</span>
                          </label>
                          <input
                            type="text"
                            value={primaryCity}
                            onChange={(e) => setPrimaryCity(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                            placeholder="e.g., Austin"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Credentials Section */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-cyan-400" />
                        Credentials
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            License Number <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={licenseNumber}
                            onChange={(e) => setLicenseNumber(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                            placeholder="e.g., LIC-123456"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Insurance Provider <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={insuranceProvider}
                            onChange={(e) => setInsuranceProvider(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                            placeholder="e.g., State Farm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Certifications & Licenses
                        </label>
                        <div className="space-y-2 mb-3">
                          {certifications.map((cert, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                              <span className="text-sm text-zinc-200">{cert}</span>
                              <button
                                onClick={() => setCertifications(certifications.filter((_, i) => i !== idx))}
                                className="text-red-400 hover:text-red-300 p-2"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={newCertification}
                            onChange={(e) => setNewCertification(e.target.value)}
                            className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                            placeholder="e.g., Licensed Contractor, EPA Certified"
                          />
                          <Button
                            onClick={() => {
                              if (newCertification.trim()) {
                                setCertifications([...certifications, newCertification]);
                                setNewCertification('');
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 w-full sm:w-auto"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Business Address */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-400" />
                        Business Address
                      </CardTitle>
                      <p className="text-sm text-zinc-400 mt-1">
                        Your business mailing address for invoicing
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Street Address
                          </label>
                          <input
                            type="text"
                            value={businessAddress}
                            onChange={(e) => setBusinessAddress(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                            placeholder="123 Main Street"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            value={businessCity}
                            onChange={(e) => setBusinessCity(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                            placeholder="Austin"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                              State
                            </label>
                            <select
                              value={businessState}
                              onChange={(e) => setBusinessState(e.target.value)}
                              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                            >
                              <option value="">Select</option>
                              {US_STATES.map(state => (
                                <option key={state.value} value={state.value}>{state.value}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                              ZIP Code
                            </label>
                            <input
                              type="text"
                              value={businessZip}
                              onChange={(e) => setBusinessZip(e.target.value)}
                              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                              placeholder="78701"
                              maxLength={5}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Time Zone
                        </label>
                        <select
                          value={timeZone}
                          onChange={(e) => setTimeZone(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="America/New_York">Eastern Time (ET)</option>
                          <option value="America/Chicago">Central Time (CT)</option>
                          <option value="America/Denver">Mountain Time (MT)</option>
                          <option value="America/Phoenix">Arizona (no DST)</option>
                          <option value="America/Los_Angeles">Pacific Time (PT)</option>
                          <option value="America/Anchorage">Alaska Time (AKT)</option>
                          <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
                        </select>
                      </div>

                      {/* Dark Mode Toggle */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Dark Mode 🌙
                        </label>
                        <button
                          type="button"
                          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                          className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 hover:border-zinc-700 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            {mounted && theme === 'dark' ? (
                              <>
                                <Moon className="h-4 w-4 text-purple-400" />
                                <span>Dark Mode</span>
                              </>
                            ) : (
                              <>
                                <Sun className="h-4 w-4 text-yellow-400" />
                                <span>Light Mode</span>
                              </>
                            )}
                          </span>
                          <div className={`w-10 h-5 rounded-full relative transition-colors ${mounted && theme === 'dark' ? 'bg-purple-500' : 'bg-zinc-600'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${mounted && theme === 'dark' ? 'left-5' : 'left-0.5'}`} />
                          </div>
                        </button>
                      </div>

                      <Button
                        onClick={saveBusinessLocation}
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-500 w-full mt-4"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Business Address
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Online Presence */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100 flex items-center gap-2">
                        <Globe className="h-5 w-5 text-purple-400" />
                        Online Presence
                      </CardTitle>
                      <p className="text-sm text-zinc-400 mt-1">
                        Help customers find you online
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Website
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                          <input
                            type="url"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Facebook Page
                          <span className="text-zinc-500 font-normal ml-2">(Optional)</span>
                        </label>
                        <div className="relative">
                          <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                          <input
                            type="url"
                            value={facebookUrl}
                            onChange={(e) => setFacebookUrl(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                            placeholder="https://facebook.com/yourbusiness"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Instagram
                          <span className="text-zinc-500 font-normal ml-2">(Optional)</span>
                        </label>
                        <div className="relative">
                          <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                          <input
                            type="url"
                            value={instagramUrl}
                            onChange={(e) => setInstagramUrl(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                            placeholder="https://instagram.com/yourbusiness"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Google Business Profile
                          <span className="text-zinc-500 font-normal ml-2">(Optional)</span>
                        </label>
                        <div className="relative">
                          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <input
                            type="url"
                            value={googleBusinessUrl}
                            onChange={(e) => setGoogleBusinessUrl(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                            placeholder="https://g.page/yourbusiness"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={saveProfileSettings}
                      disabled={saving}
                      className="bg-emerald-600 hover:bg-emerald-500 w-full sm:w-auto"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Profile'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Availability Tab */}
              {activeTab === 'availability' && (
                <div className="space-y-6">
                  {/* Working Schedule */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-400" />
                        Working Schedule
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Working Days */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-3">
                          Working Days
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {DAYS_OF_WEEK.map(day => (
                            <button
                              key={day.key}
                              onClick={() => setWorkingDays(prev => ({ ...prev, [day.key]: !prev[day.key] }))}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                workingDays[day.key]
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                              }`}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Working Hours */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-3">
                          Working Hours
                        </label>
                        <div className="grid grid-cols-2 gap-4 max-w-md">
                          <div>
                            <label className="block text-xs text-zinc-400 mb-1">Start Time</label>
                            <input
                              type="time"
                              value={workingHoursStart}
                              onChange={(e) => setWorkingHoursStart(e.target.value)}
                              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-400 mb-1">End Time</label>
                            <input
                              type="time"
                              value={workingHoursEnd}
                              onChange={(e) => setWorkingHoursEnd(e.target.value)}
                              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Scheduling Rules */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100">Scheduling Rules</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Buffer Time (minutes)
                          </label>
                          <input
                            type="number"
                            value={bufferTime}
                            onChange={(e) => setBufferTime(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                          />
                          <p className="text-xs text-zinc-500 mt-1">Time between jobs for travel</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Max Jobs Per Day
                          </label>
                          <input
                            type="number"
                            value={maxJobsPerDay}
                            onChange={(e) => setMaxJobsPerDay(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                          />
                          <p className="text-xs text-zinc-500 mt-1">Prevent overbooking</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Advance Booking (days)
                          </label>
                          <input
                            type="number"
                            value={advanceBooking}
                            onChange={(e) => setAdvanceBooking(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                          />
                          <p className="text-xs text-zinc-500 mt-1">Max days ahead for booking</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Blocked Dates */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100 flex items-center gap-2">
                        <CalendarX className="h-5 w-5 text-red-400" />
                        Blocked Dates
                      </CardTitle>
                      <p className="text-sm text-zinc-400 mt-1">
                        Block specific dates when you&apos;re unavailable
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Add Blocked Date */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="date"
                          value={newBlockedDate}
                          onChange={(e) => setNewBlockedDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                        />
                        <input
                          type="text"
                          value={newBlockedReason}
                          onChange={(e) => setNewBlockedReason(e.target.value)}
                          placeholder="Reason (optional)"
                          className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                        />
                        <Button
                          onClick={addBlockedDate}
                          disabled={!newBlockedDate}
                          className="bg-red-600 hover:bg-red-500 disabled:opacity-50"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Block Date
                        </Button>
                      </div>

                      {/* Blocked Dates List */}
                      {blockedDates.length > 0 ? (
                        <div className="flex flex-wrap gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                          {blockedDates.map((bd, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/40 rounded-full text-sm text-red-400"
                            >
                              <CalendarX className="w-3 h-3" />
                              {formatBlockedDate(bd.date)} - {bd.reason}
                              <button
                                onClick={() => removeBlockedDate(bd.date)}
                                className="hover:text-red-300 ml-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-500 text-center py-4">
                          No blocked dates. Add dates when you&apos;re unavailable.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button
                      onClick={saveAvailabilitySettings}
                      disabled={saving}
                      className="bg-emerald-600 hover:bg-emerald-500 w-full sm:w-auto"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Availability'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Services Tab */}
              {activeTab === 'services' && (
                <div className="space-y-6">
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-zinc-100">Your Services</CardTitle>
                        <span className="text-sm text-zinc-400">
                          {servicePricing.filter(s => s.enabled).length} active services
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 mt-1">
                        Configure pricing and duration for services you selected during onboarding
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {servicePricing.length === 0 ? (
                        <div className="text-center py-8">
                          <DollarSign className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                          <p className="text-zinc-400 mb-4">No services configured yet</p>
                          <p className="text-sm text-zinc-500">
                            Add services in your Profile settings, or add them below
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {servicePricing.map((service, index) => (
                            <div key={index} className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => {
                                      setServicePricing(servicePricing.map((s, i) =>
                                        i === index ? { ...s, enabled: !s.enabled } : s
                                      ));
                                    }}
                                    className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                                      service.enabled ? 'bg-emerald-600' : 'bg-zinc-700'
                                    }`}
                                  >
                                    <div
                                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                                        service.enabled ? 'translate-x-6' : 'translate-x-1'
                                      }`}
                                    />
                                  </button>
                                  <span className="text-sm md:text-base text-zinc-200 font-medium">{service.name}</span>
                                </div>
                                <button
                                  onClick={() => {
                                    setServicePricing(servicePricing.filter((_, i) => i !== index));
                                  }}
                                  className="text-zinc-500 hover:text-red-400 p-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                              {service.enabled && (
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Starting Price</label>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                                      <input
                                        type="number"
                                        value={service.startingPrice || ''}
                                        onChange={(e) => {
                                          setServicePricing(servicePricing.map((s, i) =>
                                            i === index ? { ...s, startingPrice: parseInt(e.target.value) || 0 } : s
                                          ));
                                        }}
                                        className="w-full pl-7 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500 text-sm"
                                        placeholder="0"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Estimated Duration</label>
                                    <select
                                      value={service.duration}
                                      onChange={(e) => {
                                        setServicePricing(servicePricing.map((s, i) =>
                                          i === index ? { ...s, duration: e.target.value } : s
                                        ));
                                      }}
                                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500 text-sm"
                                    >
                                      {DURATION_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Service */}
                      <div className="pt-4 border-t border-zinc-800">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Add New Service
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newServiceName}
                            onChange={(e) => setNewServiceName(e.target.value)}
                            className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                            placeholder="e.g., Gutter Cleaning"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && newServiceName.trim()) {
                                setServicePricing([...servicePricing, {
                                  name: newServiceName.trim(),
                                  enabled: true,
                                  startingPrice: 0,
                                  duration: '60',
                                }]);
                                setNewServiceName('');
                              }
                            }}
                          />
                          <Button
                            onClick={() => {
                              if (newServiceName.trim()) {
                                setServicePricing([...servicePricing, {
                                  name: newServiceName.trim(),
                                  enabled: true,
                                  startingPrice: 0,
                                  duration: '60',
                                }]);
                                setNewServiceName('');
                              }
                            }}
                            disabled={!newServiceName.trim()}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Deposit Settings */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100">Deposit Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-zinc-200">Require Deposit</p>
                          <p className="text-xs text-zinc-500 mt-1">Require upfront payment before starting jobs</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setDepositRequired(!depositRequired)}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              depositRequired ? 'bg-emerald-600' : 'bg-zinc-700'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                                depositRequired ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          {depositRequired && (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={depositPercentage}
                                onChange={(e) => setDepositPercentage(parseInt(e.target.value) || 0)}
                                className="w-20 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500 text-sm"
                                min="1"
                                max="100"
                              />
                              <span className="text-zinc-400 text-sm">%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button
                      onClick={saveServicesSettings}
                      disabled={saving}
                      className="bg-emerald-600 hover:bg-emerald-500 w-full sm:w-auto"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Services'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Team Tab */}
              {activeTab === 'team' && (
                <div className="space-y-6">
                  {/* Worker Permissions */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100 flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-400" />
                        Worker Permissions
                      </CardTitle>
                      <p className="text-sm text-zinc-400 mt-1">
                        Control what your field workers can do in the app
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Workers Can Create Jobs */}
                      <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-zinc-200">Workers can create jobs</p>
                          <p className="text-xs text-zinc-500 mt-1">
                            Allow field workers to create new jobs from their mobile app
                          </p>
                        </div>
                        <button
                          onClick={() => setWorkersCanCreateJobs(!workersCanCreateJobs)}
                          className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                            workersCanCreateJobs ? 'bg-emerald-600' : 'bg-zinc-700'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              workersCanCreateJobs ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Worker Jobs Need Approval - only show if workers can create jobs */}
                      {workersCanCreateJobs && (
                        <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg ml-4 border-l-2 border-l-emerald-600">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-zinc-200">Worker-created jobs need approval</p>
                            <p className="text-xs text-zinc-500 mt-1">
                              Jobs created by workers will be marked as &quot;Pending Approval&quot; until you approve them
                            </p>
                          </div>
                          <button
                            onClick={() => setWorkerJobsNeedApproval(!workerJobsNeedApproval)}
                            className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                              workerJobsNeedApproval ? 'bg-emerald-600' : 'bg-zinc-700'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                                workerJobsNeedApproval ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      )}

                      {/* Workers Can Edit Skills */}
                      <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-zinc-200">Workers can update their skills & equipment</p>
                          <p className="text-xs text-zinc-500 mt-1">
                            Allow workers to edit their own skill and equipment certifications
                          </p>
                        </div>
                        <button
                          onClick={() => setWorkersCanEditSkills(!workersCanEditSkills)}
                          className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                            workersCanEditSkills ? 'bg-emerald-600' : 'bg-zinc-700'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              workersCanEditSkills ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Workers Can Edit Availability */}
                      <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-zinc-200">Workers can update their availability</p>
                          <p className="text-xs text-zinc-500 mt-1">
                            Allow workers to set their own working hours and time off
                          </p>
                        </div>
                        <button
                          onClick={() => setWorkersCanEditAvailability(!workersCanEditAvailability)}
                          className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                            workersCanEditAvailability ? 'bg-emerald-600' : 'bg-zinc-700'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              workersCanEditAvailability ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Workers Can View Team Schedule */}
                      <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-zinc-200">Workers can view other team members&apos; schedules</p>
                          <p className="text-xs text-zinc-500 mt-1">
                            Allow workers to see when other team members are scheduled
                          </p>
                        </div>
                        <button
                          onClick={() => setWorkersCanViewTeamSchedule(!workersCanViewTeamSchedule)}
                          className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                            workersCanViewTeamSchedule ? 'bg-emerald-600' : 'bg-zinc-700'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              workersCanViewTeamSchedule ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Require Completion Photos */}
                      <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-zinc-200">Require photos when completing jobs</p>
                          <p className="text-xs text-zinc-500 mt-1">
                            Workers must upload at least one photo before they can finish a job. If disabled, photos are optional but workers will see a reminder.
                          </p>
                        </div>
                        <button
                          onClick={() => setRequireCompletionPhotos(!requireCompletionPhotos)}
                          className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                            requireCompletionPhotos ? 'bg-emerald-600' : 'bg-zinc-700'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              requireCompletionPhotos ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={saveTeamSettings}
                      disabled={saving}
                      className="bg-emerald-600 hover:bg-emerald-500 w-full sm:w-auto"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Team Settings'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  {/* Email Notifications */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100 flex items-center gap-2">
                        <Mail className="h-5 w-5 text-blue-400" />
                        Email Notifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div>
                          <span className="text-sm text-zinc-200">New Lead</span>
                          <p className="text-xs text-zinc-500 mt-0.5">Get notified when you receive a new lead</p>
                        </div>
                        <button
                          onClick={() => setEmailNotifications({ ...emailNotifications, newLead: !emailNotifications.newLead })}
                          className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                            emailNotifications.newLead ? 'bg-emerald-600' : 'bg-zinc-700'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            emailNotifications.newLead ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div>
                          <span className="text-sm text-zinc-200">Job Reminders</span>
                          <p className="text-xs text-zinc-500 mt-0.5">24 hours before scheduled jobs</p>
                        </div>
                        <button
                          onClick={() => setEmailNotifications({ ...emailNotifications, jobReminders: !emailNotifications.jobReminders })}
                          className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                            emailNotifications.jobReminders ? 'bg-emerald-600' : 'bg-zinc-700'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            emailNotifications.jobReminders ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div>
                          <span className="text-sm text-zinc-200">Payment Received</span>
                          <p className="text-xs text-zinc-500 mt-0.5">When a customer pays an invoice</p>
                        </div>
                        <button
                          onClick={() => setEmailNotifications({ ...emailNotifications, paymentReceived: !emailNotifications.paymentReceived })}
                          className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                            emailNotifications.paymentReceived ? 'bg-emerald-600' : 'bg-zinc-700'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            emailNotifications.paymentReceived ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div>
                          <span className="text-sm text-zinc-200">Customer Messages</span>
                          <p className="text-xs text-zinc-500 mt-0.5">When customers send you a message</p>
                        </div>
                        <button
                          onClick={() => setEmailNotifications({ ...emailNotifications, customerMessages: !emailNotifications.customerMessages })}
                          className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                            emailNotifications.customerMessages ? 'bg-emerald-600' : 'bg-zinc-700'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            emailNotifications.customerMessages ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div>
                          <span className="text-sm text-zinc-200">Weekly Summary</span>
                          <p className="text-xs text-zinc-500 mt-0.5">Performance and earnings overview</p>
                        </div>
                        <button
                          onClick={() => setEmailNotifications({ ...emailNotifications, weeklySummary: !emailNotifications.weeklySummary })}
                          className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                            emailNotifications.weeklySummary ? 'bg-emerald-600' : 'bg-zinc-700'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            emailNotifications.weeklySummary ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* SMS Notifications */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100 flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-green-400" />
                        SMS Notifications
                      </CardTitle>
                      {!phone && (
                        <p className="text-xs text-amber-400 mt-1">
                          Requires phone verification. Add your phone number in Profile settings.
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className={`flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg ${!phone ? 'opacity-50' : ''}`}>
                        <div>
                          <span className="text-sm text-zinc-200">New Lead Alert</span>
                          <p className="text-xs text-zinc-500 mt-0.5">Instant SMS when new leads come in</p>
                        </div>
                        <button
                          onClick={() => phone && setSmsNotifications({ ...smsNotifications, newLeadAlert: !smsNotifications.newLeadAlert })}
                          disabled={!phone}
                          className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                            smsNotifications.newLeadAlert && phone ? 'bg-emerald-600' : 'bg-zinc-700'
                          } ${!phone ? 'cursor-not-allowed' : ''}`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            smsNotifications.newLeadAlert && phone ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      <div className={`flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg ${!phone ? 'opacity-50' : ''}`}>
                        <div>
                          <span className="text-sm text-zinc-200">Same-day Job Reminders</span>
                          <p className="text-xs text-zinc-500 mt-0.5">Morning reminder for jobs scheduled today</p>
                        </div>
                        <button
                          onClick={() => phone && setSmsNotifications({ ...smsNotifications, sameDayReminders: !smsNotifications.sameDayReminders })}
                          disabled={!phone}
                          className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                            smsNotifications.sameDayReminders && phone ? 'bg-emerald-600' : 'bg-zinc-700'
                          } ${!phone ? 'cursor-not-allowed' : ''}`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            smsNotifications.sameDayReminders && phone ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      <div className={`flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg ${!phone ? 'opacity-50' : ''}`}>
                        <div>
                          <span className="text-sm text-zinc-200">Urgent Messages Only</span>
                          <p className="text-xs text-zinc-500 mt-0.5">Only receive SMS for urgent communications</p>
                        </div>
                        <button
                          onClick={() => phone && setSmsNotifications({ ...smsNotifications, urgentMessagesOnly: !smsNotifications.urgentMessagesOnly })}
                          disabled={!phone}
                          className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                            smsNotifications.urgentMessagesOnly && phone ? 'bg-emerald-600' : 'bg-zinc-700'
                          } ${!phone ? 'cursor-not-allowed' : ''}`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            smsNotifications.urgentMessagesOnly && phone ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quiet Hours */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-purple-400" />
                        Quiet Hours
                      </CardTitle>
                      <p className="text-sm text-zinc-400 mt-1">
                        Don&apos;t send notifications during these hours
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-6">
                        <button
                          onClick={() => setQuietHoursEnabled(!quietHoursEnabled)}
                          className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                            quietHoursEnabled ? 'bg-emerald-600' : 'bg-zinc-700'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            quietHoursEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                        {quietHoursEnabled && (
                          <div className="flex items-center gap-4">
                            <div>
                              <label className="block text-xs text-zinc-400 mb-1">Start</label>
                              <input
                                type="time"
                                value={quietHoursStart}
                                onChange={(e) => setQuietHoursStart(e.target.value)}
                                className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                            <span className="text-zinc-500 mt-4">to</span>
                            <div>
                              <label className="block text-xs text-zinc-400 mb-1">End</label>
                              <input
                                type="time"
                                value={quietHoursEnd}
                                onChange={(e) => setQuietHoursEnd(e.target.value)}
                                className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Test Notification */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100">Test Your Notifications</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Preview Card */}
                      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Preview</p>
                        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              R
                            </div>
                            <div>
                              <p className="text-sm font-medium text-zinc-200">New Lead from Renoa</p>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                John Smith is looking for &quot;Lawn Mowing&quot; in Austin, TX
                              </p>
                              <p className="text-xs text-zinc-500 mt-1">Just now</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handleSendTestEmail}
                        disabled={sendingTestEmail || !email}
                        variant="outline"
                        className="border-zinc-700"
                      >
                        {sendingTestEmail ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Test Email
                          </>
                        )}
                      </Button>
                      {email && (
                        <p className="text-xs text-zinc-500">
                          A test notification will be sent to {email}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button
                      onClick={saveNotificationSettings}
                      disabled={saving}
                      className="bg-emerald-600 hover:bg-emerald-500 w-full sm:w-auto"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Notifications'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === 'payments' && (
                <div className="space-y-6">
                  {/* Payment Processing Section */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-purple-400" />
                        Payment Processing
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stripeConnected ? (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                              <svg viewBox="0 0 24 24" className="w-6 h-6">
                                <path fill="#635BFF" d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                              </svg>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-emerald-400" />
                                <span className="text-sm font-medium text-emerald-400">Stripe Connected</span>
                              </div>
                              {stripeAccountEmail && (
                                <p className="text-xs text-zinc-400 mt-0.5">{stripeAccountEmail}</p>
                              )}
                            </div>
                          </div>
                          <a
                            href="https://dashboard.stripe.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
                          >
                            <Link2 className="h-4 w-4" />
                            Manage in Stripe Dashboard
                          </a>
                        </div>
                      ) : (
                        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center">
                              <svg viewBox="0 0 24 24" className="w-7 h-7">
                                <path fill="#635BFF" d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-zinc-200">Connect Stripe to accept online payments</p>
                              <p className="text-xs text-zinc-500 mt-1">Accept credit cards and bank transfers securely</p>
                            </div>
                            <Button className="bg-[#635BFF] hover:bg-[#5851ea] text-white">
                              Connect Stripe
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Payment Methods Section */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100">Payment Methods You Accept</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div className="flex-1">
                          <span className="text-sm text-zinc-200">Credit/Debit Cards</span>
                          {!stripeConnected && (
                            <p className="text-xs text-amber-400 mt-0.5">Requires Stripe connection</p>
                          )}
                        </div>
                        <button
                          onClick={() => stripeConnected && setAcceptCreditCard(!acceptCreditCard)}
                          disabled={!stripeConnected}
                          className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                            acceptCreditCard && stripeConnected ? 'bg-emerald-600' : 'bg-zinc-700'
                          } ${!stripeConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              acceptCreditCard && stripeConnected ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <span className="text-sm text-zinc-200">Cash</span>
                        <button
                          onClick={() => setAcceptCash(!acceptCash)}
                          className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                            acceptCash ? 'bg-emerald-600' : 'bg-zinc-700'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              acceptCash ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <span className="text-sm text-zinc-200">Check</span>
                        <button
                          onClick={() => setAcceptCheck(!acceptCheck)}
                          className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                            acceptCheck ? 'bg-emerald-600' : 'bg-zinc-700'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              acceptCheck ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div className="flex-1">
                          <span className="text-sm text-zinc-200">Bank Transfer / ACH</span>
                          {!stripeConnected && (
                            <p className="text-xs text-amber-400 mt-0.5">Requires Stripe connection</p>
                          )}
                        </div>
                        <button
                          onClick={() => stripeConnected && setAcceptBankTransfer(!acceptBankTransfer)}
                          disabled={!stripeConnected}
                          className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                            acceptBankTransfer && stripeConnected ? 'bg-emerald-600' : 'bg-zinc-700'
                          } ${!stripeConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              acceptBankTransfer && stripeConnected ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Invoice Settings Section */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100">Invoice Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Payment Terms
                        </label>
                        <select
                          value={paymentTerms}
                          onChange={(e) => setPaymentTerms(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                        >
                          {PAYMENT_TERMS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-zinc-200">Late Fee</p>
                          <p className="text-xs text-zinc-500 mt-0.5">Charge a fee on overdue invoices</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setLateFeeEnabled(!lateFeeEnabled)}
                            className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                              lateFeeEnabled ? 'bg-emerald-600' : 'bg-zinc-700'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                                lateFeeEnabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          {lateFeeEnabled && (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={lateFeePercentage}
                                onChange={(e) => setLateFeePercentage(parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500 text-sm"
                                min="1"
                                max="25"
                              />
                              <span className="text-zinc-400 text-sm">%</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-zinc-200">Auto-Invoice on Job Completion</p>
                          <p className="text-xs text-zinc-500 mt-0.5">Automatically create invoice when job is marked complete</p>
                        </div>
                        <button
                          onClick={() => setAutoInvoice(!autoInvoice)}
                          className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                            autoInvoice ? 'bg-emerald-600' : 'bg-zinc-700'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              autoInvoice ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button
                      onClick={savePaymentSettings}
                      disabled={saving}
                      className="bg-emerald-600 hover:bg-emerald-500 w-full sm:w-auto"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Payment Settings'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Integrations Tab */}
              {activeTab === 'integrations' && (
                <div className="space-y-6">
                  {/* Payment Integration */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100">Payment Integration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-7 h-7">
                              <path fill="#635BFF" d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-200">Stripe</p>
                            <p className="text-xs text-zinc-500 mt-0.5">Accept credit cards and online payments</p>
                          </div>
                        </div>
                        {stripeConnected ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Button className="bg-[#635BFF] hover:bg-[#5851ea] text-white text-sm">
                            Connect
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Calendar Integrations */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100">Calendar & Scheduling</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-6 h-6">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-200">Google Calendar</p>
                            <p className="text-xs text-zinc-500 mt-0.5">Sync your job schedule with Google Calendar</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="border-zinc-700 text-sm">
                          Connect
                        </Button>
                      </div>

                      <div className="flex items-center justify-between gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#0078D4">
                              <path d="M21.557 7.185h-8.114v4.63h4.629c-.183 1.103-.79 2.04-1.677 2.673v2.226h2.713c1.583-1.458 2.499-3.608 2.499-6.15 0-.59-.05-1.163-.15-1.72l.1-.659z"/>
                              <path d="M12.443 21.243c2.27 0 4.175-.752 5.57-2.04l-2.713-2.226c-.79.53-1.79.843-2.857.843-2.2 0-4.063-1.486-4.73-3.487H4.93v2.3c1.463 2.91 4.47 4.61 7.513 4.61z"/>
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-200">Microsoft Outlook</p>
                            <p className="text-xs text-zinc-500 mt-0.5">Sync with Outlook calendar</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="border-zinc-700 text-sm">
                          Connect
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Accounting Integrations */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100">Accounting & Invoicing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-7 h-7">
                              <path fill="#2CA01C" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-200">QuickBooks</p>
                            <p className="text-xs text-zinc-500 mt-0.5">Sync invoices and payments</p>
                          </div>
                        </div>
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                          Coming Soon
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center">
                            <span className="text-xl font-bold text-[#00A1E0]">X</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-200">Xero</p>
                            <p className="text-xs text-zinc-500 mt-0.5">Accounting and bookkeeping</p>
                          </div>
                        </div>
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                          Coming Soon
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Communication */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100">Communication</CardTitle>
                      <p className="text-xs text-zinc-500 mt-1">These integrations are managed by Renoa</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#F22F46">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-11h4v6h-4z"/>
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-200">SMS Notifications</p>
                            <p className="text-xs text-zinc-500 mt-0.5">Automated text messages to customers</p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center">
                            <Bell className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-200">Email Notifications</p>
                            <p className="text-xs text-zinc-500 mt-0.5">Job updates and reminders via email</p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  {/* Password & 2FA */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-400" />
                        Password & Security
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button variant="outline" className="border-zinc-700 w-full sm:w-auto">
                        Change Password
                      </Button>
                      <div className="flex items-center justify-between gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-zinc-200">Two-Factor Authentication</p>
                          <p className="text-xs text-zinc-500 mt-1">Add an extra layer of security to your account</p>
                        </div>
                        <Button variant="outline" size="sm" className="border-zinc-700">
                          Enable
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Active Sessions */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100 flex items-center gap-2">
                        <Monitor className="h-5 w-5 text-green-400" />
                        Active Sessions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Current Session */}
                      <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                            <Monitor className="h-5 w-5 text-zinc-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-zinc-200">This device</p>
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                                Active now
                              </Badge>
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5">Chrome on macOS</p>
                          </div>
                        </div>
                      </div>

                      <Button variant="outline" className="border-zinc-700 w-full sm:w-auto">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out all other devices
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Recent Login Activity */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100">Recent Login Activity</CardTitle>
                      <p className="text-sm text-zinc-400 mt-1">Last 5 logins to your account</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {[
                          { time: 'Today 2:34 PM', device: 'Chrome', location: 'Chicago, IL', current: true },
                          { time: 'Yesterday 9:15 AM', device: 'Safari', location: 'Chicago, IL', current: false },
                          { time: 'Dec 10, 8:42 PM', device: 'Chrome', location: 'Chicago, IL', current: false },
                          { time: 'Dec 9, 11:20 AM', device: 'Mobile App', location: 'Chicago, IL', current: false },
                          { time: 'Dec 8, 3:15 PM', device: 'Chrome', location: 'Evanston, IL', current: false },
                        ].map((login, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${login.current ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                              <span className="text-sm text-zinc-300">{login.time}</span>
                              <span className="text-sm text-zinc-500">-</span>
                              <span className="text-sm text-zinc-400">{login.device}, {login.location}</span>
                            </div>
                            {login.current && (
                              <span className="text-xs text-emerald-400">Current</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Danger Zone */}
                  <Card className="bg-red-900/20 border-red-500/30">
                    <CardHeader>
                      <CardTitle className="text-red-400 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Danger Zone
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-zinc-400 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <Button variant="outline" className="border-red-700 text-red-400 hover:bg-red-900/20">
                        Delete Account
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Crop Modal */}
      {showCropModal && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => !uploading && setShowCropModal(false)}
          />

          <div className="relative z-10 w-full max-w-2xl mx-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-zinc-100">Crop Profile Photo</h3>
                <button
                  onClick={() => !uploading && setShowCropModal(false)}
                  disabled={uploading}
                  className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative h-96 bg-black">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              <div className="px-6 py-4 bg-zinc-900/50 border-t border-zinc-800">
                <div className="mb-4">
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    Zoom: {zoom.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                    disabled={uploading}
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCropModal(false);
                      setSelectedImage(null);
                      setImageSrc(null);
                    }}
                    disabled={uploading}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCropComplete}
                    disabled={uploading}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    {uploading ? 'Uploading...' : 'Save Photo'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProviderLayout>
  );
}
