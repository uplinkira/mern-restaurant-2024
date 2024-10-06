
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Fetch dishes for a specific restaurant
export const fetchDishes = createAsyncThunk(
  'dishes/fetchDishes',
  async (restaurantId) => {
    const response = await axios.get(`${API_BASE_URL}/restaurants/${restaurantId}/dishes`);
    return response.data;
  }
);

// Fetch details of a single dish
export const fetchDishDetails = createAsyncThunk(
  'dishes/fetchDishDetails',
  async (dishId) => {
    const response = await axios.get(`${API_BASE_URL}/dishes/${dishId}`);
    return response.data;
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
      })
      .addCase(fetchDishes.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchDishes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      
      // Handle fetching a single dish by its ID
      .addCase(fetchDishDetails.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDishDetails.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentDish = action.payload;
      })
      .addCase(fetchDishDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default dishSlice.reducer;

