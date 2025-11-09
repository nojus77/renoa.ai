"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear any auth tokens/session data
    localStorage.clear();
    sessionStorage.clear();

    // Redirect to admin login page after a short delay
    const timeout = setTimeout(() => {
      router.push('/admin/login');
    }, 1500);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
          <LogOut className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Logging Out</h1>
        <p className="text-muted-foreground">
          You have been successfully logged out.
        </p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto" />
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Redirecting to home page...
        </p>
      </div>
    </div>
  );
}
