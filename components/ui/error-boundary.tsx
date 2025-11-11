'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-8 text-center">
            <div className="rounded-full bg-red-900/20 p-4 mb-4 inline-block">
              <AlertTriangle className="h-10 w-10 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-zinc-100 mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
