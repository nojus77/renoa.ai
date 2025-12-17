"use client";

import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = 'success'
}: MetricCardProps) {
  const variantStyles = {
    default: 'bg-card border-border',
    success: 'bg-emerald-500 border-emerald-600',
    warning: 'bg-amber-500 border-amber-600',
    danger: 'bg-red-500 border-red-600',
  };

  const textStyles = {
    default: 'text-foreground',
    success: 'text-white',
    warning: 'text-white',
    danger: 'text-white',
  };

  const labelStyles = {
    default: 'text-muted-foreground',
    success: 'text-emerald-100',
    warning: 'text-amber-100',
    danger: 'text-red-100',
  };

  return (
    <div className={`rounded-2xl border p-5 ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-3xl font-bold ${textStyles[variant]}`}>
            {value}
          </p>
          <p className={`text-sm mt-1 ${labelStyles[variant]}`}>
            {title}
          </p>
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg ${variant === 'default' ? 'bg-muted' : 'bg-white/20'}`}>
            <Icon className={`h-5 w-5 ${textStyles[variant]}`} />
          </div>
        )}
      </div>
      {trend && (
        <div className={`mt-3 text-xs font-medium ${trend.isPositive ? 'text-emerald-200' : 'text-red-200'}`}>
          {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% vs last period
        </div>
      )}
    </div>
  );
}
