"use client"

import { useState } from "react"
import { Button } from "../components/ui/button"
import { X, Star } from "lucide-react"

interface ReviewModalProps {
  appointmentId: string
  initialRating?: number
  initialComment?: string
  onSubmit: (rating: string, comment: string) => void
  onClose: () => void
  isEditing?: boolean
}

export default function ReviewModal({ 
  appointmentId, 
  initialRating = 0, 
  initialComment = "", 
  onSubmit, 
  onClose, 
  isEditing = false 
}: ReviewModalProps) {
  const [rating, setRating] = useState(initialRating)
  const [comment, setComment] = useState(initialComment)
  const [hoverRating, setHoverRating] = useState(0)

  const handleSubmit = () => {
    if (rating === 0) {
      alert("Please select a rating")
      return
    }
    onSubmit(String(rating), comment)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Leave a Review</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Star Rating */}
        <div className="mb-6">
          <p className="text-sm font-medium text-foreground mb-3">Rate your service experience</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label className="text-sm font-medium text-foreground block mb-2">Share your feedback (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your experience..."
            className="w-full p-3 border border-gray-300 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none bg-transparent"
            rows={4}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 border-gray-300 bg-transparent text-foreground hover:bg-accent">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
            {isEditing ? "Update Review" : "Submit Review"}
          </Button>
        </div>
      </div>
    </div>
  )
}
