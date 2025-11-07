# Notification API Quick Reference

## 📡 REST API Endpoints

### Get All Notifications
```typescript
import { getAllNotifications } from '@/app/lib/notificationsApi';

// Get all notifications
const notifications = await getAllNotifications();

// With pagination
const notifications = await getAllNotifications({ page: 0, size: 10 });
```
**Endpoint**: `GET /api/notifications?page=0&size=10`

---

### Get Unread Notifications
```typescript
import { getUnreadNotifications } from '@/app/lib/notificationsApi';

const unreadNotifications = await getUnreadNotifications();
```
**Endpoint**: `GET /api/notifications/unread`

---

### Get Unread Count
```typescript
import { getUnreadNotificationCount } from '@/app/lib/notificationsApi';

const count = await getUnreadNotificationCount();
```
**Endpoint**: `GET /api/notifications/unread/count`

---

### Mark as Read
```typescript
import { markNotificationAsRead } from '@/app/lib/notificationsApi';

await markNotificationAsRead(notificationId);
```
**Endpoint**: `PUT /api/notifications/{id}/read`

---

### Mark All as Read
```typescript
import { markAllNotificationsAsRead } from '@/app/lib/notificationsApi';

await markAllNotificationsAsRead();
```
**Endpoint**: `PUT /api/notifications/read-all`

---

### Delete Notification
```typescript
import { deleteNotification } from '@/app/lib/notificationsApi';

await deleteNotification(notificationId);
```
**Endpoint**: `DELETE /api/notifications/{id}`

---

## 🔌 WebSocket Integration

### Connect to WebSocket
```typescript
import { notificationWebSocketService } from '@/app/lib/notificationWebSocket';

notificationWebSocketService.connect(
  userId,           // User ID from localStorage
  userRole,         // 'ADMIN', 'CUSTOMER', or 'EMPLOYEE'
  (notification) => {
    // Handle new notification
    console.log('New notification:', notification);
  }
);
```
**Endpoint**: `WS /ws/notifications`

---

### Disconnect
```typescript
notificationWebSocketService.disconnect();
```

---

### Check Connection Status
```typescript
if (notificationWebSocketService.isConnected()) {
  console.log('WebSocket is connected');
}
```

---

## 🎨 Helper Functions

### Format Time
```typescript
import { formatNotificationTime } from '@/app/lib/notificationsApi';

const timeAgo = formatNotificationTime(notification.createdAt);
// Output: "5 min ago", "2 hours ago", etc.
```

---

### Get Notification Style
```typescript
import { getNotificationStyle } from '@/app/lib/notificationsApi';

const { colorClass, bgClass } = getNotificationStyle(notification.type);
// Returns: { colorClass: 'text-blue-600', bgClass: 'bg-blue-50' }
```

---

## 📦 TypeScript Types

### Notification Type
```typescript
import type { Notification } from '@/app/lib/types/notification.types';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  recipientId: number;
  appointmentId: number;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
}
```

---

### NotificationType Enum
```typescript
import { NotificationType } from '@/app/lib/types/notification.types';

enum NotificationType {
  APPOINTMENT_CREATED = 'APPOINTMENT_CREATED',
  APPOINTMENT_CONFIRMED = 'APPOINTMENT_CONFIRMED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  EMPLOYEE_ASSIGNED = 'EMPLOYEE_ASSIGNED',
  STATUS_CHANGED_IN_SERVICE = 'STATUS_CHANGED_IN_SERVICE',
  STATUS_CHANGED_READY = 'STATUS_CHANGED_READY',
  STATUS_CHANGED_COMPLETED = 'STATUS_CHANGED_COMPLETED',
  GENERAL = 'GENERAL'
}
```

---

### WebSocket Message Type
```typescript
import type { WebSocketNotificationMessage } from '@/app/lib/types/notification.types';

interface WebSocketNotificationMessage {
  notificationId: number;
  title: string;
  message: string;
  type: NotificationType;
  recipientId: number;
  appointmentId: number;
  timestamp: string;
}
```

---

## 🔐 Authentication

All API calls automatically include the Bearer token from localStorage:
```typescript
const token = localStorage.getItem('authToken');
// Automatically added to headers: Authorization: Bearer {token}
```

---

## 📍 WebSocket Topics

### User-Specific Topic
```
/topic/notifications/user.{userId}
```
Each user subscribes to their own topic based on their ID.

### Admin Topic
```
/topic/notifications/admin
```
Admin users also subscribe to this general admin topic.

---

## 🎯 Usage Examples

### Complete Notification Panel Example
```typescript
'use client'
import React, { useState, useEffect } from 'react';
import { 
  getAllNotifications, 
  getUnreadNotificationCount,
  markNotificationAsRead,
  formatNotificationTime,
  getNotificationStyle
} from '@/app/lib/notificationsApi';
import { notificationWebSocketService } from '@/app/lib/notificationWebSocket';
import type { Notification, WebSocketNotificationMessage } from '@/app/lib/types/notification.types';

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial notifications
  useEffect(() => {
    const fetchData = async () => {
      const notifs = await getAllNotifications({ size: 10 });
      const count = await getUnreadNotificationCount();
      setNotifications(notifs);
      setUnreadCount(count);
    };
    fetchData();

    // Connect WebSocket
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      notificationWebSocketService.connect(
        user.id,
        user.role,
        handleNewNotification
      );
    }

    return () => notificationWebSocketService.disconnect();
  }, []);

  // Handle new WebSocket notification
  const handleNewNotification = (wsNotif: WebSocketNotificationMessage) => {
    const newNotif: Notification = {
      id: wsNotif.notificationId,
      title: wsNotif.title,
      message: wsNotif.message,
      type: wsNotif.type,
      recipientId: wsNotif.recipientId,
      appointmentId: wsNotif.appointmentId,
      isRead: false,
      createdAt: wsNotif.timestamp,
    };
    setNotifications(prev => [newNotif, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  // Mark as read
  const handleClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => prev - 1);
    }
  };

  return (
    <div>
      {notifications.map(notification => {
        const style = getNotificationStyle(notification.type);
        return (
          <div 
            key={notification.id}
            onClick={() => handleClick(notification)}
            className={!notification.isRead ? style.bgClass : ''}
          >
            <h4>{notification.title}</h4>
            <p>{notification.message}</p>
            <span>{formatNotificationTime(notification.createdAt)}</span>
          </div>
        );
      })}
    </div>
  );
}
```

---

## 🐛 Error Handling

All API functions throw errors that should be caught:
```typescript
try {
  const notifications = await getAllNotifications();
} catch (error) {
  console.error('Failed to fetch notifications:', error);
  // Handle error (show toast, etc.)
}
```

---

## 🌐 Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=http://localhost:8080/ws/notifications
```

---

## 📱 Browser Notifications

Request permission:
```typescript
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}
```

Show notification:
```typescript
if (Notification.permission === 'granted') {
  new Notification(title, {
    body: message,
    icon: '/logo.png',
  });
}
```

---

## 🔄 Automatic Features

The notification system automatically:
- ✅ Adds Bearer token to all requests
- ✅ Reconnects WebSocket on disconnect (max 5 attempts)
- ✅ Subscribes to appropriate topics based on user role
- ✅ Handles connection errors gracefully
- ✅ Cleans up WebSocket on component unmount

---

## 📚 Additional Resources

- **Full Guide**: `FRONTEND_NOTIFICATION_INTEGRATION_GUIDE.md`
- **Setup Checklist**: `NOTIFICATION_SETUP_CHECKLIST.md`
- **Backend Summary**: `NOTIFICATION_SYSTEM_SUMMARY.md`
