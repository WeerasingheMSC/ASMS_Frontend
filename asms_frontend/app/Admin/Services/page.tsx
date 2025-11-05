'use client'
import React, { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { IoMdClose } from "react-icons/io";
import { TextField, InputAdornment, IconButton, Tooltip, Checkbox } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

declare global {
  interface Window {
    cloudinary: any;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const ServicesPage = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(1);
  const [serviceToDelete, setServiceToDelete] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const cloudinaryRef = useRef<any>(null);
  const widgetRef = useRef<any>(null);
  const [formData, setFormData] = useState({
    serviceName: '',
    category: 'Maintenance',
    description: '',
    estimatedDuration: '',
    basePrice: '',
    requiredSkills: '',
    priority: 'MEDIUM',
    maxDailySlots: '',
    serviceImage: '',
    additionalNotes: ''
  });
  const [editFormData, setEditFormData] = useState({
    id: 0,
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
  });

  useEffect(() => {
    fetchServices();
  }, []);

  // Initialize Cloudinary widget
  useEffect(() => {
    if (typeof window !== 'undefined' && !cloudinaryRef.current) {
      const script = document.createElement('script');
      script.src = 'https://upload-widget.cloudinary.com/global/all.js';
      script.async = true;
      script.onload = () => {
        cloudinaryRef.current = window.cloudinary;
      };
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, []);

  const fetchServices = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        window.location.href = '/signin';
        return;
      }

      const user = JSON.parse(userData);
      const response = await fetch(`${API_URL}/api/admin/services`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setServices(data);
      } else if (response.status === 401) {
        alert('Session expired. Please login again.');
        window.location.href = '/signin';
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setMessage({ type: 'error', text: 'Failed to load services' });
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload for Add form
  const handleImageUpload = () => {
    if (!cloudinaryRef.current) {
      setMessage({ type: 'error', text: 'Cloudinary widget not loaded yet' });
      return;
    }

    const widget = cloudinaryRef.current.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dpapypflg',
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'asms_services',
        sources: ['local', 'url', 'camera'],
        multiple: false,
        resourceType: 'image',
        clientAllowedFormats: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
        maxFileSize: 5000000, // 5MB
        folder: 'asms_services',
      },
      (error: any, result: any) => {
        if (error) {
          console.error('Upload error:', error);
          setMessage({ type: 'error', text: 'Failed to upload image' });
          setUploadingImage(false);
          return;
        }

        if (result.event === 'success') {
          setFormData(prev => ({
            ...prev,
            serviceImage: result.info.secure_url
          }));
          setUploadingImage(false);
          setMessage({ type: 'success', text: 'Image uploaded successfully!' });
        } else if (result.event === 'queues-start') {
          setUploadingImage(true);
        }
      }
    );

    widget.open();
  };

  // Handle image upload for Edit form
  const handleEditImageUpload = () => {
    if (!cloudinaryRef.current) {
      setMessage({ type: 'error', text: 'Cloudinary widget not loaded yet' });
      return;
    }

    const widget = cloudinaryRef.current.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dpapypflg',
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'asms_services',
        sources: ['local', 'url', 'camera'],
        multiple: false,
        resourceType: 'image',
        clientAllowedFormats: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
        maxFileSize: 5000000, // 5MB
        folder: 'asms_services',
      },
      (error: any, result: any) => {
        if (error) {
          console.error('Upload error:', error);
          setMessage({ type: 'error', text: 'Failed to upload image' });
          setUploadingImage(false);
          return;
        }

        if (result.event === 'success') {
          setEditFormData(prev => ({
            ...prev,
            serviceImage: result.info.secure_url
          }));
          setUploadingImage(false);
          setMessage({ type: 'success', text: 'Image uploaded successfully!' });
        } else if (result.event === 'queues-start') {
          setUploadingImage(true);
        }
      }
    );

    widget.open();
  };

  // Filter services based on search query
  const filteredServices = services.filter(service => {
    const searchLower = searchQuery.toLowerCase();
    return service.serviceName.toLowerCase().includes(searchLower) ||
      service.category.toLowerCase().includes(searchLower) ||
      (service.description && service.description.toLowerCase().includes(searchLower)) ||
      (service.requiredSkills && service.requiredSkills.toLowerCase().includes(searchLower));
  });

  // Handle select all checkbox
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedRows(filteredServices.map(service => service.id));
    } else {
      setSelectedRows([]);
    }
  };

  // Handle individual row checkbox
  const handleSelectRow = (id: number) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  // Export to CSV
  const handleExportCSV = () => {
    const dataToExport = selectedRows.length > 0
      ? filteredServices.filter(service => selectedRows.includes(service.id))
      : filteredServices;

    const exportData = dataToExport.map(service => ({
      ID: service.id,
      'Service Name': service.serviceName,
      Category: service.category,
      Description: service.description || '',
      'Duration (hours)': service.estimatedDuration,
      'Price (LKR)': service.basePrice,
      'Required Skills': service.requiredSkills || '',
      Priority: service.priority,
      'Max Daily Slots': service.maxDailySlots,
      'Available Slots': service.availableSlots,
      Status: service.isActive ? 'Active' : 'Inactive'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Services');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `services_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);
      const response = await fetch(`${API_URL}/api/admin/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          ...formData,
          estimatedDuration: parseFloat(formData.estimatedDuration),
          basePrice: parseFloat(formData.basePrice),
          maxDailySlots: parseInt(formData.maxDailySlots)
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Service added successfully!' });
        setIsPopupOpen(false);
        setFormData({
          serviceName: '',
          category: 'Maintenance',
          description: '',
          estimatedDuration: '',
          basePrice: '',
          requiredSkills: '',
          priority: 'MEDIUM',
          maxDailySlots: '',
          serviceImage: '',
          additionalNotes: ''
        });
        fetchServices();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to add service' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'An error occurred' });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);
      const response = await fetch(`${API_URL}/api/admin/services/${editFormData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          serviceName: editFormData.serviceName,
          category: editFormData.category,
          description: editFormData.description,
          estimatedDuration: parseFloat(editFormData.estimatedDuration),
          basePrice: parseFloat(editFormData.basePrice),
          requiredSkills: editFormData.requiredSkills,
          priority: editFormData.priority,
          maxDailySlots: parseInt(editFormData.maxDailySlots),
          serviceImage: editFormData.serviceImage,
          additionalNotes: editFormData.additionalNotes
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Service updated successfully!' });
        setIsEditPopupOpen(false);
        fetchServices();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to update service' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'An error occurred' });
    }
  };

  const handleEdit = (service: any) => {
    setEditFormData({
      id: service.id,
      serviceName: service.serviceName,
      category: service.category,
      description: service.description || '',
      estimatedDuration: service.estimatedDuration.toString(),
      basePrice: service.basePrice.toString(),
      requiredSkills: service.requiredSkills || '',
      priority: service.priority,
      maxDailySlots: service.maxDailySlots.toString(),
      serviceImage: service.serviceImage || '',
      additionalNotes: service.additionalNotes || ''
    });
    setIsEditPopupOpen(true);
  };

  const handleToggleStatus = async (serviceId: number, currentStatus: boolean) => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);
      const endpoint = currentStatus ? 'deactivate' : 'activate';
      
      const response = await fetch(`${API_URL}/api/admin/services/${serviceId}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Service ${currentStatus ? 'deactivated' : 'activated'} successfully!` 
        });
        fetchServices();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to update service status' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'An error occurred' });
    }
  };

  const handleDelete = (service: any) => {
    setServiceToDelete(service);
    setIsDeleteDialogOpen(true);
    setDeleteConfirmStep(1);
  };

  // Handle delete confirmation step 1
  const handleDeleteConfirmStep1 = () => {
    setDeleteConfirmStep(2);
  };

  // Handle actual delete in step 2
  const handleDeleteConfirmStep2 = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        window.location.href = '/signin';
        return;
      }

      const user = JSON.parse(userData);
      const response = await fetch(`${API_URL}/api/admin/services/${serviceToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage({ 
          type: 'success', 
          text: 'Service deleted successfully!' 
        });
        setIsDeleteDialogOpen(false);
        setServiceToDelete(null);
        setDeleteConfirmStep(1);
        fetchServices();
      } else {
        setMessage({ 
          type: 'error', 
          text: result.message || 'Failed to delete service' 
        });
        setIsDeleteDialogOpen(false);
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      setMessage({ 
        type: 'error', 
        text: 'Network error. Please try again.' 
      });
      setIsDeleteDialogOpen(false);
    }
  };

  // Cancel delete operation
  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setServiceToDelete(null);
    setDeleteConfirmStep(1);
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Maintenance': 'bg-blue-100 text-blue-800',
      'Repair': 'bg-orange-100 text-orange-800',
      'Modification': 'bg-purple-100 text-purple-800',
      'Inspection': 'bg-teal-100 text-teal-800',
      'Cleaning': 'bg-cyan-100 text-cyan-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className='flex h-screen overflow-hidden'>
      {/* Sidebar */}
      <Sidebar activeItem="Services" />

      {/* Main Content */}
      <div className='flex-1 flex flex-col'>
        <Navbar />
        <div className='flex-1 p-8 bg-gray-50 relative overflow-y-auto'>
          {/* Message Display */}
          {message.text && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <div className='flex justify-between items-center mb-6'>
          <h1 className='text-3xl font-bold text-gray-800'>Service Management</h1>
          <button
            onClick={() => setIsPopupOpen(true)}
            className='bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md'
          >
            + Add New Service
          </button>
        </div>

        {/* Search and Export Section */}
        <div className='rounded-lg p-4 mb-4'>
          <div className='flex gap-4 items-center'>
            <div className='flex-1'>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search services by name, category, description, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon className='text-black' />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchQuery('')}
                        edge="end"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#f9fafb',
                    '& fieldset': {
                      borderColor: '#000000',
                    },
                    '&:hover fieldset': {
                      borderColor: '#6366f1',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#6366f1',
                    },
                  },
                }}
              />
            </div>
            <Tooltip title={selectedRows.length > 0 ? `Export ${selectedRows.length} selected rows to CSV` : 'Export all filtered data to CSV'}>
              <button
                onClick={handleExportCSV}
                className='bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-md flex items-center gap-2 whitespace-nowrap'
              >
                <FileDownloadIcon />
                Export to CSV
              </button>
            </Tooltip>
          </div>
          {selectedRows.length > 0 && (
            <div className='mt-3 text-sm text-indigo-600 font-medium'>
              {selectedRows.length} service{selectedRows.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        {/* Services Card Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading services...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No services found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden relative"
              >
                {/* Selection Checkbox */}
                <div className="absolute top-4 left-4 z-10">
                  <Checkbox
                    checked={selectedRows.includes(service.id)}
                    onChange={() => handleSelectRow(service.id)}
                    sx={{
                      color: 'white',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      borderRadius: '4px',
                      '&.Mui-checked': {
                        color: 'white',
                        backgroundColor: '#6366f1',
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.5)',
                      },
                    }}
                  />
                </div>

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
                  {/* Title and Status */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900 flex-1">{service.serviceName}</h3>
                    <label className="relative inline-flex items-center cursor-pointer ml-2">
                      <input
                        type="checkbox"
                        checked={service.isActive}
                        onChange={() => handleToggleStatus(service.id, service.isActive)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Category and Priority */}
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(service.category)}`}>
                      {service.category}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadgeColor(service.priority)}`}>
                      {service.priority}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {service.description || 'No description available'}
                  </p>

                  {/* Service Details */}
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duration:</span>
                      <span className="font-semibold text-gray-900">{service.estimatedDuration} hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Price:</span>
                      <span className="font-bold text-blue-600">LKR {service.basePrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Available Slots:</span>
                      <span className="font-semibold text-gray-900">
                        {service.availableSlots} / {service.maxDailySlots}
                      </span>
                    </div>
                    {service.requiredSkills && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Skills:</span>
                        <span className="font-semibold text-gray-900 text-right">{service.requiredSkills}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Tooltip title="Edit Service">
                      <IconButton
                        onClick={() => handleEdit(service)}
                        size="small"
                        sx={{
                          color: '#3b82f6',
                          '&:hover': {
                            backgroundColor: '#dbeafe',
                          },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Service">
                      <IconButton
                        onClick={() => handleDelete(service)}
                        size="small"
                        sx={{
                          color: '#ef4444',
                          '&:hover': {
                            backgroundColor: '#fee2e2',
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

          {/* Add Service Popup */}
          {isPopupOpen && (
            <>
              {/* Backdrop blur overlay */}
              <div 
                className='fixed inset-0 backdrop-blur-sm bg-black/30 z-40'
                onClick={() => setIsPopupOpen(false)}
              ></div>
              
              {/* Popup Modal */}
              <div className='fixed inset-0 flex justify-center items-center z-50 pointer-events-none'>
                <div className='bg-white rounded-lg p-8 w-[500px] max-h-[90vh] overflow-y-auto relative shadow-2xl pointer-events-auto'>
                  <button
                    onClick={() => setIsPopupOpen(false)}
                    className='absolute top-4 right-4 text-gray-500 hover:text-gray-700'
                  >
                    <IoMdClose size={24} />
                  </button>

                  <h2 className='text-2xl font-bold mb-6 text-gray-800'>Add New Service</h2>

                  <form onSubmit={handleSubmit} className='space-y-4'>
                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Service Name</label>
                      <input
                        type='text'
                        name='serviceName'
                        value={formData.serviceName}
                        onChange={handleChange}
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Category</label>
                      <select
                        name='category'
                        value={formData.category}
                        onChange={handleChange}
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                        required
                      >
                        <option value='Maintenance'>Maintenance</option>
                        <option value='Repair'>Repair</option>
                        <option value='Modification'>Modification</option>
                        <option value='Inspection'>Inspection</option>
                        <option value='Cleaning'>Cleaning</option>
                      </select>
                    </div>

                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Description</label>
                      <textarea
                        name='description'
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                      />
                    </div>

                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Estimated Duration (hours)</label>
                      <input
                        type='number'
                        name='estimatedDuration'
                        value={formData.estimatedDuration}
                        onChange={handleChange}
                        step='0.5'
                        min='0.5'
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Base Price (LKR)</label>
                      <input
                        type='number'
                        name='basePrice'
                        value={formData.basePrice}
                        onChange={handleChange}
                        step='0.01'
                        min='0'
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Required Skills</label>
                      <input
                        type='text'
                        name='requiredSkills'
                        value={formData.requiredSkills}
                        onChange={handleChange}
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                      />
                    </div>

                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Priority</label>
                      <select
                        name='priority'
                        value={formData.priority}
                        onChange={handleChange}
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                        required
                      >
                        <option value='LOW'>Low</option>
                        <option value='MEDIUM'>Medium</option>
                        <option value='HIGH'>High</option>
                      </select>
                    </div>

                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Max Daily Slots</label>
                      <input
                        type='number'
                        name='maxDailySlots'
                        value={formData.maxDailySlots}
                        onChange={handleChange}
                        min='1'
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Service Image</label>
                      <div className='space-y-3'>
                        {formData.serviceImage && (
                          <div className='relative w-full h-48 rounded-lg overflow-hidden border border-gray-300'>
                            <img
                              src={formData.serviceImage}
                              alt='Service preview'
                              className='w-full h-full object-cover'
                            />
                            <button
                              type='button'
                              onClick={() => setFormData(prev => ({ ...prev, serviceImage: '' }))}
                              className='absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors'
                            >
                              <IoMdClose size={20} />
                            </button>
                          </div>
                        )}
                        <button
                          type='button'
                          onClick={handleImageUpload}
                          disabled={uploadingImage}
                          className='w-full px-4 py-3 bg-indigo-50 text-indigo-600 border-2 border-indigo-300 border-dashed rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                          <CloudUploadIcon />
                          {uploadingImage ? 'Uploading...' : formData.serviceImage ? 'Change Image' : 'Upload Image'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Additional Notes</label>
                      <textarea
                        name='additionalNotes'
                        value={formData.additionalNotes}
                        onChange={handleChange}
                        rows={2}
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                      />
                    </div>

                    <div className='flex gap-4 mt-6'>
                      <button
                        type='submit'
                        className='flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors'
                      >
                        Add Service
                      </button>
                      <button
                        type='button'
                        onClick={() => setIsPopupOpen(false)}
                        className='flex-1 bg-black text-white py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors'
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </>
          )}

          {/* Edit Service Popup */}
          {isEditPopupOpen && (
            <>
              {/* Backdrop blur overlay */}
              <div 
                className='fixed inset-0 backdrop-blur-sm bg-black/30 z-40'
                onClick={() => setIsEditPopupOpen(false)}
              ></div>
              
              {/* Popup Modal */}
              <div className='fixed inset-0 flex justify-center items-center z-50 pointer-events-none'>
                <div className='bg-white rounded-lg p-8 w-[500px] max-h-[90vh] overflow-y-auto relative shadow-2xl pointer-events-auto'>
                  <button
                    onClick={() => setIsEditPopupOpen(false)}
                    className='absolute top-4 right-4 text-gray-500 hover:text-gray-700'
                  >
                    <IoMdClose size={24} />
                  </button>

                  <h2 className='text-2xl font-bold mb-6 text-gray-800'>Edit Service</h2>

                  <form onSubmit={handleEditSubmit} className='space-y-4'>
                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Service Name</label>
                      <input
                        type='text'
                        name='serviceName'
                        value={editFormData.serviceName}
                        onChange={handleEditChange}
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Category</label>
                      <select
                        name='category'
                        value={editFormData.category}
                        onChange={handleEditChange}
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                        required
                      >
                        <option value='Maintenance'>Maintenance</option>
                        <option value='Repair'>Repair</option>
                        <option value='Modification'>Modification</option>
                        <option value='Inspection'>Inspection</option>
                        <option value='Cleaning'>Cleaning</option>
                      </select>
                    </div>

                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Description</label>
                      <textarea
                        name='description'
                        value={editFormData.description}
                        onChange={handleEditChange}
                        rows={3}
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                      />
                    </div>

                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Estimated Duration (hours)</label>
                      <input
                        type='number'
                        name='estimatedDuration'
                        value={editFormData.estimatedDuration}
                        onChange={handleEditChange}
                        step='0.5'
                        min='0.5'
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Base Price (LKR)</label>
                      <input
                        type='number'
                        name='basePrice'
                        value={editFormData.basePrice}
                        onChange={handleEditChange}
                        step='0.01'
                        min='0'
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
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
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                      />
                    </div>

                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Priority</label>
                      <select
                        name='priority'
                        value={editFormData.priority}
                        onChange={handleEditChange}
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                        required
                      >
                        <option value='LOW'>Low</option>
                        <option value='MEDIUM'>Medium</option>
                        <option value='HIGH'>High</option>
                      </select>
                    </div>

                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Max Daily Slots</label>
                      <input
                        type='number'
                        name='maxDailySlots'
                        value={editFormData.maxDailySlots}
                        onChange={handleEditChange}
                        min='1'
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Service Image</label>
                      <div className='space-y-3'>
                        {editFormData.serviceImage && (
                          <div className='relative w-full h-48 rounded-lg overflow-hidden border border-gray-300'>
                            <img
                              src={editFormData.serviceImage}
                              alt='Service preview'
                              className='w-full h-full object-cover'
                            />
                            <button
                              type='button'
                              onClick={() => setEditFormData(prev => ({ ...prev, serviceImage: '' }))}
                              className='absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors'
                            >
                              <IoMdClose size={20} />
                            </button>
                          </div>
                        )}
                        <button
                          type='button'
                          onClick={handleEditImageUpload}
                          disabled={uploadingImage}
                          className='w-full px-4 py-3 bg-indigo-50 text-indigo-600 border-2 border-indigo-300 border-dashed rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                          <CloudUploadIcon />
                          {uploadingImage ? 'Uploading...' : editFormData.serviceImage ? 'Change Image' : 'Upload Image'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className='block text-gray-700 font-semibold mb-2'>Additional Notes</label>
                      <textarea
                        name='additionalNotes'
                        value={editFormData.additionalNotes}
                        onChange={handleEditChange}
                        rows={2}
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                      />
                    </div>

                    <div className='flex gap-4 mt-6'>
                      <button
                        type='submit'
                        className='flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors'
                      >
                        Update Service
                      </button>
                      <button
                        type='button'
                        onClick={() => setIsEditPopupOpen(false)}
                        className='flex-1 bg-black text-white py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors'
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </>
          )}

          {/* Delete Confirmation Dialog - Two-Factor */}
          {isDeleteDialogOpen && serviceToDelete && (
            <>
          {/* Backdrop blur overlay */}
          <div 
            className='fixed inset-0 backdrop-blur-sm bg-black/30 z-40'
            onClick={handleDeleteCancel}
          ></div>
          
          {/* Dialog Modal */}
          <div className='fixed inset-0 flex justify-center items-center z-50 pointer-events-none'>
            <div className='bg-white rounded-lg p-8 w-[500px] relative shadow-2xl pointer-events-auto'>
              
              {deleteConfirmStep === 1 ? (
                // Step 1: First Confirmation
                <>
                  <div className='flex items-center justify-center mb-4'>
                    <div className='bg-red-100 p-3 rounded-full'>
                      <DeleteIcon sx={{ color: '#ef4444', fontSize: 40 }} />
                    </div>
                  </div>
                  
                  <h2 className='text-2xl font-bold mb-4 text-gray-800 text-center'>Delete Service?</h2>
                  
                  <div className='mb-6 text-gray-600 text-center'>
                    <p className='mb-2'>Are you sure you want to delete:</p>
                    <p className='font-semibold text-gray-800 text-lg'>
                      {serviceToDelete.serviceName}
                    </p>
                    <p className='text-sm text-gray-500'>{serviceToDelete.category}</p>
                  </div>

                  <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6'>
                    <p className='text-sm text-yellow-800'>
                      ⚠️ This action requires confirmation. You will need to confirm again in the next step.
                    </p>
                  </div>

                  <div className='flex gap-4'>
                    <button
                      onClick={handleDeleteCancel}
                      className='flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors'
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteConfirmStep1}
                      className='flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors'
                    >
                      Continue
                    </button>
                  </div>
                </>
              ) : (
                // Step 2: Final Confirmation
                <>
                  <div className='flex items-center justify-center mb-4'>
                    <div className='bg-red-100 p-3 rounded-full'>
                      <DeleteIcon sx={{ color: '#ef4444', fontSize: 40 }} />
                    </div>
                  </div>
                  
                  <h2 className='text-2xl font-bold mb-4 text-red-600 text-center'>Final Confirmation</h2>
                  
                  <div className='mb-6 text-gray-600 text-center'>
                    <p className='mb-2'>You are about to permanently delete:</p>
                    <p className='font-semibold text-gray-800 text-lg'>
                      {serviceToDelete.serviceName}
                    </p>
                    <p className='text-sm text-gray-500 mb-4'>{serviceToDelete.category}</p>
                  </div>

                  <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6'>
                    <p className='text-sm text-red-800 font-semibold mb-2'>
                      ⚠️ WARNING: This action cannot be undone!
                    </p>
                    <p className='text-sm text-red-700'>
                      All service data will be permanently removed from the system.
                    </p>
                  </div>

                  <div className='flex gap-4'>
                    <button
                      onClick={handleDeleteCancel}
                      className='flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors'
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteConfirmStep2}
                      className='flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors'
                    >
                      Delete Permanently
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
  );
};

export default ServicesPage;
