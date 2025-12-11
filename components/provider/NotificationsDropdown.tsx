"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCircle, Calendar, Star, UserPlus, DollarSign, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  message: string;
  icon: string;
  timestamp: string;
  link?: string;
}

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
}

const iconMap: Record<string, any> = {
  CheckCircle,
  Calendar,
  Star,
  UserPlus,
  DollarSign,
  Bell,
};

const iconColors: Record<string, string> = {
  CheckCircle: 'text-emerald-400',
  Calendar: 'text-blue-400',
  Star: 'text-yellow-400',
  UserPlus: 'text-purple-400',
  DollarSign: 'text-green-400',
  Bell: 'text-zinc-400',
};

export default function NotificationsDropdown({ isOpen, onClose, providerId }: NotificationsDropdownProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && providerId) {
      fetchNotifications();
    }
  }, [isOpen, providerId]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/provider/notifications?providerId=${providerId}`);
      const data = await res.json();

      if (res.ok && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.link) {
      router.push(notification.link);
      onClose();
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
            <h3 className="text-base font-semibold text-zinc-100">Recent Activity</h3>
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
              <p className="text-sm text-zinc-400 text-center">No recent activity</p>
              <p className="text-xs text-zinc-600 text-center mt-1">
                Your notifications will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {notifications.map((notification) => {
                const IconComponent = iconMap[notification.icon] || Bell;
                const iconColor = iconColors[notification.icon] || 'text-zinc-400';

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full px-4 py-3 text-left transition-colors ${
                      notification.link ? 'hover:bg-zinc-800/50 cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 p-2 rounded-lg bg-zinc-800/50 ${iconColor}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 mb-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {formatTimeAgo(notification.timestamp)}
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
          <div className="border-t border-zinc-800 px-4 py-3">
            <button
              onClick={() => {
                // TODO: Mark all as read
                onClose();
              }}
              className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>
    </>
  );
}
