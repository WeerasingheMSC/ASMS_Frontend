'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { IoNotificationsOutline } from 'react-icons/io5'
import { FaUserCircle } from 'react-icons/fa'
import { MdKeyboardArrowDown } from 'react-icons/md'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const Navbar = () => {
  const router = useRouter();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Mock notifications - replace with actual API call
    setNotifications([
      { id: 1, message: 'New project assigned to you', time: '5 min ago', read: false },
      { id: 2, message: 'Team meeting scheduled for tomorrow', time: '1 hour ago', read: false },
      { id: 3, message: 'Project deadline approaching', time: '2 hours ago', read: true }
    ]);
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
    localStorage.removeItem('user');
    router.push('/signin');
  };

  const handleProfileUpdate = () => {
    setShowProfileDropdown(false);
    router.push('/employee/profile');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className='h-16 bg-white shadow-amber-50 shadow-lg flex items-center justify-between px-6 border-b border-gray-200'>
      <div className='flex items-center'>
        <h2 className='text-xl font-semibold text-gray-800 flex gap-3'>Employee Dashboard</h2>
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
              <div className='p-4 border-b border-gray-200'>
                <h3 className='text-lg font-semibold text-gray-800'>Notifications</h3>
              </div>
              <div className='max-h-96 overflow-y-auto'>
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <p className='text-sm text-gray-800'>{notification.message}</p>
                      <p className='text-xs text-gray-500 mt-1'>{notification.time}</p>
                    </div>
                  ))
                ) : (
                  <div className='p-4 text-center text-gray-500'>No notifications</div>
                )}
              </div>
              <div className='p-3 border-t border-gray-200 text-center'>
                <button className='text-sm text-blue-600 hover:text-blue-700 font-semibold'>
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
              <p className='text-sm font-medium text-gray-800'>{user?.fullName || user?.name || 'Employee'}</p>
              <p className='text-xs text-gray-500'>{user?.role || 'Employee'}</p>
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
