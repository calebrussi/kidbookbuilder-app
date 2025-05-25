import axios from 'axios';
import { ContentType } from './types';

// API client configuration
const API_URL = 'http://localhost:3000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the auth token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API methods
export const AuthAPI = {
  register: async (username: string, password: string, displayName: string, role: string) => {
    try {
      const response = await apiClient.post('/api/auth/register', {
        username,
        password,
        displayName,
        role,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  login: async (username: string, password: string) => {
    try {
      const response = await apiClient.post('/api/auth/login', {
        username,
        password,
      });
      // Store the token in localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getUserProfile: async () => {
    try {
      const response = await apiClient.get('/api/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// Content structure for creating/updating
interface ContentPayload {
  title: string;
  content: string;
  contentType: ContentType;
  description?: string;
  tags?: string[];
}

interface ContentUpdatePayload {
  title?: string;
  content?: string;
  description?: string;
  tags?: string[];
}

// Content API methods
export const ContentAPI = {
  getSamples: async () => {
    try {
      const response = await apiClient.get('/api/samples');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getUserContent: async () => {
    try {
      const response = await apiClient.get('/api/content');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getContentById: async (contentId: string) => {
    try {
      const response = await apiClient.get(`/api/content/${contentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  createContent: async (payload: ContentPayload) => {
    try {
      const formData = new FormData();
      formData.append('title', payload.title);
      formData.append('contentType', payload.contentType);
      
      // Create a text file from the content
      const textContent = new Blob([payload.content], { type: 'text/plain' });
      formData.append('file', textContent, 'story.txt');
      
      if (payload.description) {
        formData.append('description', payload.description);
      }
      
      if (payload.tags && payload.tags.length > 0) {
        formData.append('tags', JSON.stringify(payload.tags));
      }
      
      const response = await axios.post(`${API_URL}/api/content/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateContent: async (contentId: string, payload: ContentUpdatePayload) => {
    try {
      const response = await apiClient.patch(`/api/content/${contentId}`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteContent: async (contentId: string) => {
    try {
      const response = await apiClient.delete(`/api/content/${contentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  generateIllustration: async (prompt: string) => {
    try {
      const response = await apiClient.post('/api/illustrations/generate', {
        prompt
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default apiClient; 