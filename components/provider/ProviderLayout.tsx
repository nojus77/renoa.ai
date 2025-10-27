"use client"

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard,
  TrendingUp,
  Users,
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';

interface ProviderLayoutProps {
  children: React.ReactNode;
  providerName?: string;
}

export default function ProviderLayout({ children, providerName }: ProviderLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('providerId');
    localStorage.removeItem('providerName');
    router.push('/provider/login');
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: '/provider/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Analytics',
      href: '/provider/analytics',
      icon: TrendingUp,
    },
    {
      name: 'Leads',
      href: '/provider/leads',
      icon: Users,
      disabled: true, // For future
    },
    {
      name: 'Settings',
      href: '/provider/settings',
      icon: Settings,
      disabled: true, // For future
    },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar */}
      <div className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b border-zinc-800">
          <h1 className="text-xl font-bold text-zinc-100">Provider Portal</h1>
          {providerName && (
            <p className="text-sm text-zinc-400 mt-1">{providerName}</p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.name}
                href={item.disabled ? '#' : item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${active 
                    ? 'bg-blue-600 text-white' 
                    : item.disabled
                    ? 'text-zinc-600 cursor-not-allowed'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                  }
                `}
                onClick={(e) => item.disabled && e.preventDefault()}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
                {active && <ChevronRight className="h-4 w-4 ml-auto" />}
                {item.disabled && (
                  <span className="ml-auto text-xs bg-zinc-800 px-2 py-1 rounded">
                    Soon
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-zinc-800">
          <Button
            variant="outline"
            className="w-full border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}