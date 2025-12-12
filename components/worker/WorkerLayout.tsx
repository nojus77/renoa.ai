'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Calendar, DollarSign, Clock, User } from 'lucide-react';

interface WorkerLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: '/worker/dashboard', icon: Home, label: 'Today' },
  { href: '/worker/schedule', icon: Calendar, label: 'Schedule' },
  { href: '/worker/earnings', icon: DollarSign, label: 'Earnings' },
  { href: '/worker/time-off', icon: Clock, label: 'Time Off' },
  { href: '/worker/profile', icon: User, label: 'Profile' },
];

export default function WorkerLayout({ children }: WorkerLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20">
      {/* Main Content */}
      <main className="max-w-lg mx-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-50">
        <div className="max-w-lg mx-auto flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-emerald-400'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
