"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, User, UserX, ChevronRight } from 'lucide-react';

interface UpcomingJob {
  id: string;
  startTime: string;
  endTime?: string;
  serviceType: string;
  customerName?: string;
  address?: string;
  status?: string;
  estimatedValue?: number | null;
  actualValue?: number | null;
  workerName?: string | null;
  phone?: string;
  notes?: string;
}

interface GroupedJobs {
  date: string;
  label: string;
  jobs: UpcomingJob[];
}

interface ComingUpWidgetProps {
  groupedUpcomingJobs: GroupedJobs[];
  totalJobCount: number;
  onJobClick: (job: UpcomingJob) => void;
  formatTime: (date: string) => string;
  formatCurrency: (amount: number) => string;
}

export default function ComingUpWidget({
  groupedUpcomingJobs,
  totalJobCount,
  onJobClick,
  formatTime,
  formatCurrency,
}: ComingUpWidgetProps) {
  const [showAll, setShowAll] = useState(false);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-foreground">Coming Up</h3>
        {groupedUpcomingJobs.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
          >
            {showAll ? 'Show less' : `View all (${totalJobCount})`}
            <ChevronRight className={`h-3.5 w-3.5 transition-transform ${showAll ? 'rotate-90' : ''}`} />
          </button>
        )}
      </div>

      {groupedUpcomingJobs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
          <Calendar className="h-10 w-10 mb-2 opacity-30" />
          <p className="text-sm">No upcoming jobs</p>
        </div>
      ) : (
        <div className={`flex-1 space-y-4 overflow-y-auto ${showAll ? 'max-h-none' : 'max-h-[350px]'}`}>
          {(showAll ? groupedUpcomingJobs : groupedUpcomingJobs.slice(0, 3)).map((group) => (
            <div key={group.date}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{group.label}</p>
              <div className="space-y-2">
                {group.jobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => onJobClick(job)}
                    className="w-full bg-muted/30 hover:bg-muted/50 border border-border hover:border-primary/30 rounded-xl p-3 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {job.customerName || 'Unknown Customer'}
                          </p>
                          <span className="text-xs text-primary">• {job.serviceType}</span>
                          {job.status && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                              job.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                              job.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              job.status === 'in_progress' ? 'bg-orange-500/20 text-orange-400' :
                              job.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {job.status.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(job.startTime), 'MMM d')} {formatTime(job.startTime)}
                          </span>
                          {job.workerName ? (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {job.workerName.split(' ')[0]}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-orange-500">
                              <UserX className="h-3 w-3" />
                              Unassigned
                            </span>
                          )}
                          {(job.estimatedValue || job.actualValue) && (
                            <span className="font-semibold text-emerald-500 ml-auto">
                              {formatCurrency(job.actualValue || job.estimatedValue || 0)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
