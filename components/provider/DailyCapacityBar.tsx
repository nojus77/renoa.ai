'use client'

interface DailyCapacityBarProps {
  bookedHours: number;
  availableHours?: number;
  date: Date;
}

export default function DailyCapacityBar({
  bookedHours,
  availableHours = 8,
  date,
}: DailyCapacityBarProps) {
  const utilizationPercent = (bookedHours / availableHours) * 100;

  // Color coding based on utilization
  const getColorClasses = () => {
    if (utilizationPercent > 100) {
      return 'bg-red-500/20 border-red-500/40 text-red-400';
    } else if (utilizationPercent > 90) {
      return 'bg-orange-500/20 border-orange-500/40 text-orange-400';
    } else if (utilizationPercent > 70) {
      return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400';
    } else {
      return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400';
    }
  };

  const getBarColorClasses = () => {
    if (utilizationPercent > 100) {
      return 'bg-red-500';
    } else if (utilizationPercent > 90) {
      return 'bg-orange-500';
    } else if (utilizationPercent > 70) {
      return 'bg-yellow-500';
    } else {
      return 'bg-emerald-500';
    }
  };

  return (
    <div className={`rounded-lg border p-2 mb-2 ${getColorClasses()}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold">
          {bookedHours.toFixed(1)}h / {availableHours}h
        </span>
        <span className="text-xs font-bold">
          {utilizationPercent.toFixed(0)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getBarColorClasses()}`}
          style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
        />
      </div>
    </div>
  );
}
