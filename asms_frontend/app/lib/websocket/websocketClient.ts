/**
 * WebSocket Client for Real-Time Notifications
 * Uses STOMP protocol over SockJS for live updates
 */

import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { WebSocketNotificationMessage } from '../types/notification.types';

// Configuration
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080';
const WS_ENDPOINT = '/ws/notifications';
const RECONNECT_DELAY = 5000; // 5 seconds
const HEARTBEAT_INTERVAL = 4000; // 4 seconds

/**
 * WebSocket Client Configuration
 */
export interface WebSocketConfig {
  userId: number;
  userRole: 'CUSTOMER' | 'ADMIN' | 'EMPLOYEE';
  token: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  onNotification: (notification: WebSocketNotificationMessage) => void;
}

/**
 * WebSocket Client Class
 * Manages STOMP connection for real-time notifications
 */
export class NotificationWebSocketClient {
  private client: Client | null = null;
  private subscriptions: StompSubscription[] = [];
  private config: WebSocketConfig | null = null;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;

  /**
   * Connect to WebSocket server
   */
  connect(config: WebSocketConfig): void {
    if (this.client?.connected) {
      console.log('✅ WebSocket already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('⏳ WebSocket connection in progress...');
      return;
    }

    this.config = config;
    this.isConnecting = true;

    console.log(`🔌 Connecting to WebSocket...`);
    console.log(`   User ID: ${config.userId}`);
    console.log(`   Role: ${config.userRole}`);

    // Create WebSocket URL with token authentication
    const wsUrl = `${WS_BASE_URL}${WS_ENDPOINT}?token=${config.token}`;

    // Create STOMP client
    this.client = new Client({
      // WebSocket factory using SockJS
      webSocketFactory: () => new SockJS(wsUrl) as any,

      // Connection headers
      connectHeaders: {
        Authorization: `Bearer ${config.token}`,
      },

      // Reconnection settings
      reconnectDelay: RECONNECT_DELAY,
      heartbeatIncoming: HEARTBEAT_INTERVAL,
      heartbeatOutgoing: HEARTBEAT_INTERVAL,

      // Debug logging (disable in production)
      debug: (str: string) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[STOMP] ${str}`);
        }
      },

      // On successful connection
      onConnect: (frame) => {
        console.log('✅ WebSocket Connected Successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        // Subscribe to notification topics
        this.subscribeToTopics();

        // Call onConnect callback
        if (this.config?.onConnect) {
          this.config.onConnect();
        }
      },

      // On STOMP error
      onStompError: (frame) => {
        console.error('❌ STOMP Error:', frame.headers['message']);
        console.error('   Details:', frame.body);
        this.isConnecting = false;

        if (this.config?.onError) {
          this.config.onError(frame);
        }
      },

      // On WebSocket close
      onWebSocketClose: (event) => {
        console.log('🔌 WebSocket Connection Closed');
        this.isConnecting = false;

        if (this.config?.onDisconnect) {
          this.config.onDisconnect();
        }

        // Attempt reconnection
        this.handleReconnect();
      },

      // On WebSocket error
      onWebSocketError: (error) => {
        console.error('❌ WebSocket Error:', error);
        this.isConnecting = false;

        if (this.config?.onError) {
          this.config.onError(error);
        }
      },
    });

    // Activate the connection
    this.client.activate();
  }

  /**
   * Subscribe to notification topics based on user role
   */
  private subscribeToTopics(): void {
    if (!this.client || !this.client.connected || !this.config) {
      console.error('❌ Cannot subscribe: Client not connected');
      return;
    }

    // Unsubscribe from previous subscriptions
    this.unsubscribeAll();

    const { userId, userRole, onNotification } = this.config;

    // Subscribe to user-specific topic
    const userTopic = `/topic/notifications/user.${userId}`;
    console.log(`📡 Subscribing to: ${userTopic}`);

    const userSubscription = this.client.subscribe(userTopic, (message: IMessage) => {
      try {
        const notification: WebSocketNotificationMessage = JSON.parse(message.body);
        console.log('📬 Received notification:', notification);
        onNotification(notification);
      } catch (error) {
        console.error('❌ Error parsing notification:', error);
      }
    });

    this.subscriptions.push(userSubscription);

    // If user is ADMIN, also subscribe to admin broadcast topic
    if (userRole === 'ADMIN') {
      const adminTopic = '/topic/notifications/admin';
      console.log(`📡 Subscribing to admin topic: ${adminTopic}`);

      const adminSubscription = this.client.subscribe(adminTopic, (message: IMessage) => {
        try {
          const notification: WebSocketNotificationMessage = JSON.parse(message.body);
          console.log('📬 Received admin notification:', notification);
          onNotification(notification);
        } catch (error) {
          console.error('❌ Error parsing admin notification:', error);
        }
      });

      this.subscriptions.push(adminSubscription);
    }

    console.log(`✅ Subscribed to ${this.subscriptions.length} topic(s)`);
  }

  /**
   * Unsubscribe from all topics
   */
  private unsubscribeAll(): void {
    this.subscriptions.forEach(subscription => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    });
    this.subscriptions = [];
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
      return;
    }

    if (!this.config) {
      console.error('❌ Cannot reconnect: No config available');
      return;
    }

    this.reconnectAttempts++;
    const delay = RECONNECT_DELAY * Math.pow(1.5, this.reconnectAttempts - 1);

    console.log(`🔄 Reconnecting in ${delay / 1000}s... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (this.config) {
        this.connect(this.config);
      }
    }, delay);
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    console.log('🔌 Disconnecting from WebSocket...');

    // Unsubscribe from all topics
    this.unsubscribeAll();

    // Deactivate client
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }

    this.config = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    console.log('✅ Disconnected successfully');
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  /**
   * Get connection state
   */
  getState(): 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' {
    if (this.client?.connected) return 'CONNECTED';
    if (this.isConnecting) return 'CONNECTING';
    return 'DISCONNECTED';
  }

  /**
   * Send a message to the server (if needed)
   */
  send(destination: string, body: any): void {
    if (!this.client?.connected) {
      console.error('❌ Cannot send: Client not connected');
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
  }
}

// Singleton instance
let clientInstance: NotificationWebSocketClient | null = null;

/**
 * Get or create WebSocket client instance
 */
export const getWebSocketClient = (): NotificationWebSocketClient => {
  if (!clientInstance) {
    clientInstance = new NotificationWebSocketClient();
  }
  return clientInstance;
};

/**
 * Helper function to connect with minimal config
 */
export const connectWebSocket = (
  userId: number,
  userRole: 'CUSTOMER' | 'ADMIN' | 'EMPLOYEE',
  token: string,
  onNotification: (notification: WebSocketNotificationMessage) => void
): NotificationWebSocketClient => {
  const client = getWebSocketClient();
  
  client.connect({
    userId,
    userRole,
    token,
    onNotification,
    onConnect: () => {
      console.log('🎉 Successfully connected to notification system');
    },
    onDisconnect: () => {
      console.log('👋 Disconnected from notification system');
    },
    onError: (error) => {
      console.error('⚠️ WebSocket error:', error);
    },
  });

  return client;
};

/**
 * Helper function to disconnect
 */
export const disconnectWebSocket = (): void => {
  if (clientInstance) {
    clientInstance.disconnect();
  }
};

export default NotificationWebSocketClient;
