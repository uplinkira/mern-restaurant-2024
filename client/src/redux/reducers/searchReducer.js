import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const searchRestaurantsAndDishes = createAsyncThunk(
  'search/searchRestaurantsAndDishes',
  async (query) => {
    const response = await axios.get();
    return response.data;
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    restaurants: [],
    dishes: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(searchRestaurantsAndDishes.pending, (state) => {
        state.loading = true;
      })
      .addCase(searchRestaurantsAndDishes.fulfilled, (state, action) => {
        state.loading = false;
        state.restaurants = action.payload.restaurants;
        state.dishes = action.payload.dishes;
      })
      .addCase(searchRestaurantsAndDishes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default searchSlice.reducer;
