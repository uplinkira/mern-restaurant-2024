import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

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
    list: [],         // For multiple dishes (e.g., a restaurant's menu)
    currentDish: null, // For storing the details of a specific dish
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Handle fetching multiple dishes (e.g., for a restaurant)
      .addCase(fetchDishes.pending, (state) => {
        state.status = 'loading';
        state.error = null; // Clear previous errors
      })
      .addCase(fetchDishes.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchDishes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Something went wrong while fetching dishes';
      })
      
      // Handle fetching a single dish by its ID
      .addCase(fetchDishDetails.pending, (state) => {
        state.status = 'loading';
        state.error = null; // Clear previous errors
      })
      .addCase(fetchDishDetails.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentDish = action.payload;
      })
      .addCase(fetchDishDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Something went wrong while fetching the dish details';
      });
  },
});

export default dishSlice.reducer;
