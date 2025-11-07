'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { IoNotificationsOutline } from 'react-icons/io5'
import { FaUserCircle } from 'react-icons/fa'
import { MdKeyboardArrowDown } from 'react-icons/md'
import { 
  getAllNotifications, 
  getUnreadNotificationCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  formatNotificationTime,
  getNotificationStyle 
} from '@/app/lib/notificationsApi'
import { notificationWebSocketService } from '@/app/lib/notificationWebSocket'
import type { Notification, WebSocketNotificationMessage } from '@/app/lib/types/notification.types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const Navbar = () => {
  const router = useRouter();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const data = await getAllNotifications({ size: 10 });
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Handle incoming WebSocket notification
  const handleWebSocketNotification = (wsNotification: WebSocketNotificationMessage) => {
    console.log('Received real-time notification:', wsNotification);
    
    // Convert WebSocket message to Notification object
    const newNotification: Notification = {
      id: wsNotification.notificationId,
      title: wsNotification.title,
      message: wsNotification.message,
      type: wsNotification.type,
      recipientId: wsNotification.recipientId,
      appointmentId: wsNotification.appointmentId,
      isRead: false,
      createdAt: wsNotification.timestamp,
      readAt: null
    };

    // Add to notifications list
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Optional: Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(wsNotification.title, {
        body: wsNotification.message,
        icon: '/logo.png',
      });
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Fetch initial notifications
      fetchNotifications();
      fetchUnreadCount();

      // Connect to WebSocket for real-time notifications
      const userId = parsedUser.userId || parsedUser.id;
      if (userId) {
        console.log('🔌 Connecting to WebSocket with userId:', userId, 'role:', parsedUser.role);
        notificationWebSocketService.connect(
          userId,
          parsedUser.role || 'ADMIN',
          handleWebSocketNotification
        );
      } else {
        console.warn('⚠️ No user ID found for WebSocket connection');
      }

      // Request browser notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    // Cleanup WebSocket on unmount
    return () => {
      notificationWebSocketService.disconnect();
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    notificationWebSocketService.disconnect();
    localStorage.removeItem('user');
    router.push('/signin');
  };

  const handleProfileUpdate = () => {
    setShowProfileDropdown(false);
    router.push('/Admin/Profile');
  };

  // Mark single notification as read
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    // Navigate to appointment details if needed
    if (notification.appointmentId) {
      router.push(`/Admin/Appointments?id=${notification.appointmentId}`);
      setShowNotifications(false);
    }
  };

  return (
    <div className='h-16 bg-white shadow-amber-50 shadow-lg flex items-center justify-between px-6 border-b border-gray-200'>
      <div className='flex items-center'>
        <h2 className='text-xl font-semibold text-gray-800 flex gap-3'>Admin Dashboard</h2>
      </div>

      <div className='flex items-center gap-6'>
        {/* Notifications */}
        <div className='relative' ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className='relative p-2 hover:bg-gray-100 rounded-full transition-colors'
          >
            <IoNotificationsOutline className='text-2xl text-gray-600' />
            {unreadCount > 0 && (
              <span className='absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold'>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className='absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50'>
              <div className='p-4 border-b border-gray-200 flex justify-between items-center'>
                <h3 className='text-lg font-semibold text-gray-800'>Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className='text-xs text-blue-600 hover:text-blue-700 font-semibold'
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className='max-h-96 overflow-y-auto'>
                {isLoadingNotifications ? (
                  <div className='p-4 text-center text-gray-500'>Loading...</div>
                ) : notifications.length > 0 ? (
                  notifications.map(notification => {
                    const style = getNotificationStyle(notification.type);
                    return (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.isRead ? style.bgClass : ''
                        }`}
                      >
                        <div className='flex items-start gap-2'>
                          <div className={`w-2 h-2 rounded-full mt-1 ${!notification.isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                          <div className='flex-1'>
                            <p className='text-sm font-semibold text-gray-800'>{notification.title}</p>
                            <p className='text-sm text-gray-600 mt-1'>{notification.message}</p>
                            <p className='text-xs text-gray-500 mt-1'>{formatNotificationTime(notification.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className='p-4 text-center text-gray-500'>No notifications</div>
                )}
              </div>
              <div className='p-3 border-t border-gray-200 text-center'>
                <button 
                  onClick={() => {
                    setShowNotifications(false);
                    // Navigate to notifications page if you have one
                  }}
                  className='text-sm text-blue-600 hover:text-blue-700 font-semibold'
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className='relative' ref={profileRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className='flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors'
          >
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt='Profile'
                className='w-9 h-9 rounded-full border-2 border-blue-500 object-cover'
              />
            ) : (
              <FaUserCircle className='text-3xl text-gray-600' />
            )}
            <div className='text-left hidden md:block'>
              <p className='text-xs text-gray-500'>{user?.role || 'Administrator'}</p>
            </div>
            <MdKeyboardArrowDown
              className={`text-xl text-gray-600 transition-transform ${
                showProfileDropdown ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileDropdown && (
            <div className='absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50'>
              <div className='py-2'>
                <button
                  onClick={handleProfileUpdate}
                  className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors'
                >
                  Update Profile
                </button>
                <button
                  onClick={handleLogout}
                  className='w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors'
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
