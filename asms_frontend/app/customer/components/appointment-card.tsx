"use client"

import { useState } from "react"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Calendar, Clock, Wrench, Star } from "lucide-react"

interface AppointmentCardProps {
  appointment: any
  hasReview: boolean
  onReviewSubmit: (rating: string, comment: string) => void
}

const STATUS_CONFIG = {
  pending: { badge: "bg-yellow-100 text-yellow-800", label: "Pending" },
  confirmed: { badge: "bg-blue-100 text-blue-800", label: "Confirmed" },
  "in-service": { badge: "bg-purple-100 text-purple-800", label: "In Service" },
  "ready-for-pickup": { badge: "bg-green-100 text-green-800", label: "Ready for Pickup" },
  completed: { badge: "bg-teal-100 text-teal-800", label: "Completed" },
  cancelled: { badge: "bg-red-100 text-red-800", label: "Cancelled" },
}

export default function AppointmentCard({ appointment, hasReview, onReviewSubmit }: AppointmentCardProps) {
  const [showReviewModal, setShowReviewModal] = useState(false)
  const config = STATUS_CONFIG[appointment.status as keyof typeof STATUS_CONFIG]
  const appointmentDate = new Date(appointment.date)
  const dateStr = appointmentDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
      <div className="p-6">
        {/* Header with Status */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-black">
              {appointment.vehicleInfo.brand} {appointment.vehicleInfo.model}
            </h3>
            <p className="text-sm text-gray-500">{appointment.vehicleInfo.registrationNumber}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.badge}`}>{config.label}</span>
        </div>

        {/* Service Info */}
        <div className="space-y-3 mb-4 pb-4 border-b border-gray-300">
          <div className="flex items-center gap-2 text-sm">
            <Wrench className="w-4 h-4 text-blue-600" />
            <span className="text-black">{appointment.serviceCategory} - {appointment.serviceType}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-black">{dateStr}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-black">{appointment.time}</span>
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs">Type</p>
            <p className="font-medium text-black">{appointment.vehicleInfo.type}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Year</p>
            <p className="font-medium text-black">{appointment.vehicleInfo.year}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Fuel Type</p>
            <p className="font-medium text-black">{appointment.vehicleInfo.fuelType}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Status</p>
            <p className="font-medium text-black capitalize">{appointment.status.replace("-", " ")}</p>
          </div>
        </div>

        {/* Notes */}
        {appointment.notes && (
          <div className="mb-4 p-3 bg-gray-100 rounded text-sm text-black">{appointment.notes}</div>
        )}

        {/* Review Button */}
        {appointment.status === "completed" && !hasReview && (
          <Button onClick={() => setShowReviewModal(true)} variant="outline" className="w-full bg-white border-gray-400 text-gray-500 hover:bg-gray-50">
            <Star className="w-4 h-4 mr-2" />
            Leave Review
          </Button>
        )}
        {hasReview && appointment.status === "completed" && (
          <div className="p-3 bg-green-50 rounded text-sm text-green-800">✓ Review submitted</div>
        )}
      </div>
    </Card>
  )
}
