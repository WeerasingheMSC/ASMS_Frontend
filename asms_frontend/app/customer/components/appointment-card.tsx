"use client"

import { useState, useEffect } from "react"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Calendar, Clock, Wrench, Star, Trash2, Edit, Edit2 } from "lucide-react"
import ReviewModal from "../components/review-modal"
import { reviewAPI } from "../../lib/reviewsApi"
import { changeRequestAPI } from "../../lib/changeRequestApi"

interface AppointmentCardProps {
  appointment: any
  review?: { rating: number; comment: string } | null    
  hasReview: boolean
  reviewContent?: string
  onReviewSubmit: (rating: string, comment: string) => void
  onEditReview: (appointmentId: string, rating: string, comment: string) => void
  onDeleteReview: (appointmentId: string) => void
  onCancel: (appointmentId: string) => void
  onEdit?: (appointmentId: string) => void
}

const STATUS_CONFIG = {
  PENDING: { badge: "bg-yellow-100 text-yellow-800", label: "Pending" },
  CONFIRMED: { badge: "bg-blue-100 text-blue-800", label: "Confirmed" },
  IN_SERVICE: { badge: "bg-purple-100 text-purple-800", label: "In Service" },
  READY: { badge: "bg-green-100 text-green-800", label: "Ready for Pickup" },
  COMPLETED: { badge: "bg-teal-100 text-teal-800", label: "Completed" },
  CANCELLED: { badge: "bg-red-100 text-red-800", label: "Cancelled" },
}



