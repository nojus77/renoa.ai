'use client';

import { cn } from '@/lib/utils';

interface CalendarSkeletonProps {
  type?: 'daily' | 'weekly';
  workerCount?: number;
}

export default function CalendarSkeleton({
  type = 'daily',
  workerCount = 5,
}: CalendarSkeletonProps) {
  if (type === 'weekly') {
    return <WeeklyCalendarSkeleton />;
  }

  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Header skeleton */}
      <div className="flex-shrink-0 p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-zinc-700 rounded" />
            <div className="h-6 w-48 bg-zinc-700 rounded" />
            <div className="h-8 w-8 bg-zinc-700 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-5 w-20 bg-zinc-700 rounded" />
            <div className="h-5 w-20 bg-zinc-700 rounded" />
            <div className="h-5 w-20 bg-zinc-700 rounded" />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Time column skeleton */}
        <div className="w-16 flex-shrink-0 border-r border-zinc-800 pt-12">
          {[...Array(14)].map((_, i) => (
            <div key={i} className="h-[60px] flex items-start justify-end pr-2">
              <div className="h-3 w-10 bg-zinc-800 rounded" />
            </div>
          ))}
        </div>

        {/* Worker columns skeleton */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex min-w-max">
            {[...Array(Math.min(workerCount, 6))].map((_, colIdx) => (
              <div
                key={colIdx}
                className="w-48 flex-shrink-0 border-r border-zinc-800"
              >
                {/* Worker header */}
                <div className="h-12 px-3 py-2 border-b border-zinc-800 bg-zinc-900/50">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-zinc-700" />
                    <div className="flex-1">
                      <div className="h-4 w-20 bg-zinc-700 rounded mb-1" />
                      <div className="h-3 w-16 bg-zinc-800 rounded" />
                    </div>
                  </div>
                </div>

                {/* Time slots with random job placeholders */}
                <div className="relative">
                  {[...Array(14)].map((_, slotIdx) => (
                    <div
                      key={slotIdx}
                      className="h-[60px] border-b border-zinc-800/50"
                    />
                  ))}

                  {/* Random job block placeholders */}
                  {getRandomJobPositions(colIdx).map((job, jobIdx) => (
                    <div
                      key={jobIdx}
                      className="absolute left-1 right-1 bg-zinc-700/50 rounded-lg"
                      style={{
                        top: `${job.top}px`,
                        height: `${job.height}px`,
                      }}
                    >
                      <div className="p-2 space-y-1">
                        <div className="h-3 w-3/4 bg-zinc-600 rounded" />
                        <div className="h-2 w-1/2 bg-zinc-600/50 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div className="w-72 flex-shrink-0 border-l border-zinc-800 bg-zinc-900">
          <div className="p-3 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 w-24 bg-zinc-700 rounded" />
              <div className="h-5 w-8 bg-zinc-700 rounded" />
            </div>
            <div className="h-8 w-full bg-zinc-700 rounded mb-2" />
            <div className="flex gap-2">
              <div className="h-6 w-12 bg-zinc-800 rounded" />
              <div className="h-6 w-14 bg-zinc-800 rounded" />
              <div className="h-6 w-12 bg-zinc-800 rounded" />
            </div>
          </div>
          <div className="p-2 space-y-2">
            {[...Array(4)].map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WeeklyCalendarSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-zinc-700 rounded" />
            <div className="h-6 w-56 bg-zinc-700 rounded" />
            <div className="h-8 w-8 bg-zinc-700 rounded" />
          </div>
          <div className="h-8 w-24 bg-zinc-700 rounded" />
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-zinc-800 flex gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-4 w-4 bg-zinc-700 rounded" />
            <div className="h-4 w-20 bg-zinc-700 rounded" />
          </div>
        ))}
      </div>

      {/* Week grid */}
      <div className="flex-1 overflow-auto p-4">
        {/* Day headers */}
        <div className="grid grid-cols-8 gap-2 mb-2">
          <div className="h-10" /> {/* Empty corner */}
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-10 bg-zinc-800 rounded flex items-center justify-center">
              <div className="h-4 w-16 bg-zinc-700 rounded" />
            </div>
          ))}
        </div>

        {/* Worker rows */}
        {[...Array(5)].map((_, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-8 gap-2 mb-2">
            {/* Worker name */}
            <div className="h-20 bg-zinc-800/50 rounded p-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-zinc-700" />
                <div className="h-4 w-16 bg-zinc-700 rounded" />
              </div>
            </div>
            {/* Day cells */}
            {[...Array(7)].map((_, dayIdx) => (
              <div
                key={dayIdx}
                className="h-20 bg-zinc-800/30 rounded p-1"
              >
                {Math.random() > 0.5 && (
                  <div className="h-full bg-zinc-700/50 rounded p-1">
                    <div className="h-2 w-12 bg-zinc-600 rounded mb-1" />
                    <div className="h-2 w-8 bg-zinc-600/50 rounded" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function JobCardSkeleton() {
  return (
    <div className="bg-zinc-800/50 rounded-lg p-2.5 border border-zinc-700">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-4 w-12 bg-zinc-600 rounded" />
        <div className="h-3 w-14 bg-zinc-700 rounded" />
      </div>
      <div className="h-4 w-32 bg-zinc-700 rounded mb-1" />
      <div className="h-3 w-24 bg-zinc-700/50 rounded mb-2" />
      <div className="flex items-center gap-1 mb-2">
        <div className="h-3 w-3 bg-zinc-700 rounded" />
        <div className="h-3 w-28 bg-zinc-700/50 rounded" />
      </div>
      <div className="h-7 w-full bg-zinc-600 rounded" />
    </div>
  );
}

// Generate random job positions for skeleton variety
function getRandomJobPositions(seed: number): Array<{ top: number; height: number }> {
  const positions: Array<{ top: number; height: number }> = [];
  const slotHeight = 60;

  // Use seed for pseudo-random but consistent positions
  const random = (n: number) => ((seed * 9301 + 49297) % 233280) / 233280 * n;

  // Generate 1-3 jobs per column
  const jobCount = Math.floor(random(3)) + 1;

  for (let i = 0; i < jobCount; i++) {
    const startSlot = Math.floor(random(10)) + i * 4;
    const duration = Math.floor(random(3)) + 1;

    positions.push({
      top: startSlot * slotHeight + 48, // Account for header
      height: duration * slotHeight - 4,
    });
  }

  return positions;
}
