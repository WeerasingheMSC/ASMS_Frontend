'use client'
import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import ChatBot from '../components/ChatBot'
import { FaCalendarAlt, FaClock, FaCar, FaTools, FaPaperPlane } from 'react-icons/fa'
import { MdPending, MdCheckCircle, MdCancel } from 'react-icons/md'
import { getCustomerAppointments } from '@/app/lib/appointmentsApi'
import { changeRequestAPI } from '@/app/lib/changeRequestApi'

interface Appointment {
  id: number
  serviceType: string
  appointmentDate: string
  timeSlot: string
  vehicleBrand: string
  model: string
  registerNumber: string
  status: string
  serviceCategory: string
}

interface ChangeRequest {
  id: number
  appointmentId: number
  reason: string
  status: string
  adminResponse: string | null
  requestedAt: string
  respondedAt: string | null
  serviceType: string
  appointmentDate: string
}

const RequestPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [myRequests, setMyRequests] = useState<ChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [reason, setReason] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [appointmentsData, requestsData] = await Promise.all([
        getCustomerAppointments(),
        changeRequestAPI.getMyRequests()
      ])

      // Filter only PENDING and CONFIRMED appointments
      const editableAppointments = appointmentsData.filter((apt: Appointment) => 
        apt.status === 'PENDING' || apt.status === 'CONFIRMED'
      )

      setAppointments(editableAppointments)
      setMyRequests(requestsData)
    } catch (error: any) {
      console.error('Failed to fetch data:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestChange = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setShowModal(true)
    setReason('')
    setError('')
  }

  const submitRequest = async () => {
    if (!selectedAppointment) return
    if (!reason.trim()) {
      setError('Please provide a reason for the change request')
      return
    }

    try {
      setError('')
      await changeRequestAPI.createChangeRequest(selectedAppointment.id, reason)
      setSuccess('Change request submitted successfully!')
      setShowModal(false)
      setReason('')
      setSelectedAppointment(null)
      fetchData()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to submit request')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: any = {
      PENDING: { icon: <MdPending />, class: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      APPROVED: { icon: <MdCheckCircle />, class: 'bg-green-100 text-green-700', label: 'Approved' },
      REJECTED: { icon: <MdCancel />, class: 'bg-red-100 text-red-700', label: 'Rejected' }
    }
    const badge = badges[status] || badges.PENDING
    return (
      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${badge.class}`}>
        {badge.icon} {badge.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <Sidebar activeItem='Request' />
      <div className='flex-1 ml-[16.666667%] relative'>
        <Navbar />
        <div className='p-8 mt-16'>
          {/* Header */}
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-gray-800 mb-2'>Appointment Change Requests</h1>
            <p className='text-gray-600'>Request changes to your pending or confirmed appointments</p>
          </div>

          {/* Alerts */}
          {error && (
            <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700'>
              {error}
            </div>
          )}
          {success && (
            <div className='mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700'>
              {success}
            </div>
          )}

          <div className='grid grid-cols-1 xl:grid-cols-2 gap-8'>
            {/* Editable Appointments */}
            <div>
              <h2 className='text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                <FaCalendarAlt className='text-blue-600' />
                Appointments You Can Request Changes For
              </h2>

              {loading ? (
                <div className='flex justify-center items-center h-64'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
                </div>
              ) : appointments.length === 0 ? (
                <div className='bg-white rounded-lg shadow p-8 text-center'>
                  <FaCalendarAlt className='text-6xl text-gray-300 mx-auto mb-4' />
                  <p className='text-gray-500'>No appointments available for change requests</p>
                  <p className='text-sm text-gray-400 mt-2'>
                    Only PENDING and CONFIRMED appointments can be modified
                  </p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow'
                    >
                      <div className='flex justify-between items-start mb-4'>
                        <div>
                          <h3 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
                            <FaCar className='text-blue-600' />
                            {appointment.vehicleBrand} {appointment.model}
                          </h3>
                          <p className='text-sm text-gray-500'>{appointment.registerNumber}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          appointment.status === 'PENDING' 
                            ? 'bg-yellow-100 text-yellow-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>

                      <div className='space-y-2 mb-4'>
                        <div className='flex items-center gap-2 text-sm text-gray-700'>
                          <FaTools className='text-gray-400' />
                          <span>{appointment.serviceCategory} - {appointment.serviceType}</span>
                        </div>
                        <div className='flex items-center gap-2 text-sm text-gray-700'>
                          <FaCalendarAlt className='text-gray-400' />
                          <span>{appointment.appointmentDate}</span>
                        </div>
                        <div className='flex items-center gap-2 text-sm text-gray-700'>
                          <FaClock className='text-gray-400' />
                          <span>{appointment.timeSlot}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRequestChange(appointment)}
                        className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2'
                      >
                        <FaPaperPlane />
                        Request Change
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Requests */}
            <div>
              <h2 className='text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                <FaPaperPlane className='text-green-600' />
                My Change Requests
              </h2>

              {myRequests.length === 0 ? (
                <div className='bg-white rounded-lg shadow p-8 text-center'>
                  <FaPaperPlane className='text-6xl text-gray-300 mx-auto mb-4' />
                  <p className='text-gray-500'>No change requests yet</p>
                  <p className='text-sm text-gray-400 mt-2'>
                    Submit a request to modify your appointment
                  </p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {myRequests.map((request) => (
                    <div
                      key={request.id}
                      className='bg-white rounded-lg shadow-md p-6'
                    >
                      <div className='flex justify-between items-start mb-3'>
                        <div>
                          <h3 className='text-lg font-semibold text-gray-800'>
                            {request.serviceType}
                          </h3>
                          <p className='text-sm text-gray-500'>{request.appointmentDate}</p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>

                      <div className='mb-3'>
                        <p className='text-sm font-semibold text-gray-700'>Reason:</p>
                        <p className='text-sm text-gray-600 bg-gray-50 p-2 rounded mt-1'>
                          {request.reason}
                        </p>
                      </div>

                      {request.adminResponse && (
                        <div className='mb-3'>
                          <p className='text-sm font-semibold text-gray-700'>Admin Response:</p>
                          <p className={`text-sm p-2 rounded mt-1 ${
                            request.status === 'APPROVED' 
                              ? 'bg-green-50 text-green-700' 
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {request.adminResponse}
                          </p>
                        </div>
                      )}

                      <div className='flex justify-between text-xs text-gray-500 mt-3 pt-3 border-t'>
                        <span>Requested: {formatDate(request.requestedAt)}</span>
                        {request.respondedAt && (
                          <span>Responded: {formatDate(request.respondedAt)}</span>
                        )}
                      </div>

                      {request.status === 'APPROVED' && (
                        <div className='mt-4'>
                          <button
                            onClick={() => window.location.href = '/customer/my-appointments'}
                            className='w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors'
                          >
                            Edit Appointment Now
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Request Modal */}
          {showModal && selectedAppointment && (
            <div className='absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
              <div className='bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-fade-in'>
                <h2 className='text-2xl font-bold text-gray-800 mb-4'>Request Appointment Change</h2>
                
                <div className='mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200'>
                  <p className='text-sm font-semibold text-gray-700'>Appointment Details:</p>
                  <p className='text-sm text-gray-600 mt-1'>
                    {selectedAppointment.vehicleBrand} {selectedAppointment.model}
                  </p>
                  <p className='text-sm text-gray-600'>
                    {selectedAppointment.serviceType}
                  </p>
                  <p className='text-sm text-gray-600'>
                    {selectedAppointment.appointmentDate} at {selectedAppointment.timeSlot}
                  </p>
                </div>

                <div className='mb-6'>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Reason for Change Request *
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                    rows={4}
                    placeholder='Please explain why you need to change this appointment...'
                  />
                </div>

                {error && (
                  <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm'>
                    {error}
                  </div>
                )}

                <div className='flex gap-3'>
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setReason('')
                      setError('')
                    }}
                    className='flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitRequest}
                    className='flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors'
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* ChatBot Component */}
      <ChatBot />
    </div>
  )
}

export default RequestPage
