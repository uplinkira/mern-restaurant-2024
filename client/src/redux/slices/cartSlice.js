import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Fetch the cart
export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get('/api/cart');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Error fetching cart');
  }
});

// Add an item to the cart
export const addItemToCart = createAsyncThunk('cart/addItemToCart', async (itemData, { rejectWithValue }) => {
  try {
    const response = await axios.post('/api/cart/add', itemData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Error adding item to cart');
  }
});

// Remove an item from the cart
export const removeItemFromCart = createAsyncThunk('cart/removeItemFromCart', async (itemId, { rejectWithValue }) => {
  try {
    const response = await axios.delete(`/api/cart/remove/${itemId}`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Error removing item from cart');
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    cart: null, // Holds the cart details
    status: 'idle', // Tracks the status of fetch/add/remove actions
    error: null, // Tracks any errors
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Handle fetching the cart
      .addCase(fetchCart.pending, (state) => {
        state.status = 'loading';
        state.error = null; // Clear any previous errors
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.cart = action.payload;
        state.status = 'succeeded';
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Something went wrong while fetching the cart';
      })
      
      // Handle adding an item to the cart
      .addCase(addItemToCart.pending, (state) => {
        state.status = 'loading';
        state.error = null; // Clear any previous errors
      })
      .addCase(addItemToCart.fulfilled, (state, action) => {
        state.cart = action.payload; // Update cart with the new state
        state.status = 'succeeded';
      })
      .addCase(addItemToCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Error occurred while adding item to the cart';
      })
      
      // Handle removing an item from the cart
      .addCase(removeItemFromCart.pending, (state) => {
        state.status = 'loading';
        state.error = null; // Clear any previous errors
      })
      .addCase(removeItemFromCart.fulfilled, (state, action) => {
        state.cart = action.payload; // Update the cart with the new state
        state.status = 'succeeded';
      })
      .addCase(removeItemFromCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Error occurred while removing item from the cart';
      });
  },
});

export default cartSlice.reducer;
