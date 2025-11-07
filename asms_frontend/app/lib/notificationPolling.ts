import { useEffect, useRef } from 'react';
import { getAllNotifications, getUnreadNotificationCount } from './notificationsApi';
import type { Notification } from './types/notification.types';

/**
 * Notification Polling Service
 * Alternative to WebSocket for real-time notifications
 * Polls the backend every 30 seconds for new notifications
 */

type NotificationUpdateCallback = (notifications: Notification[], unreadCount: number) => void;

class NotificationPollingService {
  private intervalId: NodeJS.Timeout | null = null;
  private isPolling: boolean = false;
  private pollingInterval: number = 30000; // 30 seconds
  private callback: NotificationUpdateCallback | null = null;

  /**
   * Start polling for notifications
   * @param callback - Function to call with updated notifications
   * @param intervalMs - Polling interval in milliseconds (default: 30000)
   */
  startPolling(callback: NotificationUpdateCallback, intervalMs: number = 30000): void {
    if (this.isPolling) {
      console.log('⏱️ Polling already active');
      return;
    }

    this.callback = callback;
    this.pollingInterval = intervalMs;
    this.isPolling = true;

    console.log(`🔄 Starting notification polling (every ${intervalMs / 1000}s)`);

    // Initial fetch
    this.fetchNotifications();

    // Set up interval
    this.intervalId = setInterval(() => {
      this.fetchNotifications();
    }, this.pollingInterval);
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isPolling = false;
    this.callback = null;
    console.log('⏹️ Stopped notification polling');
  }

  /**
   * Fetch notifications and invoke callback
   */
  private async fetchNotifications(): Promise<void> {
    if (!this.callback) return;

    try {
      const [notifications, unreadCount] = await Promise.all([
        getAllNotifications({ size: 10 }),
        getUnreadNotificationCount(),
      ]);

      this.callback(notifications, unreadCount);
    } catch (error: any) {
      // Silently handle errors - errors are already logged in notificationsApi.ts
      // Just return empty data to keep UI working
      this.callback([], 0);
    }
  }

  /**
   * Check if polling is active
   */
  isActive(): boolean {
    return this.isPolling;
  }

  /**
   * Manually trigger a fetch (useful for immediate update after user action)
   */
  async fetchNow(): Promise<void> {
    await this.fetchNotifications();
  }
}

// Export singleton instance
export const notificationPollingService = new NotificationPollingService();

/**
 * React Hook for Notification Polling
 * Usage example:
 * 
 * import { useNotificationPolling } from './lib/notificationPolling';
 * 
 * function MyComponent() {
 *   const [notifications, setNotifications] = useState([]);
 *   const [unreadCount, setUnreadCount] = useState(0);
 *   
 *   useNotificationPolling((notifs, count) => {
 *     setNotifications(notifs);
 *     setUnreadCount(count);
 *   });
 * }
 */
export const useNotificationPolling = (
  callback: NotificationUpdateCallback,
  intervalMs: number = 30000
): void => {
  const callbackRef = useRef(callback);

  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Start polling with stable callback reference
    notificationPollingService.startPolling(
      (notifications, unreadCount) => {
        callbackRef.current(notifications, unreadCount);
      },
      intervalMs
    );

    // Cleanup on unmount
    return () => {
      notificationPollingService.stopPolling();
    };
  }, [intervalMs]);
};

export default notificationPollingService;
