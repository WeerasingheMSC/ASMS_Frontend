'use client';
import { FaLock } from "react-icons/fa6";
import { IoEye, IoEyeOff } from "react-icons/io5";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(true);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      // Optionally validate token with backend here
    } else {
      setIsTokenValid(false);
      setMessage('Invalid or missing reset token.');
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validatePassword = () => {
    if (formData.newPassword.length < 8) {
      setMessage('Password must be at least 8 characters long.');
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!validatePassword()) {
      setIsSuccess(false);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: formData.newPassword
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(result.message || 'Password reset successful! Redirecting to sign in...');
        setIsSuccess(true);
        setFormData({ newPassword: '', confirmPassword: '' });
        
        // Redirect to signin after 2 seconds
        setTimeout(() => {
          router.push('/signin');
        }, 2000);
      } else {
        const errorResult = await response.json().catch(() => ({ 
          message: 'Failed to reset password' 
        }));
        setMessage(errorResult.message || 'Failed to reset password. The link may have expired.');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Error during password reset:', error);
      setMessage('Network error. Please check if the backend is running.');
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isTokenValid) {
    return (
      <div 
        className="min-h-screen flex justify-center items-center bg-cover bg-center px-4 sm:px-6 lg:px-8"
        style={{
          backgroundImage: 'url("/Forgetpassowrd.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="bg-tr backdrop-blur-sm p-6 sm:p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-sm md:max-w-md text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Invalid Reset Link</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          <Link 
            href="/forgot-password"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex justify-end items-center bg-cover bg-center px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: 'url("/Forgetpassowrd.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="bg-transparent backdrop-blur-sm p-6 sm:p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-sm md:max-w-md">
        <div className="flex justify-center mb-4 sm:mb-6">
          <img 
            src="/logo.png" 
            alt="logo" 
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-30 md:h-30 rounded-full border-2 sm:border-4 border-white shadow-lg"
          />
        </div>
        
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-center text-white">
          Reset Password
        </h1>
        <p className="text-sm sm:text-base text-center text-gray-200 mb-6">
          Enter your new password below.
        </p>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            isSuccess 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-white text-sm sm:text-base font-bold mb-2">
              New Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-lg sm:text-xl" />
              <input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Enter new password"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full pl-12 pr-12 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-400"
                required
                disabled={isSubmitting}
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showNewPassword ? 
                  <IoEyeOff className="text-black text-xl sm:text-2xl" /> : 
                  <IoEye className="text-black text-xl sm:text-2xl" />
                }
              </button>
            </div>
            <p className="text-xs text-gray-300 mt-1">Must be at least 8 characters</p>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-white text-sm sm:text-base font-bold mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-lg sm:text-xl" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-12 pr-12 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-400"
                required
                disabled={isSubmitting}
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showConfirmPassword ? 
                  <IoEyeOff className="text-black text-xl sm:text-2xl" /> : 
                  <IoEye className="text-black text-xl sm:text-2xl" />
                }
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 sm:py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Resetting...
              </span>
            ) : (
              'Reset Password'
            )}
          </button>

          <div className="text-center pt-2">
            <Link 
              href="/signin" 
              className="text-sm sm:text-base font-bold !text-blue-600 !hover:text-blue-800 underline"
            >
              Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
