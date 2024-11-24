import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

// Fetch dishes for a specific restaurant
export const fetchDishes = createAsyncThunk(
  'dishes/fetchDishes',
  async (restaurantId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/restaurants/${restaurantId}/dishes`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching dishes');
    }
  }
);

// Fetch details of a single dish
export const fetchDishDetails = createAsyncThunk(
  'dishes/fetchDishDetails',
  async (dishId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dishes/${dishId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching dish details');
    }
  }
);

const dishSlice = createSlice({
  name: 'dishes',
  initialState: {
    list: [],          // Store multiple dishes (e.g., restaurant menu)
    currentDish: null, // Store specific dish details
    status: 'idle',
    error: null,
  },
  reducers: {
    // Optional: Clear current dish when navigating away
    clearCurrentDish: (state) => {
      state.currentDish = null;
    },
    // Optional: Clear all dishes (for example, when logging out)
    clearAllDishes: (state) => {
      state.list = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetching multiple dishes for a restaurant
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
      })
      // Handle fetching a single dish by its ID
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
      });
  },
});

// Export the reducer actions
export const { clearCurrentDish, clearAllDishes } = dishSlice.actions;

// Export the reducer as default
export default dishSlice.reducer;
