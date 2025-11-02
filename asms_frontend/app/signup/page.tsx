'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FaUser, FaEnvelope, FaLock, FaUserTag } from 'react-icons/fa';

const SignUpForm = () => {
  const searchParams = useSearchParams();
  const roleFromUrl = searchParams.get('role') || 'ROLE_CUSTOMER';
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: roleFromUrl
  });

  const getRoleDisplayName = (role: string) => {
    switch(role) {
      case 'ROLE_CUSTOMER': return 'Customer';
      case 'ROLE_MECHANIC': return 'Mechanic';
      case 'ROLE_ADMIN': return 'Admin';
      default: return 'Customer';
    }
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'ROLE_CUSTOMER': return 'text-blue-600';
      case 'ROLE_MECHANIC': return 'text-green-600';
      case 'ROLE_ADMIN': return 'text-purple-600';
      default: return 'text-blue-600';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    try {
      // Split fullName into firstName and lastName
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      // Generate username from email (part before @)
      const username = formData.email.split('@')[0];
      
      const response = await fetch('http://localhost:8080/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          email: formData.email,
          password: formData.password,
          firstName: firstName,
          lastName: lastName,
          phoneNumber: formData.phoneNumber,
          role: formData.role
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Account created successfully as ${getRoleDisplayName(formData.role)}! You can now sign in.`);
        // Redirect to sign in page
        window.location.href = '/signin';
      } else {
        const errorResult = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        alert(errorResult.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error during sign up:', error);
      alert('Network error. Please check if the backend is running.');
    }
  };

  return (
    <div className="min-h-screen flex justify-end items-center bg-red-100 px-4 sm:px-6 lg:px-8" style={{backgroundImage: 'url("/Bg1.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className='p-6 sm:p-8 md:p-10 rounded-lg shadow-lg w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mr-0 sm:mr-8 md:mr-12 lg:-mr-8' >
        <div className="flex justify-center mb-4 sm:mb-6">
          <img src="/logo.png" alt="logo" className='w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-30 lg:h-30 rounded-full border-2 sm:border-4 border-white'/>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4 text-center text-gray-200">Sign Up</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-white text-sm sm:text-base font-medium mb-2">
              Full Name
            </label>
            <div className="relative">
              <FaUser className="text-black relative text-xl top-8 left-2 z-10" />
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="off"
                required
                className="w-full px-10 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-500"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-white text-sm sm:text-base font-medium mb-2">
              Email Address
            </label>
            <div className="relative">
              <FaEnvelope className="text-black relative text-xl top-8 left-2 z-10" />
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

          {/* Phone Number */}
          <div>
            <label htmlFor="phoneNumber" className="block text-white text-sm sm:text-base font-medium mb-2">
              Phone Number
            </label>
            <div className="relative">
              <FaUser className="text-black relative text-xl top-8 left-2 z-10" />
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                autoComplete="off"
                required
                pattern="[0-9]{10}"
                className="w-full px-10 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-500"
                placeholder="Enter 10-digit phone number"
                value={formData.phoneNumber}
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
            Create {getRoleDisplayName(formData.role)} Account
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
  );
};

const page = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpForm />
    </Suspense>
  );
};

export default page;


