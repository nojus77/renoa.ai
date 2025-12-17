'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Calendar, DollarSign, User, Bell, MapPin, MessageSquare } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

// Renoa Design System Colors
const LIME_GREEN = '#C4F542';

interface WorkerLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: '/worker/dashboard', icon: Home, label: 'Home' },
  { href: '/worker/schedule', icon: Calendar, label: 'Schedule' },
  { href: '/worker/map', icon: MapPin, label: 'Map' },
  { href: '/worker/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/worker/earnings', icon: DollarSign, label: 'Earnings' },
  { href: '/worker/profile', icon: User, label: 'Profile' },
];

export default function WorkerLayout({ children }: WorkerLayoutProps) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);

  // Fetch notification count
  const fetchNotificationCount = useCallback(async () => {
    if (!providerId || !userId) return;

    try {
      const res = await fetch(`/api/provider/notifications?providerId=${providerId}&userId=${userId}&unreadOnly=true&limit=1`);
      const data = await res.json();
      if (data.unreadCount !== undefined) {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  }, [providerId, userId]);

  // Fetch unread messages count using dedicated API
  const fetchUnreadMessagesCount = useCallback(async () => {
    if (!userId) return;

    try {
      const res = await fetch(`/api/worker/messages/unread-count?userId=${userId}`);
      const data = await res.json();
      if (res.ok) {
        setUnreadMessagesCount(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching message count:', error);
    }
  }, [userId]);

  // Get user IDs from localStorage
  useEffect(() => {
    const uid = localStorage.getItem('workerUserId');
    const pid = localStorage.getItem('workerProviderId');
    setUserId(uid);
    setProviderId(pid);
  }, []);

  // Fetch notifications on mount and poll every 30 seconds
  useEffect(() => {
    if (userId && providerId) {
      fetchNotificationCount();
      const interval = setInterval(fetchNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [userId, providerId, fetchNotificationCount]);

  // Fetch unread messages on mount and poll every 30 seconds
  useEffect(() => {
    if (userId) {
      fetchUnreadMessagesCount();
      const interval = setInterval(fetchUnreadMessagesCount, 30000);

      // Listen for messagesRead event to refresh immediately
      const handleMessagesRead = () => {
        fetchUnreadMessagesCount();
      };
      window.addEventListener('messagesRead', handleMessagesRead);

      return () => {
        clearInterval(interval);
        window.removeEventListener('messagesRead', handleMessagesRead);
      };
    }
  }, [userId, fetchUnreadMessagesCount]);

  // Apply saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('workerTheme') as 'dark' | 'light' | null;
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Notification Bell - Fixed in top right */}
      {unreadCount > 0 && (
        <Link
          href="/worker/notifications"
          className="fixed top-4 right-4 z-50 p-2 bg-[#1F1F1F] rounded-full border border-[#2A2A2A] shadow-lg"
        >
          <div className="relative">
            <Bell className="w-5 h-5 text-white" />
            <span
              className="absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-black rounded-full px-1"
              style={{ backgroundColor: LIME_GREEN }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </div>
        </Link>
      )}

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
            const isMessages = item.href === '/worker/messages';
            const showBadge = isMessages && unreadMessagesCount > 0;

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
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {showBadge && (
                    <span
                      className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] flex items-center justify-center text-[9px] font-bold text-black rounded-full px-1"
                      style={{ backgroundColor: LIME_GREEN }}
                    >
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
