'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ProviderContextType {
  providerId: string;
  timezone: string;
  loading: boolean;
}

const ProviderContext = createContext<ProviderContextType>({
  providerId: '',
  timezone: 'America/Chicago',
  loading: true,
});

interface ProviderProviderProps {
  children: ReactNode;
  providerId: string;
}

export function ProviderProvider({ children, providerId }: ProviderProviderProps) {
  const [timezone, setTimezone] = useState('America/Chicago');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!providerId) {
      setLoading(false);
      return;
    }

    // Fetch provider timezone
    fetch(`/api/provider/details`)
      .then((res) => res.json())
      .then((data) => {
        setTimezone(data.timeZone || data.timezone || 'America/Chicago');
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch provider timezone:', error);
        // Fallback to Chicago timezone
        setTimezone('America/Chicago');
        setLoading(false);
      });
  }, [providerId]);

  return (
    <ProviderContext.Provider value={{ providerId, timezone, loading }}>
      {children}
    </ProviderContext.Provider>
  );
}

/**
 * Hook to access provider context including timezone
 * @returns Provider context with providerId, timezone, and loading state
 */
export function useProvider() {
  const context = useContext(ProviderContext);
  if (!context) {
    throw new Error('useProvider must be used within a ProviderProvider');
  }
  return context;
}
