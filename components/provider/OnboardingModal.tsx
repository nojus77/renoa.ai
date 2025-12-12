"use client"

import { useState, useRef } from 'react';
import {
  X, ChevronRight, ChevronLeft, Check, Upload, Play, Sparkles,
  Users, Calendar, FileText, MessageSquare, TrendingUp, BarChart3, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  ];

  const handlePhotoUpload = async (file: File) => {
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Check file type
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
        return true; // Welcome screen -> Profile setup (always allowed)
      case 3:
        return formData.businessName.trim() !== '' && formData.serviceTypes.length > 0; // Need business name & services to proceed
      case 4:
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

  // Step 1 is full page, others are modal
  if (currentStep === 1) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] z-50 overflow-y-auto">
        {/* Progress bar - top */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="flex items-center gap-2 mb-2">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 flex-1 rounded-full transition-all ${
                      index + 1 <= currentStep ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600">Step {currentStep} of {totalSteps}</p>
            </div>
            <Button
              onClick={handleSkip}
              variant="ghost"
              className="text-gray-600 hover:text-gray-900"
            >
              Skip for now
            </Button>
          </div>
        </div>

        {/* Main content - side by side */}
        <div className="container mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* LEFT SIDE - Content */}
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-[#1f3810] mb-4">
                  Welcome to Renoa! 🌱
                </h1>
                <p className="text-xl text-[#2d5016]">
                  The complete platform for landscaping & home improvement professionals
                </p>
              </div>

              {/* Value props - stacked list */}
              <div className="space-y-6">
                <div className="flex items-start gap-3 bg-white/80 p-6 rounded-lg backdrop-blur shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1f3810]">Free Forever CRM</h3>
                    <p className="text-sm text-[#2d5016]">Track all your customers in one place. No credit card required.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/80 p-6 rounded-lg backdrop-blur shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1f3810]">Smart Scheduling</h3>
                    <p className="text-sm text-[#2d5016]">Never double-book. Block time off. Stay organized.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/80 p-6 rounded-lg backdrop-blur shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1f3810]">Pro Invoicing</h3>
                    <p className="text-sm text-[#2d5016]">Send invoices, track payments, get paid faster.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/80 p-6 rounded-lg backdrop-blur shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1f3810]">Customer Messaging</h3>
                    <p className="text-sm text-[#2d5016]">Chat with clients directly. No more phone tag.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/80 p-6 rounded-lg backdrop-blur shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1f3810]">Lead Management & Analytics</h3>
                    <p className="text-sm text-[#2d5016]">Convert quotes to jobs. Track revenue and growth.</p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="bg-[#2d5016] hover:bg-[#1f3810] text-white w-full py-4 text-base font-semibold shadow-md hover:shadow-lg transition-shadow"
                  onClick={handleNext}
                >
                  Complete My Profile
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-sm text-[#2d5016] text-center">
                  Takes less than 5 minutes • No credit card required
                </p>
              </div>
            </div>

            {/* RIGHT SIDE - Mockup & Video */}
            <div className="space-y-6">
              {/* Dashboard Mockup */}
              <div className="relative">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-200 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-200 rounded-full blur-3xl opacity-50"></div>

                <div className="relative bg-white rounded-2xl shadow-2xl p-4 transform hover:scale-105 transition-transform duration-300">
                  {/* Browser Chrome */}
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex-1 bg-gray-100 rounded px-3 py-1 text-xs text-gray-500">
                      renoa.ai/dashboard
                    </div>
                  </div>

                  {/* Mockup Content */}
                  <div className="space-y-2">
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-3 bg-emerald-600 rounded w-24"></div>
                        <div className="h-3 bg-emerald-200 rounded w-16"></div>
                      </div>
                      <div className="h-2 bg-emerald-200 rounded w-full mb-1"></div>
                      <div className="h-2 bg-emerald-200 rounded w-3/4"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-blue-50 rounded p-2">
                        <div className="h-2 bg-blue-400 rounded w-12 mb-1"></div>
                        <div className="h-3 bg-blue-600 rounded w-8"></div>
                      </div>
                      <div className="bg-purple-50 rounded p-2">
                        <div className="h-2 bg-purple-400 rounded w-12 mb-1"></div>
                        <div className="h-3 bg-purple-600 rounded w-8"></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded p-2 space-y-1">
                      <div className="h-2 bg-gray-300 rounded w-full"></div>
                      <div className="h-2 bg-gray-300 rounded w-5/6"></div>
                      <div className="h-2 bg-gray-300 rounded w-4/6"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video Section */}
              <div className="text-center space-y-3">
                <h2 className="text-xl font-bold text-[#1f3810]">
                  Watch This 2-Minute Tour
                </h2>

                {/* Video placeholder */}
                <div className="relative aspect-video rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center cursor-pointer group shadow-2xl">
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition rounded-xl" />

                  <div className="relative text-center text-white">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                      <Play className="h-10 w-10 text-white ml-1" />
                    </div>
                    <p className="text-sm font-medium">Click to watch the tour</p>
                    <p className="text-xs text-white/80">(Video coming soon)</p>
                  </div>
                </div>

                <p className="text-sm text-[#2d5016]">
                  Don&apos;t have time right now?{' '}
                  <button className="underline font-medium hover:text-[#1f3810]" onClick={handleNext}>
                    Skip to setup →
                  </button>
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Steps 2-4 remain as modal
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-zinc-100">Welcome to Renoa!</h2>
              <p className="text-sm text-zinc-400 mt-1">Let&apos;s get your profile set up</p>
            </div>
            <Button
              onClick={handleSkip}
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-zinc-100"
            >
              Skip for now
            </Button>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-all ${
                  index + 1 <= currentStep ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 2: Profile Setup */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-zinc-100 mb-2">Tell us about your business</h3>
                <p className="text-zinc-400">This helps customers find and trust you</p>
              </div>

              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Business Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Green Thumb Landscaping"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  About Your Business (Optional)
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] resize-none"
                  placeholder="Tell customers what makes your business special..."
                  maxLength={500}
                />
                <p className="text-xs text-zinc-500 mt-1">{formData.bio.length}/500 characters</p>
              </div>

              {/* Services Offered */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Services You Offer <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {allServiceTypes.map(service => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => toggleServiceType(service.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.serviceTypes.includes(service.id)
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600'
                      }`}
                    >
                      <div className="text-2xl mb-1">{service.icon}</div>
                      <div className="text-xs font-medium text-zinc-200">{service.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Areas */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Service Areas (Cities/Zip Codes)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={serviceAreaInput}
                    onChange={(e) => setServiceAreaInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addServiceArea())}
                    className="flex-1 px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., Austin, 78701"
                  />
                  <Button
                    type="button"
                    onClick={addServiceArea}
                    className="bg-emerald-600 hover:bg-emerald-500"
                  >
                    Add
                  </Button>
                </div>
                {formData.serviceAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.serviceAreas.map((area, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-sm text-emerald-400 flex items-center gap-2"
                      >
                        {area}
                        <button
                          type="button"
                          onClick={() => removeServiceArea(index)}
                          className="hover:text-emerald-300"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Years in Business */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Years in Business
                </label>
                <input
                  type="number"
                  value={formData.yearsInBusiness}
                  onChange={(e) => setFormData(prev => ({ ...prev, yearsInBusiness: e.target.value }))}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., 5"
                  min="0"
                  max="100"
                />
              </div>

              {/* Certifications */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Certifications & Licenses
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={certificationInput}
                    onChange={(e) => setCertificationInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                    className="flex-1 px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., Licensed Arborist"
                  />
                  <Button
                    type="button"
                    onClick={addCertification}
                    className="bg-emerald-600 hover:bg-emerald-500"
                  >
                    Add
                  </Button>
                </div>
                {formData.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.certifications.map((cert, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-sm text-blue-400 flex items-center gap-2"
                      >
                        {cert}
                        <button
                          type="button"
                          onClick={() => removeCertification(index)}
                          className="hover:text-blue-300"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Photo Upload */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-100 mb-2">Add Your Business Logo</h3>
                <p className="text-zinc-400">
                  A professional photo helps build trust with customers
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
                  <div className="text-center">
                    <div className="w-48 h-48 mx-auto rounded-lg overflow-hidden border-2 border-emerald-500 mb-4">
                      <img
                        src={photoPreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="border-zinc-700"
                    >
                      Change Photo
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full border-2 border-dashed border-zinc-700 rounded-lg p-12 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all"
                  >
                    <Upload className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
                    <p className="text-zinc-400 mb-2">
                      {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-zinc-600">PNG, JPG up to 5MB</p>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Availability Setup */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-100 mb-2">You&apos;re All Set!</h3>
                <p className="text-zinc-400">
                  Your profile is ready. You can always edit it later from settings.
                </p>
              </div>

              {/* Summary */}
              <div className="bg-zinc-800/30 border border-zinc-700 rounded-lg p-6 space-y-4">
                <div>
                  <p className="text-sm text-zinc-500">Business Name</p>
                  <p className="text-zinc-100 font-medium">{formData.businessName}</p>
                </div>

                {formData.bio && (
                  <div>
                    <p className="text-sm text-zinc-500">About</p>
                    <p className="text-zinc-100">{formData.bio}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-zinc-500 mb-2">Services</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.serviceTypes.map(serviceId => {
                      const service = allServiceTypes.find(s => s.id === serviceId);
                      return (
                        <span
                          key={serviceId}
                          className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-sm text-emerald-400"
                        >
                          {service?.icon} {service?.name}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {formData.serviceAreas.length > 0 && (
                  <div>
                    <p className="text-sm text-zinc-500 mb-2">Service Areas</p>
                    <p className="text-zinc-100">{formData.serviceAreas.join(', ')}</p>
                  </div>
                )}

                {formData.yearsInBusiness && (
                  <div>
                    <p className="text-sm text-zinc-500">Experience</p>
                    <p className="text-zinc-100">{formData.yearsInBusiness} years in business</p>
                  </div>
                )}

                {formData.certifications.length > 0 && (
                  <div>
                    <p className="text-sm text-zinc-500 mb-2">Certifications</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.certifications.map((cert, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-sm text-blue-400"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 p-6 flex items-center justify-between">
          <Button
            onClick={handleBack}
            variant="ghost"
            disabled={currentStep === 1}
            className="text-zinc-400 hover:text-zinc-100"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!canProceedToStep(currentStep + 1)}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={submitting || !formData.businessName || formData.serviceTypes.length === 0}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}
