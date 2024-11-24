import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Create an Axios instance with the backend base URL
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5001',  // Ensure the base URL is correct
});

// Add Axios interceptor to include Authorization header if token exists
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;  // Add Authorization header
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// User registration action
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ username, firstName, lastName, phoneNumber, email, password }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/auth/register', {
        username,
        firstName,
        lastName,
        phoneNumber,
        email,
        password,
      });
      const { token, user } = response.data;

      // Store token in localStorage
      localStorage.setItem('token', token);
      return { user, token };  // Return user and token to be handled by reducers
    } catch (error) {
      console.error('Registration Error:', error);
      return rejectWithValue(error.response?.data?.message || 'Registration failed.');
    }
  }
);

// User login action
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/auth/login', { email, password });
      const { token, user } = response.data;

      // Store token in localStorage
      localStorage.setItem('token', token);
      return { user, token };
    } catch (error) {
      console.error('Login Error:', error);
      return rejectWithValue(error.response?.data?.message || 'Login failed.');
    }
  }
);

// Google OAuth login action
export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (tokenId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/auth/google', {}, {
        headers: { 'Authorization': `Bearer ${tokenId}` }
      });
      const { token, user } = response.data;

      // Store token in localStorage
      localStorage.setItem('token', token);
      return { user, token };
    } catch (error) {
      console.error('Google Login Error:', error);
      return rejectWithValue(error.response?.data?.message || 'Google login failed.');
    }
  }
);

// Authentication slice
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    status: 'idle',
    error: null,
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
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
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Handle login
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
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
        state.error = action.payload;
      });
  },
});

// Export logout action
export const { logout } = authSlice.actions;

// Export the reducer
export default authSlice.reducer;
