"use client"

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, ChevronRight, ChevronLeft, Check, Upload, Sparkles,
  Users, Calendar, FileText, TrendingUp, ArrowRight,
  Building2, Phone, MapPin, Award, Camera, CheckCircle2, Briefcase, Shield, Clock,
  Plus, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
  onComplete: () => void;
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
  'Sole Proprietorship',
  'LLC',
  'Corporation',
  'Partnership',
];

const EMPLOYEE_COUNTS = [
  '1',
  '2-5',
  '6-10',
  '11-25',
  '26-50',
  '50+',
];

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

export default function OnboardingModal({
  isOpen,
  onClose,
  providerId,
  onComplete,
}: OnboardingModalProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [enhancingDescription, setEnhancingDescription] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    // Step 2: Business Info
    businessName: '',
    bio: '',
    primaryCategory: '',
    otherCategory: '', // For "Other" category
    selectedServices: [] as string[],
    customServiceInput: '', // Current input for custom service
    phone: '',
    businessEntity: '',
    yearsInBusiness: '',
    employeeCount: '',
    // Step 3: Service Areas & Credentials
    businessZipCode: '',
    travelDistance: '',
    primaryCity: '',
    licenseNumber: '',
    insuranceProvider: '',
    certifications: [] as string[], // Array of certifications
    certificationInput: '', // Current input for certification
    // Step 4: Photo
    avatar: '',
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const totalSteps = 5;

  const steps = [
    { number: 1, label: 'Welcome', icon: Sparkles },
    { number: 2, label: 'Business', icon: Building2 },
    { number: 3, label: 'Service Area', icon: MapPin },
    { number: 4, label: 'Logo', icon: Camera },
    { number: 5, label: 'Review', icon: CheckCircle2 },
  ];

  const handleEnhanceDescription = async () => {
    if (!formData.bio || formData.bio.trim().length < 3) {
      toast.error('Please enter a brief description first');
      return;
    }

    setEnhancingDescription(true);
    try {
      const res = await fetch('/api/ai/enhance-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.bio,
          businessName: formData.businessName,
          category: formData.primaryCategory,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to enhance description');
      }

      setFormData(prev => ({ ...prev, bio: data.enhancedDescription }));
      toast.success('Description enhanced!');
    } catch (error) {
      console.error('Error enhancing description:', error);
      toast.error('Failed to enhance description');
    } finally {
      setEnhancingDescription(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      formDataObj.append('providerId', providerId);

      const res = await fetch('/api/provider/upload-photo', {
        method: 'POST',
        body: formDataObj,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload photo');
      }

      setFormData(prev => ({ ...prev, avatar: data.url }));
      setPhotoPreview(data.url);
      toast.success('Photo uploaded successfully!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload photo';
      console.error('Error uploading photo:', error);
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(service)
        ? prev.selectedServices.filter(s => s !== service)
        : [...prev.selectedServices, service],
    }));
  };

  const addCustomService = () => {
    const customService = formData.customServiceInput.trim();
    if (customService && !formData.selectedServices.includes(customService)) {
      setFormData(prev => ({
        ...prev,
        selectedServices: [...prev.selectedServices, customService],
        customServiceInput: '',
      }));
    }
  };

  const addCertification = () => {
    const cert = formData.certificationInput.trim();
    if (cert && !formData.certifications.includes(cert)) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, cert],
        certificationInput: '',
      }));
    }
  };

  const removeCertification = (cert: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== cert),
    }));
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const getAvailableServices = () => {
    if (formData.primaryCategory === 'Other') {
      return [];
    }
    return SERVICES_BY_CATEGORY[formData.primaryCategory] || [];
  };

  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 2:
        return true; // Welcome -> Business Info
      case 3:
        // Required: businessName, primaryCategory (and otherCategory if "Other"), phone, businessEntity, yearsInBusiness, employeeCount, at least 1 service
        const categoryValid = formData.primaryCategory === 'Other'
          ? formData.otherCategory.trim() !== ''
          : formData.primaryCategory !== '';

        const servicesValid = formData.selectedServices.length > 0;

        return (
          formData.businessName.trim() !== '' &&
          categoryValid &&
          formData.phone.replace(/\D/g, '').length === 10 &&
          formData.businessEntity !== '' &&
          formData.yearsInBusiness !== '' &&
          formData.employeeCount !== '' &&
          servicesValid
        );
      case 4:
        // Required: businessZipCode (5 digits), travelDistance, licenseNumber, insuranceProvider
        const zipValid = /^\d{5}$/.test(formData.businessZipCode.trim());
        return (
          zipValid &&
          formData.travelDistance !== '' &&
          formData.licenseNumber.trim() !== '' &&
          formData.insuranceProvider.trim() !== ''
        );
      case 5:
        return true; // Photo is optional
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps && canProceedToStep(currentStep + 1)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleComplete = async () => {
    if (!canProceedToStep(3)) {
      toast.error('Please fill in all required business information');
      setCurrentStep(2);
      return;
    }

    if (!canProceedToStep(4)) {
      toast.error('Please fill in all required service area and credential information');
      setCurrentStep(3);
      return;
    }

    setSubmitting(true);

    try {
      // Build service types array (selectedServices already contains all services including custom ones)
      const serviceTypes = [...formData.selectedServices];

      // Certifications array is already properly formatted
      const certifications = [...formData.certifications];

      // Build service areas array based on ZIP code and travel distance
      const serviceAreas: string[] = [];
      if (formData.primaryCity) {
        serviceAreas.push(formData.primaryCity);
      }
      // Add ZIP-based description
      const travelLabel = TRAVEL_DISTANCE_OPTIONS.find(o => o.value === formData.travelDistance)?.label || formData.travelDistance;
      serviceAreas.push(`ZIP ${formData.businessZipCode} (${travelLabel})`);

      // Determine the actual category to save
      const actualCategory = formData.primaryCategory === 'Other'
        ? formData.otherCategory
        : formData.primaryCategory;

      const res = await fetch('/api/provider/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          businessName: formData.businessName,
          bio: formData.bio || null,
          phone: formData.phone,
          primaryCategory: actualCategory,
          serviceTypes,
          serviceAreas,
          yearsInBusiness: parseInt(formData.yearsInBusiness) || 0,
          businessEntity: formData.businessEntity,
          employeeCount: formData.employeeCount,
          licenseNumber: formData.licenseNumber,
          insuranceProvider: formData.insuranceProvider,
          certifications,
          avatar: formData.avatar || null,
          // New ZIP-based service area fields
          businessZipCode: formData.businessZipCode,
          travelDistance: formData.travelDistance,
          primaryCity: formData.primaryCity || null,
          onboardingCompleted: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }

      toast.success('Welcome to Renoa! Your profile is all set up.');
      onComplete();
      onClose();
      // Redirect to /provider/home
      router.push('/provider/home');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile';
      console.error('Error saving profile:', error);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Step 1: Welcome Screen (Full Page)
  if (currentStep === 1) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900 z-50 overflow-y-auto">
        {/* Subtle background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        {/* Progress bar - top */}
        <div className="relative bg-zinc-900/90 backdrop-blur-xl border-b border-zinc-800/50 sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.number === currentStep;
                const isCompleted = step.number < currentStep;
                return (
                  <div key={step.number} className="flex items-center gap-2">
                    {index > 0 && (
                      <div className={`w-6 h-px ${isCompleted ? 'bg-emerald-500' : 'bg-zinc-700'} transition-colors duration-300`} />
                    )}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${
                      isActive ? 'bg-emerald-500/20 border border-emerald-500/50' :
                      isCompleted ? 'bg-emerald-500/10' : 'bg-zinc-800/50'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isActive ? 'bg-emerald-500 text-white' :
                        isCompleted ? 'bg-emerald-500/50 text-emerald-200' : 'bg-zinc-700 text-zinc-400'
                      }`}>
                        {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-sm font-medium hidden sm:block ${
                        isActive ? 'text-emerald-400' : isCompleted ? 'text-emerald-400/70' : 'text-zinc-500'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button
              onClick={handleSkip}
              variant="ghost"
              className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
            >
              Skip for now
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="relative container mx-auto px-6 py-12 min-h-[calc(100vh-80px)] flex items-center">
          <div className="grid lg:grid-cols-2 gap-16 items-center w-full">
            {/* LEFT SIDE - Content */}
            <div className="space-y-10">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                  Welcome to{' '}
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    Renoa
                  </span>
                </h1>
                <p className="text-xl text-zinc-400 max-w-lg">
                  The complete business management platform for service professionals.
                </p>
              </div>

              {/* Value props */}
              <div className="grid gap-4">
                {[
                  { icon: Users, title: 'Customer Management', desc: 'Track customers, leads, and job history in one place', color: 'emerald' },
                  { icon: Calendar, title: 'Smart Scheduling', desc: 'Optimize your team calendar and route planning', color: 'blue' },
                  { icon: FileText, title: 'Professional Invoicing', desc: 'Create and send invoices, track payments', color: 'purple' },
                  { icon: TrendingUp, title: 'Business Analytics', desc: 'Monitor revenue, conversions, and team performance', color: 'orange' },
                ].map((item, index) => {
                  const Icon = item.icon;
                  const colorClasses = {
                    emerald: 'bg-emerald-500/10 text-emerald-400',
                    blue: 'bg-blue-500/10 text-blue-400',
                    purple: 'bg-purple-500/10 text-purple-400',
                    orange: 'bg-orange-500/10 text-orange-400',
                  }[item.color];
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{item.title}</h3>
                        <p className="text-sm text-zinc-500">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="space-y-4">
                <Button
                  size="lg"
                  className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 group"
                  onClick={handleNext}
                >
                  Set Up Your Business Profile
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <p className="text-sm text-zinc-500 text-center flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  Start your 14-day free trial
                </p>
              </div>
            </div>

            {/* RIGHT SIDE - Visual */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-3xl blur-2xl" />
                <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 p-6 shadow-2xl">
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-800">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <div className="flex-1 ml-4 bg-zinc-800 rounded-lg px-4 py-2 text-xs text-zinc-400 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                      renoa.ai/dashboard
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Revenue', value: '$12,450', trend: '+18%', color: 'emerald' },
                        { label: 'Jobs', value: '24', trend: '+5', color: 'blue' },
                        { label: 'Rating', value: '4.9', trend: '128 reviews', color: 'yellow' },
                      ].map((stat, i) => (
                        <div key={i} className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                          <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
                          <p className="text-lg font-bold text-white">{stat.value}</p>
                          <p className={`text-xs ${
                            stat.color === 'emerald' ? 'text-emerald-400' :
                            stat.color === 'blue' ? 'text-blue-400' : 'text-yellow-400'
                          }`}>{stat.trend}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-white">Today&apos;s Schedule</span>
                        <span className="text-xs text-emerald-400">3 jobs</span>
                      </div>
                      <div className="space-y-2">
                        {['9:00 AM - Site Assessment', '11:30 AM - Renovation', '2:00 PM - Final Inspection'].map((job, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-zinc-400">{job}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Steps 2-5: Modal
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-zinc-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden max-h-[90vh] flex flex-col"
        style={{ animation: 'fadeInUp 0.3s ease-out' }}
      >
        {/* Header with Progress */}
        <div className="border-b border-zinc-800 p-6 bg-zinc-900">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {currentStep === 2 && 'Business Information'}
                {currentStep === 3 && 'Service Areas & Credentials'}
                {currentStep === 4 && 'Business Logo (Optional)'}
                {currentStep === 5 && 'Review Your Profile'}
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                {currentStep === 2 && 'Tell us about your business'}
                {currentStep === 3 && 'Where do you provide services?'}
                {currentStep === 4 && 'Add your business logo or profile photo'}
                {currentStep === 5 && 'Confirm your information is correct'}
              </p>
            </div>
            <Button
              onClick={handleSkip}
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.number === currentStep;
              const isCompleted = step.number < currentStep;
              return (
                <div key={step.number} className="flex items-center gap-2 flex-1">
                  {index > 0 && (
                    <div className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-zinc-700'
                    }`} />
                  )}
                  <div className={`flex items-center gap-2 transition-all duration-300 ${isActive ? 'scale-105' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                      isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-sm font-medium hidden lg:block ${
                      isActive ? 'text-white' : isCompleted ? 'text-emerald-400' : 'text-zinc-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 2: Business Info */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Business Name */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    Business Name
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    placeholder="Your Business Name"
                  />
                </div>

                {/* Business Phone */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                    <Phone className="w-4 h-4 text-blue-400" />
                    Business Phone
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              {/* Business Description with AI Enhance */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                    <Briefcase className="w-4 h-4 text-purple-400" />
                    Business Description
                    <span className="text-zinc-500 font-normal">(Optional)</span>
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleEnhanceDescription}
                    disabled={enhancingDescription || !formData.bio.trim()}
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
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all min-h-[80px] resize-none"
                  placeholder="Brief description of your business and services..."
                  maxLength={500}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Primary Category */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                    <Briefcase className="w-4 h-4 text-orange-400" />
                    Primary Service Category
                    <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.primaryCategory}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        primaryCategory: e.target.value,
                        selectedServices: [], // Reset services when category changes
                        otherCategory: '',
                      }));
                    }}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  >
                    <option value="">Select a category</option>
                    {SERVICE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  {/* Other category text input */}
                  {formData.primaryCategory === 'Other' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={formData.otherCategory}
                        onChange={(e) => setFormData(prev => ({ ...prev, otherCategory: e.target.value }))}
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        placeholder="Specify your service type *"
                      />
                    </div>
                  )}
                </div>

                {/* Business Entity */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                    <Building2 className="w-4 h-4 text-cyan-400" />
                    Business Entity Type
                    <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.businessEntity}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessEntity: e.target.value }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  >
                    <option value="">Select entity type</option>
                    {BUSINESS_ENTITIES.map(entity => (
                      <option key={entity} value={entity}>{entity}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Services Multi-Select */}
              {formData.primaryCategory && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    Services You Provide
                    <span className="text-red-400">*</span>
                    <span className="text-zinc-500 font-normal ml-2">
                      ({formData.selectedServices.length} selected)
                    </span>
                  </label>

                  {formData.primaryCategory === 'Other' ? (
                    // For "Other" category, show only text input for custom services
                    <div className="space-y-3">
                      <p className="text-xs text-zinc-500">Add your services one at a time</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.customServiceInput}
                          onChange={(e) => setFormData(prev => ({ ...prev, customServiceInput: e.target.value }))}
                          className="flex-1 px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                          placeholder="e.g., Window Tinting"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomService();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={addCustomService}
                          disabled={!formData.customServiceInput.trim()}
                          className="px-4 bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      {formData.selectedServices.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-zinc-800/30 rounded-lg border border-zinc-700">
                          {formData.selectedServices.map((service, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-sm text-emerald-400"
                            >
                              <Check className="w-3 h-3" />
                              {service}
                              <button
                                type="button"
                                onClick={() => toggleService(service)}
                                className="hover:text-emerald-300 ml-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    // For other categories, show checkbox grid + custom services as chips
                    <>
                      {/* Show selected custom services as chips at the top */}
                      {formData.selectedServices.filter(s => !getAvailableServices().includes(s)).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {formData.selectedServices
                            .filter(s => !getAvailableServices().includes(s))
                            .map((service, i) => (
                              <span
                                key={`custom-${i}`}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-sm text-emerald-400"
                              >
                                <Check className="w-3 h-3" />
                                {service}
                                <button
                                  type="button"
                                  onClick={() => toggleService(service)}
                                  className="hover:text-emerald-300 ml-1"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {getAvailableServices().map(service => (
                          <label
                            key={service}
                            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                              formData.selectedServices.includes(service)
                                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                : 'bg-zinc-800/30 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.selectedServices.includes(service)}
                              onChange={() => toggleService(service)}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                              formData.selectedServices.includes(service)
                                ? 'bg-emerald-500 border-emerald-500'
                                : 'border-zinc-600'
                            }`}>
                              {formData.selectedServices.includes(service) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <span className="text-sm">{service}</span>
                          </label>
                        ))}
                      </div>

                      {/* Add Custom Service */}
                      <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                        <input
                          type="text"
                          value={formData.customServiceInput}
                          onChange={(e) => setFormData(prev => ({ ...prev, customServiceInput: e.target.value }))}
                          className="flex-1 px-3 py-2 bg-zinc-800/30 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 text-sm"
                          placeholder="Add custom service..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomService();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={addCustomService}
                          disabled={!formData.customServiceInput.trim()}
                          variant="ghost"
                          size="sm"
                          className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {/* Years in Business */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Years in Business
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.yearsInBusiness}
                    onChange={(e) => setFormData(prev => ({ ...prev, yearsInBusiness: e.target.value }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    placeholder="e.g., 5"
                    min="0"
                    max="100"
                  />
                </div>

                {/* Number of Employees */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                    <Users className="w-4 h-4 text-blue-400" />
                    Number of Employees
                    <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.employeeCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, employeeCount: e.target.value }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  >
                    <option value="">Select employee count</option>
                    {EMPLOYEE_COUNTS.map(count => (
                      <option key={count} value={count}>{count}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Service Areas & Credentials */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Service Area Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-400" />
                  Service Area
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Business Location ZIP Code */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                      Business Location ZIP Code
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.businessZipCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                        setFormData(prev => ({ ...prev, businessZipCode: value }));
                      }}
                      className={`w-full px-4 py-3 bg-zinc-800/50 border rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                        formData.businessZipCode && !/^\d{5}$/.test(formData.businessZipCode)
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-zinc-700 focus:border-emerald-500'
                      }`}
                      placeholder="e.g., 78701"
                      maxLength={5}
                    />
                    {formData.businessZipCode && !/^\d{5}$/.test(formData.businessZipCode) && (
                      <p className="text-xs text-red-400">Please enter a valid 5-digit ZIP code</p>
                    )}
                  </div>

                  {/* Travel Distance Dropdown */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                      How far do you travel for jobs?
                      <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.travelDistance}
                      onChange={(e) => setFormData(prev => ({ ...prev, travelDistance: e.target.value }))}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    >
                      <option value="">Select travel distance</option>
                      {TRAVEL_DISTANCE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Primary City */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                    Primary City
                    <span className="text-zinc-500 font-normal">(Optional - for display purposes)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.primaryCity}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryCity: e.target.value }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    placeholder="e.g., Austin"
                  />
                </div>
              </div>

              {/* Credentials Section */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  Credentials
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* License Number */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                      <Shield className="w-4 h-4 text-cyan-400" />
                      License Number
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      placeholder="e.g., LIC-123456"
                    />
                  </div>

                  {/* Insurance Provider */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                      <Shield className="w-4 h-4 text-purple-400" />
                      Insurance Provider
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.insuranceProvider}
                      onChange={(e) => setFormData(prev => ({ ...prev, insuranceProvider: e.target.value }))}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      placeholder="e.g., State Farm"
                    />
                  </div>
                </div>

                {/* Certifications - Multi-add with chips */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                    <Award className="w-4 h-4 text-yellow-400" />
                    Certifications
                    <span className="text-zinc-500 font-normal">(Optional)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.certificationInput}
                      onChange={(e) => setFormData(prev => ({ ...prev, certificationInput: e.target.value }))}
                      className="flex-1 px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      placeholder="e.g., HVAC Certified"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCertification();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={addCertification}
                      disabled={!formData.certificationInput.trim()}
                      className="px-4 bg-yellow-600 hover:bg-yellow-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {formData.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-zinc-800/30 rounded-lg border border-zinc-700">
                      {formData.certifications.map((cert, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/40 rounded-full text-sm text-yellow-400"
                        >
                          <Award className="w-3 h-3" />
                          {cert}
                          <button
                            type="button"
                            onClick={() => removeCertification(cert)}
                            className="hover:text-yellow-300 ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Photo Upload */}
          {currentStep === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-zinc-700">
                  <Camera className="h-10 w-10 text-zinc-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Upload Your Business Logo</h3>
                <p className="text-zinc-400 max-w-md mx-auto">
                  This will appear on your profile, invoices, and customer communications
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {photoPreview ? (
                  <div className="text-center space-y-4">
                    <div className="relative w-48 h-48 mx-auto">
                      <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-emerald-500">
                        <img
                          src={photoPreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Change Photo
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full border-2 border-dashed border-zinc-700 rounded-2xl p-12 hover:border-zinc-600 hover:bg-zinc-800/30 transition-all duration-300 group"
                  >
                    <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-zinc-700 transition-all">
                      <Upload className="h-8 w-8 text-zinc-500 group-hover:text-zinc-400 transition-colors" />
                    </div>
                    <p className="text-zinc-300 mb-2 font-medium">
                      {uploading ? 'Uploading...' : 'Click to upload'}
                    </p>
                    <p className="text-xs text-zinc-600">PNG, JPG up to 5MB</p>
                  </button>
                )}

                <div className="mt-6 text-center">
                  <Button
                    variant="ghost"
                    onClick={handleNext}
                    className="text-zinc-400 hover:text-zinc-200"
                  >
                    Skip for now
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Review Your Profile</h3>
                <p className="text-zinc-400">
                  Confirm your information is correct. You can always update it later in Settings.
                </p>
              </div>

              {/* Profile Preview Card */}
              <div className="bg-zinc-800/30 border border-zinc-700 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 bg-zinc-800/50 border-b border-zinc-700/50">
                  <div className="flex items-center gap-4">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile" className="w-16 h-16 rounded-xl object-cover border-2 border-zinc-600" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-zinc-700 flex items-center justify-center border-2 border-zinc-600">
                        <Building2 className="w-8 h-8 text-zinc-400" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-xl font-bold text-white">{formData.businessName || 'Your Business'}</h4>
                      <p className="text-sm text-zinc-400">
                        {formData.primaryCategory === 'Other' ? formData.otherCategory : formData.primaryCategory}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Phone</p>
                      <p className="text-zinc-200">{formData.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Business Type</p>
                      <p className="text-zinc-200">{formData.businessEntity || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Years in Business</p>
                      <p className="text-zinc-200">{formData.yearsInBusiness || '0'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Team Size</p>
                      <p className="text-zinc-200">{formData.employeeCount || 'Not provided'}</p>
                    </div>
                  </div>

                  {formData.bio && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">About</p>
                      <p className="text-zinc-300">{formData.bio}</p>
                    </div>
                  )}

                  {formData.selectedServices.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Services</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.selectedServices.map((service, i) => (
                          <span key={i} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-sm text-emerald-400">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(formData.businessZipCode || formData.primaryCity) && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Service Area</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full text-sm text-orange-400">
                          <MapPin className="w-3 h-3" />
                          ZIP: {formData.businessZipCode}
                          {formData.primaryCity && ` (${formData.primaryCity})`}
                        </span>
                        {formData.travelDistance && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-sm text-blue-400">
                            {TRAVEL_DISTANCE_OPTIONS.find(o => o.value === formData.travelDistance)?.label || formData.travelDistance}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {(formData.licenseNumber || formData.insuranceProvider || formData.certifications.length > 0) && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Credentials</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.licenseNumber && (
                          <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-sm text-cyan-400">
                            License: {formData.licenseNumber}
                          </span>
                        )}
                        {formData.insuranceProvider && (
                          <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-sm text-purple-400">
                            Insured: {formData.insuranceProvider}
                          </span>
                        )}
                        {formData.certifications.map((cert, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-sm text-yellow-400">
                            <Award className="w-3 h-3" />
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 p-6 bg-zinc-900/50 flex items-center justify-between">
          <Button
            onClick={handleBack}
            variant="ghost"
            disabled={currentStep === 1}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!canProceedToStep(currentStep + 1)}
                className="px-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 group"
              >
                {currentStep === 2 && !canProceedToStep(3) ? (
                  'Fill required fields'
                ) : currentStep === 3 && !canProceedToStep(4) ? (
                  'Fill required fields'
                ) : (
                  <>
                    Continue
                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={submitting}
                className="px-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Finishing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Complete Setup
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
