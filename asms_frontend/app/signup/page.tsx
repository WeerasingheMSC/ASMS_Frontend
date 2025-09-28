'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaUser, FaEnvelope, FaPhone, FaLock } from 'react-icons/fa';

const page = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    // Handle sign up logic here
    console.log('Sign up attempt:', formData);
  };

  return (
    <div className="min-h-screen flex justify-end items-center bg-red-100 px-4 sm:px-6 lg:px-8" style={{backgroundImage: 'url("/Bg1.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className='p-6 sm:p-8 md:p-10 rounded-lg shadow-lg w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mr-0 sm:mr-8 md:mr-12 lg:-mr-6' >
        <div className="flex justify-center mb-4 sm:mb-6">
          <img src="/logo.png" alt="logo" className='w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-30 lg:h-30 rounded-full border-2 sm:border-4 border-white'/>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-center text-gray-200">Sign Up</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* First Name and Last Name */}


          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-white text-sm sm:text-base font-medium mb-2">
              Email Address
            </label>
            <div className="relative">
              <FaUser className="text-black relative text-xl top-8 left-2 z-10" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="off"
                required
                className="w-full px-10 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-500"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-white text-sm sm:text-base font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <FaLock className="text-black relative text-xl top-8 left-2 z-10" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="off"
                required
                className="w-full px-10 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-500"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-white text-sm sm:text-base font-medium mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <FaLock className="text-black relative text-xl top-8 left-2 z-10" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="off"
                required
                className="w-full px-10 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-500"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-center">
            <input
              id="agree-terms"
              name="agree-terms"
              type="checkbox"
              required
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="agree-terms" className="ml-2 block text-sm sm:text-base text-gray-100">
              I agree to the{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300">
                Terms and Conditions
              </a>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full flex justify-center py-2 sm:py-3 px-4 border border-transparent rounded-md shadow-sm text-sm sm:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
          >
            Create Account
          </button>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-sm sm:text-base text-gray-200">
              Already have an account?{' '}
              <Link href="/signin" className="font-medium text-blue-400 hover:text-blue-300">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default page
