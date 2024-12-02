// client/src/redux/slices/productSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance, { API_ENDPOINTS } from '../../utils/config';

// Async thunks for product operations
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ page = 1, limit = 10, search = '', category = '' } = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.PRODUCTS, {
        params: { page, limit, search, category }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchProductDetails = createAsyncThunk(
  'products/fetchProductDetails',
  async (slug, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.PRODUCT_DETAILS(slug));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  list: [],
  currentProduct: null,
  filteredProducts: [],
  status: 'idle',
  error: null,
  filters: {
    category: null,
    priceRange: null,
    availableForDelivery: null
  }
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      // Apply filters to the product list
      state.filteredProducts = state.list.filter(product => {
        let matches = true;
        const { category, priceRange, availableForDelivery } = state.filters;
        
        if (category && category !== 'All') {
          matches = matches && product.category === category;
        }
        if (priceRange) {
          const [min, max] = priceRange;
          matches = matches && product.price >= min && product.price <= max;
        }
        if (availableForDelivery !== null) {
          matches = matches && product.availableForDelivery === availableForDelivery;
        }
        return matches;
      });
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.filteredProducts = state.list;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchProducts
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
        state.filteredProducts = action.payload;
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Handle fetchProductDetails
      .addCase(fetchProductDetails.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentProduct = action.payload;
        state.error = null;
      })
      .addCase(fetchProductDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

// Export actions
export const { 
  setFilters, 
  clearFilters, 
  clearCurrentProduct 
} = productSlice.actions;

// Selectors
export const selectAllProducts = (state) => state.products.list;
export const selectFilteredProducts = (state) => state.products.filteredProducts;
export const selectCurrentProduct = (state) => state.products.currentProduct;
export const selectProductStatus = (state) => state.products.status;
export const selectProductError = (state) => state.products.error;
export const selectProductFilters = (state) => state.products.filters;

export default productSlice.reducer;