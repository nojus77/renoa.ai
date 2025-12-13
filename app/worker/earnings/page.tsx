'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import WorkerLayout from '@/components/worker/WorkerLayout';
import { DollarSign, Clock, Briefcase, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface WorkLog {
  id: string;
  clockIn: string;
  clockOut: string | null;
  hoursWorked: number | null;
  earnings: number | null;
  isPaid: boolean;
  job: {
    id: string;
    serviceType: string;
    customer: {
      name: string;
    };
  };
}

interface Summary {
  totalEarnings: number;
  totalHours: number;
  jobsCompleted: number;
  pendingPay: number;
  paidPay: number;
}

interface PayInfo {
  payType: string | null;
  hourlyRate: number | null;
  commissionRate: number | null;
}

export default function WorkerEarnings() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [byDate, setByDate] = useState<Record<string, WorkLog[]>>({});
  const [summary, setSummary] = useState<Summary>({
    totalEarnings: 0,
    totalHours: 0,
    jobsCompleted: 0,
    pendingPay: 0,
    paidPay: 0,
  });
  const [payInfo, setPayInfo] = useState<PayInfo | null>(null);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);

  const fetchEarnings = useCallback(async (uid: string, p: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/worker/earnings?userId=${uid}&period=${p}`);
      const data = await res.json();

      if (data.workLogs) {
        setWorkLogs(data.workLogs);
        setByDate(data.byDate || {});
        setSummary(data.summary);
        setPayInfo(data.payInfo);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const uid = localStorage.getItem('workerUserId');
    if (!uid) {
      router.push('/provider/login');
      return;
    }
    setUserId(uid);
    fetchEarnings(uid, period);
  }, [router, period, fetchEarnings]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getPayRateDisplay = () => {
    if (!payInfo) return null;
    if (payInfo.payType === 'hourly' && payInfo.hourlyRate) {
      return `$${payInfo.hourlyRate}/hr`;
    }
    if (payInfo.payType === 'commission' && payInfo.commissionRate) {
      return `${payInfo.commissionRate}% per job`;
    }
    return 'Not set';
  };

  return (
    <WorkerLayout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Earnings</h1>
          <div className="flex bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === 'week'
                  ? 'bg-emerald-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === 'month'
                  ? 'bg-emerald-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Month
            </button>
          </div>
        </div>

        {/* Pay Rate Banner */}
        {payInfo && (
          <div className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 rounded-xl p-4 border border-emerald-500/30">
            <p className="text-sm text-zinc-400">Your pay rate</p>
            <p className="text-2xl font-bold text-white">{getPayRateDisplay()}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <DollarSign className="w-6 h-6 text-emerald-400 mb-2" />
            <p className="text-2xl font-bold text-white">
              ${summary.totalEarnings.toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500">Total Earned</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <Clock className="w-6 h-6 text-blue-400 mb-2" />
            <p className="text-2xl font-bold text-white">{summary.totalHours.toFixed(1)}h</p>
            <p className="text-xs text-zinc-500">Hours Worked</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <Briefcase className="w-6 h-6 text-purple-400 mb-2" />
            <p className="text-2xl font-bold text-white">{summary.jobsCompleted}</p>
            <p className="text-xs text-zinc-500">Jobs Completed</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <AlertCircle className="w-6 h-6 text-yellow-400 mb-2" />
            <p className="text-2xl font-bold text-white">
              ${summary.pendingPay.toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500">Pending Pay</p>
          </div>
        </div>

        {/* Work Logs by Date */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Work History</h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : Object.keys(byDate).length === 0 ? (
            <div className="bg-zinc-900 rounded-xl p-8 text-center border border-zinc-800">
              <p className="text-zinc-400">No work logs for this period</p>
            </div>
          ) : (
            Object.entries(byDate)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, logs]) => (
                <div key={date} className="space-y-2">
                  <h3 className="text-sm font-medium text-zinc-400">{formatDate(date)}</h3>
                  {logs.map((log) => (
                    <button
                      key={log.id}
                      onClick={() => router.push(`/worker/job/${log.job.id}`)}
                      className="w-full text-left bg-zinc-900 rounded-xl p-4 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-white">{log.job.serviceType}</p>
                          <p className="text-zinc-400 text-sm">{log.job.customer.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-400">
                            ${log.earnings?.toFixed(2) || '0.00'}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                              log.isPaid
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}
                          >
                            {log.isPaid ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Paid
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3" />
                                Pending
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
                        <span>
                          {formatTime(log.clockIn)} -{' '}
                          {log.clockOut ? formatTime(log.clockOut) : 'In Progress'}
                        </span>
                        <span>{log.hoursWorked?.toFixed(1) || '0'}h</span>
                      </div>
                    </button>
                  ))}
                </div>
              ))
          )}
        </div>
      </div>
    </WorkerLayout>
  );
}
