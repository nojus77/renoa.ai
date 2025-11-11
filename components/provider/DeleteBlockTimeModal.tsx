"use client";

import { Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';

interface DeleteBlockTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockId: string;
  reason: string;
  dateRange: string;
  onDeleted: () => void;
}

export default function DeleteBlockTimeModal({
  isOpen,
  onClose,
  blockId,
  reason,
  dateRange,
  onDeleted,
}: DeleteBlockTimeModalProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/provider/availability/block/${blockId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete time block');
      }

      toast.success('Time block deleted');
      onDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting time block:', error);
      toast.error('Failed to delete time block');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-2xl font-bold text-zinc-100">
            Delete Time Block?
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400 mb-1">
                This action cannot be undone
              </p>
              <p className="text-xs text-zinc-400">
                This time will become available for booking again.
              </p>
            </div>
          </div>

          {/* Block Details */}
          <div className="bg-zinc-800/50 rounded-lg p-4 mb-6">
            <div className="text-sm text-zinc-400 mb-1">Reason:</div>
            <div className="text-base font-semibold text-zinc-100 mb-3">{reason}</div>
            <div className="text-sm text-zinc-400 mb-1">Time Period:</div>
            <div className="text-base text-zinc-300">{dateRange}</div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full bg-red-600 hover:bg-red-500 text-white py-6 text-base font-semibold"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              {deleting ? 'Deleting...' : 'Delete Time Block'}
            </Button>
            <Button
              onClick={onClose}
              disabled={deleting}
              variant="outline"
              className="w-full border-zinc-700 hover:bg-zinc-800 py-3 text-zinc-300"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
