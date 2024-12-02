// client/src/redux/slices/orderSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance, { API_ENDPOINTS } from '../../utils/config';

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.ORDERS, orderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchOrderHistory = createAsyncThunk(
  'orders/fetchOrderHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.USER_ORDERS);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
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
