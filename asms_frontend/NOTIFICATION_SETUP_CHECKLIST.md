# Notification System - Quick Setup Checklist

## ✅ Completed Setup

### Frontend Files Created:
- [x] `app/lib/types/notification.types.ts` - TypeScript type definitions
- [x] `app/lib/notificationsApi.ts` - REST API helper functions
- [x] `app/lib/notificationWebSocket.ts` - WebSocket service
- [x] `app/employee/components/EmployeeNavbar.tsx` - Employee navbar with notifications

### Frontend Files Updated:
- [x] `app/Admin/components/Navbar.tsx` - Integrated real notifications
- [x] `app/customer/components/Navbar.tsx` - Integrated real notifications
- [x] `app/employee/layout.tsx` - Using new EmployeeNavbar

### Dependencies Installed:
- [x] `sockjs-client` - WebSocket client library
- [x] `@stomp/stompjs` - STOMP protocol for WebSocket

## 🔧 Configuration Required

### 1. Environment Variables
Create or update `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=http://localhost:8080/ws/notifications
```

**Status**: ⚠️ **ACTION REQUIRED** - Please verify these values

### 2. Backend CORS Configuration
Ensure your backend allows WebSocket connections from your frontend:

In your Spring Boot application, verify `WebSocketConfig.java`:
```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/notifications")
                .setAllowedOrigins("http://localhost:3000", "YOUR_FRONTEND_URL")
                .withSockJS();
    }
}
```

**Status**: ⚠️ **ACTION REQUIRED** - Verify CORS settings in backend

### 3. Authentication Token Storage
Ensure your login process stores the authentication token:

In your signin logic (e.g., `app/signin/page.tsx`):
```typescript
// After successful login:
localStorage.setItem('authToken', response.data.token);
localStorage.setItem('user', JSON.stringify({
  id: userData.id,
  username: userData.username,
  email: userData.email,
  role: userData.role, // 'ADMIN', 'CUSTOMER', or 'EMPLOYEE'
  profileImage: userData.profileImage
}));
```

**Status**: ⚠️ **ACTION REQUIRED** - Verify token storage in your login component

## 🧪 Testing Checklist

### Backend Verification:
- [ ] Backend server is running
- [ ] WebSocket endpoint `/ws/notifications` is accessible
- [ ] REST API endpoints are working:
  - [ ] `GET /api/notifications`
  - [ ] `GET /api/notifications/unread/count`
  - [ ] `PUT /api/notifications/{id}/read`
  - [ ] `PUT /api/notifications/read-all`
- [ ] NotificationService is integrated with AppointmentService
- [ ] Test notifications are being created when appointments change

### Frontend Verification:
- [ ] Run `npm run dev` to start frontend
- [ ] Login as Admin user
  - [ ] See notification icon in navbar
  - [ ] Click to open notification panel
  - [ ] Check browser console for WebSocket connection
- [ ] Login as Customer user
  - [ ] See notification icon in navbar
  - [ ] Create an appointment
  - [ ] Wait for admin approval
  - [ ] Check if notification appears
- [ ] Login as Employee user
  - [ ] See notification icon in navbar
  - [ ] Get assigned to an appointment
  - [ ] Check if notification appears

### WebSocket Testing:
- [ ] Open browser DevTools console
- [ ] Look for: `"WebSocket Connected Successfully"`
- [ ] Look for: `"Subscribing to topic: /topic/notifications/user.{userId}"`
- [ ] Trigger a notification from backend
- [ ] Look for: `"Received notification:"`
- [ ] Check if notification badge updates
- [ ] Check if notification appears in panel

### Interaction Testing:
- [ ] Click on a notification
  - [ ] Notification is marked as read
  - [ ] Unread count decreases
  - [ ] Navigate to relevant page
- [ ] Click "Mark all as read"
  - [ ] All notifications marked as read
  - [ ] Unread count becomes 0
- [ ] Create new appointment
  - [ ] Real-time notification appears
  - [ ] Browser notification shows (if permission granted)

## 🐛 Common Issues and Solutions

