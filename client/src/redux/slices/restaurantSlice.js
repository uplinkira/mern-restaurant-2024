// client/src/redux/slices/restaurantSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance, { API_ENDPOINTS } from '../../utils/config';

export const fetchRestaurants = createAsyncThunk(
  'restaurants/fetchRestaurants',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/restaurants');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchRestaurantDetails = createAsyncThunk(
  'restaurants/fetchRestaurantDetails',
  async (slug, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/restaurants/${slug}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const restaurantSlice = createSlice({
  name: 'restaurants',
  initialState: {
    list: [], // Stores fetched restaurants
    currentRestaurant: null, // Stores detailed data for a single restaurant
    searchResults: { restaurants: [], dishes: [], products: [] }, // Stores search results
    status: 'idle', // Status for general operations
    searchStatus: 'idle', // Status for search operations
    error: null, // General error
    searchError: null // Error during search
  },
  reducers: {
    // Clear the current restaurant data
    clearCurrentRestaurant: (state) => {
      state.currentRestaurant = null;
      state.error = null;
    },
    // Clear the list of restaurants
    clearRestaurantList: (state) => {
      state.list = [];
      state.status = 'idle';
      state.error = null;
    },
    // Clear search results
    clearSearchResults: (state) => {
      state.searchResults = { restaurants: [], dishes: [], products: [] };
      state.searchStatus = 'idle';
      state.searchError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all restaurants
      .addCase(fetchRestaurants.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload || []; // Ensure list is always an array
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Error fetching restaurants';
      })

      // Fetch details of a single restaurant
      .addCase(fetchRestaurantDetails.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchRestaurantDetails.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentRestaurant = action.payload;
      })
      .addCase(fetchRestaurantDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Error fetching restaurant details';
      });
  },
});

// Export the reducer actions
export const { clearCurrentRestaurant, clearRestaurantList, clearSearchResults } = restaurantSlice.actions;

// Export the reducer
export default restaurantSlice.reducer;
