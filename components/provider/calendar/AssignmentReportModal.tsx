'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  User,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Assignment {
  jobId: string;
  jobName: string;
  customerName: string;
  workerId: string;
  workerName: string;
  matchScore: number;
  reasoning: string;
}

interface Failure {
  jobId: string;
  jobName: string;
  customerName: string;
  reason: string;
}

interface AssignmentReport {
  success: boolean;
  total: number;
  assigned: number;
  failed: number;
  assignments: Assignment[];
  failures: Failure[];
  strategy?: string;
  timeElapsed: string;
  message?: string;
}

interface AssignmentReportModalProps {
  report: AssignmentReport;
  onClose: () => void;
}

export default function AssignmentReportModal({
  report,
  onClose,
}: AssignmentReportModalProps) {
  const successRate = report.total > 0
    ? Math.round((report.assigned / report.total) * 100)
    : 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            Auto-Assignment Results
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4 -mx-6 px-6 py-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-emerald-500/10 border-emerald-500/30">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-emerald-400">
                  {report.assigned}
                </div>
                <div className="text-sm text-emerald-300/70">Assigned</div>
              </CardContent>
            </Card>

            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-red-400">
                  {report.failed}
                </div>
                <div className="text-sm text-red-300/70">Failed</div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-zinc-300">
                  {report.total}
                </div>
                <div className="text-sm text-zinc-400">Total</div>
              </CardContent>
            </Card>
          </div>

          {/* Success Rate Bar */}
          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-zinc-400">Success Rate</span>
              <span className="text-sm font-medium text-zinc-200">
                {successRate}%
              </span>
            </div>
            <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  successRate >= 80 ? 'bg-emerald-500' :
                    successRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                )}
                style={{ width: `${successRate}%` }}
              />
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
              <Clock className="h-3 w-3" />
              <span>Completed in {report.timeElapsed}</span>
              {report.strategy && (
                <>
                  <span>•</span>
                  <span className="capitalize">{report.strategy} strategy</span>
                </>
              )}
            </div>
          </div>

          {/* Successful Assignments */}
          {report.assignments.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-zinc-200">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                Successfully Assigned ({report.assignments.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {report.assignments.map((a) => (
                  <div
                    key={a.jobId}
                    className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20"
                  >
                    <div>
                      <div className="font-medium text-zinc-100">{a.jobName}</div>
                      <div className="text-sm text-zinc-400">
                        {a.customerName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm font-medium text-zinc-200">
                        <User className="h-3 w-3" />
                        {a.workerName}
                      </div>
                      <Badge
                        className={cn(
                          'text-xs mt-1',
                          a.matchScore >= 80
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : a.matchScore >= 60
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-yellow-500/20 text-yellow-300'
                        )}
                      >
                        {Math.round(a.matchScore)}% match
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed Assignments */}
          {report.failures.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-zinc-200">
                <XCircle className="h-4 w-4 text-red-400" />
                Could Not Assign ({report.failures.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {report.failures.map((f) => (
                  <div
                    key={f.jobId}
                    className="p-3 bg-red-500/10 rounded-lg border border-red-500/20"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-zinc-100">{f.jobName}</div>
                        <div className="text-sm text-zinc-400">
                          {f.customerName}
                        </div>
                      </div>
                      <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                    </div>
                    <div className="text-sm text-red-300/80 mt-2 flex items-start gap-1">
                      <span className="text-red-400">Reason:</span>
                      {f.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {report.total === 0 && (
            <div className="text-center py-8 text-zinc-400">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-400" />
              <div className="font-medium">No unassigned jobs found</div>
              <div className="text-sm text-zinc-500">
                All jobs are already assigned
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 pt-4 border-t border-zinc-800 flex justify-end">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
