"use client"

import { useState } from "react"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Calendar, Clock, Wrench, Star, Trash2, Edit, MoreVertical } from "lucide-react"
import ReviewModal from "../components/review-modal"

interface AppointmentCardProps {
  appointment: any
  hasReview: boolean
  reviewContent?: string
  onReviewSubmit: (rating: string, comment: string) => void
  onEditReview: (appointmentId: string, rating: string, comment: string) => void
  onDeleteReview: (appointmentId: string) => void
  onCancel: (appointmentId: string) => void
}

const STATUS_CONFIG = {
  PENDING: { badge: "bg-yellow-100 text-yellow-800", label: "Pending" },
  CONFIRMED: { badge: "bg-blue-100 text-blue-800", label: "Confirmed" },
  IN_SERVICE: { badge: "bg-purple-100 text-purple-800", label: "In Service" },
  READY: { badge: "bg-green-100 text-green-800", label: "Ready for Pickup" },
  COMPLETED: { badge: "bg-teal-100 text-teal-800", label: "Completed" },
  CANCELLED: { badge: "bg-red-100 text-red-800", label: "Cancelled" },
}

export default function AppointmentCard({ appointment, hasReview, onReviewSubmit,onCancel,reviewContent, onEditReview, onDeleteReview }: AppointmentCardProps) {
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showReviewActions, setShowReviewActions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const config = STATUS_CONFIG[appointment.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
  const appointmentDate = new Date(appointment.date)
  const dateStr = appointmentDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  const handleReviewSubmit = (rating: string, comment: string) => {
    onReviewSubmit(rating, comment)
    setShowReviewModal(false)
  }

  const handleEditReview = (rating: string, comment: string) => {
    onEditReview(appointment.id, rating, comment)
    setIsEditing(false)
    setShowReviewModal(false)
  }

  const handleDeleteReview = () => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      onDeleteReview(appointment.id)
      setShowReviewActions(false)
    }
  }

  // Parse review content to get rating and comment
  const getReviewDetails = () => {
    if (!reviewContent) return { rating: 0, comment: "" }
    const [ratingPart, ...commentParts] = reviewContent.split(" - ")
    return {
      rating: parseInt(ratingPart),
      comment: commentParts.join(" - ")
    }
  }

  const reviewDetails = getReviewDetails()

  return (
    <>
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

        
        {/* Action Buttons - Bottom Right Corner */}
        <div className="flex justify-end space-x-2 pt-4 ">
          {/* Cancel Button - only if pending */}
          {appointment.status === "PENDING" && (
            <Button
              onClick={() => onCancel(appointment.id)}
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          )}

           {/* Review Button - only if completed and no review */}
          {appointment.status === "COMPLETED" && !hasReview && (
            <Button 
              onClick={() => setShowReviewModal(true)} 
              variant="outline"
              className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
              size="sm"
            >
              <Star className="w-4 h-4 mr-1" />
              Review
            </Button>
          )}

          {hasReview && appointment.status === "COMPLETED" && (
  <div className="flex items-center gap-3">
    <div className="flex items-center text-green-600 text-sm font-medium bg-green-50 px-3 py-2 rounded-lg border border-green-200">
      <Star className="w-4 h-4 mr-1 fill-green-600" />
      Reviewed ({reviewDetails.rating}/5)
    </div>

    {/* Edit Icon */}
    <button
      onClick={() => {
        setIsEditing(true)
        setShowReviewModal(true)
      }}
      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
      title="Edit Review"
    >
      <Edit className="w-4 h-4" />
    </button>

    {/* Delete Icon */}
    <button
      onClick={handleDeleteReview}
      className="text-red-600 hover:text-red-800 flex items-center gap-1"
      title="Delete Review"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
)}


{/* {hasReview && appointment.status === "completed" && (
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-green-600 text-sm font-medium bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                    <Star className="w-4 h-4 mr-1 fill-green-600" />
                    Reviewed ({reviewDetails.rating}/5)
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReviewActions(!showReviewActions)}
                    className="w-8 h-8 p-0 hover:bg-gray-100"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Review Actions Dropdown */}
                {/* {showReviewActions && (
                  <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-[120px] z-10">
                    <button
                      onClick={() => {
                        setIsEditing(true)
                        setShowReviewModal(true)
                        setShowReviewActions(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md flex items-center"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={handleDeleteReview}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )} */} 
          </div>
        </div>

        
        {/* {showReviewModal && (
  <ReviewModal
    appointmentId={appointment.id}
    onSubmit={(rating, comment) => {
      onReviewSubmit(rating, comment)   // call parent function
      setShowReviewModal(false)         // close modal
    }}
    onClose={() => setShowReviewModal(false)} // close on cancel
  />
)} */}

    </Card>


      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal
          appointmentId={appointment.id}
          initialRating={isEditing ? reviewDetails.rating : 0}
          initialComment={isEditing ? reviewDetails.comment : ""}
          onSubmit={isEditing ? handleEditReview : handleReviewSubmit}
          onClose={() => {
            setShowReviewModal(false)
            setIsEditing(false)
          }}
          isEditing={isEditing}
        />
      )}

      {/* Close dropdown when clicking outside */}
      {showReviewActions && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowReviewActions(false)}
        />
        )}
    </>

  )
}
