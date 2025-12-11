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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Users, Clock, MapPin, User } from 'lucide-react';
import SuggestionCard from './SuggestionCard';
import CrewCard from './CrewCard';
import type { WorkerScore } from '@/lib/assignment-scoring';

interface JobDetails {
  id: string;
  serviceType: string;
  customerName: string;
  startTime: string;
  endTime: string;
  duration: number;
  address: string;
  estimatedValue: number | null;
}

interface CrewMember {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  skills: string[];
}

interface Crew {
  id: string;
  name: string;
  color: string;
  members: CrewMember[];
}

interface CrewAssignmentSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  providerId: string;
  onAssignWorker: (workerId: string) => void;
  onAssignCrew: (crewId: string) => void;
}

export default function CrewAssignmentSelector({
  isOpen,
  onClose,
  jobId,
  providerId,
  onAssignWorker,
  onAssignCrew,
}: CrewAssignmentSelectorProps) {
  const [activeTab, setActiveTab] = useState<'workers' | 'crews'>('workers');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [suggestions, setSuggestions] = useState<WorkerScore[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [crewsLoading, setCrewsLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  // Fetch suggestions when dialog opens
  useEffect(() => {
    if (isOpen && jobId) {
      fetchSuggestions();
      fetchCrews();
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

  const fetchCrews = async () => {
    setCrewsLoading(true);

    try {
      const res = await fetch(`/api/provider/crews?providerId=${providerId}`);

      if (!res.ok) {
        throw new Error('Failed to fetch crews');
      }

      const data = await res.json();
      setCrews(data.crews || []);
    } catch (err) {
      console.error('Error fetching crews:', err);
      setCrews([]);
    } finally {
      setCrewsLoading(false);
    }
  };

  const handleAssignWorker = async (workerId: string) => {
    setAssigning(workerId);
    try {
      await onAssignWorker(workerId);
      onClose();
    } catch (err) {
      console.error('Error assigning worker:', err);
    } finally {
      setAssigning(null);
    }
  };

  const handleAssignCrew = async (crewId: string) => {
    setAssigning(crewId);
    try {
      await onAssignCrew(crewId);
      onClose();
    } catch (err) {
      console.error('Error assigning crew:', err);
    } finally {
      setAssigning(null);
    }
  };

  const jobInfo = jobDetails ? {
    id: jobId,
    startTime: new Date(jobDetails.startTime),
    endTime: new Date(jobDetails.endTime),
    serviceType: jobDetails.serviceType,
  } : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            Assign Job
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
                    {format(new Date(jobDetails.startTime), 'MMM d, h:mm a')} -{' '}
                    {format(new Date(jobDetails.endTime), 'h:mm a')}
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

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'workers' | 'crews')}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
            <TabsTrigger
              value="workers"
              className="data-[state=active]:bg-zinc-700"
            >
              <User className="h-4 w-4 mr-2" />
              Individual Workers
              {suggestions.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-zinc-600">
                  {suggestions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="crews"
              className="data-[state=active]:bg-zinc-700"
            >
              <Users className="h-4 w-4 mr-2" />
              Crews
              {crews.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-zinc-600">
                  {crews.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto mt-4">
            <TabsContent value="workers" className="m-0 space-y-3">
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
                  <User className="h-8 w-8 mb-3" />
                  <span>No workers available</span>
                  <p className="text-sm text-zinc-500 mt-1">
                    Add team members to get assignment suggestions
                  </p>
                </div>
              ) : (
                <>
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
                      onSelect={() => handleAssignWorker(suggestion.workerId)}
                    />
                  ))}
                </>
              )}
            </TabsContent>

            <TabsContent value="crews" className="m-0 space-y-3">
              {crewsLoading ? (
                <div className="flex flex-col items-center justify-center h-48 text-zinc-400">
                  <Loader2 className="h-8 w-8 animate-spin mb-3" />
                  <span>Loading crews...</span>
                </div>
              ) : crews.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-zinc-400">
                  <Users className="h-8 w-8 mb-3" />
                  <span>No crews configured</span>
                  <p className="text-sm text-zinc-500 mt-1">
                    Create crews in Settings → Team to enable crew assignments
                  </p>
                </div>
              ) : jobInfo ? (
                crews.map((crew) => (
                  <CrewCard
                    key={crew.id}
                    crew={crew}
                    job={jobInfo}
                    providerId={providerId}
                    onSelect={() => handleAssignCrew(crew.id)}
                    isAssigning={assigning === crew.id}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-zinc-400">
                  <Loader2 className="h-8 w-8 animate-spin mb-3" />
                  <span>Loading job details...</span>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="flex-shrink-0 pt-4 border-t border-zinc-800 flex justify-between items-center">
          <div className="text-xs text-zinc-500">
            <Sparkles className="h-3 w-3 inline mr-1" />
            {activeTab === 'workers'
              ? 'Suggestions based on skills, availability, capacity & location'
              : 'Assign entire crews to larger jobs'}
          </div>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
