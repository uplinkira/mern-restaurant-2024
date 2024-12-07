// client/src/utils/config.js

import axios from 'axios';

// Create axios instance with config
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor with logging
axiosInstance.interceptors.request.use(
  (request) => {
    // Log request details
    console.log('🚀 API Request:', {
      url: request.url,
      method: request.method,
      params: request.params,
      data: request.data,
      headers: {
        Authorization: request.headers.Authorization ? 'Bearer [REDACTED]' : 'None',
        'Content-Type': request.headers['Content-Type']
      }
    });
    
    const token = localStorage.getItem('token');
    if (token) {
      request.headers.Authorization = `Bearer ${token}`;
    }
    return request;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with logging
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful response
    console.log('✅ API Response:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      timestamp: new Date().toISOString()
    });
    return response;
  },
  (error) => {
    // Log error response
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      response: error.response?.data,
      timestamp: new Date().toISOString()
    });

    // Handle unauthorized access
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(
      error.response || {
        status: 500,
        data: {
          success: false,
          message: error.message || 'An error occurred',
        },
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

  // Restaurants
  RESTAURANTS: '/api/restaurants',
  RESTAURANTS_DETAILS: (slug) => `/api/restaurants/${slug}`,
  RESTAURANT_MENU: (slug) => `/api/restaurants/${slug}/menus`, // Updated to point to /menus

  // Dishes
  DISHES: '/api/dishes',
  DISH_DETAILS: (slug) => `/api/dishes/${slug}`,
  DISHES_BY_RESTAURANT: (restaurantSlug) => `/api/restaurants/${restaurantSlug}/dishes`,
  FEATURED_DISHES: '/api/dishes/featured',
  SIGNATURE_DISHES: '/api/dishes/signature',

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
  SEARCH: '/api/search',
  SEARCH_DISHES: '/api/search/dishes',
  SEARCH_RESTAURANTS: '/api/search/restaurants',
  SEARCH_PRODUCTS: '/api/search/products',

  // Menu
  MENU: (slug) => `/api/menus/${slug}`,
  MENU_ITEMS: (slug) => `/api/menus/${slug}/items`,
};

// Export config
export const config = {
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
  GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  isDevelopment: process.env.NODE_ENV === 'development',
  IMAGE_BASE_URL: process.env.REACT_APP_IMAGE_BASE_URL || 'http://localhost:5001/images',
};

export default axiosInstance;
