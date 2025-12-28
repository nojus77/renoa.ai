"use client";

import { Hash, TrendingUp, DollarSign } from 'lucide-react';

interface MetricsWidgetProps {
  numberOfJobs: number;
  averageJobSize: number;
  totalJobValue: number;
  formatCurrency: (amount: number) => string;
}

export default function MetricsWidget({
  numberOfJobs,
  averageJobSize,
  totalJobValue,
  formatCurrency,
}: MetricsWidgetProps) {
  return (
    <div className="h-full flex flex-col sm:flex-row lg:flex-col gap-4">
      {/* Number of Jobs */}
      <div className="flex-1 bg-[#18181b] rounded-2xl p-6 border border-[#27272a]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-4xl font-bold text-white">{numberOfJobs}</div>
          <Hash className="h-6 w-6 text-[#52525b]" />
        </div>
        <div className="text-sm text-[#71717a]">Jobs Completed</div>
      </div>

      {/* Average Job Size */}
      <div className="flex-1 bg-[#18181b] rounded-2xl p-6 border border-[#27272a]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-4xl font-bold text-white">{formatCurrency(averageJobSize)}</div>
          <TrendingUp className="h-6 w-6 text-[#52525b]" />
        </div>
        <div className="text-sm text-[#71717a]">Average Job Size</div>
      </div>

      {/* Total Job Value */}
      <div className="flex-1 bg-[#18181b] rounded-2xl p-6 border border-[#27272a]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-4xl font-bold text-white">{formatCurrency(totalJobValue)}</div>
          <DollarSign className="h-6 w-6 text-[#52525b]" />
        </div>
        <div className="text-sm text-[#71717a]">Total Revenue</div>
      </div>
    </div>
  );
}
