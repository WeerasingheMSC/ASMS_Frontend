/**
 * React Hook for WebSocket Notifications
 * Provides easy integration of real-time notifications in React components
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { getWebSocketClient } from './websocketClient';
import type { WebSocketNotificationMessage } from '../types/notification.types';

/**
 * Hook configuration
 */
export interface UseWebSocketNotificationsConfig {
  userId: number | null;
  userRole: 'CUSTOMER' | 'ADMIN' | 'EMPLOYEE' | null;
  token: string | null;
  onNotification?: (notification: WebSocketNotificationMessage) => void;
  autoConnect?: boolean;
  debug?: boolean;
}

/**
 * Hook return value
 */
export interface UseWebSocketNotificationsReturn {
  isConnected: boolean;
  connectionState: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
  lastNotification: WebSocketNotificationMessage | null;
}

/**
 * React Hook for WebSocket Notifications
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isConnected, lastNotification } = useWebSocketNotifications({
 *     userId: user.id,
 *     userRole: user.role,
 *     token: user.token,
 *     onNotification: (notif) => {
 *       console.log('New notification:', notif);
 *       showToast(notif.title, notif.message);
 *     }
 *   });
 * 
 *   return (
 *     <div>
 *       Status: {isConnected ? 'Connected' : 'Disconnected'}
 *     </div>
 *   );
 * }
 * ```
 */
export const useWebSocketNotifications = (
  config: UseWebSocketNotificationsConfig
): UseWebSocketNotificationsReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'>('DISCONNECTED');
  const [error, setError] = useState<Error | null>(null);
  const [lastNotification, setLastNotification] = useState<WebSocketNotificationMessage | null>(null);
  
  const clientRef = useRef(getWebSocketClient());
  const configRef = useRef(config);

  // Update config ref when config changes
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Handle incoming notifications
  const handleNotification = useCallback((notification: WebSocketNotificationMessage) => {
    if (configRef.current.debug) {
      console.log('[useWebSocketNotifications] Received:', notification);
    }

    setLastNotification(notification);

    // Call custom handler if provided
    if (configRef.current.onNotification) {
      configRef.current.onNotification(notification);
    }
  }, []);

  // Connect function
  const connect = useCallback(() => {
    const { userId, userRole, token } = configRef.current;

    if (!userId || !userRole || !token) {
      const errorMsg = 'Cannot connect: Missing userId, userRole, or token';
      console.error(errorMsg);
      setError(new Error(errorMsg));
      return;
    }

    setError(null);
    setConnectionState('CONNECTING');

    clientRef.current.connect({
      userId,
      userRole,
      token,
      onNotification: handleNotification,
      onConnect: () => {
        setIsConnected(true);
        setConnectionState('CONNECTED');
        setError(null);
      },
      onDisconnect: () => {
        setIsConnected(false);
        setConnectionState('DISCONNECTED');
      },
      onError: (err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setConnectionState('DISCONNECTED');
      },
    });
  }, [handleNotification]);

  // Disconnect function
  const disconnect = useCallback(() => {
    clientRef.current.disconnect();
    setIsConnected(false);
    setConnectionState('DISCONNECTED');
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (config.autoConnect !== false && config.userId && config.userRole && config.token) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [config.userId, config.userRole, config.token, config.autoConnect, connect, disconnect]);

  return {
    isConnected,
    connectionState,
    error,
    connect,
    disconnect,
    lastNotification,
  };
};

/**
 * Simplified hook that auto-connects
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isConnected, lastNotification } = useNotifications(
 *     user.id,
 *     user.role,
 *     user.token,
 *     (notification) => {
 *       showToast(notification.title, notification.message);
 *     }
 *   );
 * }
 * ```
 */
export const useNotifications = (
  userId: number | null,
  userRole: 'CUSTOMER' | 'ADMIN' | 'EMPLOYEE' | null,
  token: string | null,
  onNotification?: (notification: WebSocketNotificationMessage) => void
): UseWebSocketNotificationsReturn => {
  return useWebSocketNotifications({
    userId,
    userRole,
    token,
    onNotification,
    autoConnect: true,
  });
};

export default useWebSocketNotifications;
