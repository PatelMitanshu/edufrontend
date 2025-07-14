import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// For Android Emulator: use 10.0.2.2
// For iOS Simulator: use localhost or 127.0.0.1
// For Physical Device: use your computer's IP address

// Get your computer's IP address by running: ipconfig (Windows) or ifconfig (Mac/Linux)
const getAPIBaseURL = () => {
  // For physical devices, always use the computer's actual IP address
  // Since we confirmed the backend is accessible at 192.168.1.4
  return 'http://192.168.1.4:3000/api';
  
  // Note: If you need to switch to emulator later, change to:
  // return 'http://10.0.2.2:3000/api';
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
