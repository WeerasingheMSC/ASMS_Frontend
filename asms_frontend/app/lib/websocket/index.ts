/**
 * Central export for all WebSocket and Notification utilities
 * Import everything you need from this single file
 */

// WebSocket Client
export {
  NotificationWebSocketClient,
  getWebSocketClient,
  connectWebSocket,
  disconnectWebSocket,
  type WebSocketConfig,
} from './websocketClient';

// React Hooks
export {
  useWebSocketNotifications,
  useNotifications,
  type UseWebSocketNotificationsConfig,
  type UseWebSocketNotificationsReturn,
} from './useWebSocketNotifications';

// Notification Helpers
export {
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
  default as notificationHelpers,
} from './notificationHelpers';

// Re-export types
export type {
  Notification,
  NotificationType,
  WebSocketNotificationMessage,
  NotificationFilter,
} from '../types/notification.types';

/**
 * Quick Start Guide:
 * 
 * 1. In your component:
 * ```tsx
 * import { useNotifications, handleWebSocketNotification } from '@/app/lib/websocket';
 * 
 * function MyComponent() {
 *   const user = getUserFromAuth();
 *   
 *   const { isConnected, lastNotification } = useNotifications(
 *     user.userId,
 *     user.role,
 *     user.token,
 *     (notification) => {
 *       handleWebSocketNotification(notification, {
 *         showBrowserNotif: true,
 *         playSound: true,
 *         onNotificationClick: () => {
 *           // Navigate to notification details
 *           router.push(`/appointments/${notification.appointmentId}`);
 *         }
 *       });
 *     }
 *   );
 * 
 *   return <div>Connected: {isConnected ? '✅' : '❌'}</div>;
 * }
 * ```
 * 
 * 2. For non-React usage:
 * ```ts
 * import { connectWebSocket, disconnectWebSocket } from '@/app/lib/websocket';
 * 
 * // Connect
 * const client = connectWebSocket(
 *   userId,
 *   userRole,
 *   token,
 *   (notification) => {
 *     console.log('Received:', notification);
 *   }
 * );
 * 
 * // Disconnect
 * disconnectWebSocket();
 * ```
 */

import * as websocketClient from './websocketClient';
import * as websocketHooks from './useWebSocketNotifications';
import * as helpers from './notificationHelpers';

export default {
  // Client
  ...websocketClient,
  
  // Hooks
  ...websocketHooks,
  
  // Helpers
  ...helpers,
};
