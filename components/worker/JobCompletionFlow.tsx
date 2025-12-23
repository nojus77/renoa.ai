'use client';

import { useState, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Camera, Check, AlertCircle, Loader2 } from 'lucide-react';
import SignaturePad from './SignatureCanvas';
import { toast } from 'sonner';

interface JobCompletionFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: CompletionResult) => void;
  jobId: string;
  serviceType: string;
  providerId: string;
  customerId: string;
  customerName: string;
  estimatedDuration?: number; // hours
  existingPhotos?: string[];
  requireCompletionPhotos?: boolean;
  paymentMethod?: string; // 'card' | 'cash' | 'check' - signature only for card
}

interface CompletionResult {
  checklistCompleted: Record<string, boolean>;
  completionPhotos: string[];
  actualDurationMinutes: number | null;
  signatureDataUrl: string | null;
  signedByName: string | null;
  skipSignature: boolean;
  completionNotes: string;
}

const DURATION_OPTIONS = [
  { minutes: 30, label: '30min' },
  { minutes: 45, label: '45min' },
  { minutes: 60, label: '1h' },
  { minutes: 90, label: '1h 30min' },
  { minutes: 120, label: '2h' },
  { minutes: 150, label: '2h 30min' },
  { minutes: 180, label: '3h' },
];

type Step = 'photos' | 'duration' | 'signature' | 'review';

