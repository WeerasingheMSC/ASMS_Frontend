'use client';
import { MdEmail } from "react-icons/md";
import React, { useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(result.message || 'Password reset link has been sent to your email.');
        setIsSuccess(true);
        setEmail('');
      } else {
        const errorResult = await response.json().catch(() => ({ 
          message: 'Failed to send reset link' 
        }));
        setMessage(errorResult.message || 'Email not found. Please check and try again.');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Error during password reset request:', error);
      setMessage('Network error. Please check if the backend is running.');
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex justify-end items-center bg-cover bg-center px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: 'url("/Forgetpassowrd.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className=" backdrop-blur-sm p-6 sm:p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-sm md:max-w-md">
        <div className="flex justify-center mb-4 sm:mb-6">
          <img 
            src="/logo.png" 
            alt="logo" 
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-30 md:h-30 rounded-full border-2 sm:border-4 border-white shadow-lg"
          />
        </div>
        
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-center text-white">
          Forgot Password?
        </h1>
        <p className="text-sm sm:text-base text-center text-gray-200 mb-6">
          Enter your email address and we&apos;ll send you a link to reset your password.
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

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="email" className="block text-white text-sm sm:text-base font-bold mb-2">
              Email Address
            </label>
            <div className="relative">
              <MdEmail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl sm:text-2xl" />
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-400"
                required
                disabled={isSubmitting}
              />
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
                Sending...
              </span>
            ) : (
              'Send Reset Link'
            )}
          </button>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-center">
            <Link 
              href="/signin" 
              className="text-sm sm:text-base font-medium !text-blue-600 !hover:text-blue-800 underline"
            >
              Back to Sign In
            </Link>
            <span className="hidden sm:inline text-gray-400">|</span>
            <Link 
              href="/signup" 
              className="text-sm sm:text-base font-medium !text-blue-600 !hover:text-blue-800 underline"
            >
              Create Account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
