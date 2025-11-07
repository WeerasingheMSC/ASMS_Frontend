'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import { IoMdClose } from "react-icons/io"
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

declare global {
  interface Window {
    cloudinary: any;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const ServiceDetailsPage = () => {
  const params = useParams()
  const router = useRouter()
  const serviceId = params.id
  const [service, setService] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(1)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [uploadingImage, setUploadingImage] = useState(false)
  const cloudinaryRef = useRef<any>(null)

  const [editFormData, setEditFormData] = useState({
    serviceName: '',
    category: '',
    description: '',
    estimatedDuration: '',
    basePrice: '',
    requiredSkills: '',
    priority: '',
    maxDailySlots: '',
    serviceImage: '',
    additionalNotes: ''
  })

  useEffect(() => {
    fetchServiceDetails()
  }, [serviceId])

  // Initialize Cloudinary widget
  useEffect(() => {
    if (typeof window !== 'undefined' && !cloudinaryRef.current) {
      const script = document.createElement('script')
      script.src = 'https://upload-widget.cloudinary.com/global/all.js'
      script.async = true
      script.onload = () => {
        cloudinaryRef.current = window.cloudinary
      }
      document.body.appendChild(script)

      return () => {
        document.body.removeChild(script)
      }
    }
  }, [])

  const fetchServiceDetails = async () => {
    try {
      const userData = localStorage.getItem('user')
      if (!userData) {
        router.push('/signin')
        return
      }

      const user = JSON.parse(userData)
      const response = await fetch(`${API_URL}/api/admin/services/${serviceId}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setService(data)
        setEditFormData({
          serviceName: data.serviceName || '',
          category: data.category || '',
          description: data.description || '',
          estimatedDuration: data.estimatedDuration || '',
          basePrice: data.basePrice || '',
          requiredSkills: data.requiredSkills || '',
          priority: data.priority || '',
          maxDailySlots: data.maxDailySlots || '',
          serviceImage: data.serviceImage || '',
          additionalNotes: data.additionalNotes || ''
        })
      } else {
        setMessage({ type: 'error', text: 'Failed to load service details' })
      }
    } catch (error) {
      console.error('Error fetching service:', error)
      setMessage({ type: 'error', text: 'Error loading service details' })
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = () => {
    if (!cloudinaryRef.current) {
      console.error('Cloudinary widget not loaded')
      return
    }

    setUploadingImage(true)
    const widget = cloudinaryRef.current.createUploadWidget(
      {
        cloudName: 'dpapypflg',
        uploadPreset: 'asms_services',
        folder: 'asms_services',
        maxFileSize: 5000000,
        clientAllowedFormats: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
        maxImageWidth: 2000,
        maxImageHeight: 2000,
      },
      (error: any, result: any) => {
        setUploadingImage(false)
        if (error) {
          console.error('Upload error:', error)
          setMessage({ type: 'error', text: 'Failed to upload image' })
          return
        }

        if (result.event === 'success') {
          setEditFormData(prev => ({ ...prev, serviceImage: result.info.secure_url }))
          setMessage({ type: 'success', text: 'Image uploaded successfully!' })
          setTimeout(() => setMessage({ type: '', text: '' }), 3000)
        }
      }
    )
    widget.open()
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const userData = localStorage.getItem('user')
      if (!userData) {
        router.push('/signin')
        return
      }

      const user = JSON.parse(userData)
      const response = await fetch(`${API_URL}/api/admin/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editFormData)
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Service updated successfully!' })
        setIsEditMode(false)
        fetchServiceDetails()
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      } else {
        const errorData = await response.json()
        setMessage({ type: 'error', text: errorData.message || 'Failed to update service' })
      }
    } catch (error) {
      console.error('Error updating service:', error)
      setMessage({ type: 'error', text: 'Error updating service' })
    }
  }

  const handleDelete = async () => {
    try {
      const userData = localStorage.getItem('user')
      if (!userData) {
        router.push('/signin')
        return
      }

      const user = JSON.parse(userData)
      const response = await fetch(`${API_URL}/api/admin/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Service deleted successfully!' })
        setTimeout(() => {
          router.push('/Admin/Services')
        }, 1500)
      } else {
        const errorData = await response.json()
        setMessage({ type: 'error', text: errorData.message || 'Failed to delete service' })
      }
    } catch (error) {
      console.error('Error deleting service:', error)
      setMessage({ type: 'error', text: 'Error deleting service' })
    }
    setIsDeleteDialogOpen(false)
    setDeleteConfirmStep(1)
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Maintenance': 'bg-blue-100 text-blue-800',
      'Repair': 'bg-red-100 text-red-800',
      'Modification': 'bg-purple-100 text-purple-800',
      'Inspection': 'bg-yellow-100 text-yellow-800',
      'Cleaning': 'bg-green-100 text-green-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'HIGH': 'bg-red-100 text-red-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'LOW': 'bg-green-100 text-green-800'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className='flex h-screen'>
        <Sidebar activeItem='Services' />
        <div className='flex-1 flex flex-col'>
          <Navbar />
          <div className='flex-1 flex items-center justify-center'>
            <div className='text-xl text-gray-600'>Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className='flex h-screen'>
        <Sidebar activeItem='Services' />
        <div className='flex-1 flex flex-col'>
          <Navbar />
          <div className='flex-1 flex items-center justify-center'>
            <div className='text-xl text-red-600'>Service not found</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-screen overflow-hidden'>
      <Sidebar activeItem='Services' />
      <div className='flex-1 flex flex-col'>
        <Navbar />
        <div className='flex-1 overflow-y-auto bg-gray-50 p-8'>
          {/* Back Button and Header */}
          <div className='mb-6 flex items-center justify-between'>
            <div>
              <button
                onClick={() => router.push('/Admin/Services')}
                className='flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4'
              >
                <ArrowBackIcon />
                Back to Services
              </button>
              <h1 className='text-3xl font-bold text-gray-800'>Service Details</h1>
            </div>
          </div>

          {/* Message Display */}
          {message.text && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-700 border border-green-400'
                  : 'bg-red-100 text-red-700 border border-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className='bg-white rounded-lg shadow-md overflow-hidden'>

            {/* Service Details Content */}
            {!isEditMode ? (
              <div className='p-8'>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                  {/* Left Column - Image and Basic Info */}
                  <div>
                    {/* Service Image */}
                    <div className='mb-6'>
                      {service.serviceImage ? (
                        <img
                          src={service.serviceImage}
                          alt={service.serviceName}
                          className='w-full h-64 object-cover rounded-lg shadow-md'
                        />
                      ) : (
                        <div className='w-full h-64 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center'>
                          <div className='text-white text-6xl'>🔧</div>
                        </div>
                      )}
                    </div>

                    {/* Status and Badges */}
                    <div className='flex gap-2 mb-6 flex-wrap'>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getCategoryColor(service.category)}`}>
                        {service.category}
                      </span>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getPriorityColor(service.priority)}`}>
                        {service.priority} Priority
                      </span>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Right Column - Service Details */}
                  <div className='space-y-6'>
                    <div>
                      <h2 className='text-3xl font-bold text-gray-900 mb-2'>{service.serviceName}</h2>
                      <p className='text-gray-600 text-lg'>{service.description || 'No description available'}</p>
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                      <div className='bg-gray-50 p-4 rounded-lg'>
                        <p className='text-gray-500 text-sm mb-1'>Estimated Duration</p>
                        <p className='text-gray-900 font-bold text-xl'>{service.estimatedDuration} hours</p>
                      </div>

                      <div className='bg-gray-50 p-4 rounded-lg'>
                        <p className='text-gray-500 text-sm mb-1'>Base Price</p>
                        <p className='text-blue-600 font-bold text-xl'>LKR {service.basePrice.toLocaleString()}</p>
                      </div>

                      <div className='bg-gray-50 p-4 rounded-lg'>
                        <p className='text-gray-500 text-sm mb-1'>Available Slots</p>
                        <p className='text-gray-900 font-bold text-xl'>{service.availableSlots} / {service.maxDailySlots}</p>
                      </div>

                      <div className='bg-gray-50 p-4 rounded-lg'>
                        <p className='text-gray-500 text-sm mb-1'>Priority Level</p>
                        <p className='text-gray-900 font-bold text-xl'>{service.priority}</p>
                      </div>
                    </div>

                    {service.requiredSkills && (
                      <div className='bg-blue-50 p-4 rounded-lg'>
                        <p className='text-gray-700 font-semibold mb-2'>Required Skills</p>
                        <p className='text-gray-900'>{service.requiredSkills}</p>
                      </div>
                    )}

                    {service.additionalNotes && (
                      <div className='bg-yellow-50 p-4 rounded-lg'>
                        <p className='text-gray-700 font-semibold mb-2'>Additional Notes</p>
                        <p className='text-gray-900'>{service.additionalNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Edit Form */
              <div className='p-8'>
                <form onSubmit={handleEditSubmit} className='space-y-6'>
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                    {/* Image Upload */}
                    <div className='lg:col-span-2'>
                      <label className='block text-gray-700 font-semibold mb-2'>Service Image</label>
                      <div className='flex items-center gap-4'>
                        {editFormData.serviceImage && (
                          <div className='relative'>
                            <img
                              src={editFormData.serviceImage}
                              alt='Service'
                              className='w-32 h-32 object-cover rounded-lg'
                            />
                            <button
                              type='button'
                              onClick={() => setEditFormData(prev => ({ ...prev, serviceImage: '' }))}
                              className='absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600'
                            >
                              <IoMdClose size={16} />
                            </button>
                          </div>
                        )}
                        <button
                          type='button'
                          onClick={handleImageUpload}
                          disabled={uploadingImage}
                          className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold disabled:opacity-50'
                        >
                          <CloudUploadIcon />
                          {uploadingImage ? 'Uploading...' : editFormData.serviceImage ? 'Change Image' : 'Upload Image'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Service Name *</label>
                      <input
                        type='text'
                        name='serviceName'
                        value={editFormData.serviceName}
                        onChange={handleEditChange}
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Category *</label>
                      <select
                        name='category'
                        value={editFormData.category}
                        onChange={handleEditChange}
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                        required
                      >
                        <option value='Maintenance'>Maintenance</option>
                        <option value='Repair'>Repair</option>
                        <option value='Modification'>Modification</option>
                        <option value='Inspection'>Inspection</option>
                        <option value='Cleaning'>Cleaning</option>
                      </select>
                    </div>

                    <div className='lg:col-span-2'>
                      <label className='block text-gray-700 font-semibold mb-2'>Description</label>
                      <textarea
                        name='description'
                        value={editFormData.description}
                        onChange={handleEditChange}
                        rows={4}
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                      />
                    </div>

                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Estimated Duration (hours) *</label>
                      <input
                        type='number'
                        name='estimatedDuration'
                        value={editFormData.estimatedDuration}
                        onChange={handleEditChange}
                        step='0.5'
                        min='0.5'
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Base Price (LKR) *</label>
                      <input
                        type='number'
                        name='basePrice'
                        value={editFormData.basePrice}
                        onChange={handleEditChange}
                        step='0.01'
                        min='0'
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Required Skills</label>
                      <input
                        type='text'
                        name='requiredSkills'
                        value={editFormData.requiredSkills}
                        onChange={handleEditChange}
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                      />
                    </div>

                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Priority *</label>
                      <select
                        name='priority'
                        value={editFormData.priority}
                        onChange={handleEditChange}
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                        required
                      >
                        <option value='HIGH'>High</option>
                        <option value='MEDIUM'>Medium</option>
                        <option value='LOW'>Low</option>
                      </select>
                    </div>

                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Max Daily Slots *</label>
                      <input
                        type='number'
                        name='maxDailySlots'
                        value={editFormData.maxDailySlots}
                        onChange={handleEditChange}
                        min='1'
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                        required
                      />
                    </div>

                    <div className='lg:col-span-2'>
                      <label className='block text-gray-700 font-semibold mb-2'>Additional Notes</label>
                      <textarea
                        name='additionalNotes'
                        value={editFormData.additionalNotes}
                        onChange={handleEditChange}
                        rows={3}
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                      />
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Action Buttons at Bottom */}
            <div className='bg-gray-100 px-6 py-4 flex justify-end gap-3 border-t border-gray-200'>
              {!isEditMode ? (
                <>
                  <button
                    onClick={() => setIsEditMode(true)}
                    className='flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors'
                  >
                    <EditIcon fontSize='small' />
                    Edit Service
                  </button>
                  <button
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className='flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors'
                  >
                    <DeleteIcon fontSize='small' />
                    Delete Service
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleEditSubmit}
                    className='bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors'
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setIsEditMode(false)
                      fetchServiceDetails()
                    }}
                    className='bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors'
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Delete Confirmation Dialog */}
          {isDeleteDialogOpen && (
            <>
              <div 
                className='fixed inset-0 backdrop-blur-sm bg-black/30 z-40'
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setDeleteConfirmStep(1)
                }}
              ></div>
              
              <div className='fixed inset-0 flex justify-center items-center z-50 pointer-events-none'>
                <div className='bg-white rounded-lg p-8 w-[400px] relative shadow-2xl pointer-events-auto'>
                  {deleteConfirmStep === 1 ? (
                    <>
                      <h3 className='text-xl font-bold text-gray-800 mb-4'>Confirm Delete</h3>
                      <p className='text-gray-600 mb-6'>
                        Are you sure you want to delete "{service.serviceName}"? This action cannot be undone.
                      </p>
                      <div className='flex gap-3 justify-end'>
                        <button
                          onClick={() => {
                            setIsDeleteDialogOpen(false)
                            setDeleteConfirmStep(1)
                          }}
                          className='px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors'
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => setDeleteConfirmStep(2)}
                          className='px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors'
                        >
                          Yes, Delete
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className='text-xl font-bold text-red-600 mb-4'>Final Confirmation</h3>
                      <p className='text-gray-600 mb-6'>
                        This is your last chance. Delete "{service.serviceName}" permanently?
                      </p>
                      <div className='flex gap-3 justify-end'>
                        <button
                          onClick={() => setDeleteConfirmStep(1)}
                          className='px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors'
                        >
                          Go Back
                        </button>
                        <button
                          onClick={handleDelete}
                          className='px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors'
                        >
                          Permanently Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ServiceDetailsPage
