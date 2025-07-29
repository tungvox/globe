// Configuration for API endpoints
const isDevelopment = process.env.NODE_ENV === 'development';

// Base URL for API calls
export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5000' 
  : process.env.REACT_APP_API_URL || 'https://globe-backend.onrender.com'; // Default to a free hosting service

// Socket.io URL
export const SOCKET_URL = isDevelopment 
  ? 'http://localhost:5000' 
  : process.env.REACT_APP_SOCKET_URL || 'https://globe-backend.onrender.com'; // Default to a free hosting service

// Helper function to build API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
}; 