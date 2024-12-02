// client/src/redux/slices/cartSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance, { API_ENDPOINTS } from '../../utils/config';

// Async thunk for cart operations
export const saveCartToServer = createAsyncThunk(
  'cart/saveCartToServer',
  async (cartData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.CART_ADD, {
        productSlug: cartData.productId,
        quantity: cartData.quantity
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const processOrder = createAsyncThunk(
  'cart/processOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.ORDERS, orderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
  status: 'idle',
  error: null,
  lastUpdated: null,
  orderProcessing: false,
  orderSuccess: false,
  orderError: null
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItemToCart: (state, action) => {
      const { productId, quantity, price, name, category } = action.payload;
      const existingItem = state.items.find(item => item.productId === productId);

      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.subtotal = existingItem.price * existingItem.quantity;
      } else {
        state.items.push({
          productId,
          quantity,
          price,
          name,
          category,
          subtotal: price * quantity
        });
      }
      
      state.total = state.items.reduce((sum, item) => sum + item.subtotal, 0);
      state.itemCount = state.items.reduce((count, item) => count + item.quantity, 0);
      state.lastUpdated = new Date().toISOString();
    },

    removeItemFromCart: (state, action) => {
      const { productId } = action.payload;
      state.items = state.items.filter(item => item.productId !== productId);
      state.total = state.items.reduce((sum, item) => sum + item.subtotal, 0);
      state.itemCount = state.items.reduce((count, item) => count + item.quantity, 0);
      state.lastUpdated = new Date().toISOString();
    },

    updateItemQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find(item => item.productId === productId);
      
      if (item) {
        item.quantity = quantity;
        item.subtotal = item.price * quantity;
        state.total = state.items.reduce((sum, item) => sum + item.subtotal, 0);
        state.itemCount = state.items.reduce((count, item) => count + item.quantity, 0);
        state.lastUpdated = new Date().toISOString();
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      state.itemCount = 0;
      state.lastUpdated = new Date().toISOString();
      state.orderSuccess = false;
      state.orderError = null;
    },

    resetOrderStatus: (state) => {
      state.orderProcessing = false;
      state.orderSuccess = false;
      state.orderError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle saveCartToServer
      .addCase(saveCartToServer.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(saveCartToServer.fulfilled, (state) => {
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(saveCartToServer.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Handle processOrder
      .addCase(processOrder.pending, (state) => {
        state.orderProcessing = true;
      })
      .addCase(processOrder.fulfilled, (state) => {
        state.orderProcessing = false;
        state.orderSuccess = true;
        state.items = [];
        state.total = 0;
        state.itemCount = 0;
      })
      .addCase(processOrder.rejected, (state, action) => {
        state.orderProcessing = false;
        state.orderSuccess = false;
        state.orderError = action.payload;
      });
  }
});

// Export actions
export const {
  addItemToCart,
  removeItemFromCart,
  updateItemQuantity,
  clearCart,
  resetOrderStatus
} = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.total;
export const selectCartItemCount = (state) => state.cart.itemCount;
export const selectCartStatus = (state) => state.cart.status;
export const selectCartError = (state) => state.cart.error;
export const selectOrderStatus = (state) => ({
  processing: state.cart.orderProcessing,
  success: state.cart.orderSuccess,
  error: state.cart.orderError
});

export default cartSlice.reducer;