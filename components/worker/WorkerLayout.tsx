'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Calendar, DollarSign, User } from 'lucide-react';

// Renoa Design System Colors
const LIME_GREEN = '#C4F542';

interface WorkerLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: '/worker/dashboard', icon: Home, label: 'Home' },
  { href: '/worker/earnings', icon: DollarSign, label: 'Earnings' },
  { href: '/worker/schedule', icon: Calendar, label: 'Schedule' },
  { href: '/worker/profile', icon: User, label: 'Profile' },
];

export default function WorkerLayout({ children }: WorkerLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Main Content */}
      <main className="max-w-lg mx-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1F1F1F] border-t border-[#2A2A2A] z-50">
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
                    ? ''
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={isActive ? { color: LIME_GREEN } : undefined}
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
