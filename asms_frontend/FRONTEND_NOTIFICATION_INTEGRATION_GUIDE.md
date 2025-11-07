# Frontend Notification System Integration Guide

## Overview
This document explains the complete frontend notification system that has been integrated with your backend notification system. The system provides real-time notifications using WebSocket and REST API endpoints.

## Files Created/Modified

### 1. Type Definitions
**Location**: `app/lib/types/notification.types.ts`

Defines TypeScript interfaces that match your backend DTOs:
- `NotificationType` - Enum matching backend notification types
- `Notification` - Interface matching NotificationDTO.java
- `WebSocketNotificationMessage` - Interface matching WebSocketNotificationMessage.java
- Helper interfaces for pagination and filtering

### 2. REST API Helper
**Location**: `app/lib/notificationsApi.ts`

Provides functions to interact with backend REST endpoints:

#### Available Functions:
```typescript
// Get all notifications with optional pagination
getAllNotifications(filter?: NotificationFilter): Promise<Notification[]>

// Get only unread notifications
getUnreadNotifications(): Promise<Notification[]>

// Get count of unread notifications
getUnreadNotificationCount(): Promise<number>

// Mark a specific notification as read
markNotificationAsRead(notificationId: number): Promise<Notification>

// Mark all notifications as read
markAllNotificationsAsRead(): Promise<void>

// Delete a specific notification
deleteNotification(notificationId: number): Promise<void>

// Helper: Format timestamp (e.g., "5 min ago")
formatNotificationTime(timestamp: string): string

// Helper: Get styling based on notification type
getNotificationStyle(type: string): { colorClass: string; bgClass: string }
```

### 3. WebSocket Service
**Location**: `app/lib/notificationWebSocket.ts`

Handles real-time notification delivery using SockJS and STOMP:

#### Features:
- Automatic connection management
- Reconnection with exponential backoff
- User-specific topic subscriptions (`/topic/notifications/user.{userId}`)
- Admin topic subscription (`/topic/notifications/admin`)
- Connection status monitoring

#### Usage:
```typescript
import { notificationWebSocketService } from '@/app/lib/notificationWebSocket';

// Connect
notificationWebSocketService.connect(
  userId,
  userRole,
  (notification) => {
    console.log('New notification:', notification);
    // Handle notification
  }
);

// Disconnect
notificationWebSocketService.disconnect();

// Check connection status
if (notificationWebSocketService.isConnected()) {
  // Connected
}
```

### 4. Updated Components

#### Admin Navbar
**Location**: `app/Admin/components/Navbar.tsx`
- Real-time notifications via WebSocket
- REST API integration for fetching and managing notifications
- Unread count badge
- Click to mark as read
- Navigate to appointments on notification click

#### Customer Navbar
**Location**: `app/customer/components/Navbar.tsx`
- Same features as Admin Navbar
- Tailored for customer role
- Navigates to customer appointments

#### Employee Navbar (New)
**Location**: `app/employee/components/EmployeeNavbar.tsx`
- New component created for employee dashboard
- Same notification features
- Navigates to employee projects/services

#### Employee Layout
**Location**: `app/employee/layout.tsx`
- Updated to use new EmployeeNavbar component
- Replaces old static notification icon

## How It Works

### 1. Authentication
The system retrieves the authentication token from `localStorage`:
```typescript
const token = localStorage.getItem('authToken');
```

Ensure your login process stores the token:
```typescript
localStorage.setItem('authToken', response.data.token);
localStorage.setItem('user', JSON.stringify(userData));
```

### 2. User Information
The system expects user data in localStorage with this structure:
```typescript
{
  id: number,           // User ID (required for WebSocket)
  username: string,
  email: string,
  role: string,        // 'ADMIN', 'CUSTOMER', or 'EMPLOYEE'
  profileImage?: string
}
```

### 3. Notification Flow

#### Initial Load:
1. Component mounts
2. Fetches user from localStorage
3. Calls `getAllNotifications()` to load recent notifications
4. Calls `getUnreadNotificationCount()` to get unread count
5. Connects to WebSocket for real-time updates

#### Real-time Updates:
1. Backend sends notification via WebSocket
2. `handleWebSocketNotification()` callback is triggered
3. Notification is added to the list
4. Unread count is incremented
5. Browser notification is shown (if permission granted)

#### User Interactions:
- **Click notification**: Marks as read and navigates to related page
- **Mark all as read**: Marks all notifications as read
- **View all**: Navigates to relevant page

### 4. Browser Notifications
The system requests permission for browser notifications:
```typescript
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}
```

When a new notification arrives, a browser notification is shown:
```typescript
new Notification(title, {
  body: message,
  icon: '/logo.png',
});
```

## Backend Endpoints Used

