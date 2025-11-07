import axios from 'axios';
import type { Notification, NotificationFilter, PaginatedNotifications } from './types/notification.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Notification API Helper
 * Provides functions to interact with the backend NotificationController endpoints
 */

/**
 * Get authentication token from localStorage
 * Checks both 'authToken' and 'user.token' fields
 */
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    // First check if there's a separate authToken
    let token = localStorage.getItem('authToken');
    
    // If not, check if token is stored within user object
    if (!token) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          token = user.token || user.jwt || user.accessToken || null;
          
          if (token) {
            console.log('✅ Token found in user object');
          } else {
            console.warn('⚠️ No token found in user object. Available fields:', Object.keys(user));
          }
        } catch (e) {
          console.error('❌ Error parsing user data:', e);
        }
      } else {
        console.warn('⚠️ No user data in localStorage');
      }
    } else {
      console.log('✅ Token found in authToken field');
    }
    
    return token;
  }
  return null;
};

/**
 * Get axios config with authentication header
 */
const getAuthConfig = () => {
  const token = getAuthToken();
  
  if (!token) {
    console.warn('⚠️ No authentication token found. Please ensure you are logged in.');
  }
  
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  };
};

/**
 * GET /api/notifications
 * Get all notifications for the authenticated user with optional pagination
 * @param filter - Optional filter parameters (page, size, unreadOnly)
 * @returns Promise<PaginatedNotifications | Notification[]>
 */
export const getAllNotifications = async (
  filter?: NotificationFilter
): Promise<Notification[]> => {
  try {
    const params = new URLSearchParams();
    
    if (filter?.page !== undefined) {
      params.append('page', filter.page.toString());
    }
    if (filter?.size !== undefined) {
      params.append('size', filter.size.toString());
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await axios.get(
      `${API_URL}/api/notifications${queryString}`,
      getAuthConfig()
    );
    
    // Backend returns data wrapped in ApiResponse { success, message, data }
    return response.data.data || response.data || [];
  } catch (error: any) {
    if (error.response?.status === 403) {
      console.error('❌ Authentication failed. Token may be invalid or missing.');
      console.error('Token present:', !!getAuthToken());
      console.error('User data:', localStorage.getItem('user') ? 'Present' : 'Missing');
    } else if (error.response?.status === 500) {
      console.warn('⚠️ Backend error (500). Returning empty notifications. This is normal if database is empty.');
      return []; // Return empty array instead of throwing error
    }
    console.error('Error fetching notifications:', error);
    return []; // Return empty array for any error
  }
};

/**
 * GET /api/notifications/unread
 * Get only unread notifications for the authenticated user
 * @returns Promise<Notification[]>
 */
export const getUnreadNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await axios.get(
      `${API_URL}/api/notifications/unread`,
      getAuthConfig()
    );
    // Backend returns data wrapped in ApiResponse { success, message, data }
    return response.data.data || response.data || [];
  } catch (error: any) {
    if (error.response?.status === 500) {
      console.warn('⚠️ Backend error (500). Returning empty notifications.');
      return [];
    }
    console.error('Error fetching unread notifications:', error);
    return [];
  }
};

/**
 * GET /api/notifications/unread/count
 * Get count of unread notifications for the authenticated user
 * @returns Promise<number>
 */
export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    const response = await axios.get(
      `${API_URL}/api/notifications/unread/count`,
      getAuthConfig()
    );
    // Backend returns data wrapped in ApiResponse { success, message, data }
    return response.data.data || response.data || 0;
  } catch (error: any) {
    if (error.response?.status === 500) {
      console.warn('⚠️ Backend error (500). Returning 0 unread notifications.');
      return 0;
    }
    console.error('Error fetching unread notification count:', error);
    return 0;
  }
};

/**
 * PUT /api/notifications/{id}/read
 * Mark a specific notification as read
 * @param notificationId - The ID of the notification to mark as read
 * @returns Promise<any>
 */
export const markNotificationAsRead = async (
  notificationId: number
): Promise<any> => {
  try {
    const response = await axios.put(
      `${API_URL}/api/notifications/${notificationId}/read`,
      {},
      getAuthConfig()
    );
    // Backend returns ApiResponse { success, message }
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the authenticated user
 * @returns Promise<void>
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    await axios.put(
      `${API_URL}/api/notifications/read-all`,
      {},
      getAuthConfig()
    );
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * DELETE /api/notifications/{id}
 * Delete a specific notification
 * @param notificationId - The ID of the notification to delete
 * @returns Promise<void>
 */
export const deleteNotification = async (notificationId: number): Promise<void> => {
  try {
    await axios.delete(
      `${API_URL}/api/notifications/${notificationId}`,
      getAuthConfig()
    );
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Helper function to format notification timestamp for display
 * @param timestamp - ISO datetime string
 * @returns Formatted time string (e.g., "5 min ago", "2 hours ago")
 */
export const formatNotificationTime = (timestamp: string): string => {
  const now = new Date();
  const notificationTime = new Date(timestamp);
  const diffInMs = now.getTime() - notificationTime.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else {
    return notificationTime.toLocaleDateString();
  }
};

/**
 * Helper function to get notification icon/color based on type
 * @param type - NotificationType
 * @returns Object with icon class and color class
 */
export const getNotificationStyle = (type: string): { colorClass: string; bgClass: string } => {
  switch (type) {
    case 'APPOINTMENT_CREATED':
      return { colorClass: 'text-blue-600', bgClass: 'bg-blue-50' };
    case 'APPOINTMENT_CONFIRMED':
      return { colorClass: 'text-green-600', bgClass: 'bg-green-50' };
    case 'APPOINTMENT_CANCELLED':
      return { colorClass: 'text-red-600', bgClass: 'bg-red-50' };
    case 'EMPLOYEE_ASSIGNED':
      return { colorClass: 'text-purple-600', bgClass: 'bg-purple-50' };
    case 'STATUS_CHANGED_IN_SERVICE':
      return { colorClass: 'text-yellow-600', bgClass: 'bg-yellow-50' };
    case 'STATUS_CHANGED_READY':
      return { colorClass: 'text-indigo-600', bgClass: 'bg-indigo-50' };
    case 'STATUS_CHANGED_COMPLETED':
      return { colorClass: 'text-green-600', bgClass: 'bg-green-50' };
    default:
      return { colorClass: 'text-gray-600', bgClass: 'bg-gray-50' };
  }
};
