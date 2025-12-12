"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect old /field/today to new /worker/dashboard
export default function FieldTodayRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/worker/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <p className="text-zinc-400">Redirecting to worker dashboard...</p>
    </div>
  );
}
