'use client';
import { FaUser,FaLock } from "react-icons/fa6";
import { IoEye,IoEyeOff } from "react-icons/io5";
import React, { useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const page = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify(result));

        // determine redirect path from returned user/roles
        const determineRedirect = (user: any) => {
          const roles: string[] = [];
          if (!user) return '/Admin';
          // single role string
          if (typeof user.role === 'string' && user.role) roles.push(user.role);
          // roles as array (strings or objects)
          if (Array.isArray(user.roles)) {
            user.roles.forEach((r: any) => {
              if (!r) return;
              if (typeof r === 'string') roles.push(r);
              else if (r.authority) roles.push(r.authority);
              else if (r.name) roles.push(r.name);
            });
          }
          // authorities array (common in some backends)
          if (Array.isArray(user.authorities)) {
            user.authorities.forEach((a: any) => {
              if (!a) return;
              if (typeof a === 'string') roles.push(a);
              else if (a.authority) roles.push(a.authority);
              else if (a.name) roles.push(a.name);
            });
          }
          // other possible fields
          if (user.type) roles.push(String(user.type));
          if (user.userType) roles.push(String(user.userType));

          const normalized = roles.map(r => String(r).toUpperCase());
          if (normalized.some(r => r.includes('ADMIN'))) return '/Admin';
          if (normalized.some(r => r.includes('MECHANIC') || r.includes('EMPLOYEE') || r.includes('STAFF'))) return '/employee';
          if (normalized.some(r => r.includes('CUSTOMER') || r.includes('USER'))) return '/customer';

          // fallback - keep previous behavior
          return '/Admin';
        };

        window.location.href = determineRedirect(result);
      } else {
        const errorResult = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        alert(errorResult.message || 'Login failed');
      }
    } catch (error) {
      console.error('Error during sign in:', error);
      alert('Network error. Please check if the backend is running.');
    }
  };


  const [showpassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex justify-end items-center bg-red-100 px-4 sm:px-6 lg:px-8" style={{backgroundImage: 'url("/Bg.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className='p-6 sm:p-8 md:p-10 rounded-lg shadow-lg w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mr-0 sm:mr-8 md:mr-12 lg:-mr-14' >
        <div className="flex justify-center mb-4 sm:mb-6">
          <img src="/logo.png" alt="logo" className='w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-30 lg:h-30 rounded-full border-2 sm:border-4 border-white'/>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-center text-gray-200">Sign In</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-white text-sm sm:text-base font-medium mb-2">
              Username
            </label>
            <FaUser className=" relative lg:text-2xl text-lg lg:top-10 top-7 left-2" />
                      <input
            type="text"
            name="username"
            placeholder="Enter your Username or Email"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-12 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-500"
            required
          />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm sm:text-base font-medium text-white mb-2">
              Password
            </label>
            <FaLock className=" relative lg:text-2xl text-lg top-7 lg:top-9 left-2" />
            <input
              id="password"
              name="password"
              type={showpassword ? "text" :"password"}
              autoComplete="off"
              required
              className="w-full px-12 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-500"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
            />
            <button type="button" onClick={() => setShowPassword(!showpassword)} className="relative lg:left-100 md:left-85 left-60 lg:-top-9 -top-7">{showpassword ? <IoEyeOff className="text-black lg:text-2xl text-xl" /> : <IoEye className="text-black lg:text-2xl text-xl"/>} </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm sm:text-base text-gray-100">
                Remember me
              </label>
            </div>

            <div className="text-sm sm:text-base">
              <a href="#" className="font-medium !text-blue-600 hover:!text-blue-400 underline">
                Forgot password?
              </a>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 sm:py-3 px-4 border border-transparent rounded-md shadow-sm text-sm sm:text-base font-medium text-white bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
          >
            Sign In
          </button>

          <div className="text-center">
            <p className="text-sm sm:text-base text-gray-200">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium !text-blue-600 hover:!text-blue-400 underline">
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )    
}

export default page
