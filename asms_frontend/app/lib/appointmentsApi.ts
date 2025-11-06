import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Types matching the backend DTOs
export interface AppointmentRequest {
  vehicle: {
    type: string;
    brand: string;
    model: string;
    year: string;
    registrationNumber: string;
    fuelType: string;
  };
  service: {
    category: string;
    type: string;
    requirements?: string;
  };
  datetime: {
    date: string; // ISO date string (YYYY-MM-DD)
    time: string; // 12-hour time format (HH:mm AM/PM)
  };
}

export interface AppointmentResponse {
  id: number;
  vehicleType: string;
  vehicleBrand: string;
  model: string;
  yearOfManufacture: string;
  registerNumber: string;
  fuelType: string;
  serviceCategory: string;
  serviceType: string;
  additionalRequirements?: string;
  appointmentDate: string; // ISO datetime string from backend
  timeSlot: string;
  status: string; // PENDING, CONFIRMED, COMPLETED, CANCELLED, IN_SERVICE, READY
  customerUsername: string;
  customerEmail: string;
  customerPhone: string;
  customerFirstName: string;
  customerLastName: string;
  assignedEmployeeId?: number;
  assignedEmployeeName?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Helper to convert 12-hour time to 24-hour format for LocalDateTime
function convertTo24Hour(time12h: string): string {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  let hour = parseInt(hours, 10);
  
  if (modifier.toUpperCase() === 'AM') {
    if (hour === 12) {
      hour = 0; // 12 AM = 00:xx
    }
  } else if (modifier.toUpperCase() === 'PM') {
    if (hour !== 12) {
      hour += 12; // 1-11 PM = 13-23:xx, 12 PM stays 12:xx
    }
  }
  
  return `${hour.toString().padStart(2, '0')}:${minutes}`;
}

// Helper to get auth token from localStorage
function getAuthToken(): string | null {
  try {
    const userData = localStorage.getItem('user');
    console.log('Raw userData from localStorage:', userData);

    if (!userData) {
      console.error('No user data found in localStorage');
      return null;
    }

    const user = JSON.parse(userData);
    console.log('Parsed user object:', user);
    console.log('Token from user object:', user.token);

    if (!user.token) {
      console.error('No token found in user object');
      return null;
    }

    return user.token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

// Helper to create axios instance with auth headers
function createAuthenticatedRequest() {
  const token = getAuthToken();
  console.log('Token retrieved for request:', token ? `${token.substring(0, 20)}...` : 'null');

  if (!token) {
    throw new Error('No authentication token found. Please sign in again.');
  }

  const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
  });

  console.log('Created axios instance with baseURL:', API_URL);
  console.log('Authorization header set:', `Bearer ${token.substring(0, 20)}...`);

  return axiosInstance;
}

// Create a new appointment
export async function createAppointment(appointmentData: AppointmentRequest): Promise<AppointmentResponse> {
  try {
    const api = createAuthenticatedRequest();

    // Use the data directly from the frontend component (no conversion needed)
    const appointmentDate = appointmentData.datetime.date; // "YYYY-MM-DD" from date picker
    const appointmentTime = appointmentData.datetime.time; // "HH:MM AM/PM" from time selector

    console.log('=== RAW DATA FROM FRONTEND ===');
    console.log('Date from frontend:', appointmentDate, '(type:', typeof appointmentDate, ')');
    console.log('Time from frontend:', appointmentTime, '(type:', typeof appointmentTime, ')');
    
    // Validate data format
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    const timePattern = /^\d{1,2}:\d{2}\s?(AM|PM)$/i;
    
    if (!datePattern.test(appointmentDate)) {
      console.error('Invalid date format:', appointmentDate);
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }
    
    if (!timePattern.test(appointmentTime)) {
      console.error('Invalid time format:', appointmentTime);
      throw new Error('Invalid time format. Expected HH:MM AM/PM');
    }
    
    console.log('✅ Date and time formats validated successfully');

    // Create datetime by combining date and time
    const combinedDateTime = `${appointmentDate}T${convertTo24Hour(appointmentTime)}:00`;
    console.log('Combined DateTime for LocalDateTime:', combinedDateTime);

    // Match exact AppointmentDTO structure
    const appointmentDTO = {
      // Vehicle fields (exact DTO field names)
      vehicleType: appointmentData.vehicle.type,
      vehicleBrand: appointmentData.vehicle.brand,
      model: appointmentData.vehicle.model,                          // Note: 'model' not 'vehicleModel'
      yearOfManufacture: appointmentData.vehicle.year,               // String as per DTO
      registerNumber: appointmentData.vehicle.registrationNumber,    // Note: 'registerNumber' not 'vehicleRegistrationNumber'
      fuelType: appointmentData.vehicle.fuelType,

      // Service fields  
      serviceCategory: appointmentData.service.category,
      serviceType: appointmentData.service.type,
      additionalRequirements: appointmentData.service.requirements || '',

      // DateTime field (LocalDateTime expects ISO format: YYYY-MM-DDTHH:mm:ss)
      appointmentDate: combinedDateTime,  // "2025-11-06T10:30:00"
      timeSlot: appointmentTime,          // Keep original for display: "10:30 AM"
      
      // userId will be set by backend from Authentication
      userId: null
    };

    console.log('=== APPOINTMENT CREATION DEBUG ===');
    console.log('Original appointment data:', appointmentData);
    console.log('Creating appointment with DTO format:', appointmentDTO);
    console.log('DateTime format check:', appointmentDTO.appointmentDate, typeof appointmentDTO.appointmentDate);
    console.log('TimeSlot format check:', appointmentDTO.timeSlot, typeof appointmentDTO.timeSlot);
    console.log('API URL:', `${API_URL}/api/customer/appointments`);
    console.log('Full API endpoint:', `${API_URL}/api/customer/appointments`);

    // Debug user authentication
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('Current user role:', parsedUser.role);
        console.log('Current username:', parsedUser.username);
        console.log('Token length:', parsedUser.token ? parsedUser.token.length : 'No token');
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    try {
      // Try with DTO structure first
      const response = await api.post('/api/customer/appointments', appointmentDTO);
      console.log('Appointment created successfully:', response.data);
      return response.data as AppointmentResponse;
    } catch (flatError) {
      console.log('Flattened format failed, trying nested format...');

      // Fallback to nested format
      const nestedRequestData = {
        ...appointmentData,
        datetime: {
          ...appointmentData.datetime,
          date: appointmentDate,
          time: appointmentTime,
        }
      };

      console.log('Trying nested data format:', nestedRequestData);
      const response = await api.post('/api/customer/appointments', nestedRequestData);
      console.log('Appointment created successfully with nested format:', response.data);
      return response.data as AppointmentResponse;
    }

  } catch (error) {
    console.error('Error creating appointment:', error);

    if (axios.isAxiosError(error)) {
      // Log detailed error information for debugging
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });

      if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('user');
        throw new Error('Session expired. Please sign in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to create appointments.');
      } else if (error.response?.status === 500) {
        // Server internal error - show detailed info for debugging
        const serverError = error.response?.data?.message || error.response?.data?.error || 'Internal server error';
        console.error('Server error (500):', serverError);
        throw new Error(`Server error: ${serverError}. Please check the backend logs.`);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status && error.response.status >= 400) {
        throw new Error(`Server error: ${error.response.status}`);
      }
    }

    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please try again.');
    }

    throw new Error('Failed to create appointment. Please check your connection and try again.');
  }
}

