import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/order', orderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Order creation failed');
    }
  }
);

export const fetchOrderHistory = createAsyncThunk(
  'orders/fetchOrderHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/order/history');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order history');
    }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState: { orders: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.status = 'loading';
        state.error = null; // Clear previous errors
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.orders.push(action.payload); // Append new order
        state.status = 'succeeded';
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Something went wrong creating the order';
      })

      // Fetch Order History
      .addCase(fetchOrderHistory.pending, (state) => {
        state.status = 'loading';
        state.error = null; // Clear previous errors
      })
      .addCase(fetchOrderHistory.fulfilled, (state, action) => {
        state.orders = action.payload;
        state.status = 'succeeded';
      })
      .addCase(fetchOrderHistory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Something went wrong fetching the order history';
      });
  }
});

export default orderSlice.reducer;