export default function JobCompletionFlow({
  isOpen,
  onClose,
  onComplete,
  jobId,
  customerName: initialCustomerName,
  estimatedDuration,
  existingPhotos = [],
  requireCompletionPhotos = false,
  paymentMethod = '',
}: JobCompletionFlowProps) {
  const [step, setStep] = useState<Step>('photos');
  const [photos, setPhotos] = useState<string[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [actualDurationMinutes, setActualDurationMinutes] = useState<number | null>(null);
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [customDurationValue, setCustomDurationValue] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signedByName, setSignedByName] = useState(initialCustomerName);
  const [skipSignature, setSkipSignature] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Only show signature step for card payments
  const showSignatureStep = paymentMethod === 'card';

  // Build steps array dynamically
  const steps: Step[] = showSignatureStep
    ? ['photos', 'duration', 'signature', 'review']
    : ['photos', 'duration', 'review'];
  const currentStepIndex = steps.indexOf(step);

  const canProceed = () => {
    switch (step) {
      case 'photos':
        // If photos are required, need at least 1. Otherwise always allow proceeding.
        return requireCompletionPhotos ? photos.length >= 1 : true;
      case 'duration':
        return true; // Duration is optional
      case 'signature':
        return skipSignature || (signatureDataUrl && signedByName.trim());
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'after'); // Use 'after' type for completion photos

        // Use the existing job photos upload endpoint
        const res = await fetch(`/api/provider/jobs/${jobId}/photos/upload`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setPhotos(prev => [...prev, data.photo.url]);
        } else {
          const errorData = await res.json().catch(() => ({}));
          toast.error(errorData.error || 'Failed to upload photo');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSignatureSave = (dataUrl: string) => {
    setSignatureDataUrl(dataUrl);
    setSkipSignature(false);
  };

  const handleSkipSignature = () => {
    setSkipSignature(true);
    setSignatureDataUrl(null);
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      const result: CompletionResult = {
        checklistCompleted: {}, // Checklist removed - always empty
        completionPhotos: photos,
        actualDurationMinutes,
        signatureDataUrl,
        signedByName: skipSignature ? null : signedByName,
        skipSignature,
        completionNotes,
      };
      await onComplete(result);
    } catch (error) {
      console.error('Completion error:', error);
      toast.error('Failed to complete job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Complete Job</h2>
            <p className="text-xs text-zinc-400">
              Step {currentStepIndex + 1} of {steps.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="px-4 py-2 flex justify-center gap-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentStepIndex
                  ? 'bg-emerald-500'
                  : i < currentStepIndex
                  ? 'bg-emerald-500/50'
                  : 'bg-zinc-700'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 'photos' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-100 mb-1">
                  Completion Photos
                </h3>
                <p className="text-sm text-zinc-400">
                  {requireCompletionPhotos
                    ? 'Take photos of the completed work (min 1)'
                    : 'Add photos of the completed work (optional but recommended)'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {photos.map((url, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 p-1 bg-black/70 rounded-full hover:bg-black"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="aspect-square border-2 border-dashed border-zinc-600 rounded-lg flex flex-col items-center justify-center gap-1 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-6 h-6" />
                      <span className="text-xs">Add</span>
                    </>
                  )}
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {photos.length === 0 && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  requireCompletionPhotos
                    ? 'bg-amber-500/10 border border-amber-500/30'
                    : 'bg-blue-500/10 border border-blue-500/30'
                }`}>
                  <AlertCircle className={`w-4 h-4 flex-shrink-0 ${
                    requireCompletionPhotos ? 'text-amber-500' : 'text-blue-500'
                  }`} />
                  <p className={`text-xs ${
                    requireCompletionPhotos ? 'text-amber-400' : 'text-blue-400'
                  }`}>
                    {requireCompletionPhotos
                      ? 'At least 1 photo is required'
                      : 'Adding photos helps document your work'}
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 'duration' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-100 mb-1">
                  Actual Time Spent
                </h3>
                <p className="text-sm text-zinc-400">
                  How long did this job take? (optional)
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map(opt => {
                  const isSelected = actualDurationMinutes === opt.minutes && !showCustomDuration;
                  return (
                    <button
                      key={opt.minutes}
                      type="button"
                      onClick={() => {
                        setActualDurationMinutes(opt.minutes);
                        setShowCustomDuration(false);
                        setCustomDurationValue('');
                      }}
                      className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-emerald-500 text-white'
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
                    setCustomDurationValue(actualDurationMinutes?.toString() || '');
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

              {showCustomDuration && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={customDurationValue}
                    onChange={(e) => {
                      setCustomDurationValue(e.target.value);
                      const val = parseInt(e.target.value);
                      if (val && val >= 15 && val <= 480) {
                        setActualDurationMinutes(val);
                      }
                    }}
                    placeholder="Minutes"
                    className="w-32 px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    min="15"
                    max="480"
                  />
                  <span className="text-sm text-zinc-400">min (15-480)</span>
                </div>
              )}

              {estimatedDuration && (
                <p className="text-xs text-zinc-500">
                  Estimated: {Math.round(estimatedDuration * 60)} min
                </p>
              )}
            </div>
          )}

          {step === 'signature' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-100 mb-1">
                  Customer Signature
                </h3>
                <p className="text-sm text-zinc-400">
                  Have customer confirm job completion
                </p>
              </div>

              {skipSignature ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-sm text-amber-400 mb-3">
                    Signature will be skipped
                  </p>
                  <button
                    onClick={() => setSkipSignature(false)}
                    className="text-sm text-amber-400 underline hover:text-amber-300"
                  >
                    Get signature instead
                  </button>
                </div>
              ) : signatureDataUrl ? (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-emerald-400">
                        Signature captured
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Signed by: {signedByName}
                    </p>
                  </div>
                  <div className="border border-zinc-700 rounded-lg overflow-hidden bg-white">
                    <img
                      src={signatureDataUrl}
                      alt="Signature"
                      className="w-full h-32 object-contain"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setSignatureDataUrl(null);
                      setSkipSignature(false);
                    }}
                    className="text-sm text-zinc-400 underline hover:text-zinc-300"
                  >
                    Re-capture signature
                  </button>
                </div>
              ) : (
                <SignaturePad
                  customerName={signedByName}
                  onCustomerNameChange={setSignedByName}
                  onSave={handleSignatureSave}
                  onSkip={handleSkipSignature}
                />
              )}
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-100 mb-1">
                  Review & Complete
                </h3>
                <p className="text-sm text-zinc-400">
                  Review before submitting
                </p>
              </div>

              <div className="space-y-3">
                {/* Photos summary */}
                <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                  <span className="text-sm text-zinc-300">Photos</span>
                  <div className="flex items-center gap-2">
                    {photos.length > 0 ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm text-emerald-400">
                          {photos.length} attached
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-zinc-500">None</span>
                    )}
                  </div>
                </div>

                {/* Duration summary */}
                <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                  <span className="text-sm text-zinc-300">Duration</span>
                  <span className="text-sm text-zinc-400">
                    {actualDurationMinutes
                      ? `${actualDurationMinutes} min`
                      : 'Not recorded'}
                  </span>
                </div>

                {/* Signature summary - only show if signature step was shown */}
                {showSignatureStep && (
                  <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                    <span className="text-sm text-zinc-300">Signature</span>
                    {skipSignature ? (
                      <span className="text-sm text-amber-400">Skipped</span>
                    ) : signatureDataUrl ? (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm text-emerald-400">
                          {signedByName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-zinc-500">Not captured</span>
                    )}
                  </div>
                )}
              </div>

              {/* Completion notes */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Any notes about the job..."
                  rows={3}
                  className="w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex gap-3">
          {currentStepIndex > 0 && (
            <button
              onClick={handleBack}
              className="flex-1 py-3 border border-zinc-600 rounded-lg text-zinc-300 font-medium hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}

          {step === 'review' ? (
            <button
              onClick={handleComplete}
              disabled={submitting}
              className="flex-1 py-3 bg-emerald-600 rounded-lg text-white font-medium hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Complete Job
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                canProceed()
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
