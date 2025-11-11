import { forwardRef, ButtonHTMLAttributes } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccessibleIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const AccessibleIconButton = forwardRef<HTMLButtonElement, AccessibleIconButtonProps>(
  ({ icon: Icon, label, variant = 'default', size = 'md', className, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-8 w-8 min-h-[32px] min-w-[32px]',
      md: 'h-10 w-10 min-h-[44px] min-w-[44px]',
      lg: 'h-12 w-12 min-h-[48px] min-w-[48px]',
    };

    const iconSizes = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    const variantClasses = {
      default: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      ghost: 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100',
      outline: 'border border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100',
    };

    return (
      <button
        ref={ref}
        aria-label={label}
        className={cn(
          'inline-flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:pointer-events-none disabled:opacity-50',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <Icon className={iconSizes[size]} />
      </button>
    );
  }
);

AccessibleIconButton.displayName = 'AccessibleIconButton';
