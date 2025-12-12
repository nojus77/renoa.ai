'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { toast } from 'sonner';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

type TabType = 'profile' | 'business' | 'availability' | 'services' | 'notifications' | 'payments' | 'integrations' | 'security';

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

interface Service {
  id: string;
  name: string;
  enabled: boolean;
  minPrice: number;
  maxPrice: number;
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

const SERVICE_RADIUS_OPTIONS = [
  { value: '10', label: '10 miles' },
  { value: '25', label: '25 miles' },
  { value: '50', label: '50 miles' },
  { value: '100', label: '100 miles' },
  { value: 'statewide', label: 'Statewide' },
];

export default function ProviderSettings() {
  const router = useRouter();
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

  // Service Area
  const [businessState, setBusinessState] = useState('');
  const [serviceRadiusType, setServiceRadiusType] = useState('');
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
  const [bufferTime, setBufferTime] = useState(30);
  const [maxJobsPerDay, setMaxJobsPerDay] = useState(8);
  const [advanceBooking, setAdvanceBooking] = useState(14);

  // Services
  const [services, setServices] = useState<Service[]>([
    { id: '1', name: 'Lawn Mowing', enabled: true, minPrice: 50, maxPrice: 150 },
    { id: '2', name: 'Landscaping', enabled: true, minPrice: 200, maxPrice: 2000 },
    { id: '3', name: 'Spring Cleanup', enabled: true, minPrice: 150, maxPrice: 500 },
    { id: '4', name: 'Mulching', enabled: false, minPrice: 100, maxPrice: 400 },
  ]);
  const [minimumJobValue, setMinimumJobValue] = useState(75);
  const [depositRequired, setDepositRequired] = useState(false);
  const [depositPercentage, setDepositPercentage] = useState(25);

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState({
    newLead: true,
    jobReminders: true,
    paymentReceived: true,
    customerMessages: true,
    weeklySummary: true,
  });
  const [smsNotifications, setSmsNotifications] = useState({
    newLead: true,
    urgentMessages: true,
  });
  const [quietHoursStart, setQuietHoursStart] = useState('21:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');

  // Payments
  const [paymentTerms, setPaymentTerms] = useState('net_7');
  const [acceptCreditCard, setAcceptCreditCard] = useState(true);
  const [acceptCash, setAcceptCash] = useState(true);
  const [acceptCheck, setAcceptCheck] = useState(false);
  const [autoInvoice, setAutoInvoice] = useState(true);

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
        setBusinessState(provider.state || '');
        setPrimaryCity(provider.city || '');
        setServiceRadiusType(provider.serviceRadiusType || '');
        setLicenseNumber(provider.taxId || '');
        setInsuranceProvider(provider.insuranceProvider || '');
        setSelectedServices(provider.serviceTypes || []);

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
          // Service area
          state: businessState,
          serviceRadiusType,
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

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WebP image');
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
      const servicePricing = services.reduce((acc, service) => {
        if (service.enabled) {
          acc[service.id] = {
            enabled: true,
            minPrice: service.minPrice,
            maxPrice: service.maxPrice,
          };
        }
        return acc;
      }, {} as Record<string, { enabled: boolean; minPrice: number; maxPrice: number }>);

      const res = await fetch('/api/provider/settings/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          servicePricing,
          minimumJobValue,
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

  const tabs = [
    { id: 'profile' as TabType, name: 'Profile', icon: User },
    { id: 'business' as TabType, name: 'Business', icon: Briefcase },
    { id: 'availability' as TabType, name: 'Availability', icon: Clock },
    { id: 'services' as TabType, name: 'Services & Pricing', icon: DollarSign },
    { id: 'notifications' as TabType, name: 'Notifications', icon: Bell },
    { id: 'payments' as TabType, name: 'Payments', icon: CreditCard },
    { id: 'integrations' as TabType, name: 'Integrations', icon: Link2 },
    { id: 'security' as TabType, name: 'Security', icon: Shield },
  ];

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
                            State <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={businessState}
                            onChange={(e) => setBusinessState(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="">Select state</option>
                            {US_STATES.map(state => (
                              <option key={state.value} value={state.value}>{state.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Service Radius <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={serviceRadiusType}
                            onChange={(e) => setServiceRadiusType(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="">Select radius</option>
                            {SERVICE_RADIUS_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Primary City <span className="text-zinc-500 font-normal">(Optional)</span>
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

              {/* Business Tab */}
              {activeTab === 'business' && (
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-zinc-100">Business Address</CardTitle>
                    <p className="text-sm text-zinc-400 mt-1">
                      Your business mailing address for invoicing
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          value={businessZip}
                          onChange={(e) => setBusinessZip(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                          placeholder="78701"
                          maxLength={10}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Website
                        </label>
                        <input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                          placeholder="https://example.com"
                        />
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
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={saveProfileSettings}
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-500 w-full sm:w-auto"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Business Info'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Availability Tab */}
              {activeTab === 'availability' && (
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-zinc-100">Availability Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
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
                  </CardContent>
                </Card>
              )}

              {/* Services Tab */}
              {activeTab === 'services' && (
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-zinc-100">Services & Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      {services.map((service) => (
                        <div key={service.id} className="p-3 md:p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => {
                                  setServices(services.map(s =>
                                    s.id === service.id ? { ...s, enabled: !s.enabled } : s
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
                          </div>
                          {service.enabled && (
                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                              <div>
                                <label className="block text-xs text-zinc-400 mb-1">Min Price</label>
                                <input
                                  type="number"
                                  value={service.minPrice}
                                  onChange={(e) => {
                                    setServices(services.map(s =>
                                      s.id === service.id ? { ...s, minPrice: parseInt(e.target.value) || 0 } : s
                                    ));
                                  }}
                                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-zinc-400 mb-1">Max Price</label>
                                <input
                                  type="number"
                                  value={service.maxPrice}
                                  onChange={(e) => {
                                    setServices(services.map(s =>
                                      s.id === service.id ? { ...s, maxPrice: parseInt(e.target.value) || 0 } : s
                                    ));
                                  }}
                                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500 text-sm"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-800">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Minimum Job Value
                        </label>
                        <input
                          type="number"
                          value={minimumJobValue}
                          onChange={(e) => setMinimumJobValue(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Deposit Required
                        </label>
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
                            <input
                              type="number"
                              value={depositPercentage}
                              onChange={(e) => setDepositPercentage(parseInt(e.target.value) || 0)}
                              className="w-24 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                              placeholder="%"
                            />
                          )}
                        </div>
                      </div>
                    </div>

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
                  </CardContent>
                </Card>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-zinc-100">Notification Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 mb-3 md:mb-4">Email Notifications</h3>
                      <div className="space-y-2 md:space-y-3">
                        {Object.entries(emailNotifications).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                            <span className="text-xs md:text-sm text-zinc-300 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <button
                              onClick={() => setEmailNotifications({ ...emailNotifications, [key]: !value })}
                              className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                                value ? 'bg-emerald-600' : 'bg-zinc-700'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                                  value ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 mb-3 md:mb-4">SMS Notifications</h3>
                      <div className="space-y-2 md:space-y-3">
                        {Object.entries(smsNotifications).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                            <span className="text-xs md:text-sm text-zinc-300 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <button
                              onClick={() => setSmsNotifications({ ...smsNotifications, [key]: !value })}
                              className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                                value ? 'bg-emerald-600' : 'bg-zinc-700'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                                  value ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 mb-4">Quiet Hours</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Start</label>
                          <input
                            type="time"
                            value={quietHoursStart}
                            onChange={(e) => setQuietHoursStart(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">End</label>
                          <input
                            type="time"
                            value={quietHoursEnd}
                            onChange={(e) => setQuietHoursEnd(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

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
                  </CardContent>
                </Card>
              )}

              {/* Payments Tab */}
              {activeTab === 'payments' && (
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-zinc-100">Payment Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Payment Terms
                      </label>
                      <select
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="due_on_receipt">Due on Receipt</option>
                        <option value="net_7">Net 7</option>
                        <option value="net_15">Net 15</option>
                        <option value="net_30">Net 30</option>
                      </select>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 mb-3 md:mb-4">Accept Payment Methods</h3>
                      <div className="space-y-2 md:space-y-3">
                        <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                          <span className="text-xs md:text-sm text-zinc-300">Credit Cards</span>
                          <button
                            onClick={() => setAcceptCreditCard(!acceptCreditCard)}
                            className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                              acceptCreditCard ? 'bg-emerald-600' : 'bg-zinc-700'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                                acceptCreditCard ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                          <span className="text-xs md:text-sm text-zinc-300">Cash</span>
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
                          <span className="text-xs md:text-sm text-zinc-300">Check</span>
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
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-medium text-zinc-300">Auto-Invoice on Job Completion</p>
                        <p className="text-xs text-zinc-500 mt-1">Automatically create invoice when job is marked complete</p>
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
                  </CardContent>
                </Card>
              )}

              {/* Integrations Tab */}
              {activeTab === 'integrations' && (
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-zinc-100">Integrations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4">
                    {[
                      { name: 'QuickBooks', description: 'Sync invoices and payments', connected: false },
                      { name: 'Google Calendar', description: 'Sync appointments', connected: true },
                      { name: 'Stripe', description: 'Payment processing', connected: true },
                      { name: 'Twilio', description: 'SMS messaging', connected: true },
                    ].map((integration) => (
                      <div key={integration.name} className="flex items-center justify-between gap-3 p-3 md:p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs md:text-sm font-medium text-zinc-200">{integration.name}</p>
                          <p className="text-xs text-zinc-500 mt-1">{integration.description}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {integration.connected ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Connected
                            </Badge>
                          ) : (
                            <Button variant="outline" size="sm" className="border-zinc-700 text-xs">
                              Connect
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-4 md:space-y-6">
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-100">Password & Security</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button variant="outline" className="border-zinc-700 w-full sm:w-auto">
                        Change Password
                      </Button>
                      <div className="flex items-center justify-between gap-3 p-3 md:p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs md:text-sm font-medium text-zinc-200">Two-Factor Authentication</p>
                          <p className="text-xs text-zinc-500 mt-1">Add an extra layer of security</p>
                        </div>
                        <Button variant="outline" size="sm" className="border-zinc-700 text-xs flex-shrink-0">
                          Enable
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-red-900/20 border-red-500/30">
                    <CardHeader>
                      <CardTitle className="text-red-400 flex items-center gap-2 text-base md:text-lg">
                        <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />
                        Danger Zone
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs md:text-sm text-zinc-400 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <Button variant="outline" className="border-red-700 text-red-400 hover:bg-red-900/20 w-full sm:w-auto text-xs md:text-sm">
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
