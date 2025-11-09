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

        {/* Main Content - Two Column Layout */}
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Weekly Schedule */}
            <div>
              <div className="mb-4">
                <h2 className="text-base font-semibold text-zinc-100 mb-1">Weekly Schedule</h2>
                <p className="text-xs text-zinc-500">Set your available hours</p>
              </div>

              <div className="space-y-2">
                {days.map(({ key, label }) => {
                  const isAvailable = workingHours[key].length > 0;
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50 hover:border-zinc-700/50 transition-colors"
                    >
                      {/* Toggle Switch */}
                      <button
                        onClick={() => toggleDayAvailability(key)}
                        className={`
                          relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0
                          ${isAvailable ? 'bg-blue-600' : 'bg-zinc-800'}
                        `}
                      >
                        <span
                          className={`
                            inline-block h-3 w-3 transform rounded-full bg-white transition-transform
                            ${isAvailable ? 'translate-x-5' : 'translate-x-1'}
                          `}
                        />
                      </button>

                      {/* Day Label */}
                      <span className={`text-xs font-medium w-16 ${isAvailable ? 'text-zinc-100' : 'text-zinc-500'}`}>
                        {label}
                      </span>

                      {/* Time Inputs */}
                      {isAvailable ? (
                        <div className="flex items-center gap-2 flex-1">
                          {workingHours[key].map((slot, index) => (
                            <div key={index} className="flex items-center gap-1.5">
                              <input
                                type="time"
                                value={slot.start}
                                onChange={(e) => updateDayTime(key, index, 'start', e.target.value)}
                                className="px-2 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-transparent"
                              />
                              <span className="text-zinc-600 text-xs">→</span>
                              <input
                                type="time"
                                value={slot.end}
                                onChange={(e) => updateDayTime(key, index, 'end', e.target.value)}
                                className="px-2 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-transparent"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-600 italic">Unavailable</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Other Settings */}
            <div className="space-y-4">
              {/* Booking Preferences */}
              <div>
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-zinc-100 mb-1">Booking Preferences</h2>
                  <p className="text-xs text-zinc-500">Configure appointment settings</p>
                </div>

                <div className="space-y-3">
                  <div className="bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-blue-500/10 rounded">
                        <Clock className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-zinc-100">Buffer Time</h3>
                        <p className="text-xs text-zinc-500">Between appointments</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={bufferTime}
                        onChange={(e) => setBufferTime(parseInt(e.target.value))}
                        className="flex-1 px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded text-zinc-100 text-base font-medium focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-transparent"
                        min="0"
                        step="15"
                      />
                      <span className="text-xs text-zinc-500">minutes</span>
                    </div>
                  </div>

                  <div className="bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-purple-500/10 rounded">
                        <Calendar className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-zinc-100">Advance Booking</h3>
                        <p className="text-xs text-zinc-500">Maximum days ahead</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={advanceBooking}
                        onChange={(e) => setAdvanceBooking(parseInt(e.target.value))}
                        className="flex-1 px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded text-zinc-100 text-base font-medium focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-transparent"
                        min="1"
                        max="90"
                      />
                      <span className="text-xs text-zinc-500">days</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-4">
                <h3 className="text-xs font-semibold text-zinc-100 mb-3">Special Instructions</h3>
                <textarea
                  value={availabilityNotes}
                  onChange={(e) => setAvailabilityNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-transparent resize-none"
                  rows={4}
                  placeholder="e.g., Closed on holidays, Emergency calls available 24/7..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}