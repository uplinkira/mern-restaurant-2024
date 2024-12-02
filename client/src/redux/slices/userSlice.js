// client/src/redux/slices/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance, { API_ENDPOINTS } from '../../utils/config';

// Enhanced response handler with detailed error parsing
const handleResponse = (response) => {
 if (!response.success) {
   throw new Error(response.message || 'Operation failed');
 }
 if (!response.data) {
   throw new Error('Invalid response format');
 }
 return response.data;
};

// Parse validation errors from response
const parseValidationErrors = (error) => {
 const errorData = error.response?.data?.data;
 return {
   message: error.response?.data?.message || error.message || 'Operation failed',
   errors: errorData?.errors || null,
   validationErrors: errorData?.validationErrors || null
 };
};

export const fetchUserProfile = createAsyncThunk(
 'user/fetchUserProfile',
 async (_, { getState, rejectWithValue }) => {
   const { user } = getState();
   if (user.status === 'loading') return;
   
   try {
     const response = await axiosInstance.get(API_ENDPOINTS.PROFILE);
     return handleResponse(response);
   } catch (error) {
     return rejectWithValue(parseValidationErrors(error));
   }
 }
);

export const updateUserProfile = createAsyncThunk(
 'user/updateUserProfile',
 async (userData, { getState, dispatch, rejectWithValue }) => {
   const { user } = getState();
   if (user.status === 'loading') return;

   try {
     const updateData = {
       ...userData,
       email: userData.email?.toLowerCase(),
       phoneNumber: userData.phoneNumber || undefined,
       bio: userData.bio || undefined,
       address: userData.address || undefined,
       password: userData.password || undefined,
       confirmPassword: userData.confirmPassword || undefined
     };

     const response = await axiosInstance.put(API_ENDPOINTS.PROFILE, updateData);
     const result = handleResponse(response);
     return result;
   } catch (error) {
     const parsedError = parseValidationErrors(error);
     if (!parsedError.validationErrors) {
       dispatch(setIsEditing(true)); // Keep editing mode on error
     }
     return rejectWithValue(parsedError);
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
 originalProfile: null
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
     const newValue = Boolean(action.payload);
     if (newValue && !state.isEditing) {
       state.originalProfile = { ...state.profile };
     }
     state.isEditing = newValue;
     if (!newValue) {
       state.isDirty = false;
       state.validationErrors = null;
     }
   },
   updateProfileField: (state, action) => {
     if (state.profile && state.isEditing) {
       state.profile = {
         ...state.profile,
         ...action.payload
       };
       state.isDirty = true;
     }
   },
   cancelEditing: (state) => {
     if (state.originalProfile) {
       state.profile = { ...state.originalProfile };
     }
     state.isEditing = false;
     state.isDirty = false;
     state.error = null;
     state.validationErrors = null;
   }
 },
 extraReducers: (builder) => {
   builder
     .addCase(fetchUserProfile.pending, (state) => {
       state.status = 'loading';
       state.error = null;
     })
     .addCase(fetchUserProfile.fulfilled, (state, action) => {
       state.status = 'succeeded';
       state.profile = action.payload;
       state.originalProfile = action.payload; // Store original profile
       state.error = null;
       state.validationErrors = null;
       state.lastUpdated = Date.now();
     })
     .addCase(fetchUserProfile.rejected, (state, action) => {
       state.status = 'failed';
       state.error = action.payload.message;
       state.validationErrors = action.payload.validationErrors;
     })
     .addCase(updateUserProfile.pending, (state) => {
       state.status = 'loading';
     })
     .addCase(updateUserProfile.fulfilled, (state, action) => {
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
       state.status = 'failed';
       state.error = action.payload.message;
       state.validationErrors = action.payload.validationErrors;
     });
 },
});

export const {
 clearUserError,
 resetUserState,
 setUserStatus,
 setIsEditing,
 updateProfileField,
 cancelEditing
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