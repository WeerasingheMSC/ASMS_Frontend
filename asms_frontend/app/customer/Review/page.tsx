'use client'
import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import ChatBot from '../components/ChatBot'
import { FaStar, FaEdit, FaTrash, FaUser } from 'react-icons/fa'
import { MdRateReview } from 'react-icons/md'
import reviewAPI from '@/app/lib/reviewsApi'

interface Review {
  id: number
  rating: number
  comment: string
  appointmentId: number
  username: string
  createdAt: string
  updatedAt: string
}

const ReviewPage = () => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setCurrentUser(parsedUser)
      console.log('User loaded:', parsedUser)
      fetchAllReviews()
    } else {
      console.log('No user found, redirecting to login...')
      setLoading(false)
      // Optionally redirect to login
      // window.location.href = '/signin'
    }
  }, [])

  const fetchAllReviews = async () => {
    try {
      setLoading(true)
      const userData = localStorage.getItem('user')
      if (!userData) {
        console.log('No user data found')
        setLoading(false)
        return
      }

      const user = JSON.parse(userData)
      console.log('Fetching reviews for user:', user.username)
      const allReviews = await reviewAPI.getAllReviews(user.token)
      console.log('Reviews fetched:', allReviews)
      setReviews(allReviews)
    } catch (error: any) {
      console.error('Failed to fetch reviews:', error)
      setError('Failed to load reviews: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (review: Review) => {
    setEditingReview(review)
    setEditRating(review.rating)
    setEditComment(review.comment)
    setShowEditModal(true)
    setError('')
    setSuccess('')
  }

  const handleUpdateReview = async () => {
    if (!editingReview || !currentUser) return

    try {
      setError('')
      setSuccess('')

      await reviewAPI.updateReview(
        editingReview.id,
        { rating: editRating, comment: editComment },
        currentUser.token
      )

      setSuccess('Review updated successfully!')
      setShowEditModal(false)
      fetchAllReviews()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      console.error('Failed to update review:', error)
      setError(error.response?.data?.message || 'Failed to update review')
    }
  }

  const handleDeleteReview = async (reviewId: number) => {
    if (!currentUser) return
    
    if (!confirm('Are you sure you want to delete this review?')) return

    try {
      setError('')
      setSuccess('')

      await reviewAPI.deleteReview(reviewId, currentUser.token)
      
      setSuccess('Review deleted successfully!')
      fetchAllReviews()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      console.error('Failed to delete review:', error)
      setError(error.response?.data?.message || 'Failed to delete review')
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className='flex gap-1'>
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`text-lg ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    )
  }

  const renderEditStars = (rating: number, setRating: (r: number) => void) => {
    return (
      <div className='flex gap-2'>
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            onClick={() => setRating(star)}
            className={`text-3xl cursor-pointer transition-colors ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-500`}
          />
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isOwnReview = (review: Review) => {
    return review.username === currentUser?.username
  }

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <Sidebar activeItem='Review' />
      <div className='flex-1 ml-[16.666667%]'>
        <Navbar />
        <div className='p-8 mt-16'>
          {/* Header */}
          <div className='mb-8'>
            <div className='flex items-center gap-3 mb-2'>
              <MdRateReview className='text-4xl text-blue-600' />
              <h1 className='text-3xl font-bold text-gray-800'>Customer Reviews</h1>
            </div>
            <p className='text-gray-600'>See what our customers are saying about our service</p>
            {/* Debug info */}
            <p className='text-xs text-gray-400 mt-2'>
              Debug: {loading ? 'Loading...' : `${reviews.length} reviews loaded`} | User: {currentUser?.username || 'Not logged in'}
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700'>
              {error}
            </div>
          )}
          {success && (
            <div className='mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700'>
              {success}
            </div>
          )}

          {/* Reviews List */}
          {loading ? (
            <div className='flex justify-center items-center h-64'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className='text-center py-16'>
              <MdRateReview className='text-6xl text-gray-300 mx-auto mb-4' />
              <p className='text-xl text-gray-500'>No reviews yet</p>
              <p className='text-gray-400 mt-2'>Be the first to share your experience!</p>
            </div>
          ) : (
            <div className='grid gap-6'>
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className={`bg-white rounded-lg shadow-md p-6 border-2 transition-all hover:shadow-lg ${
                    isOwnReview(review) ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className='flex justify-between items-start mb-4'>
                    <div className='flex items-start gap-4'>
                      <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl'>
                        {review.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className='flex items-center gap-2'>
                          <h3 className='text-lg font-semibold text-gray-800'>
                            {review.username}
                          </h3>
                          {isOwnReview(review) && (
                            <span className='px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold'>
                              Your Review
                            </span>
                          )}
                        </div>
                        <div className='flex items-center gap-3 mt-1'>
                          {renderStars(review.rating)}
                          <span className='text-sm text-gray-500'>
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isOwnReview(review) && (
                      <div className='flex gap-2'>
                        <button
                          onClick={() => handleEditClick(review)}
                          className='p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors'
                          title='Edit Review'
                        >
                          <FaEdit className='text-lg' />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className='p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors'
                          title='Delete Review'
                        >
                          <FaTrash className='text-lg' />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className='text-gray-700 leading-relaxed'>{review.comment}</p>

                  {review.updatedAt !== review.createdAt && (
                    <p className='text-xs text-gray-400 mt-3 italic'>
                      Edited on {formatDate(review.updatedAt)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Edit Modal */}
          {showEditModal && (
            <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
              <div className='bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl'>
                <h2 className='text-2xl font-bold text-gray-800 mb-6'>Edit Your Review</h2>

                <div className='mb-6'>
                  <label className='block text-sm font-semibold text-gray-700 mb-3'>
                    Rating
                  </label>
                  {renderEditStars(editRating, setEditRating)}
                </div>

                <div className='mb-6'>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Your Review
                  </label>
                  <textarea
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                    rows={5}
                    placeholder='Share your experience...'
                  />
                </div>

                {error && (
                  <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm'>
                    {error}
                  </div>
                )}

                <div className='flex gap-3'>
                  <button
                    onClick={handleUpdateReview}
                    className='flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors'
                  >
                    Update Review
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setError('')
                    }}
                    className='flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors'
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* ChatBot Component */}
      <ChatBot />
    </div>
  )
}

export default ReviewPage
