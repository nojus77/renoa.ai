import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  retry?: () => void;
}

export function ErrorMessage({
  title = "Something went wrong",
  message,
  retry
}: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-red-900/20 p-4 mb-4">
        <AlertTriangle className="h-10 w-10 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-100 mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 max-w-md mb-6">{message}</p>
      {retry && (
        <Button
          onClick={retry}
          variant="outline"
          className="border-zinc-700 min-h-[44px]"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}
