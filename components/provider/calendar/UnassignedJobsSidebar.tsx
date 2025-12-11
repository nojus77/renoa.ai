'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { formatInProviderTz } from '@/lib/utils/timezone';
import { useDroppable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  CheckCircle,
  Sparkles,
  GripVertical,
  Loader2,
  Wand2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import DraggableJob from './DraggableJob';
import CrewAssignmentSelector from './CrewAssignmentSelector';
import AssignmentReportModal from './AssignmentReportModal';
import { ScheduleProposalModal } from './ScheduleProposalModal';
import type { UnassignedJob, CalendarWorker } from './DailyTeamCalendar';

interface AssignmentReport {
  success: boolean;
  total: number;
  assigned: number;
  failed: number;
  assignments: Array<{
    jobId: string;
    jobName: string;
    customerName: string;
    workerId: string;
    workerName: string;
    matchScore: number;
    reasoning: string;
  }>;
  failures: Array<{
    jobId: string;
    jobName: string;
    customerName: string;
    reason: string;
  }>;
  strategy?: string;
  timeElapsed: string;
  message?: string;
}

interface UnassignedJobsSidebarProps {
  jobs: UnassignedJob[];
  workers: CalendarWorker[];
  collapsed: boolean;
  onToggle: () => void;
  onAssignJob: (jobId: string, userId: string) => void;
  onAssignCrew?: (jobId: string, crewId: string) => void;
  onJobClick?: (jobId: string) => void;
  onRefresh?: () => void;
  providerId?: string;
  selectedDate?: Date;
}

type SortOption = 'time' | 'priority' | 'duration';
type FilterOption = 'all' | 'urgent' | 'today';

export default function UnassignedJobsSidebar({
  jobs,
  workers,
  collapsed,
  onToggle,
  onAssignJob,
  onAssignCrew,
  onJobClick,
  onRefresh,
  providerId,
  selectedDate,
}: UnassignedJobsSidebarProps) {
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [smartAssignJobId, setSmartAssignJobId] = useState<string | null>(null);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [assignmentReport, setAssignmentReport] = useState<AssignmentReport | null>(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [currentProposal, setCurrentProposal] = useState<any>(null);

  // Batch auto-assign handler using smart scheduler
  const handleBatchAutoAssign = async () => {
    if (!providerId || jobs.length === 0) return;

    setAutoAssigning(true);

    try {
      // Use the smart scheduler API to generate a proposal
      const response = await fetch('/api/provider/schedule/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          date: selectedDate?.toISOString() || new Date().toISOString(),
          jobIds: jobs.map((j) => j.id),
          createdBy: localStorage.getItem('userId') || 'system',
        }),
      });

      const result = await response.json();

      if (result.success && result.proposalId) {
        // Check if any jobs were actually assigned
        if (result.stats.assignedJobs === 0) {
          console.log('No jobs could be assigned:', result);
          return;
        }

        // Get full proposal details including job/worker info
        const proposalResponse = await fetch(`/api/provider/schedule/proposals/${result.proposalId}`);
        const proposalData = await proposalResponse.json();

        // Show proposal modal for review
        setCurrentProposal({
          proposalId: result.proposalId,
          assignments: proposalData.assignments,
          unassignedJobs: result.unassignedJobs || [],
          stats: result.stats,
        });
        setShowProposalModal(true);
      } else {
        console.error('Smart scheduler failed:', result.error || result.errors);
      }
    } catch (error) {
      console.error('Error in smart auto-assign:', error);
    } finally {
      setAutoAssigning(false);
    }
  };

  // Handle crew assignment
  const handleAssignCrew = async (crewId: string) => {
    if (!smartAssignJobId || !onAssignCrew) return;
    await onAssignCrew(smartAssignJobId, crewId);
    setSmartAssignJobId(null);
    onRefresh?.();
  };

  // Make sidebar a drop zone for unassigning jobs
  const { isOver, setNodeRef, active } = useDroppable({
    id: 'unassigned-zone',
    data: {
      type: 'unassigned',
    },
  });

  const showDropIndicator = isOver && active?.data?.current?.type === 'job';

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    if (filterBy === 'urgent') return job.priority === 'urgent';
    if (filterBy === 'today') return job.priority !== 'future';
    return true;
  });

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { urgent: 0, today: 1, future: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    if (sortBy === 'time') {
      return a.startTime.getTime() - b.startTime.getTime();
    }
    if (sortBy === 'duration') {
      return b.duration - a.duration;
    }
    return 0;
  });

  const urgentCount = jobs.filter(j => j.priority === 'urgent').length;

  if (collapsed) {
    return (
      <div className="flex-shrink-0 w-12 border-l border-zinc-800 bg-zinc-900 flex flex-col items-center pt-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="writing-mode-vertical text-xs text-zinc-400 font-medium">
          {jobs.length} Unassigned
        </div>

        {urgentCount > 0 && (
          <Badge variant="destructive" className="mt-2 text-xs px-1">
            {urgentCount}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-shrink-0 w-72 border-l border-zinc-800 bg-zinc-900 flex flex-col transition-all duration-150',
        showDropIndicator && 'ring-2 ring-inset ring-yellow-500 bg-yellow-500/10'
      )}
    >
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-zinc-100">Unassigned</h3>
            <Badge variant="secondary" className="text-xs">
              {jobs.length}
            </Badge>
            {urgentCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {urgentCount} urgent
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-6 w-6"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Auto-Assign All Button */}
        {jobs.length > 0 && providerId && (
          <Button
            onClick={handleBatchAutoAssign}
            disabled={autoAssigning}
            size="sm"
            className="w-full mb-2 bg-blue-600 hover:bg-blue-700"
          >
            {autoAssigning ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                Auto-Assign All ({jobs.length})
              </>
            )}
          </Button>
        )}

        {/* Filters */}
        <div className="flex items-center gap-1 text-xs">
          {(['all', 'urgent', 'today'] as FilterOption[]).map(filter => (
            <button
              key={filter}
              onClick={() => setFilterBy(filter)}
              className={cn(
                'px-2 py-1 rounded transition-colors capitalize',
                filterBy === filter
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              )}
            >
              {filter}
            </button>
          ))}
          <span className="text-zinc-600 mx-1">|</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-transparent text-zinc-400 text-xs focus:outline-none cursor-pointer"
          >
            <option value="priority">Priority</option>
            <option value="time">Time</option>
            <option value="duration">Duration</option>
          </select>
        </div>

        {/* Drop indicator text */}
        {showDropIndicator && (
          <div className="mt-2 py-2 text-center text-yellow-400 text-xs font-medium animate-pulse">
            Drop here to unassign
          </div>
        )}
      </div>

      {/* Jobs List */}
      <div className="flex-1 overflow-auto p-2 space-y-2">
        {sortedJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-zinc-500">
            <CheckCircle className="h-8 w-8 mb-2 text-emerald-400" />
            <span className="text-sm">All jobs assigned!</span>
          </div>
        ) : (
          sortedJobs.map(job => (
            <DraggableJob key={job.id} job={job}>
              <UnassignedJobCard
                job={job}
                workers={workers}
                onAssign={(userId) => onAssignJob(job.id, userId)}
                onClick={() => onJobClick?.(job.id)}
                onSmartAssign={providerId ? () => setSmartAssignJobId(job.id) : undefined}
              />
            </DraggableJob>
          ))
        )}
      </div>

      {/* Smart Assignment Modal (with Crew support) */}
      {smartAssignJobId && providerId && (
        <CrewAssignmentSelector
          isOpen={true}
          onClose={() => setSmartAssignJobId(null)}
          jobId={smartAssignJobId}
          providerId={providerId}
          onAssignWorker={(workerId) => {
            onAssignJob(smartAssignJobId, workerId);
            setSmartAssignJobId(null);
            onRefresh?.();
          }}
          onAssignCrew={handleAssignCrew}
        />
      )}

      {/* Assignment Report Modal */}
      {assignmentReport && (
        <AssignmentReportModal
          report={assignmentReport}
          onClose={() => setAssignmentReport(null)}
        />
      )}

      {/* Schedule Proposal Modal */}
      {currentProposal && (
        <ScheduleProposalModal
          open={showProposalModal}
          onClose={() => {
            setShowProposalModal(false);
            setCurrentProposal(null);
          }}
          proposal={currentProposal}
          jobs={jobs}
          workers={workers.map(w => ({
            id: w.id,
            firstName: w.firstName,
            lastName: w.lastName,
            color: w.color,
          }))}
          onSuccess={() => {
            setShowProposalModal(false);
            setCurrentProposal(null);
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}

// Unassigned Job Card
interface UnassignedJobCardProps {
  job: UnassignedJob;
  workers: CalendarWorker[];
  onAssign: (userId: string) => void;
  onClick?: () => void;
  onSmartAssign?: () => void;
  providerId?: string;
}

function UnassignedJobCard({ job, workers, onAssign, onClick, onSmartAssign }: UnassignedJobCardProps) {
  const [showAssign, setShowAssign] = useState(false);

  // Get suggested workers
  const suggestedWorkers = workers.filter(w =>
    job.suggestedWorkers.includes(w.id)
  );

  // Available workers sorted by capacity
  const availableWorkers = [...workers]
    .filter(w => w.capacity.percentage < 100)
    .sort((a, b) => a.capacity.percentage - b.capacity.percentage);

  const priorityStyles = {
    urgent: {
      border: 'border-red-500/50',
      bg: 'bg-red-500/10',
      badge: 'bg-red-500 text-white',
      text: 'Urgent',
    },
    today: {
      border: 'border-yellow-500/30',
      bg: 'bg-yellow-500/5',
      badge: 'bg-yellow-500/20 text-yellow-400',
      text: 'Today',
    },
    future: {
      border: 'border-zinc-700',
      bg: 'bg-zinc-800/50',
      badge: 'bg-zinc-700 text-zinc-400',
      text: 'Later',
    },
  };

  const style = priorityStyles[job.priority];

  return (
    <div
      className={cn(
        'rounded-lg border p-2.5 transition-all hover:border-zinc-600 group',
        'cursor-grab active:cursor-grabbing',
        style.border,
        style.bg
      )}
      onClick={onClick}
    >
      {/* Drag handle */}
      <div className="absolute top-2 right-2 opacity-30 group-hover:opacity-60">
        <GripVertical className="h-4 w-4 text-zinc-400" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <Badge className={cn('text-xs px-1.5 py-0', style.badge)}>
            {style.text}
          </Badge>
          <span className="text-xs text-zinc-400">
            {formatInProviderTz(job.startTime, 'h:mm a', 'America/Chicago')}
          </span>
        </div>
        <span className="text-xs text-zinc-500">{job.duration}h</span>
      </div>

      {/* Service Type */}
      <div className="font-medium text-sm text-zinc-100 truncate pr-6">
        {job.serviceType}
      </div>

      {/* Customer */}
      <div className="text-xs text-zinc-400 truncate mt-0.5">
        {job.customerName}
      </div>

      {/* Address */}
      <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1 truncate">
        <MapPin className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">{job.customerAddress}</span>
      </div>

      {/* AI Suggestion */}
      {suggestedWorkers.length > 0 && (
        <div className="mt-2 p-1.5 bg-emerald-500/10 rounded border border-emerald-500/20">
          <div className="flex items-center gap-1 text-xs text-emerald-400 mb-1">
            <Sparkles className="h-3 w-3" />
            <span>Suggested</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {suggestedWorkers.slice(0, 2).map(worker => (
              <button
                key={worker.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onAssign(worker.id);
                }}
                className="flex items-center gap-1 px-1.5 py-0.5 bg-zinc-800 rounded text-xs text-zinc-200 hover:bg-zinc-700 transition-colors"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: worker.color }}
                />
                <span>{worker.firstName}</span>
                <span className="text-zinc-500">({worker.capacity.percentage}%)</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Assign Buttons */}
      <div className="mt-2 space-y-1.5">
        {/* Smart Assign Button */}
        {onSmartAssign && (
          <Button
            variant="default"
            size="sm"
            className="w-full h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
            onClick={(e) => {
              e.stopPropagation();
              onSmartAssign();
            }}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Smart Assign
          </Button>
        )}

        {/* Manual Assign Dropdown */}
        <DropdownMenu open={showAssign} onOpenChange={setShowAssign}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs border-zinc-700 hover:bg-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              <User className="h-3 w-3 mr-1" />
              Quick Assign
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 bg-zinc-900 border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            {availableWorkers.length === 0 ? (
              <div className="p-2 text-xs text-zinc-500 text-center">
                No available workers
              </div>
            ) : (
              availableWorkers.map(worker => (
                <DropdownMenuItem
                  key={worker.id}
                  onClick={() => {
                    onAssign(worker.id);
                    setShowAssign(false);
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {worker.photo ? (
                    <img
                      src={worker.photo}
                      alt={worker.name}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center text-xs text-white"
                      style={{ backgroundColor: worker.color }}
                    >
                      {worker.firstName[0]}{worker.lastName[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-zinc-100 truncate">
                      {worker.name}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {worker.capacity.percentage}% • {worker.jobs.length} jobs
                    </div>
                  </div>
                  <div
                    className={cn(
                      'text-xs',
                      worker.capacity.percentage <= 60 ? 'text-emerald-400' :
                        worker.capacity.percentage <= 90 ? 'text-yellow-400' : 'text-red-400'
                    )}
                  >
                    {worker.capacity.percentage <= 60 ? '🟢' :
                      worker.capacity.percentage <= 90 ? '🟡' : '🔴'}
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
