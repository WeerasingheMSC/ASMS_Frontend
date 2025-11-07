/**
 * Notification Types - Matching Backend DTOs
 * These types correspond to the backend Notification system
 */

// Enum matching backend NotificationType.java
export enum NotificationType {
  APPOINTMENT_CREATED = 'APPOINTMENT_CREATED',
  APPOINTMENT_CONFIRMED = 'APPOINTMENT_CONFIRMED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  EMPLOYEE_ASSIGNED = 'EMPLOYEE_ASSIGNED',
  STATUS_CHANGED_IN_SERVICE = 'STATUS_CHANGED_IN_SERVICE',
  STATUS_CHANGED_READY = 'STATUS_CHANGED_READY',
  STATUS_CHANGED_COMPLETED = 'STATUS_CHANGED_COMPLETED',
  GENERAL = 'GENERAL'
}

// Matches NotificationDTO.java
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  recipientId: number;
  appointmentId: number;
  isRead: boolean;
  createdAt: string; // ISO datetime string
  readAt?: string | null; // ISO datetime string
}

// Matches WebSocketNotificationMessage.java
export interface WebSocketNotificationMessage {
  notificationId: number;
  title: string;
  message: string;
  type: NotificationType;
  recipientId: number;
  appointmentId: number;
  timestamp: string; // ISO datetime string
}

// Frontend-specific helper interfaces
export interface NotificationFilter {
  unreadOnly?: boolean;
  page?: number;
  size?: number;
}

export interface PaginatedNotifications {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
