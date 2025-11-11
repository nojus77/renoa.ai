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
  ChevronRight,
  Calendar,
  MessageCircle,
  Menu,
  X,
  MoreHorizontal,
  FileText
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface ProviderLayoutProps {
  children: React.ReactNode;
  providerName?: string;
}

export default function ProviderLayout({ children, providerName }: ProviderLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

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
      disabled: false,
      showInBottomNav: true,
    },
    {
      name: 'Calendar',
      href: '/provider/calendar',
      icon: Calendar,
      disabled: false,
      showInBottomNav: true,
    },
    {
      name: 'Customers',
      href: '/provider/customers',
      icon: Users,
      disabled: false,
      showInBottomNav: true,
    },
    {
      name: 'Messages',
      href: '/provider/messages',
      icon: MessageCircle,
      disabled: false,
      showInBottomNav: true,
    },
    {
      name: 'Invoices',
      href: '/provider/invoices',
      icon: FileText,
      disabled: false,
      showInBottomNav: false,
    },
    {
      name: 'Analytics',
      href: '/provider/analytics',
      icon: TrendingUp,
      disabled: false,
      showInBottomNav: false,
    },
    {
      name: 'Settings',
      href: '/provider/settings',
      icon: Settings,
      disabled: false,
      showInBottomNav: false,
    },
  ];

  const isActive = (href: string) => pathname === href;
  const bottomNavItems = navItems.filter(item => item.showInBottomNav);
  const moreMenuItems = navItems.filter(item => !item.showInBottomNav);

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Mobile Header - Only visible on mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800 z-40 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="text-center">
          <h1 className="text-lg font-bold text-zinc-100">Provider Portal</h1>
          {providerName && (
            <p className="text-xs text-zinc-400">{providerName}</p>
          )}
        </div>

        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop always visible, Mobile slides in */}
      <div className={`
        w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col fixed left-0 top-0 h-screen z-50 transition-transform duration-300
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo/Header - Desktop only, mobile has top bar */}
        <div className="hidden lg:block p-6 border-b border-zinc-800 flex-shrink-0">
          <h1 className="text-xl font-bold text-zinc-100">Provider Portal</h1>
          {providerName && (
            <p className="text-sm text-zinc-400 mt-1">{providerName}</p>
          )}
        </div>

        {/* Mobile header in sidebar */}
        <div className="lg:hidden p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-zinc-100">Menu</h1>
            {providerName && (
              <p className="text-xs text-zinc-400 mt-1">{providerName}</p>
            )}
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation - Scrollable middle section */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                href={item.disabled ? '#' : item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all min-h-[44px]
                  ${active
                    ? 'bg-emerald-600 text-white'
                    : item.disabled
                    ? 'text-zinc-600 cursor-not-allowed'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                  }
                `}
                onClick={(e) => {
                  if (item.disabled) e.preventDefault();
                }}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
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

        {/* Logout - Fixed at bottom */}
        <div className="p-4 border-t border-zinc-800 flex-shrink-0 bg-zinc-900/50">
          <Button
            variant="outline"
            className="w-full border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 min-h-[44px]"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content - With left margin on desktop, full width on mobile with top/bottom padding */}
      <div className="flex-1 lg:ml-64 overflow-auto h-screen pt-16 pb-20 lg:pt-0 lg:pb-0">
        {children}
      </div>

      {/* Bottom Navigation - Mobile only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800 z-40">
        <div className="flex items-center justify-around h-full px-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                href={item.disabled ? '#' : item.href}
                className={`
                  flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] min-h-[44px]
                  ${active
                    ? 'text-emerald-500'
                    : item.disabled
                    ? 'text-zinc-600 cursor-not-allowed'
                    : 'text-zinc-400 active:bg-zinc-800'
                  }
                `}
                onClick={(e) => {
                  if (item.disabled) e.preventDefault();
                }}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}

          {/* More button for additional menu items */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] min-h-[44px] text-zinc-400 active:bg-zinc-800"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </div>
    </div>
  );
}
