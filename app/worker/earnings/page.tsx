'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import WorkerLayout from '@/components/worker/WorkerLayout';
import { DollarSign, Clock, Briefcase, Loader2, AlertCircle } from 'lucide-react';

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

// Stat Card Component
function StatCard({
  icon: Icon,
  iconColor,
  value,
  label,
}: {
  icon: React.ElementType;
  iconColor: string;
  value: string;
  label: string;
}) {
  return (
    <div className="bg-[#1F2937] rounded-2xl p-5 flex flex-col gap-2">
      <Icon className={`w-8 h-8 ${iconColor}`} />
      <p className="text-[28px] font-bold text-white leading-none">{value}</p>
      <p className="text-sm text-[#9CA3AF]">{label}</p>
    </div>
  );
}

// Work History Card Component
function WorkHistoryCard({
  jobType,
  clientName,
  timeRange,
  duration,
  amount,
  isPaid,
  onClick,
}: {
  jobType: string;
  clientName: string;
  timeRange: string;
  duration: string;
  amount: string;
  isPaid: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-[#1F2937] rounded-xl p-4 mb-3 hover:bg-[#2a3544] transition-colors active:scale-[0.99]"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-white">{jobType}</p>
          <p className="text-sm text-[#9CA3AF] mt-1">{clientName}</p>
          <p className="text-xs text-[#6B7280] mt-1.5">
            {timeRange}  •  {duration}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          <div className="text-right flex flex-col items-end gap-2">
            <p className="text-lg font-bold text-[#10B981]">{amount}</p>
            <span
              className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold ${
                isPaid
                  ? 'bg-[#10B981]/15 text-[#10B981]'
                  : 'bg-[#F59E0B]/15 text-[#F59E0B]'
              }`}
            >
              {isPaid ? 'Paid' : 'Pending'}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function WorkerEarnings() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
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
    if (!payInfo) return 'Not set';
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
      <div className="p-4 space-y-6 bg-black min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-[32px] font-bold text-white">Earnings</h1>
          <div className="flex bg-[#1F2937] rounded-xl p-1">
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                period === 'week'
                  ? 'bg-[#10B981] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                period === 'month'
                  ? 'bg-[#10B981] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Month
            </button>
          </div>
        </div>

        {/* Pay Rate Card */}
        <div className="bg-gradient-to-br from-[#1F2937] to-[#111827] rounded-2xl p-5 border border-[#374151]">
          <p className="text-sm text-gray-400">Your pay rate</p>
          <p className="text-[28px] font-bold text-white mt-1">{getPayRateDisplay()}</p>
          {getPayRateDisplay() === 'Not set' && (
            <p className="text-xs text-gray-500 mt-2">Contact your employer to set up your pay rate</p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={DollarSign}
            iconColor="text-[#10B981]"
            value={`$${summary.totalEarnings.toFixed(2)}`}
            label="Total Earned"
          />
          <StatCard
            icon={Clock}
            iconColor="text-[#3B82F6]"
            value={`${summary.totalHours.toFixed(1)}h`}
            label="Hours Worked"
          />
          <StatCard
            icon={Briefcase}
            iconColor="text-[#8B5CF6]"
            value={`${summary.jobsCompleted}`}
            label="Jobs Completed"
          />
          <StatCard
            icon={AlertCircle}
            iconColor="text-[#F59E0B]"
            value={`$${summary.pendingPay.toFixed(2)}`}
            label="Pending Pay"
          />
        </div>

        {/* Work History Section */}
        <div className="space-y-4 mt-6">
          <h2 className="text-xl font-bold text-white">Work History</h2>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#10B981]" />
            </div>
          ) : Object.keys(byDate).length === 0 ? (
            <div className="bg-[#1F2937] rounded-2xl p-10 text-center">
              <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No work logs for this period</p>
              <p className="text-gray-500 text-sm mt-1">Complete jobs to see your earnings here</p>
            </div>
          ) : (
            Object.entries(byDate)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, logs]) => (
                <div key={date} className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    {formatDate(date)}
                  </h3>
                  {logs.map((log) => (
                    <WorkHistoryCard
                      key={log.id}
                      jobType={log.job.serviceType}
                      clientName={log.job.customer.name}
                      timeRange={`${formatTime(log.clockIn)} - ${
                        log.clockOut ? formatTime(log.clockOut) : 'In Progress'
                      }`}
                      duration={`${log.hoursWorked?.toFixed(1) || '0.0'}h`}
                      amount={`$${log.earnings?.toFixed(2) || '0.00'}`}
                      isPaid={log.isPaid}
                      onClick={() => router.push(`/worker/job/${log.job.id}`)}
                    />
                  ))}
                </div>
              ))
          )}
        </div>
      </div>
    </WorkerLayout>
  );
}
