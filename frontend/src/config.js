// Configuration for API endpoints
const isDevelopment = process.env.NODE_ENV === 'development';

// Base URL for API calls
export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5000' 
  : process.env.REACT_APP_API_URL || 'https://globe-1-hduo.onrender.com'; // Your actual backend URL

// Socket.io URL
export const SOCKET_URL = isDevelopment 
  ? 'http://localhost:5000' 
  : process.env.REACT_APP_SOCKET_URL || 'https://globe-1-hduo.onrender.com'; // Your actual backend URL

// Debug logging
console.log('Environment:', process.env.NODE_ENV);
console.log('API_BASE_URL:', API_BASE_URL);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

// Helper function to build API URLs
export const buildApiUrl = (endpoint) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log('buildApiUrl called with endpoint:', endpoint, 'result:', url);
  return url;
}; 