'use client'
import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import { getCustomerAppointments, AppointmentResponse } from '../lib/appointmentsApi'

export default function CustomerDashboard() {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const data = await getCustomerAppointments()
      setAppointments(data)
      setError('')
    } catch (err) {
      console.error('Error fetching appointments:', err)
      setError('Failed to load appointments')
      setAppointments([]) // Fallback to empty array
    } finally {
      setLoading(false)
    }
  }

  // Calculate dashboard statistics
  const upcomingAppointments = appointments.filter(apt => 
    apt.status === 'PENDING' || apt.status === 'CONFIRMED'
  ).length

  const completedAppointments = appointments.filter(apt => 
    apt.status === 'COMPLETED'
  ).length

  // Get recent appointments (last 3, sorted by date)
  const recentAppointments = appointments
    .sort((a, b) => new Date(b.createdAt || b.appointmentDate).getTime() - new Date(a.createdAt || a.appointmentDate).getTime())
    .slice(0, 3)

  // Utility functions
  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return '1 day ago'
    if (diffInDays < 7) return `${diffInDays} days ago`
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks === 1) return '1 week ago'
    return `${diffInWeeks} weeks ago`
  }

  const getStatusStyles = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return { bg: 'bg-green-100', text: 'text-green-600' }
      case 'PENDING':
        return { bg: 'bg-yellow-100', text: 'text-yellow-600' }
      case 'CONFIRMED':
        return { bg: 'bg-blue-100', text: 'text-blue-600' }
      case 'CANCELLED':
        return { bg: 'bg-red-100', text: 'text-red-600' }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600' }
    }
  }
  return (
    <div className='flex'>
      {/* Sidebar Component */}
      <Sidebar activeItem='Dashboard' />
      
      {/* Main Content Area */}
      <div className='flex-1 p-8 bg-gray-50'>
        <header className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-800'>Customer Dashboard</h1>
          <p className='text-gray-600 mt-2'>Welcome back! Here's your overview.</p>
        </header>

        {/* Dashboard Cards Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {/* Card 1 - Appointments */}
          <div className='bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-xl font-semibold text-gray-800'>My Appointments</h3>
              <div className='bg-blue-100 p-3 rounded-full'>
                <svg className='w-6 h-6 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                </svg>
              </div>
            </div>
            <p className='text-gray-600'>View and manage your service appointments</p>
            <div className='mt-4'>
              {loading ? (
                <span className='text-gray-500'>Loading...</span>
              ) : (
                <>
                  <span className='text-2xl font-bold text-blue-600'>{upcomingAppointments}</span>
                  <span className='text-gray-500 ml-2'>Upcoming</span>
                </>
              )}
            </div>
          </div>

          {/* Card 2 - Services */}
          <div className='bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-xl font-semibold text-gray-800'>Available Services</h3>
              <div className='bg-green-100 p-3 rounded-full'>
                <svg className='w-6 h-6 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                </svg>
              </div>
            </div>
            <p className='text-gray-600'>Browse our service offerings</p>
            <div className='mt-4'>
              <span className='text-2xl font-bold text-green-600'>12</span>
              <span className='text-gray-500 ml-2'>Services</span>
            </div>
          </div>

          {/* Card 3 - Profile */}
          <div className='bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-xl font-semibold text-gray-800'>My Profile</h3>
              <div className='bg-purple-100 p-3 rounded-full'>
                <svg className='w-6 h-6 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                </svg>
              </div>
            </div>
            <p className='text-gray-600'>Update your personal information</p>
            <div className='mt-4'>
              <span className='text-purple-600 font-semibold'>View Profile</span>
            </div>
          </div>

          {/* Card 4 - Service History */}
          <div className='bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-xl font-semibold text-gray-800'>Service History</h3>
              <div className='bg-orange-100 p-3 rounded-full'>
                <svg className='w-6 h-6 text-orange-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
              </div>
            </div>
            <p className='text-gray-600'>View your past service records</p>
            <div className='mt-4'>
              {loading ? (
                <span className='text-gray-500'>Loading...</span>
              ) : (
                <>
                  <span className='text-2xl font-bold text-orange-600'>{completedAppointments}</span>
                  <span className='text-gray-500 ml-2'>Completed</span>
                </>
              )}
            </div>
          </div>

          {/* Card 5 - Reports */}
          <div className='bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-xl font-semibold text-gray-800'>Reports</h3>
              <div className='bg-red-100 p-3 rounded-full'>
                <svg className='w-6 h-6 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
              </div>
            </div>
            <p className='text-gray-600'>Access your service reports</p>
            <div className='mt-4'>
              <span className='text-red-600 font-semibold'>View All</span>
            </div>
          </div>

          {/* Card 6 - Settings */}
          <div className='bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-xl font-semibold text-gray-800'>Settings</h3>
              <div className='bg-gray-100 p-3 rounded-full'>
                <svg className='w-6 h-6 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' />
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                </svg>
              </div>
            </div>
            <p className='text-gray-600'>Manage your preferences</p>
            <div className='mt-4'>
              <span className='text-gray-600 font-semibold'>Configure</span>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className='mt-8 bg-white p-6 rounded-lg shadow-md'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4'>Recent Activity</h2>
          <div className='space-y-4'>
            {loading ? (
              <div className='flex items-center justify-center py-8'>
                <div className='text-gray-500'>Loading recent activities...</div>
              </div>
            ) : error ? (
              <div className='flex items-center justify-center py-8'>
                <div className='text-red-500'>{error}</div>
              </div>
            ) : recentAppointments.length === 0 ? (
              <div className='flex items-center justify-center py-8'>
                <div className='text-gray-500'>No recent appointments found</div>
              </div>
            ) : (
              recentAppointments.map((appointment, index) => {
                const appointmentDate = new Date(appointment.appointmentDate)
                const isUpcoming = appointmentDate > new Date()
                const timeAgo = getTimeAgo(appointmentDate)
                
                return (
                  <div key={appointment.id} className={`flex items-center justify-between ${index < recentAppointments.length - 1 ? 'border-b pb-3' : ''}`}>
                    <div className='flex items-center gap-4'>
                      <div className={`p-2 rounded-full ${getStatusStyles(appointment.status).bg}`}>
                        <svg className={`w-5 h-5 ${getStatusStyles(appointment.status).text}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          {appointment.status === 'COMPLETED' ? (
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                          ) : appointment.status === 'PENDING' ? (
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                          ) : (
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                          )}
                        </svg>
                      </div>
                      <div>
                        <p className='font-semibold text-gray-800'>{appointment.serviceType}</p>
                        <p className='text-sm text-gray-500'>
                          {isUpcoming ? `${timeAgo} at ${appointment.timeSlot}` : timeAgo}
                        </p>
                        <p className='text-xs text-gray-400'>{appointment.vehicleBrand} {appointment.model}</p>
                      </div>
                    </div>
                    <span className={`font-semibold ${getStatusStyles(appointment.status).text}`}>
                      {appointment.status.charAt(0) + appointment.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
