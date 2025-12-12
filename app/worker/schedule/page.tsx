'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import WorkerLayout from '@/components/worker/WorkerLayout';
import { ChevronLeft, ChevronRight, MapPin, Clock, Loader2 } from 'lucide-react';

interface Job {
  id: string;
  serviceType: string;
  address: string;
  startTime: string;
  endTime: string;
  status: string;
  customer: {
    name: string;
    phone: string | null;
  };
}

export default function WorkerSchedule() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsByDay, setJobsByDay] = useState<Record<string, Job[]>>({});
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  const [selectedDay, setSelectedDay] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const fetchJobs = useCallback(async (uid: string, startDate: Date) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/worker/jobs/week?userId=${uid}&startDate=${startDate.toISOString()}`
      );
      const data = await res.json();

      if (data.jobs) {
        setJobs(data.jobs);
        setJobsByDay(data.jobsByDay || {});
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
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
    fetchJobs(uid, weekStart);
  }, [router, weekStart, fetchJobs]);

  const changeWeek = (direction: number) => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + direction * 7);
    setWeekStart(newStart);
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getJobCountForDay = (dateStr: string) => {
    return jobsByDay[dateStr]?.length || 0;
  };

  const selectedJobs = jobsByDay[selectedDay] || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-l-purple-500';
      case 'in_progress':
        return 'border-l-emerald-500';
      default:
        return 'border-l-blue-500';
    }
  };

  return (
    <WorkerLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Schedule</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeWeek(-1)}
              className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"
            >
              <ChevronLeft className="w-5 h-5 text-zinc-400" />
            </button>
            <span className="text-sm text-zinc-400 min-w-[140px] text-center">
              {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
              {new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString(
                'en-US',
                { month: 'short', day: 'numeric' }
              )}
            </span>
            <button
              onClick={() => changeWeek(1)}
              className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"
            >
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Week Strip */}
        <div className="grid grid-cols-7 gap-1 bg-zinc-900 rounded-xl p-2 border border-zinc-800">
          {getWeekDays().map((day) => {
            const dateStr = day.toISOString().split('T')[0];
            const isSelected = selectedDay === dateStr;
            const jobCount = getJobCountForDay(dateStr);

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDay(dateStr)}
                className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-emerald-600 text-white'
                    : isToday(day)
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <span className="text-[10px] font-medium uppercase">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="text-lg font-bold">{day.getDate()}</span>
                {jobCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 rounded-full ${
                      isSelected ? 'bg-emerald-500' : 'bg-zinc-700'
                    }`}
                  >
                    {jobCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Day Jobs */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : selectedJobs.length === 0 ? (
            <div className="bg-zinc-900 rounded-xl p-8 text-center border border-zinc-800">
              <p className="text-zinc-400">No jobs scheduled</p>
            </div>
          ) : (
            selectedJobs.map((job) => (
              <button
                key={job.id}
                onClick={() => router.push(`/worker/job/${job.id}`)}
                className={`w-full text-left bg-zinc-900 rounded-xl border border-zinc-800 border-l-4 ${getStatusColor(
                  job.status
                )} p-4 hover:bg-zinc-800/50 transition-colors active:scale-[0.98]`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-white">{job.serviceType}</p>
                    <p className="text-zinc-400 text-sm">{job.customer.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        job.status === 'completed'
                          ? 'bg-purple-500/20 text-purple-400'
                          : job.status === 'in_progress'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {job.status === 'in_progress' ? 'In Progress' : job.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Clock className="w-4 h-4" />
                    {formatTime(job.startTime)} - {formatTime(job.endTime)}
                  </div>
                </div>

                <div className="mt-2 flex items-start gap-1.5 text-sm text-zinc-500">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{job.address}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </WorkerLayout>
  );
}
