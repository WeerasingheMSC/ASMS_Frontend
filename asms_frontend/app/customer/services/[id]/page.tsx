'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import ChatBot from '../../components/ChatBot'
import { IoArrowBack, IoTimeOutline, IoPricetagOutline, IoCheckmarkCircle } from 'react-icons/io5'
import { FaTools, FaCalendarAlt } from 'react-icons/fa'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface ServiceDetails {
  id: number;
  serviceName: string;
  category: string;
  description: string;
  estimatedDuration: number;
  basePrice: number;
  requiredSkills: string;
  priority: string;
  maxDailySlots: number;
  availableSlots: number;
  serviceImage: string;
  additionalNotes: string;
  isActive: boolean;
  todayBookings?: number;
  remainingSlots?: number;
  availableToday?: boolean;
}

export default function ServiceDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const serviceId = params.id as string

  const [service, setService] = useState<ServiceDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (serviceId) {
      fetchServiceDetails()
    }
  }, [serviceId])

  const fetchServiceDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/customer/services`)
      
      if (response.ok) {
        const data = await response.json()
        const foundService = data.find((s: ServiceDetails) => s.id === parseInt(serviceId))
        
        if (foundService && foundService.isActive) {
          setService(foundService)
        } else {
          setError('Service not found or not available')
        }
      } else {
        setError('Failed to load service details')
      }
    } catch (err) {
      console.error('Error fetching service details:', err)
      setError('An error occurred while loading service details')
    } finally {
      setLoading(false)
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

  const handleBookService = () => {
    // Navigate to booking page or open booking wizard
    router.push('/customer/my-appointments') // Adjust this path as needed
  }

  if (loading) {
    return (
      <div className='flex h-screen bg-gray-50'>
        <Sidebar activeItem='Dashboard' />
        <div className='flex-1 ml-[16.666667%]'>
          <Navbar />
          <div className='flex items-center justify-center h-full pt-24'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <p className='text-gray-600 text-lg'>Loading service details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className='flex h-screen bg-gray-50'>
        <Sidebar activeItem='Dashboard' />
        <div className='flex-1 ml-[16.666667%]'>
          <Navbar />
          <div className='flex items-center justify-center h-full pt-24'>
            <div className='text-center bg-white p-8 rounded-lg shadow-md max-w-md'>
              <div className='text-red-500 text-6xl mb-4'>⚠️</div>
              <h2 className='text-2xl font-bold text-gray-800 mb-2'>Service Not Found</h2>
              <p className='text-gray-600 mb-6'>{error || 'The service you are looking for is not available.'}</p>
              <button
                onClick={() => router.push('/customer')}
                className='bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors'
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <Sidebar activeItem='Dashboard' />
      
      <div className='flex-1 ml-[16.666667%]'>
        <Navbar />
        
        <div className='p-8 pt-24'>
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className='flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-6 transition-colors'
          >
            <IoArrowBack size={20} />
            Back to Services
          </button>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Left Column - Service Image & Quick Info */}
            <div className='lg:col-span-1'>
              {/* Service Image */}
              <div className='bg-white rounded-xl shadow-md overflow-hidden mb-6'>
                <div className='h-64 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center relative'>
                  {service.serviceImage ? (
                    <img 
                      src={service.serviceImage} 
                      alt={service.serviceName} 
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <div className='text-white text-8xl'>🔧</div>
                  )}
                </div>
              </div>

              {/* Quick Info Card */}
              <div className='bg-white rounded-xl shadow-md p-6'>
                <h3 className='text-lg font-bold text-gray-800 mb-4 flex items-center gap-2'>
                  <IoCheckmarkCircle className='text-green-600' />
                  Quick Information
                </h3>
                
                <div className='space-y-4'>
                  <div className='flex items-start gap-3'>
                    <IoTimeOutline className='text-blue-600 text-xl mt-1 flex-shrink-0' />
                    <div>
                      <p className='text-sm text-gray-500'>Duration</p>
                      <p className='font-semibold text-gray-900'>{service.estimatedDuration} hours</p>
                    </div>
                  </div>

                  <div className='flex items-start gap-3'>
                    <IoPricetagOutline className='text-green-600 text-xl mt-1 flex-shrink-0' />
                    <div>
                      <p className='text-sm text-gray-500'>Price</p>
                      <p className='font-bold text-blue-600 text-lg'>LKR {service.basePrice.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className='flex items-start gap-3'>
                    <FaCalendarAlt className='text-orange-600 text-xl mt-1 flex-shrink-0' />
                    <div>
                      <p className='text-sm text-gray-500'>Available Slots Today</p>
                      <p className='font-semibold text-gray-900'>
                        {service.remainingSlots !== undefined ? (
                          <span className={service.remainingSlots > 0 ? 'text-green-600' : 'text-red-600'}>
                            {service.remainingSlots} / {service.maxDailySlots}
                          </span>
                        ) : (
                          <span>{service.availableSlots} / {service.maxDailySlots}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {service.requiredSkills && (
                    <div className='flex items-start gap-3'>
                      <FaTools className='text-purple-600 text-xl mt-1 flex-shrink-0' />
                      <div>
                        <p className='text-sm text-gray-500'>Required Skills</p>
                        <p className='font-semibold text-gray-900'>{service.requiredSkills}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Service Details */}
            <div className='lg:col-span-2'>
              <div className='bg-white rounded-xl shadow-md p-8'>
                {/* Service Title & Badges */}
                <div className='mb-6'>
                  <h1 className='text-4xl font-bold text-gray-900 mb-4'>{service.serviceName}</h1>
                  
                  <div className='flex flex-wrap gap-3'>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getCategoryColor(service.category)}`}>
                      {service.category}
                    </span>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getPriorityBadgeColor(service.priority)}`}>
                      Priority: {service.priority}
                    </span>
                    <span className='px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800'>
                      Active
                    </span>
                    {service.remainingSlots !== undefined && service.remainingSlots > 0 && (
                      <span className='px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800'>
                        {service.remainingSlots} slots available today
                      </span>
                    )}
                  </div>
                </div>

                {/* Description Section */}
                {service.description && (
                  <div className='mb-8'>
                    <h2 className='text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2'>
                      <span className='text-blue-600'>📋</span>
                      Service Description
                    </h2>
                    <p className='text-gray-700 leading-relaxed text-lg'>{service.description}</p>
                  </div>
                )}

                {/* Service Features */}
                <div className='mb-8'>
                  <h2 className='text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2'>
                    <span className='text-blue-600'>✨</span>
                    What's Included
                  </h2>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='flex items-start gap-3 bg-blue-50 p-4 rounded-lg'>
                      <IoCheckmarkCircle className='text-blue-600 text-2xl flex-shrink-0 mt-0.5' />
                      <div>
                        <p className='font-semibold text-gray-800'>Professional Service</p>
                        <p className='text-sm text-gray-600'>Performed by certified technicians</p>
                      </div>
                    </div>
                    <div className='flex items-start gap-3 bg-blue-50 p-4 rounded-lg'>
                      <IoCheckmarkCircle className='text-blue-600 text-2xl flex-shrink-0 mt-0.5' />
                      <div>
                        <p className='font-semibold text-gray-800'>Quality Parts</p>
                        <p className='text-sm text-gray-600'>Using genuine and quality materials</p>
                      </div>
                    </div>
                    <div className='flex items-start gap-3 bg-blue-50 p-4 rounded-lg'>
                      <IoCheckmarkCircle className='text-blue-600 text-2xl flex-shrink-0 mt-0.5' />
                      <div>
                        <p className='font-semibold text-gray-800'>Timely Completion</p>
                        <p className='text-sm text-gray-600'>Estimated {service.estimatedDuration} hours duration</p>
                      </div>
                    </div>
                    <div className='flex items-start gap-3 bg-blue-50 p-4 rounded-lg'>
                      <IoCheckmarkCircle className='text-blue-600 text-2xl flex-shrink-0 mt-0.5' />
                      <div>
                        <p className='font-semibold text-gray-800'>Competitive Pricing</p>
                        <p className='text-sm text-gray-600'>Fair and transparent pricing</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                {service.additionalNotes && (
                  <div className='mb-8'>
                    <h2 className='text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2'>
                      <span className='text-blue-600'>📝</span>
                      Additional Information
                    </h2>
                    <div className='bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded'>
                      <p className='text-gray-700'>{service.additionalNotes}</p>
                    </div>
                  </div>
                )}

                {/* Pricing Breakdown */}
                <div className='border-t pt-8'>
                  <h2 className='text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2'>
                    <span className='text-blue-600'>💰</span>
                    Pricing Details
                  </h2>
                  <div className='bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg'>
                    <div className='flex justify-between items-center mb-4'>
                      <span className='text-gray-700 text-lg'>Base Service Price</span>
                      <span className='text-2xl font-bold text-blue-600'>LKR {service.basePrice.toLocaleString()}</span>
                    </div>
                    <p className='text-sm text-gray-600'>
                      * Final price may vary based on vehicle condition and additional requirements
                    </p>
                  </div>
                </div>

                {/* Call to Action */}
                <div className='mt-8 bg-gradient-to-r from-blue-900 to-blue-800 text-white p-6 rounded-lg'>
                  <h3 className='text-2xl font-bold mb-2'>Ready to book this service?</h3>
                  <p className='mb-4 opacity-90'>Schedule your appointment now and let our experts take care of your vehicle.</p>
                  <button
                    onClick={handleBookService}
                    disabled={service.remainingSlots === 0}
                    className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${
                      service.remainingSlots === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-white text-blue-900 hover:bg-gray-100 hover:shadow-lg transform hover:-translate-y-0.5'
                    }`}
                  >
                    {service.remainingSlots === 0 ? 'No Slots Available Today' : 'Book Appointment Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* ChatBot Component */}
      <ChatBot />
    </div>
  )
}
