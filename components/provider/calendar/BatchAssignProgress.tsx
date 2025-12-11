'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BatchAssignProgressProps {
  isOpen: boolean;
  totalJobs: number;
  workerCount: number;
  status: 'analyzing' | 'assigning' | 'complete' | 'error';
  assignedCount?: number;
  failedCount?: number;
  currentJob?: string;
}

export default function BatchAssignProgress({
  isOpen,
  totalJobs,
  workerCount,
  status,
  assignedCount = 0,
  failedCount = 0,
  currentJob,
}: BatchAssignProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  // Smooth progress animation
  useEffect(() => {
    if (status === 'analyzing') {
      // Simulate analysis progress (0-30%)
      const interval = setInterval(() => {
        setDisplayProgress((prev) => {
          if (prev >= 30) {
            clearInterval(interval);
            return 30;
          }
          return prev + 2;
        });
      }, 100);
      return () => clearInterval(interval);
    } else if (status === 'assigning') {
      // Show actual progress (30-90%)
      const actualProgress = totalJobs > 0
        ? 30 + ((assignedCount + failedCount) / totalJobs) * 60
        : 30;
      setDisplayProgress(actualProgress);
    } else if (status === 'complete') {
      setDisplayProgress(100);
    }
  }, [status, assignedCount, failedCount, totalJobs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-[400px] bg-zinc-900 border-zinc-700 shadow-2xl">
        <CardContent className="pt-6 pb-6">
          <div className="text-center space-y-5">
            {/* Icon */}
            <div className="relative mx-auto w-16 h-16">
              {status === 'complete' ? (
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </div>
              ) : status === 'error' ? (
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-400" />
                </div>
              ) : (
                <>
                  <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                  <div className="relative w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-blue-400 animate-pulse" />
                  </div>
                </>
              )}
            </div>

            {/* Title */}
            <div>
              <h3 className="font-semibold text-lg text-zinc-100">
                {status === 'analyzing' && 'Analyzing Team Availability'}
                {status === 'assigning' && 'Assigning Jobs'}
                {status === 'complete' && 'Assignment Complete'}
                {status === 'error' && 'Assignment Failed'}
              </h3>
              <p className="text-sm text-zinc-400 mt-1">
                {status === 'analyzing' && (
                  <>Checking {workerCount} workers for {totalJobs} jobs...</>
                )}
                {status === 'assigning' && currentJob && (
                  <>Assigning: {currentJob}</>
                )}
                {status === 'assigning' && !currentJob && (
                  <>Processing {assignedCount + failedCount + 1} of {totalJobs}...</>
                )}
                {status === 'complete' && (
                  <>Successfully assigned {assignedCount} of {totalJobs} jobs</>
                )}
                {status === 'error' && (
                  <>Unable to complete auto-assignment</>
                )}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress
                value={displayProgress}
                className="h-2 bg-zinc-800"
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>
                  {status === 'analyzing' && 'Calculating optimal assignments...'}
                  {status === 'assigning' && `${assignedCount + failedCount} of ${totalJobs}`}
                  {status === 'complete' && 'Done!'}
                </span>
                <span>{Math.round(displayProgress)}%</span>
              </div>
            </div>

            {/* Stats (shown during/after assignment) */}
            {(status === 'assigning' || status === 'complete') && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                  <div className="text-2xl font-bold text-emerald-400">
                    {assignedCount}
                  </div>
                  <div className="text-xs text-emerald-300/70">Assigned</div>
                </div>
                <div className={cn(
                  'rounded-lg p-3 border',
                  failedCount > 0
                    ? 'bg-red-500/10 border-red-500/20'
                    : 'bg-zinc-800 border-zinc-700'
                )}>
                  <div className={cn(
                    'text-2xl font-bold',
                    failedCount > 0 ? 'text-red-400' : 'text-zinc-400'
                  )}>
                    {failedCount}
                  </div>
                  <div className={cn(
                    'text-xs',
                    failedCount > 0 ? 'text-red-300/70' : 'text-zinc-500'
                  )}>
                    Failed
                  </div>
                </div>
              </div>
            )}

            {/* Loading indicator for analyzing */}
            {status === 'analyzing' && (
              <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Matching skills, checking availability...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
