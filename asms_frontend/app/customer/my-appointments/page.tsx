"use client"

import Sidebar from "../components/Sidebar"
import Navbar from "../components/Navbar"
import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"  
import { Card } from "../components/ui/card"
import { Plus, Search } from "lucide-react"
import AppointmentCard from "../components/appointment-card"
import BookingWizard from "../components/booking-wizard"
import { getCustomerAppointments, AppointmentResponse, cancelAppointment } from "../../lib/appointmentsApi"

export default function MyAppointments() {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showWizard, setShowWizard] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await getCustomerAppointments()
      setAppointments(data)
    } catch (err) {
      console.error("Error fetching appointments:", err)
      setError("Failed to load appointments. Please try again.")
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  // Transform backend appointment to frontend format for AppointmentCard
  const transformAppointment = (appointment: AppointmentResponse) => ({
    id: appointment.id.toString(),
    vehicleInfo: {
      type: appointment.vehicleType,
      brand: appointment.vehicleBrand,
      model: appointment.model,
      year: parseInt(appointment.yearOfManufacture),
      registrationNumber: appointment.registerNumber,
      fuelType: appointment.fuelType,
    },
    serviceCategory: appointment.serviceCategory,
    serviceType: appointment.serviceType,
    date: appointment.appointmentDate,
    time: appointment.timeSlot,
    status: appointment.status, // Keep uppercase format from backend
    notes: appointment.additionalRequirements || "",
  })

  // Filter appointments based on search and status
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = !searchQuery || 
      apt.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.vehicleBrand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.model.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = !filterStatus || apt.status.toLowerCase() === filterStatus.toLowerCase()
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar activeItem="My Appointments" />
      
      <div className="flex-1 ml-[16.666667%] overflow-auto">
        <Navbar />
        <div className="p-8 pt-24">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">My Appointments</h1>
            <p className="text-gray-600 text-lg">Manage and track all your service appointments</p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 bg-white p-6 rounded-xl border border-gray-200">
            <div className="relative w-full lg:w-96">
              <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by service, brand, or model..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="hidden lg:block w-px h-12 bg-gray-300"></div>

            <Button
              onClick={() => setShowWizard(true)}
              className="bg-blue-800 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5 mr-2" />
              Book New Appointment
            </Button>
          </div>

          {/* Statistics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-400 transition-all duration-300">
              <div>
                <p className="text-gray-600 text-xs font-medium mb-1">Total Appointments</p>
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-blue-600">{appointments.length}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">All time bookings</p>
              </div>
            </Card>

            <Card className="bg-white p-4 rounded-lg border border-gray-200 hover:border-yellow-400 transition-all duration-300">
              <div>
                <p className="text-gray-600 text-xs font-medium mb-1">Upcoming</p>
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-yellow-600">
                    {appointments.filter((a) => ["PENDING", "CONFIRMED"].includes(a.status)).length}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-1">Pending & confirmed</p>
              </div>
            </Card>

            <Card className="bg-white p-4 rounded-lg border border-gray-200 hover:border-purple-400 transition-all duration-300">
              <div>
                <p className="text-gray-600 text-xs font-medium mb-1">In Progress</p>
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-purple-600">
                    {appointments.filter((a) => a.status === "IN_SERVICE").length}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-1">Currently being serviced</p>
              </div>
            </Card>

            <Card className="bg-white p-4 rounded-lg border border-gray-200 hover:border-green-400 transition-all duration-300">
              <div>
                <p className="text-gray-600 text-xs font-medium mb-1">Completed</p>
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-green-600">
                    {appointments.filter((a) => a.status === "COMPLETED").length}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-1">Successfully finished</p>
              </div>
            </Card>
          </div>

          {/* Filter by Status */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center pb-4 border-b border-gray-200">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter by Status
            </h3>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                onClick={() => setFilterStatus(null)}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                  filterStatus === null
                    ? "bg-blue-800 text-white shadow-md transform scale-105 hover:bg-blue-900"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All <span className="ml-1.5 bg-white/20 px-2 py-0.5 rounded-full text-sm">{appointments.length}</span>
              </Button>
              
              <Button
                onClick={() => setFilterStatus("PENDING")}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                  filterStatus === "PENDING"
                    ? "bg-yellow-500 text-white shadow-md transform scale-105 hover:bg-yellow-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Pending <span className="ml-1.5 bg-white/20 px-2 py-0.5 rounded-full text-sm">{appointments.filter(a => a.status === "PENDING").length}</span>
              </Button>

              <Button
                onClick={() => setFilterStatus("CONFIRMED")}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                  filterStatus === "CONFIRMED"
                    ? "bg-blue-500 text-white shadow-md transform scale-105 hover:bg-blue-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Confirmed <span className="ml-1.5 bg-white/20 px-2 py-0.5 rounded-full text-sm">{appointments.filter(a => a.status === "CONFIRMED").length}</span>
              </Button>

              <Button
                onClick={() => setFilterStatus("IN_SERVICE")}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                  filterStatus === "IN_SERVICE"
                    ? "bg-purple-500 text-white shadow-md transform scale-105 hover:bg-purple-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                In Service <span className="ml-1.5 bg-white/20 px-2 py-0.5 rounded-full text-sm">{appointments.filter(a => a.status === "IN_SERVICE").length}</span>
              </Button>

              <Button
                onClick={() => setFilterStatus("READY")}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                  filterStatus === "READY"
                    ? "bg-cyan-500 text-white shadow-md transform scale-105 hover:bg-cyan-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Ready <span className="ml-1.5 bg-white/20 px-2 py-0.5 rounded-full text-sm">{appointments.filter(a => a.status === "READY").length}</span>
              </Button>

              <Button
                onClick={() => setFilterStatus("COMPLETED")}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                  filterStatus === "COMPLETED"
                    ? "bg-green-500 text-white shadow-md transform scale-105 hover:bg-green-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Completed <span className="ml-1.5 bg-white/20 px-2 py-0.5 rounded-full text-sm">{appointments.filter(a => a.status === "COMPLETED").length}</span>
              </Button>

              <Button
                onClick={() => setFilterStatus("CANCELLED")}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                  filterStatus === "CANCELLED"
                    ? "bg-red-500 text-white shadow-md transform scale-105 hover:bg-red-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Cancelled <span className="ml-1.5 bg-white/20 px-2 py-0.5 rounded-full text-sm">{appointments.filter(a => a.status === "CANCELLED").length}</span>
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 rounded-lg p-6 mb-8 border border-red-200 border-l-4 border-l-red-500">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-red-800 font-semibold mb-1">Error Loading Appointments</h3>
                  <p className="text-red-700">{error}</p>
                  <Button 
                    onClick={fetchAppointments}
                    className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Appointments List */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center pb-4 border-b border-gray-200">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {filterStatus ? `${filterStatus.charAt(0) + filterStatus.slice(1).toLowerCase()} Appointments` : 'All Appointments'}
              <span className="ml-3 text-sm font-normal text-gray-500">({filteredAppointments.length} total)</span>
            </h3>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-6 rounded-xl">
                  <div className="animate-pulse">
                    <div className="h-5 bg-gray-200 rounded mb-3 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4 w-2/3"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <div className="h-8 bg-gray-200 rounded flex-1"></div>
                      <div className="h-8 bg-gray-200 rounded flex-1"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <Card className="p-12 text-center rounded-xl">
              <div className="max-w-sm mx-auto">
                <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No appointments found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || filterStatus 
                    ? "Try adjusting your search or filter criteria" 
                    : "Book your first appointment to get started!"}
                </p>
                {!searchQuery && !filterStatus && (
                  <Button
                    onClick={() => setShowWizard(true)}
                    className="bg-blue-800 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Book New Appointment
                  </Button>
                )}
              </div>
            </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={transformAppointment(appointment)}
                    hasReview={false}
                    onReviewSubmit={(rating: string, comment: string) => {
                      fetchAppointments() // <CHANGE> Refetch appointments after review added
                    }}
                    onEditReview={(appointmentId: string, rating: string, comment: string) => {
                      fetchAppointments() // <CHANGE> Refetch appointments after review edited
                    }}
                    onDeleteReview={(appointmentId: string) => {
                      fetchAppointments() // <CHANGE> Refetch appointments after review deleted
                    }}
                    onCancel={async (appointmentId: string) => {
                      try {
                        await cancelAppointment(Number(appointmentId))
                        alert("Appointment cancelled successfully!")
                        fetchAppointments()
                      } catch (error) {
                        console.error("Cancel failed:", error)
                        alert("Failed to cancel appointment. Please try again.")
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showWizard && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
            <BookingWizard 
              onClose={() => {
                setShowWizard(false)
                fetchAppointments()
              }} 
            />
          </div>
        </div>
      )}
    </div>
  )
}