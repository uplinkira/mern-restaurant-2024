// client/src/redux/slices/cartSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance, { API_ENDPOINTS } from '../../utils/config';

// Async thunks
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.CART);
      console.log('Fetch cart response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch cart');
      }
      
      // 确保数据结构正确
      const items = response.data.data.items || [];
      const validItems = items.filter(item => {
        if (!item?.product || typeof item?.product?.price !== 'number') {
          console.warn('Invalid cart item:', item);
          return false;
        }
        return true;
      });

      return {
        items: validItems,
        total: response.data.data.totalPrice || 0
      };
    } catch (error) {
      console.error('Fetch cart error:', error);
      return rejectWithValue({
        message: error.response?.data?.message || error.message || 'Failed to fetch cart'
      });
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ product, quantity }, { rejectWithValue }) => {
    try {
      console.log('Adding to cart:', { product, quantity });
      
      if (!product || (!product.id && !product._id)) {
        throw new Error('Invalid product data: Missing product ID');
      }

      const response = await axiosInstance.post(API_ENDPOINTS.CART_ADD, {
        product,
        quantity
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to add item to cart');
      }

      console.log('Add to cart response:', response.data);
      
      // Ensure proper data structure
      const items = response.data.data.items || [];
      const validItems = items.filter(item => {
        if (!item?.product || typeof item?.product?.price !== 'number') {
          console.warn('Invalid cart item:', item);
          return false;
        }
        return true;
      });

      return {
        items: validItems,
        total: response.data.data.totalPrice || 0
      };
    } catch (error) {
      console.error('Add to cart error:', error);
      return rejectWithValue({
        message: error.response?.data?.message || error.message || 'Failed to add item to cart'
      });
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      console.log('Updating cart item - Request:', {
        productId,
        quantity,
        url: API_ENDPOINTS.CART_UPDATE
      });

      const response = await axiosInstance.patch(API_ENDPOINTS.CART_UPDATE, {
        productId,
        quantity
      });

      console.log('Update cart item - Response:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update cart item');
      }

      return {
        items: response.data.data.items || [],
        total: response.data.data.totalPrice || 0
      };
    } catch (error) {
      console.error('Update cart item - Error:', {
        error,
        response: error.response?.data,
        message: error.message
      });
      return rejectWithValue({
        message: error.response?.data?.message || error.message || 'Failed to update cart item'
      });
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (productId, { rejectWithValue }) => {
    try {
      console.log('Removing from cart - Request:', {
        productId,
        url: API_ENDPOINTS.CART_REMOVE
      });
      
      if (!productId) {
        throw new Error('Invalid product ID');
      }

      const response = await axiosInstance.delete(`${API_ENDPOINTS.CART_REMOVE}?productId=${productId}`);

      console.log('Remove from cart - Response:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to remove item from cart');
      }
      
      return {
        items: response.data.data.items || [],
        total: response.data.data.totalPrice || 0
      };
    } catch (error) {
      console.error('Remove from cart - Error:', {
        error,
        response: error.response?.data,
        message: error.message
      });
      return rejectWithValue({
        message: error.response?.data?.message || error.message || 'Failed to remove item from cart'
      });
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(API_ENDPOINTS.CART_CLEAR);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const checkDeliveryAvailability = createAsyncThunk(
  'cart/checkDeliveryAvailability',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.CART_CHECK_DELIVERY);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

const initialState = {
  items: [],
  total: 0,
  status: 'idle',
  error: null
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setCartItems: (state, action) => {
      // Validate items before setting
      const validItems = action.payload.filter(item => {
        if (!item?.product || typeof item?.product?.price !== 'number') {
          console.warn('Invalid cart item:', item);
          return false;
        }
        return true;
      });
      state.items = validItems;
    },
    setCartTotal: (state, action) => {
      state.total = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.status = 'failed';
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch cart
      .addCase(fetchCart.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.error = null;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to fetch cart';
      })
      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.error = null;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to add item to cart';
      })
      // Update cart item
      .addCase(updateCartItem.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.error = null;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to update cart item';
      })
      // Remove from cart
      .addCase(removeFromCart.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.error = null;
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to remove item from cart';
      })
      // Clear cart
      .addCase(clearCart.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.status = 'succeeded';
        state.items = [];
        state.total = 0;
        state.error = null;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to clear cart';
      });
  }
});

// Export actions
export const {
  clearError,
  setStatus,
  setCartItems,
  setCartTotal,
  setError
} = cartSlice.actions;

// Export selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.total;
export const selectCartStatus = (state) => state.cart.status;
export const selectCartError = (state) => state.cart.error;

export default cartSlice.reducer;