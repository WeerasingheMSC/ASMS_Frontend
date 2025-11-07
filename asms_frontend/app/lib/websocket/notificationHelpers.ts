/**
 * Notification Helper Utilities
 * Browser notifications, toast messages, and notification formatting
 */

import type { WebSocketNotificationMessage, NotificationType } from '../types/notification.types';

/**
 * Request browser notification permission
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    console.log(`Notification permission: ${permission}`);
    return permission;
  }

  return Notification.permission;
};

/**
 * Show browser notification
 */
export const showBrowserNotification = (
  title: string,
  message: string,
  options?: {
    icon?: string;
    badge?: string;
    tag?: string;
    requireInteraction?: boolean;
    onClick?: () => void;
  }
): Notification | null => {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  try {
    const notification = new Notification(title, {
      body: message,
      icon: options?.icon || '/logo.png',
      badge: options?.badge || '/favicon.ico',
      tag: options?.tag,
      requireInteraction: options?.requireInteraction || false,
    });

    if (options?.onClick) {
      notification.onclick = () => {
        options.onClick!();
        notification.close();
      };
    }

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    return notification;
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
};

/**
 * Play notification sound
 */
export const playNotificationSound = (
  soundUrl: string = '/notification-sound.mp3',
  volume: number = 0.3
): void => {
  try {
    const audio = new Audio(soundUrl);
    audio.volume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
    audio.play().catch((error) => {
      // Silently fail if audio can't play (e.g., user hasn't interacted with page)
      if (process.env.NODE_ENV === 'development') {
        console.log('Audio play failed:', error.message);
      }
    });
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

/**
 * Get icon for notification type
 */
export const getNotificationIcon = (type: NotificationType): string => {
  const icons: Record<NotificationType, string> = {
    APPOINTMENT_CREATED: '📅',
    APPOINTMENT_CONFIRMED: '✅',
    APPOINTMENT_CANCELLED: '❌',
    EMPLOYEE_ASSIGNED: '👨‍🔧',
    STATUS_CHANGED_IN_SERVICE: '🔧',
    STATUS_CHANGED_READY: '✨',
    STATUS_CHANGED_COMPLETED: '🎉',
    GENERAL: '🔔',
  };

  return icons[type] || '🔔';
};

/**
 * Get color theme for notification type
 */
export const getNotificationColor = (type: NotificationType): {
  bg: string;
  text: string;
  border: string;
} => {
  const colors: Record<NotificationType, { bg: string; text: string; border: string }> = {
    APPOINTMENT_CREATED: {
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-200',
    },
    APPOINTMENT_CONFIRMED: {
      bg: 'bg-green-50',
      text: 'text-green-800',
      border: 'border-green-200',
    },
    APPOINTMENT_CANCELLED: {
      bg: 'bg-red-50',
      text: 'text-red-800',
      border: 'border-red-200',
    },
    EMPLOYEE_ASSIGNED: {
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-200',
    },
    STATUS_CHANGED_IN_SERVICE: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
    },
    STATUS_CHANGED_READY: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-800',
      border: 'border-indigo-200',
    },
    STATUS_CHANGED_COMPLETED: {
      bg: 'bg-green-50',
      text: 'text-green-800',
      border: 'border-green-200',
    },
    GENERAL: {
      bg: 'bg-gray-50',
      text: 'text-gray-800',
      border: 'border-gray-200',
    },
  };

  return colors[type] || colors.GENERAL;
};

/**
 * Format notification time (relative time)
 */
export const formatNotificationTime = (timestamp: string | Date): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  // Format as date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

/**
 * Handle WebSocket notification (all-in-one helper)
 */
export const handleWebSocketNotification = (
  notification: WebSocketNotificationMessage,
  options?: {
    showBrowserNotif?: boolean;
    playSound?: boolean;
    soundVolume?: number;
    onNotificationClick?: (notification: WebSocketNotificationMessage) => void;
  }
): void => {
  const {
    showBrowserNotif = true,
    playSound = true,
    soundVolume = 0.3,
    onNotificationClick,
  } = options || {};

  // Show browser notification
  if (showBrowserNotif && Notification.permission === 'granted') {
    showBrowserNotification(notification.title, notification.message, {
      icon: '/logo.png',
      tag: `notification-${notification.notificationId}`,
      onClick: () => {
        if (onNotificationClick) {
          onNotificationClick(notification);
        }
      },
    });
  }

  // Play sound
  if (playSound) {
    playNotificationSound('/notification-sound.mp3', soundVolume);
  }

  // Log to console (dev mode)
  if (process.env.NODE_ENV === 'development') {
    console.log('📬 Notification received:', {
      id: notification.notificationId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
    });
  }
};

/**
 * Get notification priority (for sorting)
 */
export const getNotificationPriority = (type: NotificationType): number => {
  const priorities: Record<NotificationType, number> = {
    APPOINTMENT_CANCELLED: 1, // Highest priority
    STATUS_CHANGED_COMPLETED: 2,
    APPOINTMENT_CONFIRMED: 3,
    EMPLOYEE_ASSIGNED: 4,
    STATUS_CHANGED_READY: 5,
    STATUS_CHANGED_IN_SERVICE: 6,
    APPOINTMENT_CREATED: 7,
    GENERAL: 8, // Lowest priority
  };

  return priorities[type] || 9;
};

/**
 * Sort notifications by priority and time
 */
export const sortNotifications = <T extends { type: NotificationType; timestamp: string }>(
  notifications: T[]
): T[] => {
  return [...notifications].sort((a, b) => {
    // First sort by priority
    const priorityDiff = getNotificationPriority(a.type) - getNotificationPriority(b.type);
    if (priorityDiff !== 0) return priorityDiff;

    // Then sort by time (newest first)
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
};

/**
 * Group notifications by date
 */
export const groupNotificationsByDate = <T extends { timestamp: string }>(
  notifications: T[]
): Record<string, T[]> => {
  const groups: Record<string, T[]> = {};

  notifications.forEach((notification) => {
    const date = new Date(notification.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let groupKey: string;

    if (date.toDateString() === today.toDateString()) {
      groupKey = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = 'Yesterday';
    } else if (date > new Date(today.getTime() - 7 * 86400000)) {
      groupKey = 'This Week';
    } else {
      groupKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
  });

  return groups;
};

/**
 * Check if notification is recent (within last 5 minutes)
 */
export const isRecentNotification = (timestamp: string | Date): boolean => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return diffMs < 300000; // 5 minutes
};

/**
 * Generate notification sound based on type
 */
export const getNotificationSoundUrl = (type: NotificationType): string => {
  // You can have different sounds for different types
  const sounds: Partial<Record<NotificationType, string>> = {
    APPOINTMENT_CANCELLED: '/sounds/alert.mp3',
    STATUS_CHANGED_COMPLETED: '/sounds/success.mp3',
    APPOINTMENT_CONFIRMED: '/sounds/confirm.mp3',
  };

  return sounds[type] || '/notification-sound.mp3';
};

export default {
  requestNotificationPermission,
  showBrowserNotification,
  playNotificationSound,
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTime,
  handleWebSocketNotification,
  getNotificationPriority,
  sortNotifications,
  groupNotificationsByDate,
  isRecentNotification,
  getNotificationSoundUrl,
};