### Issue 1: WebSocket Connection Fails
**Symptoms**: Console shows "WebSocket Error" or connection timeouts

**Solutions**:
1. Check if backend WebSocket endpoint is accessible: `http://localhost:8080/ws/notifications`
2. Verify CORS settings allow your frontend origin
3. Check if SockJS fallback is enabled in backend
4. Try accessing endpoint in browser to check connectivity

**Test Command**:
```bash
curl -I http://localhost:8080/ws/notifications
```

### Issue 2: 401 Unauthorized Errors
**Symptoms**: API calls return 401 errors

**Solutions**:
1. Check if authToken exists in localStorage
2. Verify token format: Should be stored as just the token value
3. Check if token is expired (login again)
4. Verify backend JWT validation is working

**Test in Console**:
```javascript
console.log(localStorage.getItem('authToken'));
console.log(localStorage.getItem('user'));
```

### Issue 3: Notifications Not Appearing
**Symptoms**: No notifications show up even when created

**Solutions**:
1. Check if user ID is correct in localStorage
2. Verify backend is sending to correct topic
3. Check browser console for errors
4. Verify recipientId matches user ID

**Debug Steps**:
```javascript
// In browser console:
const user = JSON.parse(localStorage.getItem('user'));
console.log('User ID:', user?.id);
console.log('User Role:', user?.role);
```

### Issue 4: Real-time Updates Not Working
**Symptoms**: Have to refresh to see new notifications

**Solutions**:
1. Check WebSocket connection status
2. Verify subscription to correct topic
3. Check if backend is publishing to WebSocket
4. Look for errors in backend logs

## 📋 Quick Test Script

Run this in browser console after logging in:
```javascript
// Check setup
console.log('Auth Token:', localStorage.getItem('authToken') ? 'Present' : 'Missing');
console.log('User Data:', JSON.parse(localStorage.getItem('user')));

// Test API
fetch('http://localhost:8080/api/notifications/unread/count', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
  }
})
.then(r => r.json())
.then(count => console.log('Unread Count:', count))
.catch(err => console.error('API Error:', err));
```

## 🚀 Deployment Checklist

When deploying to production:
- [ ] Update environment variables for production URLs
- [ ] Update CORS settings in backend for production domain
- [ ] Test WebSocket connection over HTTPS (WSS)
- [ ] Verify SSL certificates for WebSocket
- [ ] Test notification delivery in production
- [ ] Set up monitoring for WebSocket connections
- [ ] Configure production logging

## 📖 Documentation References

- **Frontend Integration Guide**: `FRONTEND_NOTIFICATION_INTEGRATION_GUIDE.md`
- **Backend Guide**: `NOTIFICATION_SYSTEM_GUIDE.md` (if available)
- **Backend Summary**: `NOTIFICATION_SYSTEM_SUMMARY.md`

## 🎯 Next Steps

1. **Verify Environment Setup**: Check all environment variables
2. **Test Backend**: Ensure all endpoints are working
3. **Test Frontend**: Follow testing checklist above
4. **Fix Issues**: Use troubleshooting guide for any problems
5. **Production Deploy**: Follow deployment checklist

## 💡 Tips

1. **Keep Browser Console Open**: It shows WebSocket connection status and errors
2. **Test with Multiple Users**: Open different browsers/incognito windows
3. **Check Network Tab**: Monitor WebSocket frames and API calls
4. **Backend Logs**: Watch backend console for notification creation
5. **Reload Page**: After updating environment variables

## ✅ Sign-off Checklist

Before considering setup complete:
- [ ] All environment variables configured
- [ ] Backend CORS allows frontend origin
- [ ] Authentication tokens are stored correctly
- [ ] WebSocket connects successfully
- [ ] REST API calls work
- [ ] Notifications appear in real-time
- [ ] Mark as read functionality works
- [ ] Navigation from notifications works
- [ ] Works for Admin, Customer, and Employee roles
- [ ] Browser notifications work (optional)

---

**Last Updated**: November 7, 2025
**Status**: ✅ Frontend Integration Complete - Backend Verification Required
