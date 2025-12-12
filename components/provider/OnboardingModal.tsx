"use client"

import { useState, useRef } from 'react';
import {
  X, ChevronRight, ChevronLeft, Check, Upload, Play, Sparkles,
  Users, Calendar, FileText, MessageSquare, TrendingUp, BarChart3, ArrowRight,
  Building2, Briefcase, MapPin, Award, Camera, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
  onComplete: () => void;
}

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
    businessName: '',
    bio: '',
    serviceTypes: [] as string[],
    serviceAreas: [] as string[],
    yearsInBusiness: '',
    certifications: [] as string[],
    avatar: '',
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [certificationInput, setCertificationInput] = useState('');
  const [serviceAreaInput, setServiceAreaInput] = useState('');

  const totalSteps = 4;

  const steps = [
    { number: 1, label: 'Welcome', icon: Sparkles },
    { number: 2, label: 'Business Info', icon: Building2 },
    { number: 3, label: 'Photo', icon: Camera },
    { number: 4, label: 'Review', icon: CheckCircle2 },
  ];

  const allServiceTypes = [
    { id: 'lawn-mowing', name: 'Lawn Mowing', icon: '🌱', description: 'Regular lawn maintenance' },
    { id: 'landscaping', name: 'Landscaping', icon: '🌳', description: 'Design & installation' },
    { id: 'cleanup', name: 'Cleanup', icon: '🧹', description: 'Yard & debris cleanup' },
    { id: 'tree-service', name: 'Tree Service', icon: '🪓', description: 'Trimming & removal' },
    { id: 'snow-removal', name: 'Snow Removal', icon: '❄️', description: 'Winter services' },
    { id: 'hardscaping', name: 'Hardscaping', icon: '🪨', description: 'Patios & walkways' },
    { id: 'irrigation', name: 'Irrigation', icon: '💧', description: 'Sprinkler systems' },
    { id: 'fertilization', name: 'Fertilization', icon: '🌿', description: 'Lawn treatments' },
    { id: 'pest-control', name: 'Pest Control', icon: '🐛', description: 'Insect management' },
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
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast.error(error.message || 'Failed to upload photo');
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

  const toggleServiceType = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(serviceId)
        ? prev.serviceTypes.filter(s => s !== serviceId)
        : [...prev.serviceTypes, serviceId],
    }));
  };

  const addCertification = () => {
    if (certificationInput.trim()) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, certificationInput.trim()],
      }));
      setCertificationInput('');
    }
  };

  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
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

  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 2:
        return true;
      case 3:
        return formData.businessName.trim() !== '' && formData.serviceTypes.length > 0;
      case 4:
        return true;
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
    if (!formData.businessName || formData.serviceTypes.length === 0) {
      toast.error('Please fill in business name and select at least one service type');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/provider/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          businessName: formData.businessName,
          bio: formData.bio || null,
          serviceTypes: formData.serviceTypes,
          serviceAreas: formData.serviceAreas,
          yearsInBusiness: formData.yearsInBusiness ? parseInt(formData.yearsInBusiness) : 0,
          certifications: formData.certifications,
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
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Failed to save profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Step 1: Welcome Screen (Full Page)
  if (currentStep === 1) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-950 via-zinc-950 to-zinc-950 z-50 overflow-y-auto">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        {/* Progress bar - top */}
        <div className="relative bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800/50 sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.number === currentStep;
                const isCompleted = step.number < currentStep;
                return (
                  <div key={step.number} className="flex items-center gap-2">
                    {index > 0 && (
                      <div className={`w-8 h-px ${isCompleted ? 'bg-emerald-500' : 'bg-zinc-700'} transition-colors duration-300`} />
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
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Welcome to the platform</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                  Grow your business with{' '}
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    Renoa
                  </span>
                </h1>
                <p className="text-xl text-zinc-400 max-w-lg">
                  The complete platform for landscaping & home improvement professionals. Free forever.
                </p>
              </div>

              {/* Value props */}
              <div className="grid gap-4">
                {[
                  { icon: Users, title: 'Smart CRM', desc: 'Track customers, leads, and jobs in one place', color: 'emerald' },
                  { icon: Calendar, title: 'Smart Scheduling', desc: 'Never double-book. Optimize your routes.', color: 'blue' },
                  { icon: FileText, title: 'Pro Invoicing', desc: 'Send invoices, track payments, get paid faster.', color: 'purple' },
                  { icon: TrendingUp, title: 'Growth Analytics', desc: 'Track revenue, conversions, and team performance.', color: 'orange' },
                ].map((item, index) => {
                  const Icon = item.icon;
                  const colorClasses = {
                    emerald: 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20',
                    blue: 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20',
                    purple: 'bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20',
                    orange: 'bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/20',
                  }[item.color];
                  return (
                    <div
                      key={index}
                      className="group flex items-start gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all duration-300 cursor-default"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${colorClasses}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                          {item.title}
                        </h3>
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
                  className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 group"
                  onClick={handleNext}
                >
                  Complete My Profile
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <p className="text-sm text-zinc-500 text-center flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  Takes less than 5 minutes
                  <span className="text-zinc-700">•</span>
                  No credit card required
                </p>
              </div>
            </div>

            {/* RIGHT SIDE - Visual */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Glow effects */}
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-3xl blur-2xl" />

                {/* Dashboard Preview Card */}
                <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 p-6 shadow-2xl">
                  {/* Browser Chrome */}
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

                  {/* Mock Dashboard Content */}
                  <div className="space-y-4">
                    {/* Stats Row */}
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

                    {/* Activity Preview */}
                    <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-white">Today's Schedule</span>
                        <span className="text-xs text-emerald-400">3 jobs</span>
                      </div>
                      <div className="space-y-2">
                        {['9:00 AM - Lawn Mowing', '11:30 AM - Landscaping', '2:00 PM - Tree Service'].map((job, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-zinc-400">{job}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Chart Placeholder */}
                    <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-white">Revenue Trend</span>
                        <span className="text-xs text-zinc-500">Last 7 days</span>
                      </div>
                      <div className="flex items-end gap-1 h-16">
                        {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-emerald-500/50 to-emerald-500/20 rounded-t"
                            style={{ height: `${h}%` }}
                          />
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

  // Steps 2-4: Modal
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-zinc-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden max-h-[90vh] flex flex-col"
        style={{ animation: 'fadeInUp 0.3s ease-out' }}
      >
        {/* Header with Progress */}
        <div className="border-b border-zinc-800 p-6 bg-gradient-to-r from-zinc-900 to-zinc-900/95">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {currentStep === 2 && 'Tell us about your business'}
                {currentStep === 3 && 'Add your business photo'}
                {currentStep === 4 && 'Review your profile'}
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                {currentStep === 2 && 'This helps customers find and trust you'}
                {currentStep === 3 && 'A professional photo builds trust with customers'}
                {currentStep === 4 && 'Make sure everything looks good'}
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
          <div className="flex items-center gap-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.number === currentStep;
              const isCompleted = step.number < currentStep;
              return (
                <div key={step.number} className="flex items-center gap-3 flex-1">
                  {index > 0 && (
                    <div className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-zinc-700'
                    }`} />
                  )}
                  <div className={`flex items-center gap-2 transition-all duration-300 ${
                    isActive ? 'scale-105' : ''
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                      isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-sm font-medium hidden md:block ${
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
          {/* Step 2: Profile Setup */}
          {currentStep === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
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
                  className="w-full px-4 py-3.5 bg-zinc-800/50 border-2 border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
                  placeholder="e.g., Green Thumb Landscaping"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                  <Briefcase className="w-4 h-4 text-blue-400" />
                  About Your Business
                  <span className="text-zinc-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-4 py-3.5 bg-zinc-800/50 border-2 border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 min-h-[100px] resize-none"
                  placeholder="Tell customers what makes your business special..."
                  maxLength={500}
                />
                <div className="flex justify-end">
                  <span className={`text-xs ${formData.bio.length > 450 ? 'text-yellow-400' : 'text-zinc-500'}`}>
                    {formData.bio.length}/500
                  </span>
                </div>
              </div>

              {/* Services */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Services You Offer
                  <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {allServiceTypes.map(service => {
                    const isSelected = formData.serviceTypes.includes(service.id);
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => toggleServiceType(service.id)}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left group ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                            : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600 hover:bg-zinc-800/50'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">
                          {service.icon}
                        </div>
                        <div className="text-sm font-medium text-white">{service.name}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{service.description}</div>
                      </button>
                    );
                  })}
                </div>
                {formData.serviceTypes.length > 0 && (
                  <p className="text-sm text-emerald-400">
                    {formData.serviceTypes.length} service{formData.serviceTypes.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              {/* Service Areas */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                  <MapPin className="w-4 h-4 text-orange-400" />
                  Service Areas
                  <span className="text-zinc-500 font-normal">(Cities or Zip Codes)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={serviceAreaInput}
                    onChange={(e) => setServiceAreaInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addServiceArea())}
                    className="flex-1 px-4 py-3 bg-zinc-800/50 border-2 border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
                    placeholder="e.g., Austin, 78701"
                  />
                  <Button
                    type="button"
                    onClick={addServiceArea}
                    className="px-6 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl transition-colors"
                  >
                    Add
                  </Button>
                </div>
                {formData.serviceAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.serviceAreas.map((area, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-full text-sm text-orange-400 group"
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

              {/* Years & Certifications Row */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Years in Business */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    Years in Business
                  </label>
                  <input
                    type="number"
                    value={formData.yearsInBusiness}
                    onChange={(e) => setFormData(prev => ({ ...prev, yearsInBusiness: e.target.value }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border-2 border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
                    placeholder="e.g., 5"
                    min="0"
                    max="100"
                  />
                </div>

                {/* Certifications */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                    <Award className="w-4 h-4 text-yellow-400" />
                    Certifications
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={certificationInput}
                      onChange={(e) => setCertificationInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                      className="flex-1 px-4 py-3 bg-zinc-800/50 border-2 border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
                      placeholder="e.g., Licensed Arborist"
                    />
                    <Button
                      type="button"
                      onClick={addCertification}
                      className="px-4 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl transition-colors"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {formData.certifications.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.certifications.map((cert, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-sm text-yellow-400"
                    >
                      <Award className="w-3 h-3" />
                      {cert}
                      <button
                        type="button"
                        onClick={() => removeCertification(index)}
                        className="hover:text-yellow-300 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Photo Upload */}
          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                  <Camera className="h-10 w-10 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Upload Your Business Logo</h3>
                <p className="text-zinc-400 max-w-md mx-auto">
                  This will appear on your profile, invoices, and customer communications
                </p>
              </div>

              {/* Upload Area */}
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
                      <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-lg opacity-30" />
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
                    className="w-full border-2 border-dashed border-zinc-700 rounded-2xl p-12 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-300 group"
                  >
                    <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500/10 group-hover:scale-110 transition-all duration-300">
                      <Upload className="h-8 w-8 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <p className="text-zinc-300 mb-2 font-medium">
                      {uploading ? 'Uploading...' : 'Click to upload'}
                    </p>
                    <p className="text-xs text-zinc-600">PNG, JPG up to 5MB</p>
                  </button>
                )}

                <p className="text-center text-sm text-zinc-500 mt-6">
                  You can skip this step and add a photo later from settings
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Looking good!</h3>
                <p className="text-zinc-400">
                  Review your profile below. You can always edit it later.
                </p>
              </div>

              {/* Profile Preview Card */}
              <div className="bg-zinc-800/30 border border-zinc-700 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-zinc-700/50">
                  <div className="flex items-center gap-4">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile" className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500/50" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/30">
                        <Building2 className="w-8 h-8 text-emerald-400" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-xl font-bold text-white">{formData.businessName || 'Your Business'}</h4>
                      {formData.yearsInBusiness && (
                        <p className="text-sm text-zinc-400">{formData.yearsInBusiness} years in business</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 space-y-5">
                  {formData.bio && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">About</p>
                      <p className="text-zinc-300">{formData.bio}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Services</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.serviceTypes.map(serviceId => {
                        const service = allServiceTypes.find(s => s.id === serviceId);
                        return (
                          <span
                            key={serviceId}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-sm text-emerald-400"
                          >
                            <span>{service?.icon}</span>
                            {service?.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {formData.serviceAreas.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Service Areas</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.serviceAreas.map((area, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-full text-sm text-orange-400"
                          >
                            <MapPin className="w-3 h-3" />
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.certifications.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Certifications</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.certifications.map((cert, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-sm text-yellow-400"
                          >
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
                disabled={submitting || !formData.businessName || formData.serviceTypes.length === 0}
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
