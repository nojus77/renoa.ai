"use client";

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';

interface RecentJob {
  id: string;
  completedAt: string;
  customerName: string;
  serviceType: string;
  workerName: string | null;
  address: string;
  amount: number | null;
}

interface RecentJobsTableProps {
  jobs: RecentJob[];
}

export default function RecentJobsTable({ jobs }: RecentJobsTableProps) {
  const router = useRouter();

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'MMM d, h:mm a');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const truncateAddress = (address: string, maxLength: number = 30) => {
    if (address.length <= maxLength) return address;
    return address.substring(0, maxLength) + '...';
  };

  if (jobs.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        <h3 className="text-base font-semibold text-foreground mb-4">Recent Jobs</h3>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <p className="text-sm">No completed jobs yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-base font-semibold text-foreground">Recent Jobs</h3>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        <table className="w-full">
          <thead className="bg-muted/30 sticky top-0">
            <tr>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Completed</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Customer</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Service</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Worker</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Address</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Amount</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job, index) => (
              <tr
                key={job.id}
                onClick={() => router.push(`/provider/jobs/${job.id}`)}
                className={`cursor-pointer hover:bg-muted/40 transition-colors ${
                  index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                }`}
              >
                <td className="px-5 py-3 text-sm text-foreground whitespace-nowrap">
                  {formatDateTime(job.completedAt)}
                </td>
                <td className="px-5 py-3 text-sm text-foreground">
                  {job.customerName}
                </td>
                <td className="px-5 py-3 text-sm text-foreground">
                  {job.serviceType}
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground">
                  {job.workerName || '—'}
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground">
                  <span title={job.address}>{truncateAddress(job.address)}</span>
                </td>
                <td className="px-5 py-3 text-sm font-medium text-emerald-600 text-right whitespace-nowrap">
                  {job.amount ? formatCurrency(job.amount) : '—'}
                </td>
                <td className="px-3 py-3">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
