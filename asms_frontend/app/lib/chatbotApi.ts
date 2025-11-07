// Chatbot API Configuration
export const CHATBOT_CONFIG = {
  // Your Spring Boot backend URL
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  apiEndpoint: process.env.NEXT_PUBLIC_API_URL 
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/chatbot/chat`
    : 'http://localhost:8080/api/chatbot/chat',
  
  // Chat history endpoint
  historyEndpoint: process.env.NEXT_PUBLIC_API_URL 
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/chatbot/history`
    : 'http://localhost:8080/api/chatbot/history',
  
  // Request timeout in milliseconds
  timeout: 30000,
  
  // Quick action suggestions
  quickActions: [
    'Book an appointment',
    'Check appointment status',
    'View available services',
    'Contact support',
    'Cancel appointment',
    'Reschedule appointment'
  ],
  
  // Default welcome message
  welcomeMessage: 'Hello! Welcome to ASMS Service. How can I assist you today?',
  
  // Error messages
  errorMessages: {
    network: 'Sorry, I encountered a network error. Please check your connection and try again.',
    server: 'Sorry, our service is temporarily unavailable. Please try again later.',
    timeout: 'The request took too long. Please try again.',
    unauthorized: 'Please log in to use the chatbot.',
    generic: 'Sorry, something went wrong. Please try again later.'
  }
}

// Helper function to get JWT token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    // First check for direct token storage
    const directToken = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (directToken) return directToken;
    
    // Check for user object with token
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.token || user.accessToken || null;
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
        return null;
      }
    }
  }
  return null;
}

// Helper function to get user ID from localStorage
const getUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id?.toString() || user.userId?.toString() || null;
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
        return null;
      }
    }
  }
  return null;
}

// Helper function to get session ID
const getOrCreateSessionId = (): string => {
  if (typeof window !== 'undefined') {
    let sessionId = sessionStorage.getItem('chatSessionId');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('chatSessionId', sessionId);
    }
    return sessionId;
  }
  return `session-${Date.now()}`;
}

// API request helper for sending chat messages
export const sendChatMessage = async (message: string, userId?: string) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      return {
        success: false,
        message: CHATBOT_CONFIG.errorMessages.unauthorized
      };
    }

    const sessionId = getOrCreateSessionId();
    const currentUserId = userId || getUserId();

    const response = await fetch(CHATBOT_CONFIG.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        message, 
        sessionId,
        userId: currentUserId
      }),
      signal: AbortSignal.timeout(CHATBOT_CONFIG.timeout)
    });

    if (response.status === 401) {
      return {
        success: false,
        message: CHATBOT_CONFIG.errorMessages.unauthorized
      };
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      message: data.response || data.message || 'No response from server',
      sessionId: data.sessionId,
      timestamp: data.timestamp,
      tokensUsed: data.tokensUsed,
      data
    };
  } catch (error) {
    console.error('Chat API Error:', error);
    
    if (error instanceof TypeError) {
      return {
        success: false,
        message: CHATBOT_CONFIG.errorMessages.network
      };
    }
    
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      return {
        success: false,
        message: CHATBOT_CONFIG.errorMessages.timeout
      };
    }
    
    return {
      success: false,
      message: CHATBOT_CONFIG.errorMessages.generic
    };
  }
}

// API request helper for getting chat history
export const getChatHistory = async () => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      return {
        success: false,
        message: CHATBOT_CONFIG.errorMessages.unauthorized,
        data: []
      };
    }

    const response = await fetch(CHATBOT_CONFIG.historyEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(CHATBOT_CONFIG.timeout)
    });

    if (response.status === 401) {
      return {
        success: false,
        message: CHATBOT_CONFIG.errorMessages.unauthorized,
        data: []
      };
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Chat History API Error:', error);
    return {
      success: false,
      message: CHATBOT_CONFIG.errorMessages.generic,
      data: []
    };
  }
}

// API request helper for getting session-specific history
export const getSessionHistory = async (sessionId: string) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      return {
        success: false,
        message: CHATBOT_CONFIG.errorMessages.unauthorized,
        data: []
      };
    }

    const response = await fetch(`${CHATBOT_CONFIG.historyEndpoint}/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(CHATBOT_CONFIG.timeout)
    });

    if (response.status === 401) {
      return {
        success: false,
        message: CHATBOT_CONFIG.errorMessages.unauthorized,
        data: []
      };
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Session History API Error:', error);
    return {
      success: false,
      message: CHATBOT_CONFIG.errorMessages.generic,
      data: []
    };
  }
}

// API request helper for deleting chat history
export const deleteChatHistory = async () => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      return {
        success: false,
        message: CHATBOT_CONFIG.errorMessages.unauthorized
      };
    }

    const response = await fetch(CHATBOT_CONFIG.historyEndpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(CHATBOT_CONFIG.timeout)
    });

    if (response.status === 401) {
      return {
        success: false,
        message: CHATBOT_CONFIG.errorMessages.unauthorized
      };
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: data.success || true,
      message: data.message || 'History deleted successfully'
    };
  } catch (error) {
    console.error('Delete History API Error:', error);
    return {
      success: false,
      message: CHATBOT_CONFIG.errorMessages.generic
    };
  }
}