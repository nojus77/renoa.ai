"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProviderRoot() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page
    router.replace('/provider/home');
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground">Redirecting...</div>
    </div>
  );
}