'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { AlertCircle, Calendar, Clock } from 'lucide-react';

interface DueJob {
  id: string;
  serviceType: string;
  nextDueDate: string;
  provider: {
    id: string;
    businessName: string;
    phone: string;
  };
}

interface DueJobsData {
  dueJobs: DueJob[];
  overdueCount: number;
  upcomingCount: number;
  totalDue: number;
}

export default function ServiceDueAlert() {
  const [dueData, setDueData] = useState<DueJobsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/customer/jobs/due')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error && data.totalDue > 0) {
          setDueData(data);
        }
      })
      .catch((err) => console.error('Error loading due jobs:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !dueData || dueData.totalDue === 0) {
    return null;
  }

  const today = new Date();
  const getUrgency = (dueDateStr: string) => {
    const dueDate = new Date(dueDateStr);
    const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return { level: 'overdue', text: 'Overdue', color: 'bg-red-100 text-red-800 border-red-200' };
    if (daysUntil === 0) return { level: 'today', text: 'Due Today', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    if (daysUntil <= 3) return { level: 'urgent', text: `${daysUntil} days`, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    return { level: 'upcoming', text: `${daysUntil} days`, color: 'bg-blue-100 text-blue-800 border-blue-200' };
  };

  const mostUrgentJob = dueData.dueJobs[0];
  const urgency = getUrgency(mostUrgentJob.nextDueDate);

  return (
    <Alert className={`${urgency.color} mb-6 border-2`}>
      <AlertCircle className="h-5 w-5" />
      <AlertTitle className="text-lg font-semibold flex items-center gap-2">
        Service Maintenance Due
        {dueData.overdueCount > 0 && (
          <Badge variant="destructive">{dueData.overdueCount} Overdue</Badge>
        )}
      </AlertTitle>
      <AlertDescription>
        <div className="mt-3 space-y-3">
          {/* Most Urgent Service */}
          <div className="flex items-center justify-between gap-4 p-3 bg-white rounded-lg border">
            <div className="flex items-start gap-3 flex-1">
              <Calendar className="h-5 w-5 mt-0.5 text-zinc-600" />
              <div className="flex-1">
                <p className="font-semibold text-zinc-900">{mostUrgentJob.serviceType}</p>
                <p className="text-sm text-zinc-600">{mostUrgentJob.provider.businessName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-zinc-500" />
                  <span className="text-xs text-zinc-500">
                    {new Date(mostUrgentJob.nextDueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <Badge className={urgency.color}>{urgency.text}</Badge>
          </div>

          {/* Additional Services Count */}
          {dueData.totalDue > 1 && (
            <p className="text-sm text-zinc-700">
              + {dueData.totalDue - 1} more service{dueData.totalDue > 2 ? 's' : ''} due soon
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button asChild size="sm" className="flex-1">
              <Link href={`tel:${mostUrgentJob.provider.phone}`}>
                Call Provider
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href="/customer-portal/jobs">
                View All Services
              </Link>
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
