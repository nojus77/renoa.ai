"use client";

import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
}: MetricCardProps) {
  return (
    <div className="flex-1 bg-[#18181b] rounded-2xl p-5 border border-[#27272a]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-4xl font-bold text-white">{value}</p>
          <p className="text-sm text-[#71717a] mt-1">{title}</p>
        </div>
        {Icon && <Icon className="h-5 w-5 text-[#71717a]" />}
      </div>
    </div>
  );
}
