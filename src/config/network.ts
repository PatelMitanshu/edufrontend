// Network Configuration Utility
// This file helps you quickly switch between different API endpoints

// Your computer's current IP addresses:
// WiFi Network: 192.168.1.6 (Main network - use this if device is on same WiFi)
// Hotspot/Tethering: 192.168.137.1 (Use this if device connects via hotspot/USB tethering)

export const API_ENDPOINTS = {
  // For physical devices on the same WiFi network
  PHYSICAL_DEVICE_WIFI: 'http://192.168.1.6:3000',
  
  // For physical devices connected via hotspot/USB tethering  
  PHYSICAL_DEVICE_HOTSPOT: 'http://192.168.137.1:3000',
  
  // For Android emulator
  ANDROID_EMULATOR: 'http://10.0.2.2:3000',
  
  // For iOS simulator
  IOS_SIMULATOR: 'http://localhost:3000',
  
  // For testing on same computer
  LOCALHOST: 'http://localhost:3000',
  
  // Production server (when available)
  PRODUCTION: 'https://edulearnappbackend.onrender.com'
};

// Current active endpoint - Try WIFI first, if it doesn't work, try HOTSPOT
export const CURRENT_API_ENDPOINT = API_ENDPOINTS.PRODUCTION
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
