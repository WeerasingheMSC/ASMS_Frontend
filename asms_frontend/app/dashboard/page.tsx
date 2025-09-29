'use client';

import React, { useState, useEffect } from 'react';
import { 
  FaUser, 
  FaCog, 
  FaSignOutAlt, 
  FaCar, 
  FaTools, 
  FaClipboardList, 
  FaUsers,
  FaChartBar,
  FaCalendarAlt
} from 'react-icons/fa';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const DashboardPage = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get user info from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // Redirect to signin if no user data
      window.location.href = '/signin';
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const getRoleDisplayName = (role: string) => {
    switch(role) {
      case 'ROLE_CUSTOMER': return 'Customer';
      case 'ROLE_MECHANIC': return 'Mechanic';
      case 'ROLE_ADMIN': return 'Administrator';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'ROLE_CUSTOMER': return 'bg-blue-500';
      case 'ROLE_MECHANIC': return 'bg-green-500';
      case 'ROLE_ADMIN': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getMenuItems = (role: string) => {
    const baseItems = [
      { icon: FaUser, label: 'Profile', color: 'bg-blue-500' },
      { icon: FaCog, label: 'Settings', color: 'bg-gray-500' },
    ];

    switch(role) {
      case 'ROLE_CUSTOMER':
        return [
          { icon: FaCar, label: 'My Vehicles', color: 'bg-blue-500' },
          { icon: FaCalendarAlt, label: 'Appointments', color: 'bg-green-500' },
          { icon: FaClipboardList, label: 'Service History', color: 'bg-yellow-500' },
          ...baseItems
        ];
      case 'ROLE_MECHANIC':
        return [
          { icon: FaTools, label: 'Work Orders', color: 'bg-green-500' },
          { icon: FaCalendarAlt, label: 'Schedule', color: 'bg-blue-500' },
          { icon: FaClipboardList, label: 'Parts Inventory', color: 'bg-yellow-500' },
          { icon: FaCar, label: 'Vehicle Database', color: 'bg-purple-500' },
          ...baseItems
        ];
      case 'ROLE_ADMIN':
        return [
          { icon: FaChartBar, label: 'Analytics', color: 'bg-purple-500' },
          { icon: FaUsers, label: 'User Management', color: 'bg-blue-500' },
          { icon: FaTools, label: 'Service Management', color: 'bg-green-500' },
          { icon: FaClipboardList, label: 'Reports', color: 'bg-yellow-500' },
          { icon: FaCar, label: 'Fleet Management', color: 'bg-red-500' },
          ...baseItems
        ];
      default:
        return baseItems;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const menuItems = getMenuItems(user.role);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/logo.png" alt="ASMS" className="h-10 w-10 rounded-full" />
              <h1 className="ml-3 text-xl font-semibold text-gray-900">
                Auto Service Management System
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-white text-sm ${getRoleColor(user.role)}`}>
                {getRoleDisplayName(user.role)}
              </div>
              <span className="text-gray-700">{user.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FaSignOutAlt className="h-5 w-5" />
                <span className="ml-1 hidden sm:block">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome back, {user.name}!
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {getRoleDisplayName(user.role)} Dashboard
            </p>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 ${item.color} rounded-md p-3`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            {item.label}
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            Click to access
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <a href="#" className="font-medium text-cyan-700 hover:text-cyan-900">
                        View details
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="mt-8">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Overview
            </h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FaClipboardList className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Services
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {user.role === 'ROLE_CUSTOMER' ? '12' : user.role === 'ROLE_MECHANIC' ? '45' : '156'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FaCalendarAlt className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {user.role === 'ROLE_CUSTOMER' ? 'Appointments' : 'Scheduled'}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {user.role === 'ROLE_CUSTOMER' ? '3' : user.role === 'ROLE_MECHANIC' ? '8' : '24'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FaCar className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {user.role === 'ROLE_CUSTOMER' ? 'My Vehicles' : 'Vehicles'}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {user.role === 'ROLE_CUSTOMER' ? '2' : user.role === 'ROLE_MECHANIC' ? '15' : '89'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FaChartBar className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {user.role === 'ROLE_CUSTOMER' ? 'Spending' : user.role === 'ROLE_MECHANIC' ? 'Earnings' : 'Revenue'}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          ${user.role === 'ROLE_CUSTOMER' ? '1,250' : user.role === 'ROLE_MECHANIC' ? '3,400' : '12,500'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;