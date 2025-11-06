"use client"

import Sidebar from '../components/Sidebar'
import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Plus, Search, Filter } from "lucide-react"
import AppointmentCard from "../components/appointment-card"
import BookingWizard from "../components/booking-wizard"


const MOCK_APPOINTMENTS = [
  {
    id: "1",
    vehicleInfo: {
      type: "Sedan",
      brand: "Toyota",
      model: "Camry",
      year: 2022,
      registrationNumber: "ABC-1234",
      fuelType: "Petrol",
    },
    serviceCategory: "Maintenance",
    serviceType: "Oil Change",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    time: "10:00 AM",
    status: "completed",
    notes: "",
    review: null,
  },
  {
    id: "2",
    vehicleInfo: {
      type: "SUV",
      brand: "Honda",
      model: "CR-V",
      year: 2021,
      registrationNumber: "XYZ-5678",
      fuelType: "Diesel",
    },
    serviceCategory: "Repair",
    serviceType: "Brake Inspection",
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    time: "02:00 PM",
    status: "confirmed",
    notes: "Bring original documents",
    review: null,
  },
  {
    id: "3",
    vehicleInfo: {
      type: "Sedan",
      brand: "Maruti",
      model: "Swift",
      year: 2023,
      registrationNumber: "DEF-9012",
      fuelType: "Petrol",
    },
    serviceCategory: "Maintenance",
    serviceType: "General Service",
    date: new Date().toISOString(),
    time: "11:30 AM",
    status: "in-service",
    notes: "",
    review: null,
  },
  {
    id: "4",
    vehicleInfo: {
      type: "Sedan",
      brand: "Hyundai",
      model: "Creta",
      year: 2020,
      registrationNumber: "GHI-3456",
      fuelType: "Petrol",
    },
    serviceCategory: "Repair",
    serviceType: "Battery Replacement",
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    time: "03:00 PM",
    status: "ready-for-pickup",
    notes: "",
    review: null,
  },
  {
    id: "5",
    vehicleInfo: {
      type: "SUV",
      brand: "Mahindra",
      model: "XUV500",
      year: 2019,
      registrationNumber: "JKL-7890",
      fuelType: "Diesel",
    },
    serviceCategory: "Maintenance",
    serviceType: "Oil Change",
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    time: "09:00 AM",
    status: "cancelled",
    notes: "",
    review: null,
  },
]



