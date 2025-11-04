"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProviderLayout from '@/components/provider/ProviderLayout';
import { Button } from '@/components/ui/button';
import { Clock, Save, Calendar, Info, Check } from 'lucide-react';
import { toast } from 'sonner';

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

export default function ProviderSettings() {
  const router = useRouter();
  const [providerName, setProviderName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
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
  const [advanceBooking, setAdvanceBooking] = useState(14);
  const [availabilityNotes, setAvailabilityNotes] = useState('');

  useEffect(() => {
    const id = localStorage.getItem('providerId');
    const name = localStorage.getItem('providerName');
    
    if (!id || !name) {
      router.push('/provider/login');
      return;
    }

    setProviderId(id);
    setProviderName(name);
    fetchAvailability(id);
  }, [router]);

  const fetchAvailability = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/provider/availability?providerId=${id}`);
      const data = await res.json();
      
      if (data.workingHours) setWorkingHours(data.workingHours);
      if (data.bufferTime) setBufferTime(data.bufferTime);
      if (data.advanceBooking) setAdvanceBooking(data.advanceBooking);
      if (data.availabilityNotes) setAvailabilityNotes(data.availabilityNotes);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAvailability = async () => {
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
          availabilityNotes,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');

      toast.success('✅ Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleDayAvailability = (day: keyof WorkingHours) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: prev[day].length === 0 
        ? [{ start: '09:00', end: '17:00' }]
        : []
    }));
  };

  const updateDayTime = (
    day: keyof WorkingHours,
    index: number,
    field: 'start' | 'end',
    value: string
  ) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: prev[day].map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const days: { key: keyof WorkingHours; label: string }[] = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  if (loading) {
    return (
      <ProviderLayout providerName={providerName}>
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout providerName={providerName}>
      <div className="min-h-screen bg-zinc-950">
        {/* Header - Cleaner */}
        <div className="border-b border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-8 py-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-100">Availability</h1>
              <p className="text-sm text-zinc-500 mt-1">Configure your working hours and booking preferences</p>
            </div>
            <Button
              onClick={handleSaveAvailability}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Content - Centered, Cleaner */}
        <div className="max-w-5xl mx-auto px-8 py-12">
          {/* Weekly Schedule */}
          <div className="mb-12">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-zinc-100 mb-2">Weekly Schedule</h2>
              <p className="text-sm text-zinc-500">Set the hours you're available to take appointments</p>
            </div>

            <div className="space-y-2">
              {days.map(({ key, label }) => {
                const isAvailable = workingHours[key].length > 0;
                return (
                  <div 
                    key={key} 
                    className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50 hover:border-zinc-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Toggle Switch */}
                      <button
                        onClick={() => toggleDayAvailability(key)}
                        className={`
                          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                          ${isAvailable ? 'bg-blue-600' : 'bg-zinc-800'}
                        `}
                      >
                        <span
                          className={`
                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${isAvailable ? 'translate-x-6' : 'translate-x-1'}
                          `}
                        />
                      </button>

                      {/* Day Label */}
                      <span className={`text-sm font-medium w-28 ${isAvailable ? 'text-zinc-100' : 'text-zinc-500'}`}>
                        {label}
                      </span>

                      {/* Time Inputs */}
                      {isAvailable ? (
                        <div className="flex items-center gap-3">
                          {workingHours[key].map((slot, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <input
                                type="time"
                                value={slot.start}
                                onChange={(e) => updateDayTime(key, index, 'start', e.target.value)}
                                className="px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                              />
                              <span className="text-zinc-600">→</span>
                              <input
                                type="time"
                                value={slot.end}
                                onChange={(e) => updateDayTime(key, index, 'end', e.target.value)}
                                className="px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-zinc-600 italic">Unavailable</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Booking Preferences */}
          <div className="grid grid-cols-2 gap-6 mb-12">
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">Buffer Time</h3>
                  <p className="text-xs text-zinc-500">Between appointments</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={bufferTime}
                  onChange={(e) => setBufferTime(parseInt(e.target.value))}
                  className="flex-1 px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-100 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  min="0"
                  step="15"
                />
                <span className="text-sm text-zinc-500">minutes</span>
              </div>
            </div>

            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">Advance Booking</h3>
                  <p className="text-xs text-zinc-500">Maximum days ahead</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={advanceBooking}
                  onChange={(e) => setAdvanceBooking(parseInt(e.target.value))}
                  className="flex-1 px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-100 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  min="1"
                  max="90"
                />
                <span className="text-sm text-zinc-500">days</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6">
            <h3 className="text-sm font-semibold text-zinc-100 mb-3">Special Instructions</h3>
            <textarea
              value={availabilityNotes}
              onChange={(e) => setAvailabilityNotes(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none"
              rows={3}
              placeholder="e.g., Closed on holidays, Emergency calls available 24/7..."
            />
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}