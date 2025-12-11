'use client'

import { Clock, DollarSign, MapPin, User, Users, GripVertical, AlertCircle, AlertTriangle } from 'lucide-react';

interface AssignedUser {
  id: string;
  firstName: string;
  lastName: string;
  role?: string;
  workerSkills?: {
    level: string;
    skill: {
      name: string;
    };
  }[];
}

interface EnhancedJobCardProps {
  id: string;
  customerName: string;
  customerAddress: string;
  serviceType: string;
  scheduledTime: string;
  duration: number;
  estimatedValue: number;
  status: 'scheduled' | 'dispatched' | 'on-the-way' | 'in-progress' | 'completed' | 'cancelled';
  assignedUsers?: AssignedUser[];
  onClick?: () => void;
  isDraggable?: boolean;
  priority?: 'urgent' | 'high' | 'normal';
  notes?: string;
}

const STATUS_CONFIG = {
  scheduled: {
    label: 'Scheduled',
    color: 'bg-blue-500',
    borderColor: 'border-l-blue-500',
    textColor: 'text-blue-400',
    bgLight: 'bg-blue-500/10',
  },
  dispatched: {
    label: 'Dispatched',
    color: 'bg-purple-500',
    borderColor: 'border-l-purple-500',
    textColor: 'text-purple-400',
    bgLight: 'bg-purple-500/10',
  },
  'on-the-way': {
    label: 'On the Way',
    color: 'bg-orange-500',
    borderColor: 'border-l-orange-500',
    textColor: 'text-orange-400',
    bgLight: 'bg-orange-500/10',
  },
  'in-progress': {
    label: 'In Progress',
    color: 'bg-yellow-500',
    borderColor: 'border-l-yellow-500',
    textColor: 'text-yellow-400',
    bgLight: 'bg-yellow-500/10',
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-500',
    borderColor: 'border-l-green-500',
    textColor: 'text-green-400',
    bgLight: 'bg-green-500/10',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-500',
    borderColor: 'border-l-red-500',
    textColor: 'text-red-400',
    bgLight: 'bg-red-500/10',
  },
};

export default function EnhancedJobCard({
  id,
  customerName,
  customerAddress,
  serviceType,
  scheduledTime,
  duration,
  estimatedValue,
  status,
  assignedUsers = [],
  onClick,
  isDraggable = false,
  priority,
  notes,
}: EnhancedJobCardProps) {
  const statusConfig = STATUS_CONFIG[status];

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  // Check if assigned workers have required skills
  const checkSkillWarnings = () => {
    if (assignedUsers.length === 0) return null;

    const jobSkill = serviceType.toLowerCase();
    let hasWarning = false;
    let warningType: 'missing' | 'basic' | null = null;

    for (const user of assignedUsers) {
      if (!user.workerSkills || user.workerSkills.length === 0) {
        hasWarning = true;
        warningType = 'missing';
        break;
      }

      // Check if worker has the required skill
      const matchingSkill = user.workerSkills.find(ws =>
        ws.skill.name.toLowerCase().includes(jobSkill) || jobSkill.includes(ws.skill.name.toLowerCase())
      );

      if (!matchingSkill) {
        hasWarning = true;
        warningType = 'missing';
        break;
      } else if (matchingSkill.level === 'basic' && !warningType) {
        hasWarning = true;
        warningType = 'basic';
      }
    }

    if (!hasWarning) return null;

    return {
      type: warningType,
      message: warningType === 'missing'
        ? 'Worker missing required skill'
        : 'Worker has basic skill level only'
    };
  };

  const skillWarning = checkSkillWarnings();

  return (
    <div
      onClick={onClick}
      className={`
        group relative bg-zinc-800/40 rounded-lg p-3
        border-l-4 ${statusConfig.borderColor}
        hover:bg-zinc-800/60 transition-all cursor-pointer
        ${isDraggable ? 'hover:shadow-lg' : ''}
      `}
    >
      {/* Drag Handle - only visible on hover if draggable */}
      {isDraggable && (
        <div className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-zinc-500" />
        </div>
      )}

      <div className={isDraggable ? 'pl-4' : ''}>
        {/* Header: Time, Priority, Status Badge */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-sm font-bold text-zinc-100">
              {formatTime(scheduledTime)}
            </span>
            {priority === 'urgent' && (
              <AlertCircle className="h-3.5 w-3.5 text-red-400" title="Urgent" />
            )}
            {skillWarning && (
              <AlertTriangle
                className={`h-3.5 w-3.5 ${skillWarning.type === 'missing' ? 'text-red-400' : 'text-yellow-400'}`}
                title={skillWarning.message}
              />
            )}
          </div>
          <span className={`px-2 py-0.5 ${statusConfig.bgLight} ${statusConfig.textColor} text-[10px] font-semibold rounded uppercase`}>
            {statusConfig.label}
          </span>
        </div>

        {/* Customer Name */}
        <h4 className="text-sm font-semibold text-zinc-100 mb-1 leading-tight">
          {customerName}
        </h4>

        {/* Service Type */}
        <p className="text-xs text-zinc-400 mb-2 line-clamp-1">
          {serviceType}
        </p>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-2">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{customerAddress}</span>
        </div>

        {/* Notes preview if available */}
        {notes && (
          <div className="text-xs text-zinc-500 italic mb-2 line-clamp-1">
            &ldquo;{notes}&rdquo;
          </div>
        )}

        {/* Footer: Assigned Users, Duration, Value */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-700/50">
          {/* Assigned Users */}
          <div className="flex items-center gap-1">
            {assignedUsers.length === 0 ? (
              <div className="flex items-center gap-1 text-zinc-500">
                <User className="h-3 w-3" />
                <span className="text-[10px]">Unassigned</span>
              </div>
            ) : assignedUsers.length === 1 ? (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center text-white text-[10px] font-bold">
                  {getInitials(assignedUsers[0].firstName, assignedUsers[0].lastName)}
                </div>
                <span className="text-[10px] text-zinc-400">
                  {assignedUsers[0].firstName}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <div className="flex -space-x-1">
                  {assignedUsers.slice(0, 3).map((user, idx) => (
                    <div
                      key={user.id}
                      className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center text-white text-[9px] font-bold border border-zinc-800"
                      style={{ zIndex: 10 - idx }}
                      title={`${user.firstName} ${user.lastName}`}
                    >
                      {getInitials(user.firstName, user.lastName)}
                    </div>
                  ))}
                  {assignedUsers.length > 3 && (
                    <div
                      className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 text-[9px] font-bold border border-zinc-800"
                      style={{ zIndex: 7 }}
                    >
                      +{assignedUsers.length - 3}
                    </div>
                  )}
                </div>
                <Users className="h-3 w-3 text-zinc-500 ml-0.5" />
              </div>
            )}
          </div>

          {/* Duration & Value */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {duration}h
            </span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
              <DollarSign className="h-3 w-3" />
              {formatCurrency(estimatedValue)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
