"use client"

import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Listbox } from '@headlessui/react';

interface EditJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  initialData: {
    serviceType: string;
    startTime: string;
    endTime: string;
    estimatedValue?: number;
    jobInstructions?: string;
    customerNotes?: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  };
  onJobUpdated: () => void;
  providerServiceTypes?: string[];
}

export default function EditJobModal({
  isOpen,
  onClose,
  jobId,
  initialData,
  onJobUpdated,
  providerServiceTypes,
}: EditJobModalProps) {
  const [submitting, setSubmitting] = useState(false);

  // Calculate date and time from startTime
  const startDate = new Date(initialData.startTime);
  const endDate = new Date(initialData.endTime);
  const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

  const [jobDetails, setJobDetails] = useState({
    serviceType: initialData.serviceType,
    date: startDate.toISOString().split('T')[0],
    startTime: `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`,
    duration: durationHours.toString(),
    endTime: '',
    estimatedValue: initialData.estimatedValue?.toString() || '',
    jobInstructions: initialData.jobInstructions || '',
    customerNotes: initialData.customerNotes || '',
    status: initialData.status,
  });

  // All available service types
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
    { id: 'other', name: 'Other', icon: '⚙️' },
  ];

  const serviceTypes = providerServiceTypes && providerServiceTypes.length > 0
    ? allServiceTypes.filter(service =>
        providerServiceTypes.includes(service.id) || service.id === 'other'
      )
    : allServiceTypes;

  // Generate time options (6:00 AM to 8:00 PM in 30-minute increments)
  const timeOptions = [];
  for (let hour = 6; hour <= 20; hour++) {
    for (let minute of [0, 30]) {
      const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const period = hour >= 12 ? 'PM' : 'AM';
      const timeLabel = `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
      timeOptions.push({ value: time24, label: timeLabel });
    }
  }

  // Calculate end time when start time or duration changes
  useEffect(() => {
    if (jobDetails.startTime && jobDetails.duration) {
      const [hours, minutes] = jobDetails.startTime.split(':').map(Number);
      const durationHours = parseFloat(jobDetails.duration);

      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + (durationHours * 60);

      const endHours = Math.floor(endMinutes / 60) % 24;
      const endMins = Math.floor(endMinutes % 60);

      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
      setJobDetails(prev => ({ ...prev, endTime }));
    }
  }, [jobDetails.startTime, jobDetails.duration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobDetails.serviceType || !jobDetails.date || !jobDetails.startTime || !jobDetails.duration) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/provider/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: jobDetails.serviceType,
          date: jobDetails.date,
          startTime: jobDetails.startTime,
          duration: jobDetails.duration,
          estimatedValue: jobDetails.estimatedValue,
          jobInstructions: jobDetails.jobInstructions,
          customerNotes: jobDetails.customerNotes,
          status: jobDetails.status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update job');
      }

      toast.success('Job updated successfully!');
      onJobUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating job:', error);
      toast.error(error.message || 'Failed to update job');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-zinc-900 w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-hidden shadow-2xl border-t md:border border-zinc-800">
        {/* Header */}
        <div className="border-b border-zinc-800">
          <div className="flex items-center justify-between px-4 md:px-6 py-4 md:py-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-zinc-100">Edit Job</h2>
              <p className="text-xs text-zinc-500 mt-1">Update job details</p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-zinc-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)] overscroll-contain">
          <div className="px-4 md:px-6 py-4 md:py-6 space-y-6">
            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">
                Service Type <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                {serviceTypes.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setJobDetails(prev => ({ ...prev, serviceType: type.name }))}
                    className={`
                      p-3 md:p-4 rounded-lg border-2 transition-all active:scale-95 min-h-[72px] md:min-h-[80px]
                      ${jobDetails.serviceType === type.name
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600 hover:bg-zinc-800/50'
                      }
                    `}
                  >
                    <div className="text-2xl md:text-3xl mb-1">{type.icon}</div>
                    <div className="text-xs md:text-sm font-medium text-zinc-200">{type.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={jobDetails.date}
                  onChange={(e) => setJobDetails(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Start Time <span className="text-red-400">*</span>
                </label>
                <Listbox
                  value={jobDetails.startTime}
                  onChange={(value) => setJobDetails(prev => ({ ...prev, startTime: value }))}
                >
                  <div className="relative">
                    <Listbox.Button className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base text-left">
                      {jobDetails.startTime ? timeOptions.find(t => t.value === jobDetails.startTime)?.label || jobDetails.startTime : 'Select time'}
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {timeOptions.map((time) => (
                        <Listbox.Option
                          key={time.value}
                          value={time.value}
                          className={({ active }) =>
                            `cursor-pointer px-4 py-2 text-sm ${
                              active ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-300'
                            }`
                          }
                        >
                          {time.label}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">
                Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(hours => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setJobDetails(prev => ({ ...prev, duration: hours.toString() }))}
                    className={`
                      py-3 rounded-lg border-2 transition-all font-medium active:scale-95
                      ${jobDetails.duration === hours.toString()
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600 hover:bg-zinc-800/50 text-zinc-300'
                      }
                    `}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setJobDetails(prev => ({ ...prev, duration: '8' }))}
                className={`
                  w-full py-3 rounded-lg border-2 transition-all font-medium mt-2 active:scale-95
                  ${jobDetails.duration === '8'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600 hover:bg-zinc-800/50 text-zinc-300'
                  }
                `}
              >
                All Day (8 hours)
              </button>
              {jobDetails.duration && (
                <p className="text-xs text-zinc-500 mt-2">
                  End time: {jobDetails.endTime || 'Calculating...'}
                </p>
              )}
            </div>

            {/* Pricing & Notes */}
            <div className="space-y-3">
              {/* Pricing Section */}
              <details className="group bg-zinc-800/30 border border-zinc-700 rounded-lg overflow-hidden">
                <summary className="cursor-pointer px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors select-none">
                  <span className="text-sm font-medium text-zinc-300">💰 Pricing (optional)</span>
                  <span className="text-zinc-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-4 pb-4 pt-2">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Estimated Value
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                    <input
                      type="number"
                      value={jobDetails.estimatedValue}
                      onChange={(e) => setJobDetails(prev => ({ ...prev, estimatedValue: e.target.value }))}
                      className="w-full pl-8 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
              </details>

              {/* Internal Notes Section */}
              <details className="group bg-zinc-800/30 border border-zinc-700 rounded-lg overflow-hidden">
                <summary className="cursor-pointer px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors select-none">
                  <span className="text-sm font-medium text-zinc-300">📝 Internal Notes (optional)</span>
                  <span className="text-zinc-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-4 pb-4 pt-2">
                  <textarea
                    value={jobDetails.jobInstructions}
                    onChange={(e) => setJobDetails(prev => ({ ...prev, jobInstructions: e.target.value }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px] text-sm md:text-base resize-none"
                    placeholder="Equipment needed, special instructions, etc."
                  />
                </div>
              </details>

              {/* Customer Notes Section */}
              <details className="group bg-zinc-800/30 border border-zinc-700 rounded-lg overflow-hidden">
                <summary className="cursor-pointer px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors select-none">
                  <span className="text-sm font-medium text-zinc-300">💬 Customer Notes (optional)</span>
                  <span className="text-zinc-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-4 pb-4 pt-2">
                  <textarea
                    value={jobDetails.customerNotes}
                    onChange={(e) => setJobDetails(prev => ({ ...prev, customerNotes: e.target.value }))}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px] text-sm md:text-base resize-none"
                    placeholder="This will be shown to the customer"
                  />
                </div>
              </details>
            </div>

            {/* Status */}
            <div>
              <h3 className="text-base md:text-lg font-semibold text-zinc-100 mb-3 md:mb-4">Status</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                <label className="flex items-center gap-3 p-3 md:p-4 bg-zinc-800/30 border-2 border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-800/50 transition-all active:scale-95 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-500/10">
                  <input
                    type="radio"
                    name="status"
                    value="scheduled"
                    checked={jobDetails.status === 'scheduled'}
                    onChange={(e) => setJobDetails(prev => ({ ...prev, status: e.target.value as any }))}
                    className="text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-zinc-200">Scheduled</span>
                </label>

                <label className="flex items-center gap-3 p-3 md:p-4 bg-zinc-800/30 border-2 border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-800/50 transition-all active:scale-95 has-[:checked]:border-yellow-500 has-[:checked]:bg-yellow-500/10">
                  <input
                    type="radio"
                    name="status"
                    value="in_progress"
                    checked={jobDetails.status === 'in_progress'}
                    onChange={(e) => setJobDetails(prev => ({ ...prev, status: e.target.value as any }))}
                    className="text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className="text-sm font-medium text-zinc-200">In Progress</span>
                </label>

                <label className="flex items-center gap-3 p-3 md:p-4 bg-zinc-800/30 border-2 border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-800/50 transition-all active:scale-95 has-[:checked]:border-green-500 has-[:checked]:bg-green-500/10">
                  <input
                    type="radio"
                    name="status"
                    value="completed"
                    checked={jobDetails.status === 'completed'}
                    onChange={(e) => setJobDetails(prev => ({ ...prev, status: e.target.value as any }))}
                    className="text-green-500 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-zinc-200">Completed</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex items-center justify-end gap-3 px-4 md:px-6 py-4 md:py-6 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-sm">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800 flex-1 md:flex-none min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !jobDetails.serviceType || !jobDetails.date || !jobDetails.startTime}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 flex-1 md:flex-none disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 min-h-[44px]"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 animate-spin" />
                  Updating...
                </span>
              ) : (
                'Update Job'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
