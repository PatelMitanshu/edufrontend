// Network Configuration Utility
// This file helps you quickly switch between different API endpoints

// Your computer's current IP address: 192.168.1.3
// Device being used: Physical Android device (RMX3511)

export const API_ENDPOINTS = {
  // For physical devices on the same network
  PHYSICAL_DEVICE: 'http://192.168.1.3:3000/api',
  
  // For Android emulator
  ANDROID_EMULATOR: 'http://10.0.2.2:3000/api',
  
  // For iOS simulator
  IOS_SIMULATOR: 'http://localhost:3000/api',
  
  // For testing on same computer
  LOCALHOST: 'http://localhost:3000/api',
  
  // Production server (when available)
  PRODUCTION: 'https://edulearnappbackend.onrender.com/api'
};

// Current active endpoint
export const CURRENT_API_ENDPOINT = API_ENDPOINTS.PRODUCTION;

// Helper function to detect platform and return appropriate endpoint
export const getOptimalEndpoint = () => {
  // You can add logic here to automatically detect the best endpoint
  // For now, it returns the current setting
  return CURRENT_API_ENDPOINT;
};

// Instructions:
// 1. If using physical device: Use PHYSICAL_DEVICE endpoint
// 2. If using Android emulator: Use ANDROID_EMULATOR endpoint  
// 3. If using iOS simulator: Use IOS_SIMULATOR endpoint
// 4. If your IP changes, update the PHYSICAL_DEVICE endpoint

// To find your IP address:
// Windows: Run 'ipconfig' in Command Prompt, look for "IPv4 Address"
// Mac/Linux: Run 'ifconfig' or 'ip addr show' in Terminal

export default {
  API_ENDPOINTS,
  CURRENT_API_ENDPOINT,
  getOptimalEndpoint
};
