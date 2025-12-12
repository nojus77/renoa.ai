"use client"

import { useState, useRef } from 'react';
import {
  X, ChevronRight, ChevronLeft, Check, Upload, Sparkles,
  Users, Calendar, FileText, TrendingUp, ArrowRight,
  Building2, Phone, MapPin, Award, Camera, CheckCircle2, Briefcase, Shield, Clock
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

export default function OnboardingModal({
  isOpen,
  onClose,
  providerId,
  onComplete,
}: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    // Step 2: Business Info
    businessName: '',
    bio: '',
    primaryCategory: '',
    services: '',
    phone: '',
    businessEntity: '',
    yearsInBusiness: '',
    employeeCount: '',
    // Step 3: Service Areas
    serviceAreas: [] as string[],
    licenseNumber: '',
    insuranceProvider: '',
    certifications: '',
    // Step 4: Photo
    avatar: '',
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [serviceAreaInput, setServiceAreaInput] = useState('');

  const totalSteps = 5;

  const steps = [
    { number: 1, label: 'Welcome', icon: Sparkles },
    { number: 2, label: 'Business', icon: Building2 },
    { number: 3, label: 'Service Area', icon: MapPin },
    { number: 4, label: 'Logo', icon: Camera },
    { number: 5, label: 'Review', icon: CheckCircle2 },
  ];

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

  const addServiceArea = () => {
    if (serviceAreaInput.trim()) {
      setFormData(prev => ({
        ...prev,
        serviceAreas: [...prev.serviceAreas, serviceAreaInput.trim()],
      }));
      setServiceAreaInput('');
    }
  };

  const removeServiceArea = (index: number) => {
    setFormData(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.filter((_, i) => i !== index),
    }));
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 2:
        return true; // Welcome -> Business Info
      case 3:
        // Required: businessName, primaryCategory, phone, businessEntity, yearsInBusiness, employeeCount
        return (
          formData.businessName.trim() !== '' &&
          formData.primaryCategory !== '' &&
          formData.phone.replace(/\D/g, '').length === 10 &&
          formData.businessEntity !== '' &&
          formData.yearsInBusiness !== '' &&
          formData.employeeCount !== ''
        );
      case 4:
        return true; // Service areas are optional
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

    setSubmitting(true);

    try {
      // Parse services from comma-separated string
      const serviceTypes = formData.services
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Parse certifications from comma-separated string
      const certifications = formData.certifications
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const res = await fetch('/api/provider/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          businessName: formData.businessName,
          bio: formData.bio || null,
          phone: formData.phone,
          primaryCategory: formData.primaryCategory,
          serviceTypes,
          serviceAreas: formData.serviceAreas,
          yearsInBusiness: parseInt(formData.yearsInBusiness) || 0,
          businessEntity: formData.businessEntity,
          employeeCount: formData.employeeCount,
          licenseNumber: formData.licenseNumber || null,
          insuranceProvider: formData.insuranceProvider || null,
          certifications,
          avatar: formData.avatar || null,
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

              {/* Business Description */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                  <Briefcase className="w-4 h-4 text-purple-400" />
                  Business Description
                  <span className="text-zinc-500 font-normal">(Optional)</span>
                </label>
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
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryCategory: e.target.value }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  >
                    <option value="">Select a category</option>
                    {SERVICE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
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

              {/* Services */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  Services You Provide
                  <span className="text-zinc-500 font-normal">(Comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={formData.services}
                  onChange={(e) => setFormData(prev => ({ ...prev, services: e.target.value }))}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="e.g., Lawn mowing, Tree trimming, Landscape design"
                />
              </div>

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

          {/* Step 3: Service Areas */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Service Areas */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                  <MapPin className="w-4 h-4 text-orange-400" />
                  Service Areas
                  <span className="text-zinc-500 font-normal">(Cities or ZIP codes)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={serviceAreaInput}
                    onChange={(e) => setServiceAreaInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addServiceArea())}
                    className="flex-1 px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    placeholder="e.g., Austin, TX or 78701"
                  />
                  <Button
                    type="button"
                    onClick={addServiceArea}
                    className="px-6 bg-zinc-700 hover:bg-zinc-600 text-white"
                  >
                    Add
                  </Button>
                </div>
                {formData.serviceAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.serviceAreas.map((area, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-full text-sm text-orange-400"
                      >
                        <MapPin className="w-3 h-3" />
                        {area}
                        <button
                          type="button"
                          onClick={() => removeServiceArea(index)}
                          className="hover:text-orange-300 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* License Number */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    License Number
                    <span className="text-zinc-500 font-normal">(Optional)</span>
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
                    <span className="text-zinc-500 font-normal">(Optional)</span>
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

              {/* Certifications */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                  <Award className="w-4 h-4 text-yellow-400" />
                  Certifications
                  <span className="text-zinc-500 font-normal">(Comma-separated, optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.certifications}
                  onChange={(e) => setFormData(prev => ({ ...prev, certifications: e.target.value }))}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="e.g., Licensed Contractor, HVAC Certified"
                />
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
                      <p className="text-sm text-zinc-400">{formData.primaryCategory}</p>
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

                  {formData.services && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Services</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.services.split(',').map((service, i) => (
                          <span key={i} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-sm text-emerald-400">
                            {service.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.serviceAreas.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Service Areas</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.serviceAreas.map((area, index) => (
                          <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full text-sm text-orange-400">
                            <MapPin className="w-3 h-3" />
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(formData.licenseNumber || formData.insuranceProvider || formData.certifications) && (
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
                        {formData.certifications && formData.certifications.split(',').map((cert, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-sm text-yellow-400">
                            <Award className="w-3 h-3" />
                            {cert.trim()}
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
                    <Sparkles className="h-4 w-4 animate-spin" />
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
