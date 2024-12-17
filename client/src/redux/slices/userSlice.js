// client/src/redux/slices/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance, { API_ENDPOINTS } from '../../utils/config';

// Enhanced response handler with detailed error parsing
const handleResponse = (response) => {
  const responseData = response.data;
  console.log('Handling response data:', responseData);
  if (!responseData.success) {
    throw new Error(responseData.message || 'Operation failed');
  }
  if (!responseData.data) {
    throw new Error('Invalid response format');
  }
  return responseData.data;
};

// Parse validation errors from response
const parseValidationErrors = (error) => {
  const errorData = error.response?.data?.data;
  return {
    message: error.response?.data?.message || error.message || 'Operation failed',
    errors: errorData?.errors || null,
    validationErrors: errorData?.validationErrors || null,
  };
};

export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (_, { getState, rejectWithValue }) => {
    const { user } = getState();
    console.log('Current user state:', user);

    try {
      console.log('Fetching user profile from:', API_ENDPOINTS.PROFILE);
      const token = localStorage.getItem('token');
      console.log('Auth token present:', !!token);
      
      if (!token) {
        return rejectWithValue({
          message: 'Authentication token not found',
          validationErrors: null
        });
      }
      
      const response = await axiosInstance.get(API_ENDPOINTS.PROFILE);
      console.log('Profile API response:', response.data);
      
      if (!response.data.success) {
        return rejectWithValue({
          message: response.data.message || 'Failed to fetch profile',
          validationErrors: null
        });
      }
      
      const data = handleResponse(response);
      console.log('Processed profile data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error.response || error);
      const errorData = parseValidationErrors(error);
      console.log('Parsed error data:', errorData);
      return rejectWithValue(errorData);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async (userData, { getState, dispatch, rejectWithValue }) => {
    const { user } = getState();
    console.log('Current user state before update:', user);

    if (!user.isEditing) {
      console.log('Not in editing mode, rejecting update');
      return rejectWithValue({
        message: 'Not in editing mode',
        validationErrors: null
      });
    }

    try {
      // Clean up the update data
      const updateData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email?.toLowerCase(),
        phoneNumber: userData.phoneNumber || undefined,
        bio: userData.bio || undefined,
        address: userData.address || undefined,
      };

      // Only include password fields if they are provided
      if (userData.password) {
        updateData.password = userData.password;
        updateData.confirmPassword = userData.confirmPassword;
      }

      console.log('Sending profile update request with data:', {
        ...updateData,
        password: updateData.password ? '[REDACTED]' : undefined,
        confirmPassword: updateData.confirmPassword ? '[REDACTED]' : undefined
      });

      const response = await axiosInstance.put(API_ENDPOINTS.PROFILE, updateData);
      console.log('Profile update response:', response.data);

      if (!response.data.success) {
        console.error('Profile update failed:', response.data.message);
        return rejectWithValue({
          message: response.data.message || 'Failed to update profile',
          validationErrors: response.data.validationErrors || null
        });
      }

      const result = handleResponse(response);
      console.log('Profile updated successfully:', result);
      return result;
    } catch (error) {
      console.error('Error updating profile:', error.response || error);
      const errorData = parseValidationErrors(error);
      console.log('Parsed error data:', errorData);
      return rejectWithValue(errorData);
    }
  }
);

const initialState = {
  profile: null,
  status: 'idle',
  error: null,
  validationErrors: null,
  lastUpdated: null,
  isEditing: false,
  isDirty: false,
  originalProfile: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
      state.validationErrors = null;
    },
    resetUserState: () => initialState,
    setUserStatus: (state, action) => {
      state.status = action.payload;
    },
    setIsEditing: (state, action) => {
      console.log('Setting isEditing to:', action.payload);
      const newValue = Boolean(action.payload);
      if (newValue === state.isEditing) {
        console.log('Edit state unchanged, skipping update');
        return;
      }

      state.isEditing = newValue;
      if (newValue) {
        state.originalProfile = { ...state.profile };
        state.error = null;
        state.validationErrors = null;
      } else {
        state.isDirty = false;
        state.error = null;
        state.validationErrors = null;
      }
    },
    updateProfileField: (state, action) => {
      if (!state.isEditing) {
        console.log('Not in editing mode, skipping field update');
        return;
      }
      if (state.profile) {
        state.profile = {
          ...state.profile,
          ...action.payload,
        };
        state.isDirty = true;
      }
    },
    cancelEditing: (state) => {
      console.log('Canceling edit mode in slice');
      if (state.originalProfile) {
        state.profile = { ...state.originalProfile };
      }
      state.isEditing = false;
      state.isDirty = false;
      state.error = null;
      state.validationErrors = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.validationErrors = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.profile = action.payload;
        state.originalProfile = { ...action.payload };
        state.error = null;
        state.validationErrors = null;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to fetch profile';
        state.validationErrors = action.payload?.validationErrors || null;
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.validationErrors = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        console.log('Update fulfilled, setting state...');
        state.status = 'succeeded';
        state.profile = action.payload;
        state.originalProfile = { ...action.payload };
        state.error = null;
        state.validationErrors = null;
        state.lastUpdated = Date.now();
        state.isEditing = false;
        state.isDirty = false;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        console.log('Update rejected:', action.payload);
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to update profile';
        state.validationErrors = action.payload?.validationErrors || null;
        // Keep editing mode if it's not a "not in editing mode" error
        if (action.payload?.message !== 'Not in editing mode') {
          state.isEditing = true;
        }
      });
  },
});

export const {
  clearUserError,
  resetUserState,
  setUserStatus,
  setIsEditing,
  updateProfileField,
  cancelEditing,
} = userSlice.actions;

// Enhanced selectors
export const selectUserProfile = (state) => state.user.profile;
export const selectUserStatus = (state) => state.user.status;
export const selectUserError = (state) => state.user.error;
export const selectValidationErrors = (state) => state.user.validationErrors;
export const selectLastUpdated = (state) => state.user.lastUpdated;
export const selectIsEditing = (state) => state.user.isEditing;
export const selectIsDirty = (state) => state.user.isDirty;
export const selectIsProfileLoading = (state) => state.user.status === 'loading';
export const selectOriginalProfile = (state) => state.user.originalProfile;

export const selectIsProfileComplete = (state) => {
  const profile = state.user.profile;
  return profile && profile.email && profile.firstName && profile.lastName;
};

export const selectUserName = (state) => {
  const profile = state.user.profile;
  if (!profile) return '';
  return profile.firstName ? `${profile.firstName} ${profile.lastName}`.trim() : profile.email;
};

export default userSlice.reducer;