### REST API Endpoints:
```
GET  /api/notifications              - Get all notifications
GET  /api/notifications/unread       - Get unread notifications
GET  /api/notifications/unread/count - Get unread count
PUT  /api/notifications/{id}/read    - Mark as read
PUT  /api/notifications/read-all     - Mark all as read
DELETE /api/notifications/{id}       - Delete notification
```

### WebSocket Endpoint:
```
WS /ws/notifications
```

### Topics:
```
/topic/notifications/user.{userId}  - User-specific notifications
/topic/notifications/admin          - Admin-only notifications
```

## Environment Configuration

Create a `.env.local` file in your project root:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=http://localhost:8080/ws/notifications
```

For production:
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_WS_URL=https://your-api-domain.com/ws/notifications
```

## Testing the Integration

### 1. Test REST API
```bash
# Get notifications
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/notifications

# Get unread count
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/notifications/unread/count

# Mark as read
curl -X PUT -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/notifications/1/read
```

### 2. Test WebSocket
1. Login to the application
2. Open browser console
3. Look for "WebSocket Connected Successfully" message
4. Look for "Subscribing to topic: /topic/notifications/user.{userId}"
5. Create an appointment or trigger a backend action
6. Watch for "Received notification:" in console

### 3. Test Notification Flow
1. **Admin Dashboard**: Create/approve an appointment
2. **Customer Dashboard**: Watch for notification
3. **Employee Dashboard**: Get assigned to an appointment
4. Click notification to navigate
5. Check that notification is marked as read

## Troubleshooting

### Issue: WebSocket not connecting
**Solution**: 
- Check CORS configuration in backend
- Verify WebSocket endpoint is accessible
- Check browser console for errors
- Ensure `NEXT_PUBLIC_WS_URL` is correct

### Issue: Notifications not showing
**Solution**:
- Check if user is logged in and has `id` in localStorage
- Verify authentication token is valid
- Check browser console for API errors
- Ensure backend NotificationService is working

### Issue: Real-time updates not working
**Solution**:
- Check WebSocket connection status
- Verify user ID matches backend recipientId
- Check backend logs for WebSocket messages
- Ensure correct topic subscription

### Issue: "401 Unauthorized" errors
**Solution**:
- Check if authToken is stored correctly
- Verify token format (should be "Bearer {token}")
- Check token expiration
- Re-login to get new token

## Notification Types and Styling

The system applies different colors based on notification type:

| Type | Color | Background |
|------|-------|-----------|
| APPOINTMENT_CREATED | Blue | Light Blue |
| APPOINTMENT_CONFIRMED | Green | Light Green |
| APPOINTMENT_CANCELLED | Red | Light Red |
| EMPLOYEE_ASSIGNED | Purple | Light Purple |
| STATUS_CHANGED_IN_SERVICE | Yellow | Light Yellow |
| STATUS_CHANGED_READY | Indigo | Light Indigo |
| STATUS_CHANGED_COMPLETED | Green | Light Green |
| GENERAL | Gray | Light Gray |

## Best Practices

1. **Always disconnect WebSocket on logout**:
   ```typescript
   const handleLogout = () => {
     notificationWebSocketService.disconnect();
     localStorage.clear();
     router.push('/signin');
   };
   ```

2. **Handle connection errors gracefully**:
   The WebSocket service automatically retries with exponential backoff (max 5 attempts).

3. **Optimize notification fetching**:
   Use pagination for large notification lists:
   ```typescript
   getAllNotifications({ page: 0, size: 10 })
   ```

4. **Mark notifications as read**:
   Always mark notifications as read when user interacts with them.

5. **Test with multiple users**:
   Open multiple browser windows/tabs with different users to test real-time updates.

## Future Enhancements

Consider implementing:
1. **Notification preferences** - Let users choose which notifications to receive
2. **Notification history page** - Dedicated page for all notifications
3. **Mark as unread** - Allow users to mark notifications as unread
4. **Delete notifications** - UI for deleting individual notifications
5. **Sound alerts** - Play sound when new notification arrives
6. **Email notifications** - Send email for important notifications
7. **Push notifications** - For mobile apps using PWA

## Dependencies Installed

```json
{
  "sockjs-client": "^1.6.1",
  "@stomp/stompjs": "^7.0.0"
}
```

## Support

If you encounter issues:
1. Check browser console for errors
2. Check backend logs for WebSocket and API errors
3. Verify network requests in browser DevTools
4. Ensure all environment variables are set correctly
5. Test REST endpoints independently using Postman/curl

## Summary

Your notification system is now fully integrated with:
✅ REST API for fetching and managing notifications
✅ WebSocket for real-time updates
✅ Browser notifications
✅ Unread count badges
✅ Mark as read functionality
✅ Navigation to related appointments
✅ Automatic reconnection handling
✅ Type-safe TypeScript interfaces
✅ Proper error handling

All three dashboards (Admin, Customer, Employee) now have working notification systems connected to your backend!
