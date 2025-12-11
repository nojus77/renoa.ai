"use client"

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FieldLayoutProps {
  children: React.ReactNode;
}

export default function FieldLayout({ children }: FieldLayoutProps) {
  const router = useRouter();

  const handleLogout = () => {
    // Clear all localStorage items
    localStorage.removeItem('providerId');
    localStorage.removeItem('providerName');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');

    // Redirect to login
    router.push('/provider/login');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Minimal Top Bar - Fixed */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-zinc-900 border-b border-zinc-800 px-4 z-40">
        <div className="flex items-center justify-between max-w-3xl mx-auto h-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-emerald-400">Renoa</h1>
              <p className="text-[10px] text-zinc-500">Field View</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 min-h-[44px]"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content - With top padding */}
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}
