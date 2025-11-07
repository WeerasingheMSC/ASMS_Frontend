/**
 * Example: Simple Notification Component
 * This shows the minimal setup needed for WebSocket notifications
 */

'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useNotifications,
  handleWebSocketNotification,
  requestNotificationPermission,
} from '@/app/lib/websocket';

export default function SimpleNotificationExample() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // Load user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      // Request permission for browser notifications
      requestNotificationPermission();
    }
  }, []);

  // Connect to WebSocket - that's it!
  const { isConnected } = useNotifications(
    user?.userId,
    user?.role,
    user?.token,
    (notification) => {
      // This runs when a new notification arrives
      console.log('New notification:', notification);

      // Show browser notification and play sound
      handleWebSocketNotification(notification, {
        showBrowserNotif: true,
        playSound: true,
        onNotificationClick: () => {
          // Navigate when notification clicked
          router.push(`/appointments/${notification.appointmentId}`);
        },
      });
    }
  );

  return (
    <div>
      <p>WebSocket: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
    </div>
  );
}
