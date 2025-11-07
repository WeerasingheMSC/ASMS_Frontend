"use client";
import Image from "next/image";
import Link from "next/link";
import {
  Wrench,
  CalendarDays,
  ClipboardList,
  Zap,
  Car,
  Users,
  Settings,
} from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#03070f] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/garage-bg.jpg"
          alt="Automobile Workshop"
          fill
          priority
          className="object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-linear-to-br from-[#03070f]/90 via-[#020918]/85 to-[#17315a]/80 backdrop-blur-sm"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(68,130,206,0.15),transparent_60%)] animate-pulse-slow"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[1800px] px-6 sm:px-10 md:px-16 lg:px-24 py-10 md:py-12 flex flex-col justify-between min-h-screen">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 md:gap-14 items-center grow">
          {/* LEFT SIDE */}
          <div className="text-center xl:text-left space-y-6">
            {/* Logo */}
            <div className="flex justify-center xl:justify-start mb-4">
              <div className="relative">
                <div className="absolute -inset-6 bg-linear-to-r from-[#4482ce] to-cyan-400 rounded-full opacity-70 blur-lg animate-pulse"></div>
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white/30 bg-[#020918]/80 backdrop-blur-sm overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="ASMS Logo"
                    width={120}
                    height={120}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="font-bold text-5xl sm:text-6xl md:text-7xl xl:text-8xl text-cyan-500 drop-shadow-lg tracking-tight">
              VX Service
            </h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl xl:text-4xl text-gray-200 font-semibold">
              Automobile Service Management System
            </h2>

            {/* Description */}
            <p className="text-sm sm:text-base md:text-lg xl:text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto xl:mx-0">
              Streamline your automotive service experience with our modern,
              customer-friendly management system for vehicle owners, employees,
              and administrators.
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto xl:mx-0">
              {[
                { icon: <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />, label: "Service Tracking" },
                { icon: <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />, label: "Appointment Booking" },
                { icon: <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />, label: "Maintenance History" },
                { icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />, label: "Quick Processing" },
              ].map(({ icon, label }) => (
                <div
                  key={label}
                  className="flex items-center space-x-3 bg-white/5 rounded-lg p-3 sm:p-4 text-sm sm:text-base backdrop-blur-sm hover:bg-white/10 transition"
                >
                  {icon}
                  <span className="text-gray-300">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-8 max-w-2xl mx-auto w-full">
            {/* CUSTOMER ACCESS */}
            <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-cyan-400/30 shadow-2xl hover:border-cyan-400/60 hover:bg-white/15 transition-all duration-300 transform hover:scale-[1.02]">
              <div className="text-center">
                <Car className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-300 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-2xl sm:text-3xl font-semibold mb-2 text-cyan-200">
                  Customer Access
                </h3>
                <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base md:text-lg">
                  Manage appointments, view your service records, and track
                  progress all in one place.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    href="/signup?role=ROLE_CUSTOMER"
                    className="inline-block px-4 py-3 sm:px-6 sm:py-4 bg-linear-to-r from-cyan-800 to-[#4482ce] font-semibold rounded-lg shadow-lg hover:from-[#0f1f3a] hover:to-cyan-500 active:scale-95 transition duration-300 border border-cyan-400/40 text-sm sm:text-base"
                  >
                    <p className="text-blue-100 mb-1 sm:mb-2 text-sm font-normal">
                      New to VX Service?
                    </p>
                    Create Account
                  </Link>
                  <Link
                    href="/signin?role=ROLE_CUSTOMER"
                    className="inline-block px-4 py-3 sm:px-6 sm:py-4 bg-linear-to-r from-transparent to-cyan-800 font-semibold rounded-lg shadow-lg hover:from-[#152449] hover:to-cyan-900 active:scale-95 transition duration-300 border border-cyan-400/40 text-sm sm:text-base"
                  >
                    <p className="text-blue-100 mb-1 sm:mb-2 text-sm font-normal">
                      Already have an Account?
                    </p>
                    Sign In
                  </Link>
                </div>
              </div>
            </div>

            {/* EMPLOYEE & ADMIN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Employee */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-white/20 shadow-lg hover:border-green-400/50 hover:bg-white/15 transition-all duration-300 transform hover:scale-[1.03]">
                <div className="text-center">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 mx-auto mb-2" />
                  <h3 className="text-base sm:text-lg font-medium mb-2 text-green-300">
                    Employee
                  </h3>
                  <Link
                    href="/signin?role=EMPLOYEE"
                    className="block w-full px-4 py-2 sm:py-3 bg-linear-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-800 active:scale-95 transition text-sm"
                  >
                    Sign In
                  </Link>
                </div>
              </div>

              {/* Admin */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-white/20 shadow-lg hover:border-purple-400/50 hover:bg-white/15 transition-all duration-300 transform hover:scale-[1.03]">
                <div className="text-center">
                  <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mx-auto mb-2" />
                  <h3 className="text-base sm:text-lg font-medium mb-2 text-purple-300">
                    Admin
                  </h3>
                  <Link
                    href="/signin?role=ROLE_ADMIN"
                    className="block w-full px-4 py-2 sm:py-3 bg-linear-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-800 active:scale-95 transition text-sm"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs sm:text-sm text-gray-400 opacity-80 mt-4">
          © 2025 Automobile Service Management System (ASMS) • Built with Next.js & Spring Boot
        </div>
      </div>
    </div>
  );
}
