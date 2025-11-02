'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaLock, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const SetPasswordForm = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setError('No token provided');
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/auth/verify-token?token=${token}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setUserInfo(result.data);
        setError('');
      } else {
        setError(result.message || 'Invalid or expired token');
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      setError('Network error. Please check if the backend is running.');
    } finally {
      setLoading(false);
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
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setVerifying(true);

    try {
      const response = await fetch('http://localhost:8080/api/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          newPassword: formData.newPassword
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/signin';
        }, 3000);
      } else {
        setError(result.message || 'Failed to set password');
      }
    } catch (error) {
      console.error('Error setting password:', error);
      setError('Network error. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying token...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Set Successfully!</h2>
          <p className="text-gray-600 mb-4">
            Your password has been set. Redirecting to login page...
          </p>
          <Link 
            href="/signin" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Click here if not redirected
          </Link>
        </div>
      </div>
    );
  }

  if (error && !userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <FaExclamationCircle className="text-red-500 text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Invalid or Expired Token</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/" 
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-100 px-4 sm:px-6 lg:px-8" 
      style={{
        backgroundImage: 'url("/Bg1.png")', 
        backgroundSize: 'cover', 
        backgroundPosition: 'center'
      }}
    >
      <div className="bg-white/90 backdrop-blur-sm p-6 sm:p-8 md:p-10 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img 
            src="/logo.png" 
            alt="logo" 
            className="w-20 h-20 rounded-full border-4 border-blue-500"
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center text-gray-800">
          Set Your Password
        </h1>

        {userInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Welcome, {userInfo.firstName} {userInfo.lastName}!</strong>
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Username: <span className="font-medium">{userInfo.username}</span>
            </p>
            <p className="text-xs text-gray-600">
              Email: <span className="font-medium">{userInfo.email}</span>
            </p>
          </div>
        )}

        <p className="text-center text-gray-600 mb-6">
          Please create a secure password for your account
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-gray-700 text-sm font-medium mb-2">
              New Password
            </label>
            <div className="relative">
              <FaLock className="text-gray-400 absolute text-xl top-3 left-3 z-10" />
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                placeholder="Enter new password"
                value={formData.newPassword}
                onChange={handleChange}
                minLength={6}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <FaLock className="text-gray-400 absolute text-xl top-3 left-3 z-10" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={verifying}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verifying ? 'Setting Password...' : 'Set Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already set your password?{' '}
            <Link href="/signin" className="font-medium text-blue-600 hover:text-blue-800">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const SetPasswordPage = () => {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SetPasswordForm />
    </Suspense>
  );
};

export default SetPasswordPage;