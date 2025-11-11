import { Loader2 } from 'lucide-react';
import { Button, ButtonProps } from './button';
import { forwardRef } from 'react';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading, children, disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={loading || disabled}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {children}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';
