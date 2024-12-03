// client/src/redux/slices/dishSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance, { API_ENDPOINTS } from '../../utils/config';

// Fetch dishes by restaurant
export const fetchDishesByRestaurant = createAsyncThunk(
  'dishes/fetchDishesByRestaurant',
  async (restaurantSlug, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/restaurants/${restaurantSlug}/dishes`);
      return response.data.data; // Return the array of dishes directly
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch details of a single dish by slug
export const fetchDishDetails = createAsyncThunk(
  'dishes/fetchDishDetails',
  async (dishSlug, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.DISH_DETAILS(dishSlug));
      return response.data.data; // Return the dish object directly
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch all dishes
export const fetchDishes = createAsyncThunk(
  'dishes/fetchDishes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.DISHES);
      return response.data.data; // Adjust according to your API response
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  list: [], // Stores all dishes
  currentDish: null, // Stores details of a single dish
  status: 'idle', // Status of the current API call (idle, loading, succeeded, failed)
  error: null, // Stores error messages if any
};

const dishSlice = createSlice({
  name: 'dishes',
  initialState,
  reducers: {
    clearCurrentDish: (state) => {
      state.currentDish = null;
    },
    clearDishes: (state) => {
      state.list = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch dishes for a specific restaurant
      .addCase(fetchDishesByRestaurant.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDishesByRestaurant.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchDishesByRestaurant.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch dishes for the restaurant';
      })

      // Fetch details of a specific dish
      .addCase(fetchDishDetails.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDishDetails.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentDish = action.payload;
      })
      .addCase(fetchDishDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch dish details';
      })

      // Fetch all dishes
      .addCase(fetchDishes.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDishes.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchDishes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch dishes';
      });
  },
});

// Selectors
export const selectAllDishes = (state) => state.dishes.list;
export const selectCurrentDish = (state) => state.dishes.currentDish;
export const selectDishStatus = (state) => state.dishes.status;
export const selectDishError = (state) => state.dishes.error;

// Export the reducer actions
export const { clearCurrentDish, clearDishes } = dishSlice.actions;

// Export the reducer
export default dishSlice.reducer;
