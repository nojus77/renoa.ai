import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export type NotificationType =
  | 'time_off_request'
  | 'job_completed'
  | 'new_customer'
  | 'payment_received'
  | 'worker_clocked_in'
  | 'job_created_by_worker'
  | 'new_team_member';

interface CreateNotificationParams {
  providerId: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  data?: Prisma.InputJsonValue;
}

export async function createNotification({
  providerId,
  userId,
  type,
  title,
  message,
  link,
  data,
}: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        providerId,
        userId,
        type,
        title,
        message,
        link,
        data: data ?? Prisma.JsonNull,
      },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

export async function getUnreadNotificationCount(providerId: string, userId?: string) {
  try {
    const whereClause: Record<string, unknown> = {
      providerId,
      read: false,
    };

    // If userId is provided, get notifications for that user OR general notifications (userId = null)
    if (userId) {
      whereClause.OR = [{ userId }, { userId: null }];
      delete whereClause.userId;
    }

    return await prisma.notification.count({
      where: whereClause,
    });
  } catch (error) {
    console.error('Error getting notification count:', error);
    return 0;
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return null;
  }
}

export async function markAllNotificationsAsRead(providerId: string, userId?: string) {
  try {
    const whereClause: Record<string, unknown> = {
      providerId,
      read: false,
    };

    if (userId) {
      whereClause.OR = [{ userId }, { userId: null }];
    }

    return await prisma.notification.updateMany({
      where: whereClause,
      data: { read: true },
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return null;
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    return await prisma.notification.delete({
      where: { id: notificationId },
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return null;
  }
}