// Get customer's appointments
export async function getCustomerAppointments(): Promise<AppointmentResponse[]> {
  try {
    const api = createAuthenticatedRequest();
    const response = await api.get('/api/customer/appointments');
    return response.data as AppointmentResponse[];
  } catch (error) {
    console.error('Error fetching appointments:', error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        localStorage.removeItem('user');
        throw new Error('Session expired. Please sign in again.');
      }
    }

    throw new Error('Failed to fetch appointments.');
  }
}

// Get appointment status
export async function getAppointmentStatus(appointmentId: number): Promise<string> {
  try {
    const api = createAuthenticatedRequest();
    const response = await api.get(`/api/customer/appointments/${appointmentId}/status`);
    return response.data as string;
  } catch (error) {
    console.error('Error fetching appointment status:', error);
    throw new Error('Failed to fetch appointment status.');
  }
}

// Admin: Get all appointments
export async function getAllAppointments(): Promise<AppointmentResponse[]> {
  try {
    const api = createAuthenticatedRequest();
    const response = await api.get('/api/admin/appointments');
    console.log('Fetched all appointments:', response.data);
    return response.data as AppointmentResponse[];
  } catch (error) {
    console.error('Error fetching all appointments:', error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        localStorage.removeItem('user');
        throw new Error('Session expired. Please sign in again.');
      }
    }
    throw new Error('Failed to fetch appointments.');
  }
}

// Admin: Approve appointment (change status from PENDING to CONFIRMED)
export async function approveAppointment(appointmentId: number): Promise<AppointmentResponse> {
  try {
    const api = createAuthenticatedRequest();
    const response = await api.put(`/api/admin/appointments/${appointmentId}/approve`);
    console.log('Appointment approved:', response.data);
    return response.data as AppointmentResponse;
  } catch (error) {
    console.error('Error approving appointment:', error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        localStorage.removeItem('user');
        throw new Error('Session expired. Please sign in again.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
    }
    throw new Error('Failed to approve appointment.');
  }
}

// Admin: Reject appointment (change status to CANCELLED)
export async function rejectAppointment(appointmentId: number): Promise<AppointmentResponse> {
  try {
    const api = createAuthenticatedRequest();
    const response = await api.put(`/api/admin/appointments/${appointmentId}/reject`);
    console.log('Appointment rejected:', response.data);
    return response.data as AppointmentResponse;
  } catch (error) {
    console.error('Error rejecting appointment:', error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        localStorage.removeItem('user');
        throw new Error('Session expired. Please sign in again.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
    }
    throw new Error('Failed to reject appointment.');
  }
}

// Admin: Assign employee to appointment (change status to IN_SERVICE)
export async function assignEmployeeToAppointment(appointmentId: number, employeeId: number): Promise<AppointmentResponse> {
  try {
    const api = createAuthenticatedRequest();
    const response = await api.put(`/api/admin/appointments/${appointmentId}/assign/${employeeId}`);
    console.log('Employee assigned to appointment:', response.data);
    return response.data as AppointmentResponse;
  } catch (error) {
    console.error('Error assigning employee to appointment:', error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        localStorage.removeItem('user');
        throw new Error('Session expired. Please sign in again.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
    }
    throw new Error('Failed to assign employee to appointment.');
  }
}
