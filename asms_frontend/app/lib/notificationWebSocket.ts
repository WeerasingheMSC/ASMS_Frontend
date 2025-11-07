import { useEffect } from 'react';
import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { WebSocketNotificationMessage } from './types/notification.types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws/notifications';

/**
 * WebSocket Notification Service
 * Handles real-time notification delivery using SockJS and STOMP
 */

type NotificationCallback = (notification: WebSocketNotificationMessage) => void;

class NotificationWebSocketService {
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private userId: number | null = null;
  private userRole: string | null = null;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;

  /**
   * Connect to WebSocket and subscribe to user-specific notifications
   * @param userId - The ID of the current user
   * @param userRole - The role of the user (CUSTOMER, EMPLOYEE, ADMIN)
   * @param onNotification - Callback function to handle incoming notifications
   */
  connect(userId: number, userRole: string, onNotification: NotificationCallback): void {
    if (this.client?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('WebSocket connection in progress');
      return;
    }

    this.userId = userId;
    this.userRole = userRole.toUpperCase();
    this.isConnecting = true;

    // Get authentication token
    const token = this.getAuthToken();
    if (!token) {
      console.error('❌ No authentication token found. Cannot connect to WebSocket.');
      this.isConnecting = false;
      return;
    }

    try {
      // Create WebSocket URL with token as query parameter
      const wsUrlWithToken = `${WS_URL}?token=${token}`;
      
      console.log('🔌 Attempting WebSocket connection to:', WS_URL);
      
      // Create STOMP client with SockJS
      this.client = new Client({
        webSocketFactory: () => new SockJS(wsUrlWithToken) as any,
        
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },

        debug: (str) => {
          console.log('STOMP Debug:', str);
        },

        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        onConnect: () => {
          console.log('✅ WebSocket Connected Successfully');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.subscribeToNotifications(onNotification);
        },

        onStompError: (frame) => {
          console.error('❌ STOMP Error:', frame.headers['message']);
          console.error('Error Details:', frame.body);
          this.isConnecting = false;
        },

        onWebSocketClose: () => {
          console.log('🔌 WebSocket Connection Closed');
          this.isConnecting = false;
          this.handleReconnect(userId, userRole, onNotification);
        },

        onWebSocketError: (error) => {
          console.error('❌ WebSocket Error:', error);
          this.isConnecting = false;
        },
      });

      // Activate the STOMP client
      this.client.activate();
    } catch (error) {
      console.error('❌ Error creating WebSocket connection:', error);
      this.isConnecting = false;
      this.handleReconnect(userId, userRole, onNotification);
    }
  }

  /**
   * Get authentication token from localStorage
   */
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      let token = localStorage.getItem('authToken');
      
      if (!token) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            token = user.token || user.jwt || user.accessToken || null;
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }
      }
      
      return token;
    }
    return null;
  }

  /**
   * Subscribe to notification topics based on user role
   */
  private subscribeToNotifications(onNotification: NotificationCallback): void {
    if (!this.client || !this.client.connected) {
      console.error('Cannot subscribe: WebSocket not connected');
      return;
    }

    // Unsubscribe from previous subscription if exists
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    // Subscribe to user-specific topic
    const userTopic = `/topic/notifications/user.${this.userId}`;
    
    console.log(`Subscribing to topic: ${userTopic}`);

    this.subscription = this.client.subscribe(userTopic, (message) => {
      try {
        const notification: WebSocketNotificationMessage = JSON.parse(message.body);
        console.log('Received notification:', notification);
        onNotification(notification);
      } catch (error) {
        console.error('Error parsing notification message:', error);
      }
    });

    // For admins, also subscribe to general admin topic
    if (this.userRole === 'ADMIN') {
      const adminTopic = '/topic/notifications/admin';
      console.log(`Subscribing to admin topic: ${adminTopic}`);
      
      this.client.subscribe(adminTopic, (message) => {
        try {
          const notification: WebSocketNotificationMessage = JSON.parse(message.body);
          console.log('Received admin notification:', notification);
          onNotification(notification);
        } catch (error) {
          console.error('Error parsing admin notification message:', error);
        }
      });
    }
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(
    userId: number,
    userRole: string,
    onNotification: NotificationCallback
  ): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached. Please refresh the page.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(`Attempting to reconnect in ${delay / 1000} seconds... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect(userId, userRole, onNotification);
    }, delay);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }

    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }

    this.userId = null;
    this.userRole = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    console.log('WebSocket Disconnected');
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.client?.connected || false;
  }

  /**
   * Send a test notification (for testing purposes)
   * This would typically be done from the backend
   */
  sendTestNotification(recipientId: number, message: string): void {
    if (!this.client?.connected) {
      console.error('Cannot send notification: WebSocket not connected');
      return;
    }

    this.client.publish({
      destination: '/app/notifications/test',
      body: JSON.stringify({
        recipientId,
        message,
      }),
    });
  }
}

// Export singleton instance
export const notificationWebSocketService = new NotificationWebSocketService();

/**
 * React Hook for WebSocket notifications
 * Usage example:
 * 
 * import { useNotificationWebSocket } from './lib/notificationWebSocket';
 * 
 * function MyComponent() {
 *   const handleNotification = (notification) => {
 *     console.log('New notification:', notification);
 *     // Update state, show toast, etc.
 *   };
 *   
 *   useNotificationWebSocket(userId, userRole, handleNotification);
 * }
 */
export const useNotificationWebSocket = (
  userId: number | null,
  userRole: string | null,
  onNotification: NotificationCallback
): void => {
  if (typeof window === 'undefined') return; // Skip on server-side

  // Connect when component mounts
  useEffect(() => {
    if (userId && userRole) {
      notificationWebSocketService.connect(userId, userRole, onNotification);
    }

    // Disconnect when component unmounts
    return () => {
      notificationWebSocketService.disconnect();
    };
  }, [userId, userRole, onNotification]);
};

// For non-React usage
export default notificationWebSocketService;
