'use client'

import { useDroppable } from '@dnd-kit/core';

interface Job {
  id: string;
  customerName: string;
  serviceType: string;
  startTime: Date;
  endTime: Date;
  status: string;
  assignedUserIds: string[];
  estimatedValue: number;
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface TeamDispatchViewProps {
  jobs: Job[];
  teamMembers: TeamMember[];
  currentDate: Date;
  onSlotClick: (date: Date, hour: number, userId: string) => void;
  onJobClick: (job: Job) => void;
  onStatusChange?: (job: Job, status: string) => void;
  onDeleteJob?: (jobId: string) => void;
}

// Droppable time slot component
function DroppableTimeSlot({ date, hour, userId, onClick }: {
  date: Date;
  hour: number;
  userId: string;
  onClick: () => void;
}) {
  const dateStr = date.toISOString().split('T')[0];
  const dropZoneId = `timeslot_${dateStr}_${hour}_${userId}`;

  const { setNodeRef, isOver } = useDroppable({
    id: dropZoneId,
    data: {
      date: dateStr,
      hour,
      userId,
      type: 'timeslot'
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`w-full h-full hover:bg-zinc-800/20 cursor-pointer transition-colors ${
        isOver ? 'bg-emerald-500/20 ring-2 ring-emerald-500/50' : ''
      }`}
      onClick={onClick}
    />
  );
}

export default function TeamDispatchView({
  jobs,
  teamMembers,
  currentDate,
  onSlotClick,
  onJobClick,
}: TeamDispatchViewProps) {
  const hours = Array.from({ length: 13 }, (_, i) => i + 7); // 7 AM to 7 PM

  // Group jobs by user and time
  const getJobsForUserAtHour = (userId: string, hour: number) => {
    return jobs.filter(job => {
      const jobStart = new Date(job.startTime);
      const jobHour = jobStart.getHours();
      const jobDate = jobStart.toISOString().split('T')[0];
      const currentDateStr = currentDate.toISOString().split('T')[0];

      return (
        job.assignedUserIds.includes(userId) &&
        jobDate === currentDateStr &&
        jobHour === hour
      );
    });
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(0)}`;
  };

  return (
    <div className="h-full overflow-auto">
      <div className="min-w-[1200px]">
        {/* Header Row */}
        <div className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 grid"
          style={{ gridTemplateColumns: '200px repeat(13, 1fr)' }}>
          <div className="p-3 font-semibold text-zinc-100 border-r border-zinc-800">
            Team Member
          </div>
          {hours.map(hour => (
            <div key={hour} className="p-2 text-center text-xs font-medium text-zinc-400 border-r border-zinc-800">
              {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
            </div>
          ))}
        </div>

        {/* Team Member Rows */}
        {teamMembers.map(member => (
          <div key={member.id} className="grid border-b border-zinc-800"
            style={{ gridTemplateColumns: '200px repeat(13, 1fr)' }}>
            {/* Team Member Name */}
            <div className="p-3 border-r border-zinc-800 bg-zinc-900/30 flex items-center">
              <div>
                <div className="font-medium text-zinc-100 text-sm">
                  {member.firstName} {member.lastName}
                </div>
                <div className="text-xs text-zinc-500 capitalize">{member.role}</div>
              </div>
            </div>

            {/* Time Slots */}
            {hours.map(hour => {
              const jobsAtHour = getJobsForUserAtHour(member.id, hour);

              return (
                <div key={hour} className="border-r border-zinc-800 min-h-[80px] relative">
                  <DroppableTimeSlot
                    date={currentDate}
                    hour={hour}
                    userId={member.id}
                    onClick={() => onSlotClick(currentDate, hour, member.id)}
                  />

                  {/* Render jobs in this slot */}
                  {jobsAtHour.map(job => {
                    const startDate = new Date(job.startTime);
                    const endDate = new Date(job.endTime);
                    const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

                    return (
                      <div
                        key={job.id}
                        onClick={() => onJobClick(job)}
                        className="absolute inset-0 m-0.5 p-2 rounded bg-blue-500/20 border border-blue-500/50 cursor-pointer hover:bg-blue-500/30 transition-colors overflow-hidden"
                        style={{
                          height: `${Math.min(duration * 100, 95)}%`
                        }}
                      >
                        <div className="text-xs font-semibold text-blue-300 line-clamp-1">
                          {job.customerName}
                        </div>
                        <div className="text-[10px] text-blue-400 line-clamp-1">
                          {job.serviceType}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                          {formatCurrency(job.estimatedValue)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}

        {/* Empty State */}
        {teamMembers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-zinc-500 text-sm">No team members found</p>
            <p className="text-zinc-600 text-xs mt-1">Add team members to see them here</p>
          </div>
        )}
      </div>
    </div>
  );
}
