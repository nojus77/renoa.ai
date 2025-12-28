"use client";

import { useState } from 'react';
import { Calendar, Clock, User, UserX, ChevronRight } from 'lucide-react';

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
}

interface TodayJob {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  address: string;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: number | null;
  workers: Worker[];
}

interface TodaysJobsWidgetProps {
  todaysJobs: TodayJob[];
  onJobClick: (job: TodayJob) => void;
  formatTime: (date: string) => string;
  formatCurrency: (amount: number) => string;
}

export default function TodaysJobsWidget({
  todaysJobs,
  onJobClick,
  formatTime,
  formatCurrency,
}: TodaysJobsWidgetProps) {
  const [showAll, setShowAll] = useState(false);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-foreground">Jobs Scheduled Today</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            {todaysJobs.length}
          </span>
        </div>
        {todaysJobs.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
          >
            {showAll ? 'Show less' : `View all (${todaysJobs.length})`}
            <ChevronRight className={`h-3.5 w-3.5 transition-transform ${showAll ? 'rotate-90' : ''}`} />
          </button>
        )}
      </div>

      {todaysJobs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
          <Calendar className="h-10 w-10 mb-2 opacity-30" />
          <p className="text-sm">No jobs scheduled today</p>
        </div>
      ) : (
        <div className={`flex-1 space-y-2 overflow-y-auto ${showAll ? 'max-h-none' : 'max-h-[350px]'}`}>
          {(showAll ? todaysJobs : todaysJobs.slice(0, 5)).map((job) => (
            <button
              key={job.id}
              onClick={() => onJobClick(job)}
              className="w-full bg-muted/30 hover:bg-muted/50 border border-border hover:border-primary/30 rounded-xl p-3 text-left transition-all group"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{job.customerName}</p>
                    <span className="text-xs text-primary">• {job.serviceType}</span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                      job.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                      job.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      job.status === 'in_progress' ? 'bg-orange-500/20 text-orange-400' :
                      job.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {job.status === 'in_progress' && (
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1 animate-pulse" />
                      )}
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(job.startTime)}{job.endTime && ` - ${formatTime(job.endTime)}`}
                    </span>
                    {job.workers && job.workers.length > 0 ? (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {job.workers[0].firstName}
                        {job.workers.length > 1 && ` +${job.workers.length - 1}`}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-orange-500">
                        <UserX className="h-3 w-3" />
                        Unassigned
                      </span>
                    )}
                    {job.totalAmount && (
                      <span className="font-semibold text-emerald-500 ml-auto">
                        {formatCurrency(job.totalAmount)}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
