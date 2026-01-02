'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Provider Profile Page
 * Redirects to the settings page with the profile tab active
 */
export default function ProviderProfilePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to settings page (profile tab is the default)
    router.replace('/provider/settings');
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">
        Loading profile...
      </div>
    </div>
  );
}
