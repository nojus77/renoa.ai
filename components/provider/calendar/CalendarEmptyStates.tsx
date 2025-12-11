'use client';

import { Button } from '@/components/ui/button';
import {
  Users,
  Calendar,
  CheckCircle,
  Plus,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface EmptyStateProps {
  onAction?: () => void;
}

export function NoWorkersState({ onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-center px-4">
      <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mb-6">
        <Users className="w-10 h-10 text-zinc-500" />
      </div>
      <h3 className="text-xl font-semibold text-zinc-100 mb-2">
        No Team Members Yet
      </h3>
      <p className="text-zinc-400 mb-6 max-w-sm">
        Add your first team member to start scheduling jobs and managing your crew.
      </p>
      {onAction && (
        <Button onClick={onAction} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Team Member
        </Button>
      )}
    </div>
  );
}

export function NoJobsTodayState({ date }: { date?: Date }) {
  const isToday = date
    ? new Date().toDateString() === date.toDateString()
    : true;

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-4">
      <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
        <Calendar className="w-8 h-8 text-zinc-500" />
      </div>
      <h4 className="font-medium text-zinc-200 mb-1">
        No Jobs Scheduled
      </h4>
      <p className="text-sm text-zinc-500">
        {isToday
          ? "Today's schedule is clear. Jobs will appear here when scheduled."
          : 'This day is clear. Add jobs from the calendar.'}
      </p>
    </div>
  );
}

export function AllJobsAssignedState() {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center px-4 py-6">
      <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
        <CheckCircle className="w-8 h-8 text-emerald-400" />
      </div>
      <h4 className="font-medium text-zinc-100 mb-1">
        All Caught Up!
      </h4>
      <p className="text-sm text-zinc-500">
        Every job has been assigned to a worker
      </p>
    </div>
  );
}

interface NetworkErrorStateProps {
  onRetry: () => void;
  message?: string;
}

export function NetworkErrorState({ onRetry, message }: NetworkErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-4">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h4 className="font-medium text-zinc-100 mb-1">
        Unable to Load Calendar
      </h4>
      <p className="text-sm text-zinc-400 mb-4">
        {message || 'Check your connection and try again'}
      </p>
      <Button onClick={onRetry} variant="outline" size="sm">
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry
      </Button>
    </div>
  );
}

interface NoSuggestionsStateProps {
  onManualAssign?: () => void;
}

export function NoSuggestionsState({ onManualAssign }: NoSuggestionsStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center px-4">
      <div className="w-14 h-14 rounded-full bg-yellow-500/10 flex items-center justify-center mb-3">
        <Sparkles className="w-7 h-7 text-yellow-400" />
      </div>
      <h4 className="font-medium text-zinc-100 mb-1">
        No Suitable Workers
      </h4>
      <p className="text-sm text-zinc-400 mb-3">
        All workers are busy or lack required skills
      </p>
      {onManualAssign && (
        <Button onClick={onManualAssign} variant="outline" size="sm">
          Assign Manually
        </Button>
      )}
    </div>
  );
}

interface NoCrewsStateProps {
  onCreateCrew?: () => void;
}

export function NoCrewsState({ onCreateCrew }: NoCrewsStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center px-4">
      <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
        <Users className="w-7 h-7 text-zinc-500" />
      </div>
      <h4 className="font-medium text-zinc-100 mb-1">
        No Crews Configured
      </h4>
      <p className="text-sm text-zinc-400 mb-3">
        Create crews to assign multiple workers at once
      </p>
      {onCreateCrew && (
        <Button onClick={onCreateCrew} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Create Crew
        </Button>
      )}
    </div>
  );
}

export function WorkerDayEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center opacity-50">
      <Calendar className="w-6 h-6 text-zinc-600 mb-2" />
      <span className="text-xs text-zinc-600">No jobs</span>
    </div>
  );
}
