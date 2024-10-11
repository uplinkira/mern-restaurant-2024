import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000',  // Ensure the base URL is correct for backend
});

// Add Axios interceptor to include Authorization header if token exists
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;  // Add Authorization header
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// User registration
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      // Making POST request to register the user
      const response = await axiosInstance.post('/api/auth/register', { name, email, password });
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      return response.data;  // Ensure to return token and user data
    } catch (error) {
      console.error('Registration Error:', error);  // Log error for debugging
      return rejectWithValue(error.response?.data || 'Registration failed');
    }
  }
);

// User login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      // Making POST request to login the user
      const response = await axiosInstance.post('/api/auth/login', { email, password });
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      return response.data;  // Ensure to return token and user data
    } catch (error) {
      console.error('Login Error:', error);  // Log error for debugging
      return rejectWithValue(error.response?.data || 'Login failed');
    }
  }
);

// Google OAuth login
export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (tokenId, { rejectWithValue }) => {
    try {
      // Making POST request to login with Google OAuth
      const response = await axiosInstance.post('/api/auth/google', {}, {
        headers: {
          'Authorization': `Bearer ${tokenId}`  // Send Google token via Authorization header
        }
      });
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      return response.data;  // Ensure to return token and user data
    } catch (error) {
      console.error('Google Login Error:', error);  // Log error for debugging
      return rejectWithValue(error.response?.data || 'Google login failed');
    }
  }
);

// Auth slice for handling authentication state
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token') || null,  // Load token from localStorage on init
    isAuthenticated: !!localStorage.getItem('token'),  // Check if token exists
    status: 'idle',
    error: null,
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');  // Clear token from localStorage on logout
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle registration
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;  // Ensure backend sends user info along with token
        state.token = action.payload.token;  // Store token in Redux state
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;  // Error message in case of failure
      })
      // Handle login
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;  // Ensure backend sends user info along with token
        state.token = action.payload.token;  // Store token in Redux state
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;  // Error message in case of failure
      })
      // Handle Google login
      .addCase(googleLogin.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;  // Error message in case of failure
      });
  },
});

// Export logout action
export const { logout } = authSlice.actions;

// Export the reducer
export default authSlice.reducer;
