"use client"

import { useState, useEffect } from 'react';
import { X, Lock, AlertCircle, Users, Building2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  profilePhotoUrl?: string;
}

interface BlockTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
  onTimeBlocked: () => void;
  selectedDate?: Date;
}

export default function BlockTimeModal({
  isOpen,
  onClose,
  providerId,
  onTimeBlocked,
  selectedDate,
}: BlockTimeModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);

  // Scope state - company-wide or specific workers
  const [scope, setScope] = useState<'company' | 'workers'>('company');
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  const [blockData, setBlockData] = useState({
    fromDate: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    toDate: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    reason: '',
    notes: '',
    // Recurring options
    repeatType: 'weekly' as 'weekly' | 'monthly',
    daysOfWeek: [] as number[], // 0-6 (Sunday-Saturday)
    endsType: 'never' as 'never' | 'after' | 'on',
    occurrences: 1,
    endsOnDate: '',
  });

  const reasons = [
    'Vacation',
    'Sick',
    'Weather',
    'Equipment Issues',
    'Personal',
    'Other',
  ];

  const daysOfWeek = [
    { label: 'Sun', value: 0 },
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 },
  ];

  const toggleDayOfWeek = (day: number) => {
    setBlockData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  // Fetch team members when modal opens and scope is 'workers'
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!providerId || !isOpen) return;

      setLoadingTeam(true);
      try {
        const res = await fetch(`/api/provider/team?providerId=${providerId}`);
        if (res.ok) {
          const data = await res.json();
          setTeamMembers(data.teamMembers || []);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
      } finally {
        setLoadingTeam(false);
      }
    };

    fetchTeamMembers();
  }, [providerId, isOpen]);

  const toggleWorker = (workerId: string) => {
    setSelectedWorkerIds(prev =>
      prev.includes(workerId)
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!blockData.fromDate || !blockData.toDate) {
      toast.error('Please select date range');
      return;
    }

    if (!blockData.reason) {
      toast.error('Please select a reason');
      return;
    }

    if (new Date(blockData.fromDate) > new Date(blockData.toDate)) {
      toast.error('End date must be after start date');
      return;
    }

    if (isRecurring && blockData.repeatType === 'weekly' && blockData.daysOfWeek.length === 0) {
      toast.error('Please select at least one day of the week');
      return;
    }

    if (isRecurring && blockData.endsType === 'after' && blockData.occurrences < 1) {
      toast.error('Occurrences must be at least 1');
      return;
    }

    if (isRecurring && blockData.endsType === 'on' && !blockData.endsOnDate) {
      toast.error('Please select an end date for recurring block');
      return;
    }

    if (scope === 'workers' && selectedWorkerIds.length === 0) {
      toast.error('Please select at least one worker');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        providerId,
        fromDate: blockData.fromDate,
        toDate: blockData.toDate,
        startTime: blockData.startTime || null,
        endTime: blockData.endTime || null,
        reason: blockData.reason,
        notes: blockData.notes || null,
        isRecurring,
        scope,
        blockedWorkerIds: scope === 'workers' ? selectedWorkerIds : [],
        ...(isRecurring && {
          recurring: {
            type: blockData.repeatType,
            daysOfWeek: blockData.daysOfWeek,
            endsType: blockData.endsType,
            occurrences: blockData.endsType === 'after' ? blockData.occurrences : null,
            endsOnDate: blockData.endsType === 'on' ? blockData.endsOnDate : null,
          },
        }),
      };

      const res = await fetch('/api/provider/availability/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to block time');
      }

      toast.success('Time blocked successfully!');
      onTimeBlocked();
      onClose();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to block time');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setBlockData({
      fromDate: new Date().toISOString().split('T')[0],
      toDate: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      reason: '',
      notes: '',
      repeatType: 'weekly',
      daysOfWeek: [],
      endsType: 'never',
      occurrences: 1,
      endsOnDate: '',
    });
    setIsRecurring(false);
    setScope('company');
    setSelectedWorkerIds([]);
  };

  if (!isOpen) return null;

  const isAllDay = !blockData.startTime && !blockData.endTime;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Lock className="h-5 w-5 text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-100">Block Time Off</h2>
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

        {/* Warning Banner */}
        <div className="mx-6 mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-orange-400">No New Leads During This Time</p>
            <p className="text-xs text-zinc-400 mt-1">
              You won&apos;t receive new Renoa leads for the blocked time slots
            </p>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6 space-y-6">
            {/* Date Range */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-4">
                Date Range
                {selectedDate && (
                  <span className="ml-2 text-sm text-orange-400 font-normal">
                    📅 {new Date(blockData.fromDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    From Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={blockData.fromDate}
                    onChange={(e) => setBlockData(prev => ({ ...prev, fromDate: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                  {selectedDate && (
                    <p className="mt-1 text-xs text-zinc-500">
                      Blocking time for the selected date
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    To Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={blockData.toDate}
                    onChange={(e) => setBlockData(prev => ({ ...prev, toDate: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Same day block or multi-day
                  </p>
                </div>
              </div>
            </div>

            {/* Who to Block - Scope Selection */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-4">Who to Block</h3>

              {/* Scope Options */}
              <div className="space-y-3">
                <label
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    scope === 'company'
                      ? 'bg-orange-500/10 border-orange-500'
                      : 'bg-zinc-800/30 border-zinc-700 hover:bg-zinc-800/50'
                  }`}
                  onClick={() => setScope('company')}
                >
                  <input
                    type="radio"
                    name="scope"
                    value="company"
                    checked={scope === 'company'}
                    onChange={() => setScope('company')}
                    className="sr-only"
                  />
                  <div className={`p-2 rounded-lg ${scope === 'company' ? 'bg-orange-500/20' : 'bg-zinc-700/50'}`}>
                    <Building2 className={`h-5 w-5 ${scope === 'company' ? 'text-orange-400' : 'text-zinc-400'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${scope === 'company' ? 'text-orange-400' : 'text-zinc-300'}`}>
                      Block entire company
                    </p>
                    <p className="text-xs text-zinc-500">
                      All workers will be blocked during this time
                    </p>
                  </div>
                  {scope === 'company' && (
                    <Check className="h-5 w-5 text-orange-400" />
                  )}
                </label>

                <label
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    scope === 'workers'
                      ? 'bg-orange-500/10 border-orange-500'
                      : 'bg-zinc-800/30 border-zinc-700 hover:bg-zinc-800/50'
                  }`}
                  onClick={() => setScope('workers')}
                >
                  <input
                    type="radio"
                    name="scope"
                    value="workers"
                    checked={scope === 'workers'}
                    onChange={() => setScope('workers')}
                    className="sr-only"
                  />
                  <div className={`p-2 rounded-lg ${scope === 'workers' ? 'bg-orange-500/20' : 'bg-zinc-700/50'}`}>
                    <Users className={`h-5 w-5 ${scope === 'workers' ? 'text-orange-400' : 'text-zinc-400'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${scope === 'workers' ? 'text-orange-400' : 'text-zinc-300'}`}>
                      Block specific workers
                    </p>
                    <p className="text-xs text-zinc-500">
                      Choose which workers to block
                    </p>
                  </div>
                  {scope === 'workers' && (
                    <Check className="h-5 w-5 text-orange-400" />
                  )}
                </label>
              </div>

              {/* Worker Selection - shown when scope is 'workers' */}
              {scope === 'workers' && (
                <div className="mt-4 p-4 bg-zinc-800/30 border border-zinc-700/50 rounded-lg">
                  <p className="text-sm font-medium text-zinc-300 mb-3">
                    Select workers to block <span className="text-red-400">*</span>
                  </p>

                  {loadingTeam ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                    </div>
                  ) : teamMembers.length === 0 ? (
                    <p className="text-sm text-zinc-500 text-center py-4">
                      No team members found
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {teamMembers.map((member) => (
                        <label
                          key={member.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                            selectedWorkerIds.includes(member.id)
                              ? 'bg-orange-500/10 border border-orange-500/50'
                              : 'bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800'
                          }`}
                          onClick={() => toggleWorker(member.id)}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedWorkerIds.includes(member.id)
                              ? 'bg-orange-500 border-orange-500'
                              : 'border-zinc-600'
                          }`}>
                            {selectedWorkerIds.includes(member.id) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-200 truncate">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-xs text-zinc-500 capitalize">
                              {member.role}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {selectedWorkerIds.length > 0 && (
                    <p className="text-xs text-zinc-400 mt-3">
                      {selectedWorkerIds.length} worker{selectedWorkerIds.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Time Range */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-4">Time Range</h3>

              {/* Quick Time Presets */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setBlockData(prev => ({ ...prev, startTime: '', endTime: '' }))}
                  className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition-colors"
                >
                  All Day
                </button>
                <button
                  type="button"
                  onClick={() => setBlockData(prev => ({ ...prev, startTime: '07:00', endTime: '12:00' }))}
                  className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition-colors"
                >
                  Morning (7AM-12PM)
                </button>
                <button
                  type="button"
                  onClick={() => setBlockData(prev => ({ ...prev, startTime: '12:00', endTime: '17:00' }))}
                  className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition-colors"
                >
                  Afternoon (12PM-5PM)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Start Time
                    <span className="text-xs text-zinc-500 ml-2">(optional, leave blank for all day)</span>
                  </label>
                  <input
                    type="time"
                    value={blockData.startTime}
                    onChange={(e) => setBlockData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    End Time
                    <span className="text-xs text-zinc-500 ml-2">(optional)</span>
                  </label>
                  <input
                    type="time"
                    value={blockData.endTime}
                    onChange={(e) => setBlockData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              {isAllDay && (
                <p className="text-xs text-zinc-500 mt-2">
                  ⏰ All day block selected
                </p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Reason <span className="text-red-400">*</span>
              </label>
              <select
                value={blockData.reason}
                onChange={(e) => setBlockData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              >
                <option value="">Select reason...</option>
                {reasons.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={blockData.notes}
                onChange={(e) => setBlockData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[80px]"
                placeholder="Any additional details..."
              />
            </div>

            {/* Recurring Checkbox */}
            <div className="border-t border-zinc-800 pt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 text-orange-500 focus:ring-orange-500 focus:ring-offset-zinc-900"
                />
                <span className="text-sm font-medium text-zinc-300">Make this recurring</span>
              </label>
            </div>

            {/* Recurring Options */}
            {isRecurring && (
              <div className="space-y-4 p-4 bg-zinc-800/30 border border-zinc-700/50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Repeat
                  </label>
                  <select
                    value={blockData.repeatType}
                    onChange={(e) => setBlockData(prev => ({ ...prev, repeatType: e.target.value as 'weekly' | 'monthly' }))}
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                {blockData.repeatType === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-3">
                      Days of Week <span className="text-red-400">*</span>
                    </label>
                    <div className="flex gap-2">
                      {daysOfWeek.map(day => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDayOfWeek(day.value)}
                          className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border-2 transition-all ${
                            blockData.daysOfWeek.includes(day.value)
                              ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                              : 'bg-zinc-800/30 border-zinc-700 text-zinc-400 hover:bg-zinc-800/50'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3">
                    Ends
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="endsType"
                        value="never"
                        checked={blockData.endsType === 'never'}
                        onChange={(e) => setBlockData(prev => ({ ...prev, endsType: 'never' }))}
                        className="text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm text-zinc-300">Never</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="endsType"
                        value="after"
                        checked={blockData.endsType === 'after'}
                        onChange={(e) => setBlockData(prev => ({ ...prev, endsType: 'after' }))}
                        className="text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm text-zinc-300">After</span>
                      <input
                        type="number"
                        min="1"
                        value={blockData.occurrences}
                        onChange={(e) => setBlockData(prev => ({ ...prev, occurrences: parseInt(e.target.value) || 1 }))}
                        disabled={blockData.endsType !== 'after'}
                        className="w-20 px-3 py-1.5 bg-zinc-800/50 border border-zinc-700 rounded text-zinc-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <span className="text-sm text-zinc-300">occurrences</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="endsType"
                        value="on"
                        checked={blockData.endsType === 'on'}
                        onChange={(e) => setBlockData(prev => ({ ...prev, endsType: 'on' }))}
                        className="text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm text-zinc-300">On</span>
                      <input
                        type="date"
                        value={blockData.endsOnDate}
                        onChange={(e) => setBlockData(prev => ({ ...prev, endsOnDate: e.target.value }))}
                        disabled={blockData.endsType !== 'on'}
                        className="flex-1 px-3 py-1.5 bg-zinc-800/50 border border-zinc-700 rounded text-zinc-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800 bg-zinc-900/50">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-orange-600 hover:bg-orange-500 text-white px-6"
            >
              {submitting ? 'Blocking...' : 'Block Time'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
