import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  response: string;
  sessionId: string;
  timestamp: string;
  tokensUsed?: number;
}

export interface ChatHistoryDTO {
  id: number;
  message: string;
  response: string;
  timestamp: string;
  sessionId: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

// Helper function to get auth token from localStorage (same as appointmentsApi)
function getAuthToken(): string | null {
  try {
    const userData = localStorage.getItem('user');
    
    if (!userData) {
      console.error('No user data found in localStorage');
      return null;
    }

    const user = JSON.parse(userData);
    
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

class ChatbotAPI {
  /**
   * Send a message to the chatbot
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please sign in again.');
    }

    const response = await axios.post<ChatResponse>(
      `${API_URL}/chatbot/chat`,
      request,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  }

  /**
   * Get chat history for the current user
   */
  async getChatHistory(): Promise<ChatHistoryDTO[]> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please sign in again.');
    }

    const response = await axios.get<ChatHistoryDTO[]>(
      `${API_URL}/chatbot/history`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }

  /**
   * Get chat history for a specific session
   */
  async getSessionHistory(sessionId: string): Promise<ChatHistoryDTO[]> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please sign in again.');
    }

    const response = await axios.get<ChatHistoryDTO[]>(
      `${API_URL}/chatbot/history/${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }

  /**
   * Delete chat history for the current user
   */
  async deleteChatHistory(): Promise<ApiResponse> {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please sign in again.');
    }

    const response = await axios.delete<ApiResponse>(
      `${API_URL}/chatbot/history`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }
}

export const chatbotAPI = new ChatbotAPI();
