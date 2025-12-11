'use client'

import { useState } from 'react';
import { Filter, ChevronDown, Check, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface CalendarFilterBarProps {
  teamMembers: TeamMember[];
  selectedView: string;
  onViewChange: (view: string) => void;
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
  calendarMode: 'my-schedule' | 'team-schedule';
  onCalendarModeChange: (mode: 'my-schedule' | 'team-schedule') => void;
  userRole: string;
}

const STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-500' },
  { value: 'dispatched', label: 'Dispatched', color: 'bg-purple-500' },
  { value: 'on-the-way', label: 'On the way', color: 'bg-orange-500' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-yellow-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
];

export default function CalendarFilterBar({
  teamMembers,
  selectedView,
  onViewChange,
  selectedStatuses,
  onStatusChange,
  calendarMode,
  onCalendarModeChange,
  userRole,
}: CalendarFilterBarProps) {
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const handleStatusToggle = (status: string) => {
    if (status === 'all') {
      onStatusChange([]);
    } else {
      const newStatuses = selectedStatuses.includes(status)
        ? selectedStatuses.filter(s => s !== status)
        : [...selectedStatuses, status];
      onStatusChange(newStatuses);
    }
  };

  const getViewLabel = () => {
    if (selectedView === 'all') return 'All Team Members';
    if (selectedView === 'unassigned') return 'Unassigned Jobs';
    const member = teamMembers.find(m => m.id === selectedView);
    if (member) return `${member.firstName} ${member.lastName}`;
    return 'Select View';
  };

  const getStatusLabel = () => {
    if (selectedStatuses.length === 0) return 'All Statuses';
    if (selectedStatuses.length === 1) {
      const status = STATUSES.find(s => s.value === selectedStatuses[0]);
      return status?.label || 'Statuses';
    }
    return `${selectedStatuses.length} selected`;
  };

  return (
    <div className="bg-zinc-900/50 border-b border-zinc-800 p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left side filters */}
        <div className="flex items-center gap-3 flex-1">
          {/* View Filter */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowViewDropdown(!showViewDropdown)}
              className="border-zinc-700 hover:bg-zinc-800 min-w-[200px] justify-between"
            >
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {getViewLabel()}
              </span>
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>

            {showViewDropdown && (
              <div className="absolute top-full mt-1 left-0 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 min-w-[200px] max-h-[400px] overflow-y-auto">
                <button
                  onClick={() => {
                    onViewChange('all');
                    setShowViewDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center justify-between"
                >
                  All Team Members
                  {selectedView === 'all' && <Check className="h-4 w-4 text-emerald-400" />}
                </button>

                <button
                  onClick={() => {
                    onViewChange('unassigned');
                    setShowViewDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center justify-between border-b border-zinc-700"
                >
                  Unassigned Jobs Only
                  {selectedView === 'unassigned' && <Check className="h-4 w-4 text-emerald-400" />}
                </button>

                <div className="p-2 text-xs text-zinc-500 font-semibold">Team Members</div>
                {teamMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => {
                      onViewChange(member.id);
                      setShowViewDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center text-white text-xs font-bold">
                        {member.firstName[0]}{member.lastName[0]}
                      </div>
                      {member.firstName} {member.lastName}
                      <span className="text-xs text-zinc-500">({member.role})</span>
                    </span>
                    {selectedView === member.id && <Check className="h-4 w-4 text-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="border-zinc-700 hover:bg-zinc-800 min-w-[160px] justify-between"
            >
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {getStatusLabel()}
              </span>
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>

            {showStatusDropdown && (
              <div className="absolute top-full mt-1 left-0 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 min-w-[200px]">
                {STATUSES.map(status => (
                  <button
                    key={status.value}
                    onClick={() => handleStatusToggle(status.value)}
                    className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      {status.color && (
                        <div className={`w-3 h-3 rounded-full ${status.color}`} />
                      )}
                      {status.label}
                    </span>
                    {(status.value === 'all' && selectedStatuses.length === 0) ||
                     (status.value !== 'all' && selectedStatuses.includes(status.value)) ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side - View Mode Toggle (only for owner/office) */}
        {(userRole === 'owner' || userRole === 'office') && (
          <div className="flex items-center gap-2 bg-zinc-800/50 p-1 rounded-lg">
            <button
              onClick={() => onCalendarModeChange('my-schedule')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                calendarMode === 'my-schedule'
                  ? 'bg-emerald-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              My Schedule
            </button>
            <button
              onClick={() => onCalendarModeChange('team-schedule')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                calendarMode === 'team-schedule'
                  ? 'bg-emerald-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              Team Schedule
            </button>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {(selectedView !== 'all' || selectedStatuses.length > 0) && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs text-zinc-500">Active filters:</span>
          {selectedView !== 'all' && (
            <span className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-md flex items-center gap-1">
              View: {getViewLabel()}
              <button
                onClick={() => onViewChange('all')}
                className="hover:text-red-400"
              >
                ×
              </button>
            </span>
          )}
          {selectedStatuses.map(status => {
            const statusInfo = STATUSES.find(s => s.value === status);
            return (
              <span
                key={status}
                className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-md flex items-center gap-1"
              >
                {statusInfo?.color && (
                  <div className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
                )}
                {statusInfo?.label}
                <button
                  onClick={() => handleStatusToggle(status)}
                  className="hover:text-red-400"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
