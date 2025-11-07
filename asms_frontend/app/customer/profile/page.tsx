'use client'
import React, { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { IoMdClose } from "react-icons/io"
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import { FaUserCircle } from 'react-icons/fa'

declare global {
  interface Window {
    cloudinary: any;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const CustomerProfilePage = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const cloudinaryRef = useRef<any>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    profileImage: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      window.location.href = '/signin';
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setFormData({
      username: parsedUser.username || '',
      email: parsedUser.email || '',
      firstName: parsedUser.firstName || '',
      lastName: parsedUser.lastName || '',
      phoneNumber: parsedUser.phoneNumber || '',
      address: parsedUser.address || '',
      profileImage: parsedUser.profileImage || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setLoading(false);
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
        if (script.parentNode) {
          document.body.removeChild(script);
        }
      };
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
        maxFileSize: 5000000,
        folder: 'asms_profiles',
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
            profileImage: result.info.secure_url
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password fields if changing password
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'New passwords do not match!' });
        return;
      }
      if (!formData.currentPassword) {
        setMessage({ type: 'error', text: 'Current password is required to change password!' });
        return;
      }
      if (formData.newPassword.length < 6) {
        setMessage({ type: 'error', text: 'Password must be at least 6 characters long!' });
        return;
      }
    }

    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        window.location.href = '/signin';
        return;
      }

      const user = JSON.parse(userData);
      const updateData: any = {
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        profileImage: formData.profileImage
      };

      // Add password fields if changing password
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await fetch(`${API_URL}/api/customer/profile/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        
        // Update localStorage with new user data
        const newUserData = { ...user, ...updatedUser };
        localStorage.setItem('user', JSON.stringify(newUserData));
        setUser(newUserData);
        
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    }
  };

  if (loading) {
    return (
      <div className='flex h-screen bg-gray-50'>
        <Sidebar activeItem='Profile' />
        <div className='flex-1 ml-[16.666%] flex flex-col'>
          <Navbar />
          <div className='flex-1 flex items-center justify-center pt-16'>
            <div className='text-xl text-gray-600'>Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <Sidebar activeItem='Profile' />
      <div className='flex-1 ml-[16.666%] flex flex-col'>
        <Navbar />
        <div className='flex-1 overflow-y-auto p-8 pt-24'>
          {/* Page Header */}
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-gray-800'>Profile Settings</h1>
            <p className='text-gray-600 mt-2'>Manage your account information and settings</p>
          </div>

          {/* Message Display */}
          {message.text && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-700 border border-green-400'
                  : 'bg-red-100 text-red-700 border border-red-400'
              }`}
            >
              <span>{message.text}</span>
              <button onClick={() => setMessage({ type: '', text: '' })} className='ml-4'>
                <IoMdClose size={20} />
              </button>
            </div>
          )}

          {/* Profile Form */}
          <div className='bg-white rounded-lg shadow-md p-8'>
            <form onSubmit={handleSubmit}>
              {/* Profile Image Section */}
              <div className='mb-8 pb-8 border-b border-gray-200'>
                <h2 className='text-xl font-semibold text-gray-800 mb-6'>Profile Picture</h2>
                <div className='flex items-center gap-6'>
                  {formData.profileImage ? (
                    <div className='relative'>
                      <img
                        src={formData.profileImage}
                        alt='Profile'
                        className='w-32 h-32 rounded-full object-cover border-4 border-blue-500'
                      />
                      <button
                        type='button'
                        onClick={() => setFormData(prev => ({ ...prev, profileImage: '' }))}
                        className='absolute top-0 right-0 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors'
                      >
                        <IoMdClose size={20} />
                      </button>
                    </div>
                  ) : (
                    <FaUserCircle className='w-32 h-32 text-gray-300' />
                  )}
                  <div>
                    <button
                      type='button'
                      onClick={handleImageUpload}
                      disabled={uploadingImage}
                      className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <CloudUploadIcon />
                      {uploadingImage ? 'Uploading...' : formData.profileImage ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    <p className='text-sm text-gray-500 mt-2'>PNG, JPG, JPEG, GIF or WEBP (max 5MB)</p>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className='mb-8 pb-8 border-b border-gray-200'>
                <h2 className='text-xl font-semibold text-gray-800 mb-6'>Personal Information</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label className='block text-gray-700 font-semibold mb-2'>Username *</label>
                    <input
                      type='text'
                      name='username'
                      value={formData.username}
                      onChange={handleChange}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-gray-700 font-semibold mb-2'>Email *</label>
                    <input
                      type='email'
                      name='email'
                      value={formData.email}
                      onChange={handleChange}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-gray-700 font-semibold mb-2'>First Name</label>
                    <input
                      type='text'
                      name='firstName'
                      value={formData.firstName}
                      onChange={handleChange}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                    />
                  </div>

                  <div>
                    <label className='block text-gray-700 font-semibold mb-2'>Last Name</label>
                    <input
                      type='text'
                      name='lastName'
                      value={formData.lastName}
                      onChange={handleChange}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                    />
                  </div>

                  <div>
                    <label className='block text-gray-700 font-semibold mb-2'>Phone Number</label>
                    <input
                      type='tel'
                      name='phoneNumber'
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                      placeholder='+94 XX XXX XXXX'
                    />
                  </div>

                  <div>
                    <label className='block text-gray-700 font-semibold mb-2'>Address</label>
                    <textarea
                      name='address'
                      value={formData.address}
                      onChange={handleChange}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                      rows={3}
                      placeholder='Enter your address'
                    />
                  </div>
                </div>
              </div>

              {/* Change Password Section */}
              <div className='mb-8'>
                <h2 className='text-xl font-semibold text-gray-800 mb-6'>Change Password</h2>
                <p className='text-sm text-gray-600 mb-4'>Leave blank if you don&apos;t want to change your password</p>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='md:col-span-2'>
                    <label className='block text-gray-700 font-semibold mb-2'>Current Password</label>
                    <input
                      type='password'
                      name='currentPassword'
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                      autoComplete='current-password'
                    />
                  </div>

                  <div>
                    <label className='block text-gray-700 font-semibold mb-2'>New Password</label>
                    <input
                      type='password'
                      name='newPassword'
                      value={formData.newPassword}
                      onChange={handleChange}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                      autoComplete='new-password'
                      minLength={6}
                    />
                    <p className='text-xs text-gray-500 mt-1'>Minimum 6 characters</p>
                  </div>

                  <div>
                    <label className='block text-gray-700 font-semibold mb-2'>Confirm New Password</label>
                    <input
                      type='password'
                      name='confirmPassword'
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                      autoComplete='new-password'
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex gap-4 justify-end'>
                <button
                  type='button'
                  onClick={() => window.location.reload()}
                  className='px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold'
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfilePage;
