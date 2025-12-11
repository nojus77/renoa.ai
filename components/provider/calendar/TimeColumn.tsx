'use client';

import { useEffect, useState } from 'react';

interface TimeColumnProps {
  timeSlots: string[];
  slotHeight: number;
  startHour: number;
  showCurrentTime?: boolean;
}

export default function TimeColumn({
  timeSlots,
  slotHeight,
  startHour,
  showCurrentTime = false,
}: TimeColumnProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    if (!showCurrentTime) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [showCurrentTime]);

  // Calculate current time position
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const totalMinutes = (hours - startHour) * 60 + minutes;
    return (totalMinutes / 60) * slotHeight;
  };

  const currentTimePosition = getCurrentTimePosition();
  const isWithinCalendar = currentTimePosition >= 0 && currentTimePosition <= timeSlots.length * slotHeight;

  return (
    <div className="sticky left-0 z-20 flex-shrink-0 w-20 bg-zinc-900 border-r border-zinc-800">
      {/* Header spacer */}
      <div className="h-16 border-b border-zinc-800 bg-zinc-900 flex items-center justify-center">
        <span className="text-xs text-zinc-500 font-medium">TIME</span>
      </div>

      {/* Time slots */}
      <div className="relative">
        {timeSlots.map((time, index) => (
          <div
            key={time}
            className="flex items-start justify-end pr-3 text-xs text-zinc-500"
            style={{ height: `${slotHeight}px` }}
          >
            <span className="-mt-2">{time}</span>
          </div>
        ))}

        {/* Current time indicator */}
        {showCurrentTime && isWithinCalendar && (
          <div
            className="absolute left-0 right-0 flex items-center z-30 pointer-events-none"
            style={{ top: `${currentTimePosition}px` }}
          >
            <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
            <div className="flex-1 h-0.5 bg-red-500" />
          </div>
        )}
      </div>
    </div>
  );
}
