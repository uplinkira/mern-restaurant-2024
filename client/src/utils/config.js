// client/src/utils/config.js

import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL;
console.log('Current baseURL:', baseURL);

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor with logging
axiosInstance.interceptors.request.use(
  (request) => {
    const token = localStorage.getItem('token');
    console.log('Request interceptor - Token present:', !!token);
    
    if (token) {
      request.headers.Authorization = `Bearer ${token}`;
      console.log('Added auth header to request:', request.url);
    } else {
      console.log('No token found for request:', request.url);
    }
    
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

// API endpoints configuration - 移除所有 /api 前缀
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: 'auth/login',
  REGISTER: 'auth/register',
  GOOGLE_LOGIN: 'auth/google',
  VERIFY_TOKEN: 'auth/verify',
  LOGOUT: 'auth/logout',

  // User Profile
  PROFILE: 'profile/me',
  UPDATE_PROFILE: 'profile/me',

  // Products
  PRODUCTS: 'products',
  PRODUCT_DETAILS: (slug) => `products/${slug}`,

  // Restaurants
  RESTAURANTS: 'restaurants',
  RESTAURANTS_DETAILS: (slug) => `restaurants/${slug}`,
  RESTAURANT_MENU: (slug) => `restaurants/${slug}/menus`,

  // Dishes
  DISHES: 'dishes',
  DISH_DETAILS: (slug) => `dishes/${slug}`,
  DISHES_BY_RESTAURANT: (restaurantSlug) => `restaurants/${restaurantSlug}/dishes`,
  FEATURED_DISHES: 'dishes/featured',
  SIGNATURE_DISHES: 'dishes/signature',

  // Cart
  CART: 'cart',
  CART_ADD: 'cart/add',
  CART_UPDATE: 'cart/update',
  CART_REMOVE: 'cart/remove',
  CART_CLEAR: 'cart/clear',
  CART_CHECK_DELIVERY: 'cart/check-delivery',

  // Orders
  ORDERS: 'orders',
  ORDER_DETAILS: (id) => `orders/${id}`,
  USER_ORDERS: 'orders/user/me',

  // Search
  SEARCH: 'search',
  SEARCH_DISHES: 'search/dishes',
  SEARCH_RESTAURANTS: 'search/restaurants',
  SEARCH_PRODUCTS: 'search/products',

  // Menu
  MENU: (slug) => `menus/${slug}`,
  MENU_ITEMS: (slug) => `menus/${slug}/items`,
};

// Export config
export const config = {
  API_URL: process.env.REACT_APP_API_URL,
  GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  isDevelopment: process.env.NODE_ENV === 'development',
  IMAGE_BASE_URL: process.env.REACT_APP_IMAGE_BASE_URL
};

export default axiosInstance;
