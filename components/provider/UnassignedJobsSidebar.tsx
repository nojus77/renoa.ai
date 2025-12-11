'use client'

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, DollarSign, MapPin, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDraggable } from '@dnd-kit/core';

interface UnassignedJob {
  id: string;
  customerName: string;
  customerAddress: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  estimatedValue: number;
  priority?: 'urgent' | 'high' | 'normal';
}

interface UnassignedJobsSidebarProps {
  jobs: UnassignedJob[];
  onJobClick?: (jobId: string) => void;
}

// Draggable job card component
function DraggableJobCard({ job, onJobClick, formatCurrency, formatDate, formatTime, getPriorityColor }: {
  job: UnassignedJob;
  onJobClick?: (jobId: string) => void;
  formatCurrency: (cents: number) => string;
  formatDate: (dateStr: string) => string;
  formatTime: (timeStr: string) => string;
  getPriorityColor: (priority?: string) => string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: job.id,
    data: { job },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`
        group relative bg-zinc-800/40 rounded-lg p-3
        border-l-4 ${getPriorityColor(job.priority)}
        hover:bg-zinc-800/60 transition-colors select-none
        min-h-[60px]
        ${isDragging ? 'opacity-50 cursor-grabbing' : 'opacity-100 cursor-grab'}
      `}
      style={{ touchAction: 'none', userSelect: 'none' }}
      onClick={(e) => {
        // Prevent click during drag
        if (!isDragging) {
          onJobClick?.(job.id);
        }
      }}
    >
      {/* Drag Handle Indicator - Visual only */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
          isDragging ? 'opacity-100' : ''
        }`}
      >
        <GripVertical className="h-4 w-4 text-zinc-500" />
      </div>

      <div className="pl-6 pointer-events-none">
        {/* Customer Name */}
        <div className="flex items-start justify-between mb-1.5">
          <h4 className="text-sm font-semibold text-zinc-100 leading-tight">
            {job.customerName}
          </h4>
          {job.priority === 'urgent' && (
            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded uppercase">
              Urgent
            </span>
          )}
        </div>

        {/* Service Type */}
        <p className="text-xs text-zinc-400 mb-2 line-clamp-1">
          {job.serviceType}
        </p>

        {/* Date/Time */}
        <div className="flex items-center gap-3 text-xs text-zinc-500 mb-1.5">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(job.scheduledDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatTime(job.scheduledTime)}</span>
          </div>
        </div>

        {/* Location & Value */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-zinc-500 flex-1 min-w-0">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{job.customerAddress}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 ml-2 flex-shrink-0">
            <DollarSign className="h-3 w-3" />
            <span className="font-semibold">{formatCurrency(job.estimatedValue)}</span>
          </div>
        </div>

        {/* Duration badge */}
        <div className="mt-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-700/50 text-zinc-400 text-[10px] rounded">
            <Clock className="h-3 w-3" />
            {job.duration}h
          </span>
        </div>
      </div>
    </div>
  );
}

export default function UnassignedJobsSidebar({
  jobs,
  onJobClick,
}: UnassignedJobsSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-orange-500';
      default:
        return 'border-l-zinc-700';
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-zinc-900/50 border-r border-zinc-800 flex flex-col items-center py-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors mb-4"
          title="Expand sidebar"
        >
          <ChevronRight className="h-5 w-5 text-zinc-400" />
        </button>
        <div className="writing-mode-vertical-rl text-xs text-zinc-500 font-semibold">
          Unassigned Jobs ({jobs.length})
        </div>
      </div>
    );
  }

  return (
    <div className="w-[280px] bg-zinc-900/50 border-r border-zinc-800 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div>
          <h3 className="text-sm font-bold text-zinc-100">Unassigned Jobs</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} need assignment
          </p>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          title="Collapse sidebar"
        >
          <ChevronLeft className="h-4 w-4 text-zinc-400" />
        </button>
      </div>

      {/* Jobs List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
              <Calendar className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-sm text-zinc-400 text-center">
              All jobs are assigned!
            </p>
            <p className="text-xs text-zinc-600 text-center mt-1">
              New jobs will appear here
            </p>
          </div>
        ) : (
          jobs.map((job) => (
            <DraggableJobCard
              key={job.id}
              job={job}
              onJobClick={onJobClick}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              formatTime={formatTime}
              getPriorityColor={getPriorityColor}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {jobs.length > 0 && (
        <div className="p-3 border-t border-zinc-800 bg-zinc-900/30">
          <p className="text-xs text-zinc-500 text-center">
            Drag jobs to calendar to assign
          </p>
        </div>
      )}
    </div>
  );
}
