import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchRestaurants = createAsyncThunk(
  'restaurants/fetchRestaurants',
  async () => {
    const response = await axios.get('/api/restaurants');
    return response.data;
  }
);

export const fetchRestaurantDetails = createAsyncThunk(
  'restaurants/fetchRestaurantDetails',
  async (id) => {
    const response = await axios.get(`/api/restaurants/${id}`);
    return response.data;
  }
);

export const searchRestaurantsAndDishes = createAsyncThunk(
  'restaurants/searchRestaurantsAndDishes',
  async (query) => {
    const response = await axios.get(`/api/restaurants/search?q=${query}`);
    return response.data;
  }
);

const restaurantSlice = createSlice({
  name: 'restaurants',
  initialState: {
    list: [],
    currentRestaurant: null,
    searchResults: { restaurants: [], dishes: [] },
    status: 'idle',
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRestaurants.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchRestaurantDetails.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchRestaurantDetails.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentRestaurant = action.payload;
      })
      .addCase(fetchRestaurantDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(searchRestaurantsAndDishes.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(searchRestaurantsAndDishes.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.searchResults = action.payload;
      })
      .addCase(searchRestaurantsAndDishes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  }
});

export default restaurantSlice.reducer;
