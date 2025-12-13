"use client"

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCircle,
  Calendar,
  Star,
  UserPlus,
  DollarSign,
  X,
  Clock,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
  onUnreadCountChange?: (count: number) => void;
}

// Map notification types to icons
const typeIconMap: Record<string, React.ElementType> = {
  time_off_request: Calendar,
  job_completed: CheckCircle,
  new_customer: UserPlus,
  payment_received: DollarSign,
  worker_clocked_in: Clock,
  job_created_by_worker: Plus,
  new_team_member: UserPlus,
  new_lead: Star,
};

// Map notification types to colors
const typeColorMap: Record<string, string> = {
  time_off_request: 'text-yellow-400 bg-yellow-400/10',
  job_completed: 'text-emerald-400 bg-emerald-400/10',
  new_customer: 'text-blue-400 bg-blue-400/10',
  payment_received: 'text-green-400 bg-green-400/10',
  worker_clocked_in: 'text-purple-400 bg-purple-400/10',
  job_created_by_worker: 'text-blue-400 bg-blue-400/10',
  new_team_member: 'text-purple-400 bg-purple-400/10',
  new_lead: 'text-yellow-400 bg-yellow-400/10',
};

export default function NotificationsDropdown({
  isOpen,
  onClose,
  providerId,
  onUnreadCountChange,
}: NotificationsDropdownProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!providerId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/provider/notifications?providerId=${providerId}&limit=20`);
      const data = await res.json();

      if (res.ok && data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
        onUnreadCountChange?.(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [providerId, onUnreadCountChange]);

  useEffect(() => {
    if (isOpen && providerId) {
      fetchNotifications();
    }
  }, [isOpen, providerId, fetchNotifications]);

  // Poll for new notifications every 60 seconds when open
  useEffect(() => {
    if (!isOpen || !providerId) return;

    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [isOpen, providerId, fetchNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      try {
        await fetch(`/api/provider/notifications/${notification.id}`, {
          method: 'PATCH',
        });
        // Update local state
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        onUnreadCountChange?.(Math.max(0, unreadCount - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate to link if present
    if (notification.link) {
      router.push(notification.link);
      onClose();
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('/api/provider/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      });

      if (res.ok) {
        // Update local state
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        onUnreadCountChange?.(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Dropdown Panel */}
      <div className="absolute right-0 top-full mt-2 w-96 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-50 max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-zinc-100">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded transition-colors"
          >
            <X className="h-4 w-4 text-zinc-400" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Bell className="h-12 w-12 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-400 text-center">No notifications</p>
              <p className="text-xs text-zinc-600 text-center mt-1">
                Your notifications will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {notifications.map((notification) => {
                const IconComponent = typeIconMap[notification.type] || AlertCircle;
                const colorClass = typeColorMap[notification.type] || 'text-zinc-400 bg-zinc-400/10';
                const [textColor, bgColor] = colorClass.split(' ');

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-zinc-800/50 ${
                      notification.link ? 'cursor-pointer' : 'cursor-default'
                    } ${!notification.read ? 'bg-zinc-800/30' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Unread indicator */}
                      {!notification.read && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}

                      {/* Icon */}
                      <div className={`relative flex-shrink-0 p-2 rounded-lg ${bgColor}`}>
                        <IconComponent className={`h-4 w-4 ${textColor}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium mb-0.5 ${!notification.read ? 'text-zinc-100' : 'text-zinc-300'}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-zinc-400 mb-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-zinc-800 px-4 py-3 flex justify-between items-center">
            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className={`text-sm font-medium transition-colors ${
                unreadCount > 0
                  ? 'text-emerald-400 hover:text-emerald-300'
                  : 'text-zinc-600 cursor-not-allowed'
              }`}
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>
    </>
  );
}