export default function AppointmentCard({
  appointment,
  hasReview=false,
  reviewContent,
  onReviewSubmit,
  onEditReview,
  onDeleteReview,
  onCancel,
  onEdit,
}: AppointmentCardProps) {
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showReviewActions, setShowReviewActions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [reviewId, setReviewId] = useState<number | null>(null)
  const [canEditAppointment, setCanEditAppointment] = useState(false)
  const [checkingEditPermission, setCheckingEditPermission] = useState(false)
  const config = STATUS_CONFIG[appointment.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
  const appointmentDate = new Date(appointment.date)
  const dateStr = appointmentDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  // Check if appointment can be edited (has approved change request)
  useEffect(() => {
    checkEditPermission()
  }, [appointment.id])

  const checkEditPermission = async () => {
    // Only check for PENDING or CONFIRMED appointments
    if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
      setCanEditAppointment(false)
      return
    }

    try {
      setCheckingEditPermission(true)
      const result = await changeRequestAPI.canEditAppointment(Number(appointment.id))
      setCanEditAppointment(result.canEdit)
    } catch (error) {
      console.error('Error checking edit permission:', error)
      setCanEditAppointment(false)
    } finally {
      setCheckingEditPermission(false)
    }
  }

  const fetchReviewData = async () => {
  const token = getToken()
  if (!token) return

  try {
    const review = await reviewAPI.getReviewByAppointment(Number(appointment.id), token)
    if (review) {
      setLocalReview({ rating: review.rating, comment: review.comment })
      setReviewId(review.id) // <CHANGE> Store the review ID
    } else {
      setLocalReview(null)
      setReviewId(null)
    }
  } catch (err) {
    console.error("Error fetching review:", err)
  }
}

  const getReviewDetails = () => {
    if (!reviewContent) return { rating: 0, comment: "" }
    const [ratingPart, ...commentParts] = reviewContent.split(" - ")
    return { rating: parseInt(ratingPart), comment: commentParts.join(" - ") }
  }

  const reviewDetails = getReviewDetails()

    const [localReview, setLocalReview] = useState<{
  rating: number
  comment: string
} | null>(hasReview ? reviewDetails : null)


  // ✅ Utility: get JWT token safely
const getToken = (): string | null => {
  const userData = localStorage.getItem("user")  // CORRECT KEY (matches appointments)
  if (!userData) return null
  try {
    const parsed = JSON.parse(userData)
    return parsed.token || null
  } catch {
    return null
  }
}

  // ✅ Add new review
  const handleReviewSubmit = async (rating: string, comment: string) => {
    const token = getToken()
    if (!token) return alert("⚠️ Please log in again.")

    const reviewData = {
      appointmentId: Number(appointment.id),
      rating: parseInt(rating),
      comment: comment.trim(),
    }

    try {
      await reviewAPI.addReview(reviewData, token)
      alert("✅ Review added successfully!")
      await fetchReviewData()
      onReviewSubmit(rating, comment)
    } catch (err: any) {
      if (err.response?.status === 403) alert("🚫 Not authorized.")
      else alert("❌ Failed to submit review.")
      console.error(err)
    } finally {
      setShowReviewModal(false)
    }
    setLocalReview({ rating: parseInt(rating), comment })

  }

  // ✅ Edit review
  const handleEditReview = async (appointmentId: string, rating: string, comment: string) => {
    const token = getToken()
    if (!token) return alert("⚠️ Please log in again.")
    if (!reviewId) return alert("⚠️ Could not find review ID. Please try again.")

    const reviewData = { rating: parseInt(rating), comment: comment.trim() }
    try {
      //await reviewAPI.updateReview(Number(appointmentId), reviewData, token)
      await reviewAPI.updateReview(reviewId, reviewData, token)
      alert("✅ Review updated successfully!")
      await fetchReviewData()
      onEditReview(appointmentId, rating, comment)
    } catch (err: any) {
      if (err.response?.status === 403) alert("🚫 Not authorized.")
      else alert("❌ Failed to update review.")
      console.error(err)
    } finally {
      setIsEditing(false)
      setShowReviewModal(false)
    }
    setLocalReview({ rating: parseInt(rating), comment })
  }

  // ✅ Delete review
  const handleDeleteReview = async (appointmentId: string) => {
    if (!window.confirm("🗑️ Are you sure you want to delete this review?")) return
    const token = getToken()
    if (!token) return alert("⚠️ Please log in again.")
    if (!reviewId) return alert("⚠️ Could not find review ID. Please try again.")
    try {
      //await reviewAPI.deleteReview(Number(appointmentId), token)
      await reviewAPI.deleteReview(reviewId, token)
      alert("✅ Review deleted successfully!")
      setLocalReview(null)
      setReviewId(null)
      await fetchReviewData()

      onDeleteReview(appointmentId)
    } catch (err: any) {
      if (err.response?.status === 403) alert("🚫 Not authorized.")
      else alert("❌ Failed to delete review.")
      console.error(err)
    } finally {
      setShowReviewActions(false)
    }
    setLocalReview(null)
  }

  useEffect(() => {
  if (appointment.status.toLowerCase() === "completed") {
    fetchReviewData()
  }
}, [appointment.id])

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg text-black">
                {appointment.vehicleInfo.brand} {appointment.vehicleInfo.model}
              </h3>
              <p className="text-sm text-gray-500">{appointment.vehicleInfo.registrationNumber}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.badge}`}>
              {config.label}
            </span>
          </div>

          {/* Service Info */}
          <div className="space-y-3 mb-4 pb-4 border-b border-gray-300">
            <div className="flex items-center gap-2 text-sm">
              <Wrench className="w-4 h-4 text-blue-600" />
              <span className="text-black">
                {appointment.serviceCategory} - {appointment.serviceType}
              </span>
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
          {/* Edit Appointment Button - if has approved change request */}
          {canEditAppointment && (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
            <Button
              onClick={() => onEdit && onEdit(appointment.id)}
              className="bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
              size="sm"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit Appointment
            </Button>
          )}

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
{appointment.status.toLowerCase() === "completed" && !localReview && (
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


          {localReview && appointment.status.toLowerCase() === "completed" && (
  <div className="flex items-center gap-3">
    <div className="flex items-center text-green-600 text-sm font-medium bg-green-50 px-3 py-2 rounded-lg border border-green-200">
      <Star className="w-4 h-4 mr-1 fill-green-600" />
      Reviewed ({localReview.rating}/5)
    </div>

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

                <button
                  onClick={() => handleDeleteReview(appointment.id)}
                  className="text-red-600 hover:text-red-800 flex items-center gap-1"
                  title="Delete Review"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Review Modal */}
      {showReviewModal && (
<ReviewModal
  appointmentId={appointment.id}
  initialRating={
    isEditing
      ? localReview?.rating ?? reviewDetails.rating
      : 0
  }
  initialComment={
    isEditing
      ? localReview?.comment ?? reviewDetails.comment
      : ""
  }
  onSubmit={(rating, comment) => {
    if (isEditing) handleEditReview(appointment.id, rating, comment)
    else handleReviewSubmit(rating, comment)
  }}
  onClose={() => {
    setShowReviewModal(false)
    setIsEditing(false)
  }}
  isEditing={isEditing}
/>

      )}

      {/* Close dropdown when clicking outside */}
      {showReviewActions && <div className="fixed inset-0 z-0" onClick={() => setShowReviewActions(false)} />}
    </>
  )
} 
