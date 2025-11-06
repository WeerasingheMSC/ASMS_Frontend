'use client'
import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import { getCustomerAppointments, AppointmentResponse } from '../lib/appointmentsApi'

export default function CustomerDashboard() {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [selectedService, setSelectedService] = useState<{
    title: string;
    description: string;
    benefits: string[];
  } | null>(null)
  
  // State for service image carousels
  const [serviceImages] = useState({
    repair: [
      '/services/repair1.jpg',
      '/services/repair2.jpg',
      '/services/repair3.jpg'
    ],
    washing: [
      '/services/washing1.jpg',
      '/services/washing2.jpg',
      '/services/washing3.jpg'
    ],
    checkup: [
      '/services/checkup1.jpg',
      '/services/checkup2.jpg',
      '/services/checkup3.jpg'
    ]
  })
  
  const [currentImageIndex, setCurrentImageIndex] = useState({
    repair: 0,
    washing: 0,
    checkup: 0
  })

  // Auto-rotate service images every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => ({
        repair: (prev.repair + 1) % serviceImages.repair.length,
        washing: (prev.washing + 1) % serviceImages.washing.length,
        checkup: (prev.checkup + 1) % serviceImages.checkup.length
      }))
    }, 3000)
    
    return () => clearInterval(interval)
  }, [serviceImages])

  // Helper function for greeting message
  const getGreetingMessage = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning! Ready to keep your vehicle in top shape?"
    if (hour < 18) return "Good Afternoon! Let's take care of your vehicle today."
    return "Good Evening! We're here to help with your automotive needs."
  }

  // Handle learn more button
  const handleLearnMore = (service: string) => {
    const serviceDetails = {
      repair: {
        title: 'Vehicle Repair Services',
        description: 'Our expert mechanics provide comprehensive repair services for all vehicle types. From engine repairs to transmission work, we handle it all with precision and care.',
        benefits: [
          'Certified and experienced mechanics',
          'State-of-the-art diagnostic equipment',
          'Quality parts and materials',
          'Comprehensive warranty on all repairs',
          '24/7 emergency repair services',
          'Free vehicle inspection with every repair'
        ]
      },
      washing: {
        title: 'Vehicle Washing & Detailing',
        description: 'Keep your vehicle looking brand new with our premium washing and detailing services. We use eco-friendly products and advanced techniques to ensure the best results.',
        benefits: [
          'Exterior hand wash and polish',
          'Interior deep cleaning and vacuuming',
          'Engine bay cleaning',
          'Wax and paint protection',
          'Odor removal and sanitization',
          'Eco-friendly cleaning products'
        ]
      },
      checkup: {
        title: 'Vehicle Condition Checkup',
        description: 'Regular maintenance and checkups are essential for your vehicle\'s longevity. Our comprehensive inspection covers all critical systems to keep your vehicle running smoothly.',
        benefits: [
          'Complete multi-point inspection',
          'Brake system evaluation',
          'Fluid level checks and top-ups',
          'Battery and electrical system testing',
          'Tire pressure and condition assessment',
          'Detailed inspection report with recommendations'
        ]
      }
    }
    
    setSelectedService(serviceDetails[service as keyof typeof serviceDetails])
    setShowServiceModal(true)
  }

  // Close modal
  const closeModal = () => {
    setShowServiceModal(false)
    setSelectedService(null)
  }

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
      <Sidebar activeItem='Dashboard' />
      
      <div className='flex-1 ml-[16.666667%] p-8 bg-gray-50 min-h-screen'>
        
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

       
        <div className='mb-8'>
          <h2 className='text-3xl font-bold text-gray-800 mb-6'>Our Services</h2>
          
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {/* Service 1: Vehicle Repair */}
            <div className='group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2'>
              {/* Image Container - Dynamic background color on hover */}
              <div className='relative h-48 bg-gradient-to-br from-blue-100 to-blue-50 group-hover:from-blue-200 group-hover:to-blue-100 transition-all duration-300 flex items-center justify-center overflow-hidden'>
                {/* Photos carousel - auto-rotate every 3 seconds */}
                {serviceImages.repair.map((imageSrc, index) => (
                  <img 
                    key={index}
                    src={imageSrc} 
                    alt={`Vehicle Repair ${index + 1}`} 
                    className={`absolute w-full h-full object-cover group-hover:scale-110 transition-all duration-1000 ${
                      index === currentImageIndex.repair ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ))}
                {/* Image indicators */}
                <div className='absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10'>
                  {serviceImages.repair.map((_, index) => (
                    <div 
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentImageIndex.repair ? 'bg-white w-6' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {/* Card Content */}
              <div className='p-6'>
                <h3 className='text-xl font-bold text-gray-800 mb-2'>Vehicle Repair</h3>
                <p className='text-gray-600 mb-4'>Professional repair services for all vehicle types. Expert mechanics ready to fix any issue.</p>
                <button 
                  onClick={() => handleLearnMore('repair')}
                  className='w-full bg-blue-800 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300'
                >
                  Learn More
                </button>
              </div>
            </div>

            {/* Service 2: Vehicle Washing */}
            <div className='group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2'>
              {/* Image Container - Dynamic background color on hover */}
              <div className='relative h-48 bg-gradient-to-br from-green-100 to-green-50 group-hover:from-green-200 group-hover:to-green-100 transition-all duration-300 flex items-center justify-center overflow-hidden'>
                {/* Photos carousel - auto-rotate every 3 seconds */}
                {serviceImages.washing.map((imageSrc, index) => (
                  <img 
                    key={index}
                    src={imageSrc} 
                    alt={`Vehicle Washing ${index + 1}`} 
                    className={`absolute w-full h-full object-cover group-hover:scale-110 transition-all duration-1000 ${
                      index === currentImageIndex.washing ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ))}
                {/* Image indicators */}
                <div className='absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10'>
                  {serviceImages.washing.map((_, index) => (
                    <div 
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentImageIndex.washing ? 'bg-white w-6' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {/* Card Content */}
              <div className='p-6'>
                <h3 className='text-xl font-bold text-gray-800 mb-2'>Vehicle Washing</h3>
                <p className='text-gray-600 mb-4'>Premium washing and detailing services. Keep your vehicle spotless and shining.</p>
                <button 
                  onClick={() => handleLearnMore('washing')}
                  className='w-full bg-blue-800 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300'
                >
                  Learn More
                </button>
              </div>
            </div>

            {/* Service 3: Condition Checkup */}
            <div className='group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2'>
              {/* Image Container - Dynamic background color on hover */}
              <div className='relative h-48 bg-gradient-to-br from-purple-100 to-purple-50 group-hover:from-purple-200 group-hover:to-purple-100 transition-all duration-300 flex items-center justify-center overflow-hidden'>
                {/* Photos carousel - auto-rotate every 3 seconds */}
                {serviceImages.checkup.map((imageSrc, index) => (
                  <img 
                    key={index}
                    src={imageSrc} 
                    alt={`Condition Checkup ${index + 1}`} 
                    className={`absolute w-full h-full object-cover group-hover:scale-110 transition-all duration-1000 ${
                      index === currentImageIndex.checkup ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ))}
                {/* Image indicators */}
                <div className='absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10'>
                  {serviceImages.checkup.map((_, index) => (
                    <div 
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentImageIndex.checkup ? 'bg-white w-6' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
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
          </div>
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

      {/* Service Details Modal Popup */}
      {showServiceModal && selectedService && (
        <div className='fixed inset-0 bg-none bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4' onClick={closeModal}>
          <div className='bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto' onClick={(e) => e.stopPropagation()}>
            <div className='sticky top-0 bg-gradient-to-r from-blue-900 to-blue-800 text-white p-6 rounded-t-2xl flex justify-between items-center'>
              <h2 className='text-3xl font-bold'>{selectedService.title}</h2>
              <button 
                onClick={closeModal}
                className='text-white hover:text-gray-200 text-3xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-300'
              >
                ×
              </button>
            </div>
            
            <div className='p-8'>
              <div className='mb-6'>
                <h3 className='text-xl font-semibold text-gray-800 mb-3'>Why Choose VX Service?</h3>
                <p className='text-gray-700 leading-relaxed text-lg'>
                  {selectedService.description}
                </p>
              </div>

              <div className='mb-6'>
                <h3 className='text-xl font-semibold text-gray-800 mb-4'>Key Benefits & Features</h3>
                <div className='space-y-3'>
                  {selectedService.benefits.map((benefit, index) => (
                    <div key={index} className='flex items-start gap-3 bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors duration-300'>
                      <svg className='w-6 h-6 text-blue-800 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M5 13l4 4L19 7' />
                      </svg>
                      <p className='text-gray-700 leading-relaxed'>{benefit}</p>
                    </div>
                  ))}
                </div>
              </div>

              
            </div>
          </div>
        </div>
      )}
    </div>
  )
}