"use client";

import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  AlertCircle,
  CalendarX,
  ClockAlert,
  UserX,
  FileWarning,
  CheckCircle2
} from 'lucide-react';

interface WorkerAlert {
  id: string;
  name: string;
  jobCount: number;
}

interface Alerts {
  scheduleConflicts: number;
  overloadedWorkers: WorkerAlert[];
  underutilizedWorkers: WorkerAlert[];
  unassignedJobs: number;
  unconfirmedSoonJobs: number;
  overdueInvoices: number;
  overdueJobs: number;
}

export type AlertType = 'schedule-conflicts' | 'overdue-jobs' | 'unconfirmed-soon' | 'unassigned-jobs' | 'overdue-invoices';

interface NeedsAttentionTableProps {
  alerts: Alerts;
  onAlertClick?: (alertType: AlertType, alertDetails: { count: number; href: string }) => void;
}

type Priority = 'urgent' | 'medium' | 'low';

interface AlertRow {
  id: AlertType;
  type: string;
  icon: React.ReactNode;
  details: string;
  priority: Priority;
  href: string;
  count: number;
}

const priorityColors: Record<Priority, { bg: string; text: string; badge: string }> = {
  urgent: { bg: 'bg-red-500/10', text: 'text-red-600', badge: 'bg-red-100 text-red-700' },
  medium: { bg: 'bg-orange-500/10', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
  low: { bg: 'bg-amber-500/10', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
};

export default function NeedsAttentionTable({ alerts, onAlertClick }: NeedsAttentionTableProps) {
  const router = useRouter();

  // Build alert rows from alerts data
  const alertRows: AlertRow[] = [];

  if (alerts.scheduleConflicts > 0) {
    alertRows.push({
      id: 'schedule-conflicts',
      type: 'Schedule Conflicts',
      icon: <AlertCircle className="h-4 w-4" />,
      details: `${alerts.scheduleConflicts} overlapping ${alerts.scheduleConflicts === 1 ? 'job' : 'jobs'}`,
      priority: 'urgent',
      href: '/provider/calendar',
      count: alerts.scheduleConflicts,
    });
  }

  if (alerts.overdueJobs > 0) {
    alertRows.push({
      id: 'overdue-jobs',
      type: 'Overdue Jobs',
      icon: <CalendarX className="h-4 w-4" />,
      details: `${alerts.overdueJobs} past scheduled time`,
      priority: 'urgent',
      href: '/provider/jobs?status=overdue',
      count: alerts.overdueJobs,
    });
  }

  if (alerts.unconfirmedSoonJobs > 0) {
    alertRows.push({
      id: 'unconfirmed-soon',
      type: 'Starting Soon',
      icon: <ClockAlert className="h-4 w-4" />,
      details: `${alerts.unconfirmedSoonJobs} within 2 hours`,
      priority: 'medium',
      href: '/provider/jobs?status=pending',
      count: alerts.unconfirmedSoonJobs,
    });
  }

  if (alerts.unassignedJobs > 0) {
    alertRows.push({
      id: 'unassigned-jobs',
      type: 'Unassigned Jobs',
      icon: <UserX className="h-4 w-4" />,
      details: `${alerts.unassignedJobs} ${alerts.unassignedJobs === 1 ? 'job needs' : 'jobs need'} worker`,
      priority: 'medium',
      href: '/provider/calendar',
      count: alerts.unassignedJobs,
    });
  }

  if (alerts.overdueInvoices > 0) {
    alertRows.push({
      id: 'overdue-invoices',
      type: 'Overdue Invoices',
      icon: <FileWarning className="h-4 w-4" />,
      details: `${alerts.overdueInvoices} unpaid 30+ days`,
      priority: 'low',
      href: '/provider/invoices?status=overdue',
      count: alerts.overdueInvoices,
    });
  }

  const handleAlertClick = (alert: AlertRow) => {
    if (onAlertClick) {
      onAlertClick(alert.id, { count: alert.count, href: alert.href });
    } else {
      router.push(alert.href);
    }
  };

  // Empty state
  if (alertRows.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">Needs Attention</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <CheckCircle2 className="h-10 w-10 mb-3 text-emerald-500 opacity-60" />
          <p className="text-sm font-medium text-foreground">All clear!</p>
          <p className="text-xs text-muted-foreground mt-1">No items need attention</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-base font-semibold text-foreground">Needs Attention</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Alert Type</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Details</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Priority</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {alertRows.map((alert, index) => {
              const colors = priorityColors[alert.priority];
              return (
                <tr
                  key={alert.id}
                  onClick={() => handleAlertClick(alert)}
                  className={`cursor-pointer hover:bg-muted/40 transition-colors ${
                    index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                  }`}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${colors.bg}`}>
                        <span className={colors.text}>{alert.icon}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{alert.type}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">
                    {alert.details}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
                      {alert.priority === 'urgent' ? 'Urgent' : alert.priority === 'medium' ? 'Medium' : 'Low'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <ChevronRight className={`h-4 w-4 inline-block ${colors.text}`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
