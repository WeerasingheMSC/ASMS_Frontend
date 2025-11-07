import axios from "axios"

const API_BASE_URL = "http://localhost:8080/api"

// Create axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    const fullURL = `${config.baseURL || ""}${config.url || ""}`
    console.log("[v0] API Request:", {
      url: config.url,
      method: config.method?.toUpperCase(),
      dataType: typeof config.data,
      dataKeys: config.data ? Object.keys(config.data) : "no data",
      headerKeys: Object.keys(config.headers || {}),
      authHeader:
  typeof config.headers?.Authorization === "string"
    ? `${config.headers.Authorization.substring(0, 20)}...`
    : "none",

    })
    return config
  },
  (error) => {
    console.error("[v0] Request Interceptor Error:", error.message)
    return Promise.reject(error)
  },
)

// Response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log("[v0] API Response Success:", {
      status: response.status,
      statusText: response.statusText,
      dataReceived: response.data ? "yes" : "no",
    })
    return response
  },
  (error) => {
    console.error("[v0] API Error Response:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      errorMessage: error.response?.data?.message || error.message,
      errorDetails: error.response?.data,
    })
    return Promise.reject(error)
  },
)

export const reviewAPI = {
  addReview: async (data: any, token: string) => {
    console.log("[v0] addReview: Validating input data...")

    // Validate required fields
    if (!data.appointmentId) {
      console.error("[v0] VALIDATION FAILED: appointmentId is missing or 0")
      throw new Error("appointmentId is required and must be a valid number")
    }
    if (!data.rating || data.rating < 1 || data.rating > 5) {
      console.error("[v0] VALIDATION FAILED: rating must be between 1-5, got:", data.rating)
      throw new Error("rating must be between 1 and 5")
    }
    if (typeof data.comment !== "string") {
      console.error("[v0] VALIDATION FAILED: comment must be a string, got:", typeof data.comment)
      throw new Error("comment must be a string")
    }

    const userDataStr = localStorage.getItem("user")
    const userData = userDataStr ? JSON.parse(userDataStr) : {}
    const username = userData?.username || ""
    const userId = userData?.id || null

    const cleanData = {
      appointmentId: Number(data.appointmentId),
      rating: Number(data.rating),
      comment: String(data.comment).trim(),
      username: username,
      userId: userId, // Include userId for backend authorization
    }

    console.log("[v0] addReview: Validation passed. Clean data:", cleanData)
    console.log("[v0] addReview: Token length:", token?.length)
    console.log("[v0] addReview: Username included:", username, "UserID included:", userId)

    try {
      const response = await api.post("/customer/reviews", cleanData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      console.log("[v0] addReview: SUCCESS")
      return response
    } catch (error: any) {
      console.error("[v0] addReview: FAILED with error:", error?.response?.status, error?.response?.data)
      throw error
    }
  },

  updateReview: async (id: number, data: any, token: string) => {
    console.log("[v0] updateReview: Validating input...", { id, dataKeys: Object.keys(data) })

    if (!id || id <= 0) {
      console.error("[v0] VALIDATION FAILED: id is invalid")
      throw new Error("appointmentId must be a valid number")
    }
    if (!data.rating || data.rating < 1 || data.rating > 5) {
      console.error("[v0] VALIDATION FAILED: rating must be 1-5")
      throw new Error("rating must be between 1 and 5")
    }

    const cleanData = {
      rating: Number(data.rating),
      comment: String(data.comment || "").trim(),
    }

    console.log("[v0] updateReview: Clean data:", cleanData)

    try {
      const response = await api.put(`/customer/reviews/${id}`, cleanData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      console.log("[v0] updateReview: SUCCESS")
      return response
    } catch (error: any) {
      console.error("[v0] updateReview: FAILED", error?.response?.status)
      throw error
    }
  },

  deleteReview: async (id: number, token: string) => {
    console.log("[v0] deleteReview: ID=", id)

    if (!id || id <= 0) {
      throw new Error("Invalid appointmentId")
    }

    try {
      const response = await api.delete(`/customer/reviews/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      console.log("[v0] deleteReview: SUCCESS")
      return response
    } catch (error: any) {
      console.error("[v0] deleteReview: FAILED", error?.response?.status)
      throw error
    }
  },


  getReviewByAppointment: async (appointmentId: number, token: string) => {
    console.log("[v0] getReviewByAppointment:", appointmentId)
    try {
      const response = await api.get(`/customer/reviews/${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      console.log("[v0] getReviewByAppointmentWithId: SUCCESS - Review ID:", response.data?.id);
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log("[v0] No review found for appointment:", appointmentId)
        return null
      }
      console.error("[v0] getReviewByAppointmentWithId: FAILED", error?.response?.status);
      throw error
    }
  },
}
export default reviewAPI;