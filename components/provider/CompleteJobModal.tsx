"use client";

import { AlertCircle, Camera, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompleteJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  hasAfterPhotos: boolean;
}

export default function CompleteJobModal({
  isOpen,
  onClose,
  onComplete,
  hasAfterPhotos,
}: CompleteJobModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-2xl font-bold text-zinc-100">
            Mark this job as complete?
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {!hasAfterPhotos ? (
            <>
              {/* Warning about no photos */}
              <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-4">
                <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-400 mb-1">
                    No after photos yet
                  </p>
                  <p className="text-xs text-zinc-400">
                    Photos help with:
                  </p>
                  <ul className="text-xs text-zinc-400 mt-2 space-y-1 list-disc list-inside">
                    <li>Customer satisfaction (show them the work)</li>
                    <li>Your portfolio (showcase your skills)</li>
                    <li>Protection (proof of completion)</li>
                  </ul>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <Button
                  onClick={onClose}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 text-base font-semibold"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Add Photos First (Recommended)
                </Button>
                <Button
                  onClick={() => {
                    onComplete();
                    onClose();
                  }}
                  variant="outline"
                  className="w-full border-zinc-700 hover:bg-zinc-800 py-3 text-zinc-300"
                >
                  Complete Without Photos
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Success message with photos */}
              <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg mb-4">
                <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-400">
                    Great! After photos uploaded.
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Ready to mark this job as complete
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    onComplete();
                    onClose();
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 text-base font-semibold"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Mark Complete
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full border-zinc-700 hover:bg-zinc-800 py-3 text-zinc-300"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
