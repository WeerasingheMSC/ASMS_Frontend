"use client"

import Sidebar from "../components/Sidebar"
import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"  
import { Card } from "../components/ui/card"
import { Plus, Search } from "lucide-react"
import AppointmentCard from "../components/appointment-card"
import BookingWizard from "../components/booking-wizard"
import { getCustomerAppointments, AppointmentResponse } from "../../lib/appointmentsApi"

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
    status: appointment.status.toLowerCase(),
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
    <div className="flex h-screen">
      <Sidebar activeItem="My Appointments" />
      
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Appointments</h1>
            <p className="text-gray-600">Manage your service appointments and bookings</p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <Button
              onClick={() => setShowWizard(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Book New Appointment
            </Button>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search appointments..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-center">
                <p className="text-gray-500 text-sm mb-1">Total</p>
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-1"></div>
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-gray-800">{appointments.length}</p>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-center">
                <p className="text-gray-500 text-sm mb-1">Upcoming</p>
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-1"></div>
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-yellow-600">
                    {appointments.filter((a) => ["PENDING", "CONFIRMED"].includes(a.status)).length}
                  </p>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-center">
                <p className="text-gray-500 text-sm mb-1">In Progress</p>
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-1"></div>
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-purple-600">
                    {appointments.filter((a) => a.status === "IN_SERVICE").length}
                  </p>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-center">
                <p className="text-gray-500 text-sm mb-1">Completed</p>
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-1"></div>
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-green-600">
                    {appointments.filter((a) => a.status === "COMPLETED").length}
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Filter by Status */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Filter by Status</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setFilterStatus(null)}
                className={`${
                  filterStatus === null
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                All ({appointments.length})
              </Button>
              
              <Button
                onClick={() => setFilterStatus("PENDING")}
                className={`${
                  filterStatus === "PENDING"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Pending ({appointments.filter(a => a.status === "PENDING").length})
              </Button>

              <Button
                onClick={() => setFilterStatus("CONFIRMED")}
                className={`${
                  filterStatus === "CONFIRMED"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Confirmed ({appointments.filter(a => a.status === "CONFIRMED").length})
              </Button>

              <Button
                onClick={() => setFilterStatus("IN_SERVICE")}
                className={`${
                  filterStatus === "IN_SERVICE"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                In Service ({appointments.filter(a => a.status === "IN_SERVICE").length})
              </Button>

              <Button
                onClick={() => setFilterStatus("READY")}
                className={`${
                  filterStatus === "READY"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Ready ({appointments.filter(a => a.status === "READY").length})
              </Button>

              <Button
                onClick={() => setFilterStatus("COMPLETED")}
                className={`${
                  filterStatus === "COMPLETED"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Completed ({appointments.filter(a => a.status === "COMPLETED").length})
              </Button>

              <Button
                onClick={() => setFilterStatus("CANCELLED")}
                className={`${
                  filterStatus === "CANCELLED"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Cancelled ({appointments.filter(a => a.status === "CANCELLED").length})
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
              <Button 
                onClick={fetchAppointments}
                variant="outline" 
                className="mt-2 text-red-600 border-red-300 hover:bg-red-50"
              >
                Try Again
              </Button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500 mb-4">
                <p className="text-lg font-semibold mb-2">No appointments found</p>
                <p>Book your first appointment to get started!</p>
              </div>
              <Button
                onClick={() => setShowWizard(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Book New Appointment
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={transformAppointment(appointment)}
                  hasReview={false}
                  onReviewSubmit={(rating: string, comment: string) => {
                    console.log('Review submitted:', { appointmentId: appointment.id, rating, comment })
                  }}
                  onEditReview={(appointmentId: string, rating: string, comment: string) => {
                    console.log('Review edited:', { appointmentId, rating, comment })
                  }}
                  onDeleteReview={(appointmentId: string) => {
                    console.log('Review deleted:', appointmentId)
                  }}
                  onCancel={(appointmentId: string) => {
                    console.log('Appointment cancelled:', appointmentId)
                    fetchAppointments()
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showWizard && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
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