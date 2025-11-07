/**
 * Example: Advanced Notification Panel
 * This shows a full-featured notification panel with all features
 */

'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useNotifications,
  handleWebSocketNotification,
  requestNotificationPermission,
  formatNotificationTime,
  getNotificationIcon,
  getNotificationColor,
  groupNotificationsByDate,
  sortNotifications,
} from '@/app/lib/websocket';
import type { WebSocketNotificationMessage } from '@/app/lib/websocket';

export default function AdvancedNotificationPanel() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<WebSocketNotificationMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  // Load user
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      requestNotificationPermission();
    }
  }, []);

  // Connect to WebSocket
  const { isConnected, connectionState, error } = useNotifications(
    user?.userId,
    user?.role,
    user?.token,
    (notification) => {
      console.log('📬 Received:', notification);

      // Add to notifications list
      setNotifications(prev => {
        const updated = [notification, ...prev];
        return sortNotifications(updated);
      });

      // Increment unread count
      setUnreadCount(prev => prev + 1);

      // Show browser notification and play sound
      handleWebSocketNotification(notification, {
        showBrowserNotif: true,
        playSound: true,
        soundVolume: 0.3,
        onNotificationClick: () => {
          handleNotificationClick(notification);
        },
      });
    }
  );

  // Handle notification click
  const handleNotificationClick = (notification: WebSocketNotificationMessage) => {
    setShowPanel(false);
    if (notification.appointmentId) {
      router.push(`/appointments/${notification.appointmentId}`);
    }
  };

  // Mark all as read
  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  // Group notifications by date
  const grouped = groupNotificationsByDate(notifications);

  return (
    <div className="relative">
      {/* Connection Status Indicator */}
      <div className="absolute top-0 right-0 m-2">
        <div className="flex items-center gap-2 text-xs">
          <span className={isConnected ? 'text-green-500' : 'text-red-500'}>
            {isConnected ? '🟢' : '🔴'}
          </span>
          <span className="text-gray-600">{connectionState}</span>
        </div>
      </div>

      {/* Notification Bell Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
              <p className="text-xs text-gray-500">
                {isConnected ? 'Live updates enabled' : 'Reconnecting...'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200">
              <p className="text-sm text-red-600">⚠️ {error.message}</p>
            </div>
          )}

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto">
            {Object.keys(grouped).length > 0 ? (
              Object.entries(grouped).map(([date, notifs]) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase">{date}</h4>
                  </div>

                  {/* Notifications */}
                  {notifs.map((notification) => {
                    const colors = getNotificationColor(notification.type);
                    const icon = getNotificationIcon(notification.type);

                    return (
                      <div
                        key={notification.notificationId}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${colors.bg}`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <span className="text-2xl flex-shrink-0">{icon}</span>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-sm ${colors.text}`}>
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <span className="text-xs text-gray-500 mt-2 inline-block">
                              {formatNotificationTime(notification.timestamp)}
                            </span>
                          </div>

                          {/* Unread indicator */}
                          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <span className="text-4xl">📭</span>
                <p className="text-gray-500 mt-2">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  You'll be notified about appointment updates
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 text-center">
            <button
              onClick={() => {
                setShowPanel(false);
                router.push('/notifications');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
