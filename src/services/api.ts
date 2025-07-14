import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// API Configuration for Production
// Using live server hosted on Render.com

// Production API URL
const getAPIBaseURL = () => {
  // Live server URL
  return 'https://edulearnappbackend.onrender.com/api';
  
  // For local development, use one of the following:
  // For physical devices: 'http://YOUR_IP:3000/api'
  // For Android emulator: 'http://10.0.2.2:3000/api'
  // For iOS simulator: 'http://localhost:3000/api'
};

const API_BASE_URL = getAPIBaseURL();

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Debug logging for settings requests
    } catch (error) {
      // Token error handled silently
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Network error handling
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      // Network error - server not reachable
    }
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('teacherData');
      // Navigate to login screen
    }
    
    return Promise.reject(error);
  }
);

export default api;
