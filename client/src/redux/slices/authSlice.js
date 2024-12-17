// client/src/redux/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance, { API_ENDPOINTS } from '../../utils/config';

// Enhanced auth response handler with better error handling
const handleAuthResponse = (response) => {
 if (!response.data.success) {
   throw new Error(response.data.message || 'Authentication failed');
 }
 if (response.data.data?.token) {
   localStorage.setItem('token', response.data.data.token);
 }
 return response.data.data;
};

// Enhanced error handler
const handleAuthError = (error) => {
 if (error.response?.status === 401) {
   localStorage.removeItem('token');
 }
 return error.response?.data?.message || error.message || 'Authentication failed';
};

export const registerUser = createAsyncThunk(
 'auth/registerUser',
 async (userData, { rejectWithValue }) => {
   try {
     console.log('Sending registration request with data:', userData);
     const response = await axiosInstance.post(API_ENDPOINTS.REGISTER, {
       ...userData,
       email: userData.email.toLowerCase()
     });
     console.log('Registration response:', response);
     return handleAuthResponse(response);
   } catch (error) {
     console.error('Registration error in thunk:', error);
     return rejectWithValue(handleAuthError(error));
   }
 }
);

export const loginUser = createAsyncThunk(
 'auth/loginUser',
 async (credentials, { rejectWithValue }) => {
   try {
     const response = await axiosInstance.post(API_ENDPOINTS.LOGIN, {
       ...credentials,
       email: credentials.email.toLowerCase()
     });
     return handleAuthResponse(response);
   } catch (error) {
     return rejectWithValue(handleAuthError(error));
   }
 }
);

export const googleLogin = createAsyncThunk(
 'auth/googleLogin',
 async (credential, { rejectWithValue }) => {
   try {
     const response = await axiosInstance.post(API_ENDPOINTS.GOOGLE_LOGIN, 
       { credential },
       { timeout: 10000 } // 10s timeout for Google auth
     );
     return handleAuthResponse(response);
   } catch (error) {
     return rejectWithValue(handleAuthError(error));
   }
 }
);

export const verifyToken = createAsyncThunk(
 'auth/verifyToken',
 async (_, { rejectWithValue }) => {
   try {
     const token = localStorage.getItem('token');
     if (!token) {
       throw new Error('No token found');
     }
     const response = await axiosInstance.get(API_ENDPOINTS.VERIFY_TOKEN);
     return handleAuthResponse(response);
   } catch (error) {
     localStorage.removeItem('token');
     return rejectWithValue(handleAuthError(error));
   }
 }
);

export const logoutUser = createAsyncThunk(
 'auth/logout',
 async (_, { dispatch }) => {
   try {
     await axiosInstance.post(API_ENDPOINTS.LOGOUT);
   } catch (error) {
     console.error('Logout error:', error);
   } finally {
     localStorage.removeItem('token');
     dispatch(clearUser());
   }
 }
);

const initialState = {
 user: null,
 token: localStorage.getItem('token'),
 isAuthenticated: false,
 status: 'idle',
 error: null,
 lastVerified: null,
 isInitializing: true
};

const authSlice = createSlice({
 name: 'auth',
 initialState,
 reducers: {
   clearError: (state) => {
     state.error = null;
   },
   clearUser: (state) => {
     state.user = null;
     state.isAuthenticated = false;
   },
   setAuthStatus: (state, action) => {
     state.status = action.payload;
   },
   setInitializing: (state, action) => {
     state.isInitializing = action.payload;
   }
 },
 extraReducers: (builder) => {
   builder
     // Registration cases
     .addCase(registerUser.pending, (state) => {
       state.status = 'loading';
       state.error = null;
     })
     .addCase(registerUser.fulfilled, (state, action) => {
       state.status = 'succeeded';
       state.user = action.payload.user;
       state.token = action.payload.token;
       state.isAuthenticated = true;
       state.error = null;
       state.lastVerified = Date.now();
       state.isInitializing = false;
     })
     .addCase(registerUser.rejected, (state, action) => {
       state.status = 'failed';
       state.error = action.payload;
       state.isAuthenticated = false;
       state.isInitializing = false;
     })
     // Login cases
     .addCase(loginUser.pending, (state) => {
       state.status = 'loading';
       state.error = null;
     })
     .addCase(loginUser.fulfilled, (state, action) => {
       state.status = 'succeeded';
       state.user = action.payload.user;
       state.token = action.payload.token;
       state.isAuthenticated = true;
       state.error = null;
       state.lastVerified = Date.now();
       state.isInitializing = false;
     })
     .addCase(loginUser.rejected, (state, action) => {
       state.status = 'failed';
       state.error = action.payload;
       state.isAuthenticated = false;
       state.isInitializing = false;
     })
     // Google login cases
     .addCase(googleLogin.pending, (state) => {
       state.status = 'loading';
       state.error = null;
     })
     .addCase(googleLogin.fulfilled, (state, action) => {
       state.status = 'succeeded';
       state.user = action.payload.user;
       state.token = action.payload.token;
       state.isAuthenticated = true;
       state.error = null;
       state.lastVerified = Date.now();
       state.isInitializing = false;
     })
     .addCase(googleLogin.rejected, (state, action) => {
       state.status = 'failed';
       state.error = action.payload;
       state.isAuthenticated = false;
       state.isInitializing = false;
     })
     // Token verification cases
     .addCase(verifyToken.pending, (state) => {
       state.status = 'loading';
       state.error = null;
     })
     .addCase(verifyToken.fulfilled, (state, action) => {
       state.status = 'succeeded';
       state.user = action.payload.user;
       state.isAuthenticated = true;
       state.lastVerified = Date.now();
       state.error = null;
       state.isInitializing = false;
     })
     .addCase(verifyToken.rejected, (state, action) => {
       state.status = 'failed';
       state.user = null;
       state.token = null;
       state.isAuthenticated = false;
       state.error = action.payload;
       state.isInitializing = false;
     })
     // Logout cases
     .addCase(logoutUser.fulfilled, (state) => {
       state.user = null;
       state.token = null;
       state.isAuthenticated = false;
       state.status = 'idle';
       state.error = null;
       state.lastVerified = null;
       state.isInitializing = false;
     });
 },
});

export const { 
  clearUser, 
  clearError, 
  setAuthStatus,
  setInitializing 
} = authSlice.actions;

// Enhanced selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
export const selectIsInitializing = (state) => state.auth.isInitializing;

// Combined selector
export const selectAuthState = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
  user: state.auth.user,
  status: state.auth.status,
  error: state.auth.error
});

export default authSlice.reducer;