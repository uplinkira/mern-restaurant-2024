import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance, { API_ENDPOINTS } from '../../utils/config';

export const fetchDishesByRestaurant = createAsyncThunk(
  'dishes/fetchDishesByRestaurant',
  async (restaurantSlug, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/restaurants/${restaurantSlug}/dishes`);
      return response.data;
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
      const response = await axiosInstance.get(`${API_ENDPOINTS.DISHES}/${dishSlug}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const dishSlice = createSlice({
  name: 'dishes',
  initialState: {
    list: [], // Stores all dishes for a restaurant
    currentDish: null, // Stores details of a single dish
    status: 'idle', // Status of the current API call (idle, loading, succeeded, failed)
    error: null, // Stores error messages if any
  },
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
      });
  },
});

// Export the reducer actions
export const { clearCurrentDish, clearDishes } = dishSlice.actions;

// Export the reducer
export default dishSlice.reducer;
