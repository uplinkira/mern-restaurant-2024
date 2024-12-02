// client/src/utils/config.js
import axios from 'axios';

// Create axios instance with config
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Return the complete response data to handle success/error in slices
    return response.data;
  },
  (error) => {
    // Handle unauthorized access
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(
      error.response?.data || 
      { 
        success: false, 
        message: error.message || 'An error occurred' 
      }
    );
  }
);

// API endpoints configuration
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  GOOGLE_LOGIN: '/api/auth/google',
  VERIFY_TOKEN: '/api/auth/verify',
  LOGOUT: '/api/auth/logout',
  
  // User Profile
  PROFILE: '/api/profile/me',
  UPDATE_PROFILE: '/api/profile/me',
  
  // Products
  PRODUCTS: '/api/products',
  PRODUCT_DETAILS: (slug) => `/api/products/${slug}`,
  
  // Cart
  CART: '/api/cart',
  CART_ADD: '/api/cart/add',
  CART_UPDATE: '/api/cart/update',
  CART_REMOVE: (productId) => `/api/cart/remove/${productId}`,
  CART_CLEAR: '/api/cart/clear',
  
  // Orders
  ORDERS: '/api/orders',
  ORDER_DETAILS: (id) => `/api/orders/${id}`,
  USER_ORDERS: '/api/orders/user/me',
  
  // Search
  SEARCH: '/api/search'
};

// Export config
export const config = {
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
  GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  isDevelopment: process.env.NODE_ENV === 'development'
};

export default axiosInstance;