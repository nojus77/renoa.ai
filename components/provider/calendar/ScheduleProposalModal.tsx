'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Car,
  AlertCircle,
  Sparkles,
  Users,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { formatInProviderTz } from '@/lib/utils/timezone';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Assignment {
  jobId: string;
  workerIds: string[];
  suggestedStart: string | Date;
  suggestedEnd: string | Date;
  orderInRoute: number;
  driveTimeFromPrev: number;
  totalScore: number;
  scoreBreakdown: {
    sla?: number;
    route?: number;
    continuity?: number;
    balance?: number;
  };
}

interface ProposalData {
  proposalId: string;
  assignments: Assignment[];
  unassignedJobs: any[];
  stats: {
    totalJobs: number;
    assignedJobs: number;
    unassignedJobs: number;
    totalDriveTime: number;
    averageScore: number;
  };
}

interface ScheduleProposalModalProps {
  open: boolean;
  onClose: () => void;
  proposal: ProposalData;
  jobs: any[];
  workers: any[];
  onSuccess: () => void;
}

export function ScheduleProposalModal({
  open,
  onClose,
  proposal,
  jobs,
  workers,
  onSuccess,
}: ScheduleProposalModalProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [modifiedAssignments, setModifiedAssignments] = useState<Map<string, string[]>>(new Map());
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [availableWorkersForJob, setAvailableWorkersForJob] = useState<any[]>([]);
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false);

  // Group assignments by worker
  const assignmentsByWorker = useMemo(() => {
    const map = new Map<string, Assignment[]>();

    for (const assignment of proposal.assignments) {
      for (const workerId of assignment.workerIds) {
        if (!map.has(workerId)) {
          map.set(workerId, []);
        }
        map.get(workerId)!.push(assignment);
      }
    }

    // Sort each worker's jobs by route order
    map.forEach((assignments) => {
      assignments.sort((a, b) => a.orderInRoute - b.orderInRoute);
    });

    return map;
  }, [proposal.assignments]);

  const handleOpenSwapWorker = async (jobId: string, currentWorkerId: string) => {
    setEditingJobId(jobId);
    setIsLoadingAlternatives(true);

    try {
      const res = await fetch(
        `/api/provider/jobs/${jobId}/alternatives?currentWorkerId=${currentWorkerId}`
      );

      if (!res.ok) throw new Error('Failed to load alternatives');

      const data = await res.json();
      setAvailableWorkersForJob(data.alternatives);
    } catch (error) {
      console.error('Load alternatives error:', error);
      toast.error('Failed to load alternative workers');
      setEditingJobId(null);
    } finally {
      setIsLoadingAlternatives(false);
    }
  };

  const handleSelectWorker = (jobId: string, newWorkerId: string) => {
    setModifiedAssignments((prev) => {
      const updated = new Map(prev);
      updated.set(jobId, [newWorkerId]);
      return updated;
    });
  };

  const handleApprove = async () => {
    setIsApproving(true);

    try {
      // If there are modifications, apply them first
      if (modifiedAssignments.size > 0) {
        const modifications = Array.from(modifiedAssignments.entries()).map(
          ([jobId, workerIds]) => ({
            jobId,
            workerIds,
          })
        );

        await fetch(
          `/api/provider/schedule/proposals/${proposal.proposalId}/modify`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modifications }),
          }
        );
      }

      // Then approve
      const res = await fetch(
        `/api/provider/schedule/proposals/${proposal.proposalId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'approve',
            userId: localStorage.getItem('userId') || 'system',
          }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to approve');
      }

      const modifiedCount = modifiedAssignments.size;
      toast.success(
        modifiedCount > 0
          ? `✅ Schedule approved with ${modifiedCount} modification(s)!`
          : `✅ Schedule approved! ${proposal.stats.assignedJobs} jobs assigned.`
      );

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Approve error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to approve schedule'
      );
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);

    try {
      const res = await fetch(
        `/api/provider/schedule/proposals/${proposal.proposalId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reject',
            userId: localStorage.getItem('userId') || 'system',
          }),
        }
      );

      if (!res.ok) throw new Error('Failed to reject');

      toast.info('Schedule rejected');
      onClose();
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('Failed to reject schedule');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-800">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-6 h-6 text-purple-400" />
            AI Schedule Proposal
          </DialogTitle>
        </DialogHeader>

        {/* STATS OVERVIEW */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-4 gap-3 p-4 bg-zinc-800/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {proposal.stats.assignedJobs}/{proposal.stats.totalJobs}
              </div>
              <div className="text-xs text-zinc-400 mt-1">Jobs Assigned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {Math.floor(proposal.stats.totalDriveTime / 60)}h{' '}
                {proposal.stats.totalDriveTime % 60}m
              </div>
              <div className="text-xs text-zinc-400 mt-1">Total Drive Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {proposal.stats.averageScore.toFixed(0)}%
              </div>
              <div className="text-xs text-zinc-400 mt-1">Avg Match Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {assignmentsByWorker.size}
              </div>
              <div className="text-xs text-zinc-400 mt-1">Workers</div>
            </div>
          </div>
        </div>

        {/* WORKER ROUTES */}
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 pb-4">
            {Array.from(assignmentsByWorker.entries()).map(
              ([workerId, assignments]) => {
                const worker = workers.find((w) => w.id === workerId);
                if (!worker) return null;

                const totalHours = assignments.reduce((sum, a) => {
                  const start = new Date(a.suggestedStart);
                  const end = new Date(a.suggestedEnd);
                  return (
                    sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
                  );
                }, 0);

                const totalDrive = assignments.reduce(
                  (sum, a) => sum + a.driveTimeFromPrev,
                  0
                );

                return (
                  <div
                    key={workerId}
                    className="border border-zinc-700 rounded-lg overflow-hidden"
                  >
                    {/* Worker Header */}
                    <div className="bg-zinc-800 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback
                            style={{
                              backgroundColor: worker.color || '#6b7280',
                            }}
                            className="text-sm font-medium"
                          >
                            {worker.firstName?.[0]}
                            {worker.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-base">
                            {worker.firstName} {worker.lastName}
                          </div>
                          <div className="text-xs text-zinc-400 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {assignments.length} jobs
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {totalHours.toFixed(1)}h
                            </span>
                            <span className="flex items-center gap-1">
                              <Car className="w-3 h-3" />
                              {totalDrive}min
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Jobs List */}
                    <div className="divide-y divide-zinc-800">
                      {assignments.map((assignment, index) => {
                        const job = jobs.find((j) => j.id === assignment.jobId);
                        if (!job) return null;

                        const customerName =
                          job.customer?.name ||
                          `${job.customer?.firstName || ''} ${
                            job.customer?.lastName || ''
                          }`.trim() ||
                          'Unknown Customer';

                        return (
                          <div
                            key={assignment.jobId}
                            className={cn(
                              "p-3 hover:bg-zinc-800/30 transition-colors",
                              modifiedAssignments.has(assignment.jobId) && "bg-blue-500/10 border-l-4 border-l-blue-500"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                {/* Order Badge */}
                                <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                  {index + 1}
                                </div>

                                {/* Job Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm mb-0.5">
                                    {job.serviceType}
                                  </div>
                                  <div className="text-xs text-zinc-400 truncate mb-2">
                                    {customerName}
                                  </div>

                                  {/* Time, Drive, Location */}
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 shrink-0" />
                                      {format(
                                        new Date(assignment.suggestedStart),
                                        'h:mm a'
                                      )}
                                    </span>

                                    {assignment.driveTimeFromPrev > 0 && (
                                      <span className="flex items-center gap-1 text-blue-400">
                                        <Car className="w-3 h-3 shrink-0" />
                                        {assignment.driveTimeFromPrev}min drive
                                      </span>
                                    )}

                                    {job.address && (
                                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                                        <MapPin className="w-3 h-3 shrink-0" />
                                        <span className="truncate">
                                          {job.address.split(',')[0]}
                                        </span>
                                      </span>
                                    )}
                                  </div>

                                  {/* Score Breakdown */}
                                  <div className="flex gap-3 mt-2 text-xs">
                                    <span className="text-zinc-500">
                                      SLA:{' '}
                                      <span className="text-zinc-300">
                                        {assignment.scoreBreakdown.sla?.toFixed(
                                          0
                                        ) || 0}
                                      </span>
                                    </span>
                                    <span className="text-zinc-500">
                                      Route:{' '}
                                      <span className="text-zinc-300">
                                        {assignment.scoreBreakdown.route?.toFixed(
                                          0
                                        ) || 0}
                                      </span>
                                    </span>
                                    <span className="text-zinc-500">
                                      Balance:{' '}
                                      <span className="text-zinc-300">
                                        {assignment.scoreBreakdown.balance?.toFixed(
                                          0
                                        ) || 0}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Score Badge & Swap Button */}
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="text-right">
                                  <div
                                    className={cn(
                                      'text-base font-bold',
                                      assignment.totalScore >= 80
                                        ? 'text-green-400'
                                        : assignment.totalScore >= 60
                                          ? 'text-yellow-400'
                                          : 'text-orange-400'
                                    )}
                                  >
                                    {modifiedAssignments.has(assignment.jobId) ? '✏️ ' : ''}
                                    {assignment.totalScore.toFixed(0)}%
                                  </div>
                                  <div className="text-[10px] text-zinc-500 uppercase">
                                    match
                                  </div>
                                </div>

                                {/* Swap Worker Button */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleOpenSwapWorker(assignment.jobId, assignment.workerIds[0])}
                                  className="h-7 px-2 hover:bg-zinc-700"
                                  disabled={isApproving}
                                >
                                  <Users className="w-3 h-3 mr-1" />
                                  <span className="text-xs">Swap</span>
                                </Button>
                              </div>
                            </div>

                            {/* Modified Indicator */}
                            {modifiedAssignments.has(assignment.jobId) && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-blue-400">
                                <AlertCircle className="w-3 h-3" />
                                <span>Modified - new worker selected</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
            )}

            {/* UNASSIGNED JOBS WARNING */}
            {proposal.unassignedJobs.length > 0 && (
              <div className="border border-red-500/30 bg-red-500/5 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-red-400 mb-1">
                      {proposal.unassignedJobs.length}{' '}
                      {proposal.unassignedJobs.length === 1 ? 'Job' : 'Jobs'}{' '}
                      Could Not Be Assigned
                    </div>
                    <div className="text-xs text-zinc-400">
                      No qualified workers available for these jobs
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {proposal.unassignedJobs.map((job) => {
                    const customerName =
                      job.customer?.name ||
                      `${job.customer?.firstName || ''} ${
                        job.customer?.lastName || ''
                      }`.trim();

                    return (
                      <div
                        key={job.id}
                        className="text-sm text-zinc-300 flex items-start gap-2"
                      >
                        <span className="text-red-400">•</span>
                        <div>
                          <span className="font-medium">{job.serviceType}</span>
                          {customerName && (
                            <span className="text-zinc-500">
                              {' '}
                              - {customerName}
                            </span>
                          )}
                          <span className="text-zinc-500">
                            {' '}
                            at{' '}
                            {formatInProviderTz(job.startTime, 'h:mm a', 'America/Chicago')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* FOOTER ACTIONS */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-400">
              Review the proposed assignments and approve to apply them
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={isRejecting || isApproving}
                className="min-w-[100px]"
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </>
                )}
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isApproving || isRejecting}
                className="bg-green-600 hover:bg-green-700 min-w-[120px]"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve All
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* SWAP WORKER DIALOG */}
      {editingJobId && (
        <Dialog open={!!editingJobId} onOpenChange={() => setEditingJobId(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Change Worker Assignment</DialogTitle>
            </DialogHeader>

            {isLoadingAlternatives ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : (
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-2 pr-4">
                  {availableWorkersForJob.map((alt) => {
                    const isSelected =
                      modifiedAssignments.get(editingJobId)?.[0] ===
                      alt.workerId;

                    return (
                      <button
                        key={alt.workerId}
                        onClick={() =>
                          handleSelectWorker(editingJobId, alt.workerId)
                        }
                        disabled={!alt.passed}
                        className={cn(
                          'w-full text-left p-3 rounded-lg border transition-all',
                          isSelected
                            ? 'border-green-500 bg-green-500/10'
                            : alt.passed
                              ? 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'
                              : 'border-zinc-800 bg-zinc-900/50 opacity-50 cursor-not-allowed'
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1">
                            <Avatar className="w-9 h-9">
                              <AvatarFallback
                                style={{ backgroundColor: alt.workerColor }}
                              >
                                {alt.workerName
                                  .split(' ')
                                  .map((n: string) => n[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {alt.workerName}
                                </span>
                                {alt.isCurrent && (
                                  <Badge variant="outline" className="text-xs">
                                    Current
                                  </Badge>
                                )}
                                {isSelected && (
                                  <Badge className="bg-green-500 text-xs">
                                    Selected
                                  </Badge>
                                )}
                              </div>

                              {/* Availability status */}
                              {alt.passed ? (
                                <div className="text-xs text-green-400 mt-0.5">
                                  ✓ Available
                                </div>
                              ) : (
                                <div className="text-xs text-red-400 mt-0.5">
                                  {alt.availabilityIssues?.[0] ||
                                    alt.hardFilterReasons?.[0] ||
                                    'Not available'}
                                </div>
                              )}

                              {/* Score breakdown */}
                              {alt.passed && (
                                <div className="flex gap-3 mt-1 text-xs text-zinc-500">
                                  <span>
                                    SLA: {alt.breakdown.sla?.toFixed(0) || 0}
                                  </span>
                                  <span>
                                    Route:{' '}
                                    {alt.breakdown.route?.toFixed(0) || 0}
                                  </span>
                                  <span>
                                    Balance:{' '}
                                    {alt.breakdown.balance?.toFixed(0) || 0}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Score */}
                          <div className="text-right">
                            <div
                              className={cn(
                                'text-xl font-bold',
                                alt.score >= 80
                                  ? 'text-green-400'
                                  : alt.score >= 60
                                    ? 'text-yellow-400'
                                    : 'text-orange-400'
                              )}
                            >
                              {alt.score.toFixed(0)}%
                            </div>
                            <div className="text-[10px] text-zinc-500 uppercase">
                              match
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditingJobId(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setEditingJobId(null);
                  toast.info('Worker changed. Review and approve to apply.');
                }}
                className="bg-green-600"
              >
                Confirm Change
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
