import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center">
      <div className="text-center text-white px-4">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <img 
              src="/logo.png" 
              alt="ASMS Logo" 
              className="w-32 h-32 rounded-full border-4 border-white/30 shadow-2xl"
            />
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-75 blur animate-pulse"></div>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-bold text-4xl md:text-6xl lg:text-7xl mb-6 drop-shadow-lg">
          Automobile Service Management System
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl md:text-2xl mb-12 opacity-90 max-w-3xl mx-auto">
          Your complete solution for managing vehicle services, maintenance, and customer relationships
        </p>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {/* Customer Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 hover:bg-white/20 transition duration-300">
            <div className="text-5xl mb-4">👤</div>
            <h3 className="text-2xl font-semibold mb-4">Customer</h3>
            <p className="text-sm opacity-80 mb-6">Book services, track your vehicle maintenance, and manage appointments</p>
            <Link 
              href="/signup?role=ROLE_CUSTOMER"
              className="block w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300 mb-3"
            >
              Sign Up as Customer
            </Link>
          </div>

          {/* Employee card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 hover:bg-white/20 transition duration-300">
            <div className="text-5xl mb-4">🔧</div>
            <h3 className="text-2xl font-semibold mb-4">Employee</h3>
            <p className="text-sm opacity-80 mb-6">Manage service tasks, update repair status, and communicate with customers</p>
            <Link 
              href="/signup?role=EMPLOYEE"
              className="block w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-300 mb-3"
            >
              Sign Up as Employee
            </Link>
          </div>

          {/* Admin Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 hover:bg-white/20 transition duration-300">
            <div className="text-5xl mb-4">⚙️</div>
            <h3 className="text-2xl font-semibold mb-4">Admin</h3>
            <p className="text-sm opacity-80 mb-6">Oversee operations, manage users, and access comprehensive reports</p>
            <Link 
              href="/signup?role=ROLE_ADMIN"
              className="block w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition duration-300 mb-3"
            >
              Sign Up as Admin
            </Link>
          </div>
        </div>

        {/* Sign In Section */}
        <div className="mb-8">
          <p className="text-lg mb-4">Already have an account?</p>
          <Link 
            href="/signin" 
            className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition duration-300 transform hover:scale-105"
          >
            Sign In
          </Link>
        </div>

        {/* Footer text */}
        <p className="mt-12 text-sm opacity-70">
          &copy; 2025 ASMS. Built with Next.js and Spring Boot
        </p>
      </div>
    </div>
  );
}
