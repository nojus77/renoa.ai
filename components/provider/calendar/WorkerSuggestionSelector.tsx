'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Users, Clock, MapPin } from 'lucide-react';
import { formatInProviderTz } from '@/lib/utils/timezone';
import SuggestionCard from './SuggestionCard';
import type { WorkerScore } from '@/lib/assignment-scoring';

interface JobDetails {
  serviceType: string;
  customerName: string;
  startTime: string;
  endTime: string;
  duration: number;
  address: string;
  estimatedValue: number | null;
}

interface WorkerSuggestionSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  providerId: string;
  onAssign: (workerId: string) => void;
}

export default function WorkerSuggestionSelector({
  isOpen,
  onClose,
  jobId,
  providerId,
  onAssign,
}: WorkerSuggestionSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [suggestions, setSuggestions] = useState<WorkerScore[]>([]);
  const [showAllWorkers, setShowAllWorkers] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);

  // Fetch suggestions when dialog opens
  useEffect(() => {
    if (isOpen && jobId) {
      fetchSuggestions();
    }
  }, [isOpen, jobId]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/provider/jobs/${jobId}/suggestions?providerId=${providerId}&limit=5`
      );

      if (!res.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await res.json();
      setJobDetails(data.jobDetails);
      setSuggestions(data.suggestions);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError('Unable to load suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (workerId: string) => {
    setAssigning(workerId);
    try {
      await onAssign(workerId);
      onClose();
    } catch (err) {
      console.error('Error assigning:', err);
    } finally {
      setAssigning(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            Smart Assignment
          </DialogTitle>
          {jobDetails && (
            <DialogDescription className="space-y-2">
              <div className="font-medium text-zinc-200">
                {jobDetails.serviceType} - {jobDetails.customerName}
              </div>
              <div className="flex items-center gap-4 text-sm text-zinc-400">
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {format(new Date(jobDetails.startTime), 'MMM d')}, {formatInProviderTz(jobDetails.startTime, 'h:mm a', 'America/Chicago')} -{' '}
                    {formatInProviderTz(jobDetails.endTime, 'h:mm a', 'America/Chicago')}
                  </span>
                  <span className="text-zinc-500">({jobDetails.duration}h)</span>
                </div>
                {jobDetails.estimatedValue && (
                  <Badge variant="outline" className="border-emerald-500 text-emerald-400">
                    ${jobDetails.estimatedValue}
                  </Badge>
                )}
              </div>
              {jobDetails.address && (
                <div className="flex items-center gap-1 text-sm text-zinc-500">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{jobDetails.address}</span>
                </div>
              )}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto -mx-6 px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-400">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <span>Analyzing team availability...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-400">
              <span className="text-red-400 mb-3">{error}</span>
              <Button onClick={fetchSuggestions} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-400">
              <Users className="h-8 w-8 mb-3" />
              <span>No workers available</span>
              <p className="text-sm text-zinc-500 mt-1">
                Add team members to get assignment suggestions
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Top Suggestion Highlight */}
              {suggestions.length > 0 && suggestions[0].matchQuality === 'excellent' && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                    <Sparkles className="h-4 w-4" />
                    <span>Recommended: {suggestions[0].workerName}</span>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-0">
                      {suggestions[0].totalScore}% match
                    </Badge>
                  </div>
                </div>
              )}

              {/* Suggestion Cards */}
              {suggestions.map((suggestion, index) => (
                <SuggestionCard
                  key={suggestion.workerId}
                  suggestion={suggestion}
                  rank={index + 1}
                  isAssigning={assigning === suggestion.workerId}
                  onSelect={() => handleAssign(suggestion.workerId)}
                />
              ))}

              {/* Show All Workers Option */}
              {!showAllWorkers && (
                <div className="pt-4 border-t border-zinc-800">
                  <button
                    onClick={() => setShowAllWorkers(true)}
                    className="w-full py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Show all workers (override suggestions)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 pt-4 border-t border-zinc-800 flex justify-between items-center">
          <div className="text-xs text-zinc-500">
            <Sparkles className="h-3 w-3 inline mr-1" />
            Suggestions based on skills, availability, capacity & location
          </div>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
