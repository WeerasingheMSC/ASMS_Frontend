import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

const getAuthHeader = () => {
  const userData = localStorage.getItem('user')
  if (!userData) return {}
  
  const user = JSON.parse(userData)
  return {
    Authorization: `Bearer ${user.token}`
  }
}

export const changeRequestAPI = {
  // Customer endpoints
  createChangeRequest: async (appointmentId: number, reason: string) => {
    const response = await axios.post(
      `${API_URL}/customer/change-requests`,
      { appointmentId, reason },
      { headers: getAuthHeader() }
    )
    return response.data
  },

  getMyRequests: async () => {
    const response = await axios.get(
      `${API_URL}/customer/change-requests/my-requests`,
      { headers: getAuthHeader() }
    )
    return response.data
  },

  canEditAppointment: async (appointmentId: number) => {
    const response = await axios.get(
      `${API_URL}/customer/change-requests/can-edit/${appointmentId}`,
      { headers: getAuthHeader() }
    )
    return response.data // Returns { canEdit: boolean }
  },

  // Admin endpoints
  getPendingRequests: async () => {
    const response = await axios.get(
      `${API_URL}/admin/change-requests/pending`,
      { headers: getAuthHeader() }
    )
    return response.data
  },

  getAllRequests: async () => {
    const response = await axios.get(
      `${API_URL}/admin/change-requests/all`,
      { headers: getAuthHeader() }
    )
    return response.data
  },

  approveRequest: async (requestId: number, adminResponse: string = 'Approved') => {
    const response = await axios.put(
      `${API_URL}/admin/change-requests/${requestId}/approve`,
      { adminResponse },
      { headers: getAuthHeader() }
    )
    return response.data
  },

  rejectRequest: async (requestId: number, adminResponse: string = 'Rejected') => {
    const response = await axios.put(
      `${API_URL}/admin/change-requests/${requestId}/reject`,
      { adminResponse },
      { headers: getAuthHeader() }
    )
    return response.data
  },
}
