'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import ChatBot from './components/ChatBot'
import { getCustomerAppointments, AppointmentResponse } from '../lib/appointmentsApi'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function CustomerDashboard() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingServices, setLoadingServices] = useState(true)
  const [error, setError] = useState('')

  // Helper function for greeting message
  const getGreetingMessage = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning! Ready to keep your vehicle in top shape?"
    if (hour < 18) return "Good Afternoon! Let's take care of your vehicle today."
    return "Good Evening! We're here to help with your automotive needs."
  }

  useEffect(() => {
    fetchAppointments()
    fetchServices()
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

  const fetchServices = async () => {
    try {
      setLoadingServices(true)
      const response = await fetch(`${API_URL}/api/customer/services`)
      
      if (response.ok) {
        const data = await response.json()
        // Filter only active services for customer view
        const activeServices = data.filter((service: any) => service.isActive)
        setServices(activeServices)
      } else {
        console.error('Failed to fetch services')
      }
    } catch (err) {
      console.error('Error fetching services:', err)
    } finally {
      setLoadingServices(false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Maintenance': 'bg-blue-100 text-blue-800',
      'Repair': 'bg-orange-100 text-orange-800',
      'Inspection': 'bg-teal-100 text-teal-800',
      'Detailing': 'bg-purple-100 text-purple-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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
      <Sidebar activeItem='Dashboard' />
      
      <div className='flex-1 ml-[16.666667%] bg-gray-50 min-h-screen'>
        <Navbar />
        <div className='p-8 pt-24'>
          <div className='mb-8 animate-fade-in-down'>
          <div className='relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-900 to-blue-900 p-10 rounded-3xl shadow-2xl'>
            <div className='absolute inset-0 opacity-10'>
              <div className='absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16'></div>
              <div className='absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20'></div>
              <div className='absolute top-1/2 right-1/4 w-24 h-24 bg-white rounded-full'></div>
            </div>
            
            <div className='relative z-10'>
              <h1 className='text-6xl font-extrabold mb-4 text-white tracking-tight animate-bounce-in'>
                Welcome! <span className='inline-block animate-wave'>🔧</span>
              </h1>
              <p className='text-2xl text-white font-medium opacity-95 animate-slide-up leading-relaxed max-w-2xl'>
                {getGreetingMessage()}
              </p>
            </div>
          </div>
        </div>

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
        </div>

       
        {/* Our Services Section */}
        <div className='mb-8 mt-8'>
          <h2 className='text-3xl font-bold text-gray-800 mb-6'>Our Services</h2>
          
          {loadingServices ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No services available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => router.push(`/customer/services/${service.id}`)}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1"
                >
                  {/* Service Image */}
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center relative">
                    {service.serviceImage ? (
                      <img src={service.serviceImage} alt={service.serviceName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-white text-6xl">🔧</div>
                    )}
                  </div>

                  {/* Service Content */}
                  <div className="p-6">
                    {/* Title */}
                    <div className="mb-3">
                      <h3 className="text-xl font-bold text-gray-900">{service.serviceName}</h3>
                    </div>

                    {/* Category and Priority */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(service.category)}`}>
                        {service.category}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadgeColor(service.priority)}`}>
                        {service.priority}
                      </span>
                      {service.remainingSlots !== undefined && service.remainingSlots > 0 && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          {service.remainingSlots} slots left today
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {service.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
                    )}

                    {/* Service Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Duration:</span>
                        <span className="font-semibold text-gray-900">{service.estimatedDuration} hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Price:</span>
                        <span className="font-bold text-blue-600">LKR {service.basePrice.toLocaleString()}</span>
                      </div>
                      {service.requiredSkills && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Skills:</span>
                          <span className="font-semibold text-gray-900 text-right text-xs">{service.requiredSkills}</span>
                        </div>
                      )}
                    </div>

                    {/* View Details Button */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/customer/services/${service.id}`);
                        }}
                        className="w-full px-4 py-2 bg-blue-800 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Section */}
        {recentAppointments.length > 0 ? (
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
        ) : (
          <div className='mb-8 animate-fade-in-down'>
            <div className='bg-white rounded-2xl shadow-lg p-12 text-center'>
              <div className='max-w-md mx-auto'>
                <div className='mb-6'>
                  <svg className='w-24 h-24 mx-auto text-gray-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                  </svg>
                </div>
                <h3 className='text-2xl font-bold text-gray-800 mb-3'>We are looking for your appointment</h3>
                <p className='text-gray-600 mb-6'>You haven&apos;t scheduled an appointment yet. Book a service to track your vehicle&apos;s progress here.</p>
                <button className='bg-blue-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1'>
                  Book an Appointment
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      
      {/* ChatBot Component */}
      <ChatBot />
      </div>
    </div>
  )
}