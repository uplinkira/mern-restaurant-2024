import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Fetch all restaurants
export const fetchRestaurants = createAsyncThunk(
  'restaurants/fetchRestaurants',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/restaurants');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching restaurants');
    }
  }
);

// Fetch details of a single restaurant
export const fetchRestaurantDetails = createAsyncThunk(
  'restaurants/fetchRestaurantDetails',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/restaurants/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching restaurant details');
    }
  }
);

// Search for restaurants, dishes, and products
export const searchRestaurantsAndDishes = createAsyncThunk(
  'restaurants/searchRestaurantsAndDishes',
  async (query, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/restaurants/search?q=${query}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error performing search');
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
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Restaurants
      .addCase(fetchRestaurants.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Error fetching restaurants';
      })

      // Fetch Restaurant Details
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
      })

      // Search Restaurants, Dishes, and Products
      .addCase(searchRestaurantsAndDishes.pending, (state) => {
        state.searchStatus = 'loading';
      })
      .addCase(searchRestaurantsAndDishes.fulfilled, (state, action) => {
        state.searchStatus = 'succeeded';
        state.searchResults = action.payload;
      })
      .addCase(searchRestaurantsAndDishes.rejected, (state, action) => {
        state.searchStatus = 'failed';
        state.searchError = action.payload || 'Error performing search';
      });
  }
});

export default restaurantSlice.reducer;
