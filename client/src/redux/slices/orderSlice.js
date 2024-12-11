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
      return rejectWithValue(error.response?.data?.message || error.message);
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
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async ({ orderId, reason }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`${API_ENDPOINTS.ORDERS}/${orderId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState: { orders: [], status: 'idle', error: null },
  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        // Check if the response has the expected structure
        if (action.payload?.success && action.payload?.data) {
          state.orders = state.orders || [];
          state.orders.push(action.payload.data);
          state.status = 'succeeded';
          state.error = null;
        } else {
          state.status = 'failed';
          state.error = 'Invalid response format from server';
        }
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to create order';
      })

      // Fetch Order History
      .addCase(fetchOrderHistory.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchOrderHistory.fulfilled, (state, action) => {
        // Check if the response has the expected structure
        if (action.payload?.success && Array.isArray(action.payload?.data)) {
          state.orders = action.payload.data;
          state.status = 'succeeded';
          state.error = null;
        } else {
          state.status = 'failed';
          state.error = 'Invalid response format from server';
        }
      })
      .addCase(fetchOrderHistory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch order history';
      })

      // Cancel Order
      .addCase(cancelOrder.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        if (action.payload?.success && action.payload?.data) {
          const cancelledOrder = action.payload.data;
          // Update the order in the state
          const orderIndex = state.orders.findIndex(order => order._id === cancelledOrder._id);
          if (orderIndex !== -1) {
            state.orders[orderIndex] = cancelledOrder;
          }
          state.status = 'succeeded';
          state.error = null;
        } else {
          state.status = 'failed';
          state.error = 'Invalid response format from server';
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to cancel order';
      });
  }
});

export const { clearOrderError } = orderSlice.actions;
export default orderSlice.reducer;
