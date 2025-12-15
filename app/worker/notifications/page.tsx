'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import WorkerLayout from '@/components/worker/WorkerLayout';
import { ArrowLeft, Bell, CheckCheck, Briefcase, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Renoa Design System Colors
const LIME_GREEN = '#C4F542';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
  data?: {
    jobId?: string;
    serviceType?: string;
    startTime?: string;
    address?: string;
  };
}

export default function WorkerNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [providerId, setProviderId] = useState<string>('');

  const fetchNotifications = useCallback(async (pid: string, uid: string) => {
    try {
      const res = await fetch(`/api/provider/notifications?providerId=${pid}&userId=${uid}&limit=50`);
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const uid = localStorage.getItem('workerUserId');
    const pid = localStorage.getItem('workerProviderId');

    if (!uid || !pid) {
      router.push('/provider/login');
      return;
    }

    setUserId(uid);
    setProviderId(pid);
    fetchNotifications(pid, uid);
  }, [router, fetchNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      try {
        await fetch(`/api/provider/notifications/${notification.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ read: true }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate to link if available
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/provider/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, userId }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job_assigned':
        return <Briefcase className="w-5 h-5" style={{ color: LIME_GREEN }} />;
      default:
        return <Bell className="w-5 h-5 text-zinc-400" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <WorkerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: LIME_GREEN }} />
        </div>
      </WorkerLayout>
    );
  }

  return (
    <WorkerLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-semibold text-white">Notifications</h1>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        {/* Notification List */}
        {notifications.length === 0 ? (
          <div className="bg-[#1F1F1F] rounded-[20px] py-12 text-center border border-[#2A2A2A]">
            <Bell className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No notifications yet</p>
            <p className="text-zinc-500 text-sm mt-1">You&apos;ll see job updates here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full bg-[#1F1F1F] rounded-[20px] p-4 text-left border transition-colors ${
                  notification.read
                    ? 'border-[#2A2A2A]'
                    : 'border-[#C4F542]/30 bg-[#1F1F1F]'
                } hover:bg-[#2A2A2A]`}
              >
                <div className="flex gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notification.read ? 'bg-[#2A2A2A]' : 'bg-[#C4F542]/10'
                    }`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`font-medium ${
                          notification.read ? 'text-zinc-300' : 'text-white'
                        }`}
                      >
                        {notification.title}
                      </p>
                      <span className="text-xs text-zinc-500 whitespace-nowrap">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    {!notification.read && (
                      <div
                        className="w-2 h-2 rounded-full mt-2"
                        style={{ backgroundColor: LIME_GREEN }}
                      />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </WorkerLayout>
  );
}