export default function CustomerPage() {
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const statuses = [
    { value: "pending", label: "Pending", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    { value: "confirmed", label: "Confirmed", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { value: "in-service", label: "In Service", color: "bg-purple-50 text-purple-700 border-purple-200" },
    { value: "ready-for-pickup", label: "Ready", color: "bg-green-50 text-green-700 border-green-200" },
    { value: "completed", label: "Completed", color: "bg-gray-50 text-gray-700 border-gray-200" },
    { value: "cancelled", label: "Cancelled", color: "bg-red-50 text-red-700 border-red-200" },
  ]

  useEffect(() => {
    fetchAppointments()
  }, [])
  
  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/bookings")
      if (response.ok) {
        const data = await response.json()
        if (data.appointments && data.appointments.length > 0) {
          setAppointments([...MOCK_APPOINTMENTS, ...data.appointments])
        }
      }
    } catch (error) {
      console.error("Error fetching appointments:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus = filterStatus ? apt.status === filterStatus : true
    const matchesSearch = searchQuery
      ? apt.vehicleInfo.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.vehicleInfo.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.serviceType.toLowerCase().includes(searchQuery.toLowerCase())
      : true
    return matchesStatus && matchesSearch
  })

  const handleReviewSubmit = (appointmentId: string, rating: string, comment: string) => {
    const submitReview = async () => {
      try {
        const response = await fetch("/api/reviews", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            appointmentId,
            rating,
            comment,
          }),
        })

        if (response.ok) {
          setReviews((prev) => ({
            ...prev,
            [appointmentId]: `${rating} - ${comment}`,
          }))
        }
      } catch (error) {
        console.error("Error submitting review:", error)
      }
    }

    submitReview()
  }

  return (
    <div className="relative">
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar activeItem="My Appointments" />

        <div className="flex-1 overflow-y-auto ml-[16.666667%]">
          <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Header Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h1 className="text-4xl font-bold text-black mb-2">My Appointments</h1>
                    <p className="text-muted-foreground text-lg">Track and manage your service appointments</p>
                  </div>
                  <Button
                    onClick={() => setShowWizard(true)}
                    size="lg"
                    className="bg-primary hover:bg-primary-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-6"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    New Appointment
                  </Button>
                </div>

                {/* Search Bar */}
                <div className="mt-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by vehicle, registration number, or service..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 text-gray-500 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium mb-1">Total</p>
                      <p className="text-3xl font-bold text-black">{appointments.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Filter className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium mb-1">Upcoming</p>
                      <p className="text-3xl font-bold text-black">
                        {appointments.filter((a) => ["pending", "confirmed"].includes(a.status)).length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <div className="w-6 h-6 text-primary font-bold">📅</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium mb-1">In Progress</p>
                      <p className="text-3xl font-bold text-black">
                        {appointments.filter((a) => a.status === "in-service").length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                      <div className="w-6 h-6 text-purple-600 font-bold">⚙️</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium mb-1">Completed</p>
                      <p className="text-3xl font-bold text-black">
                        {appointments.filter((a) => a.status === "completed").length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                      <div className="w-6 h-6 text-green-600 font-bold">✓</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-black">Filter by Status</h3>
                </div>
                
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  <button
                    onClick={() => setFilterStatus(null)}
                    className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                      filterStatus === null
                        ? "bg-primary text-white shadow-md scale-105"
                        : "bg-gray-50 text-foreground border border-gray-200 hover:border-primary hover:bg-blue-50"
                    }`}
                  >
                    All ({appointments.length})
                  </button>

                  {statuses.map((status) => {
                    const count = appointments.filter((apt) => apt.status === status.value).length
                    return (
                      <button
                        key={status.value}
                        onClick={() => setFilterStatus(status.value)}
                        className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap border ${
                          filterStatus === status.value
                            ? "bg-primary text-white shadow-md scale-105 border-primary"
                            : `${status.color} hover:scale-105 hover:shadow-md`
                        }`}
                      >
                        {status.label} ({count})
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Loading Indicator */}
              {loading && (
                <Card className="p-16 text-center bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground text-lg font-medium">Loading appointments...</p>
                  </div>
                </Card>
              )}

              {/* Appointments Grid */}
              {!loading && filteredAppointments.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-foreground">
                      {filterStatus 
                        ? `${statuses.find(s => s.value === filterStatus)?.label} Appointments` 
                        : 'All Appointments'} 
                      <span className="text-muted-foreground ml-2">({filteredAppointments.length})</span>
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAppointments.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        hasReview={!!reviews[appointment.id]}
                        onReviewSubmit={(rating, comment) =>
                          handleReviewSubmit(appointment.id, rating, comment)
                        }
                      />
                    ))}
                  </div>
                </>
              ) : !loading ? (
                <Card className="p-16 text-center bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-5xl">📋</span>
                    </div>
                    <div>
                      <p className="text-foreground text-xl font-semibold mb-2">No appointments found</p>
                      <p className="text-muted-foreground">
                        {searchQuery ? "Try adjusting your search criteria" : "Create your first appointment to get started"}
                      </p>
                    </div>
                    {!searchQuery && (
                      <Button
                        onClick={() => setShowWizard(true)}
                        className="bg-primary hover:bg-primary-600 text-white rounded-xl mt-4"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Appointment
                      </Button>
                    )}
                  </div>
                </Card>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Modal overlay for BookingWizard */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <BookingWizard onClose={() => setShowWizard(false)} />
          </div>
        </div>
      )}
    </div>
  )
}