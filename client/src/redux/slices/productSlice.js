import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import axiosInstance, { API_ENDPOINTS } from '../../utils/config';

// Async thunks for product operations
export const fetchProducts = createAsyncThunk(
 'products/fetchProducts',
 async (params, { rejectWithValue, signal }) => {
   try {
     const response = await axiosInstance.get(API_ENDPOINTS.PRODUCTS, {
       params,
       signal
     });
     
     return response.data;
   } catch (error) {
     if (error.name === 'CanceledError') {
       return;
     }
     
     if (error.response?.status === 429) {
       return rejectWithValue('Rate limit exceeded. Please wait a moment before trying again.');
     }
     
     return rejectWithValue(
       error.response?.data?.message || 
       error.message || 
       'An error occurred while fetching products'
     );
   }
 }
);

export const fetchProductDetails = createAsyncThunk(
 'products/fetchProductDetails',
 async ({ slug, includeRelated = true }, { rejectWithValue }) => {
   try {
     const response = await axiosInstance.get(
       API_ENDPOINTS.PRODUCT_DETAILS(slug),
       { params: { includeRelated } }
     );
     
     if (!response.data.success) {
       return rejectWithValue(response.data);
     }
     
     return response.data;
   } catch (error) {
     return rejectWithValue(error.response?.data || { message: error.message });
   }
 }
);

const initialState = {
  products: [],
  status: 'idle',
  error: null,
  filters: {
    category: 'All',
    sortBy: 'createdAt',
    order: 'desc'
  },
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: 1,
    totalItems: 0
  },
  categories: [],
  sortOptions: [
    { value: 'createdAt', order: 'desc', label: 'Newest First' },
    { value: 'createdAt', order: 'asc', label: 'Oldest First' },
    { value: 'price', order: 'asc', label: 'Price: Low to High' },
    { value: 'price', order: 'desc', label: 'Price: High to Low' }
  ]
};

const productSlice = createSlice({
 name: 'products',
 initialState,
 reducers: {
   setFilters: (state, action) => {
     state.filters = { ...state.filters, ...action.payload };
     // Reset page when filters change
     state.pagination.currentPage = 1;
   },
   clearFilters: (state) => {
     state.filters = initialState.filters;
     state.pagination.currentPage = 1;
   },
   setQuickFilter: (state, action) => {
     state.filters.quickFilter = action.payload;
     state.pagination.currentPage = 1;
   },
   setSorting: (state, action) => {
     const { sortBy, order } = action.payload;
     state.filters.sortBy = sortBy;
     state.filters.order = order;
   },
   clearCurrentProduct: (state) => {
     state.currentProduct = null;
     state.relatedProducts = [];
   },
   setPagination: (state, action) => {
     state.pagination = { ...state.pagination, ...action.payload };
   }
 },
 extraReducers: (builder) => {
   builder
     .addCase(fetchProducts.pending, (state) => {
       state.status = 'loading';
       state.error = null;
     })
     .addCase(fetchProducts.fulfilled, (state, action) => {
       if (!action.payload) return;
       
       state.status = 'succeeded';
       state.products = action.payload.data;
       state.pagination = {
         currentPage: action.payload.meta.page,
         totalPages: action.payload.meta.totalPages,
         itemsPerPage: action.payload.meta.limit,
         totalItems: action.payload.meta.total
       };
       state.error = null;
     })
     .addCase(fetchProducts.rejected, (state, action) => {
       state.status = 'failed';
       state.error = action.payload?.message || 'Failed to fetch products';
     })
     .addCase(fetchProductDetails.pending, (state) => {
       state.status = 'loading';
       state.error = null;
     })
     .addCase(fetchProductDetails.fulfilled, (state, action) => {
       state.status = 'succeeded';
       state.currentProduct = action.payload.data;
       state.relatedProducts = action.payload.data.relatedProducts || [];
       state.error = null;
     })
     .addCase(fetchProductDetails.rejected, (state, action) => {
       state.status = 'failed';
       state.error = action.payload?.message || 'Failed to fetch product details';
     });
 }
});

// Export actions
export const { 
 setFilters, 
 clearFilters, 
 setQuickFilter,
 setSorting,
 clearCurrentProduct,
 setPagination
} = productSlice.actions;

// Selectors
const selectProductsState = state => state.products;

// Memoized selectors
export const selectAllProducts = createSelector(
  [selectProductsState],
  state => state.products
);

export const selectCurrentProduct = createSelector(
  [selectProductsState],
  state => state.currentProduct
);

export const selectRelatedProducts = createSelector(
  [selectProductsState],
  state => state.relatedProducts || []
);

export const selectProductStatus = createSelector(
  [selectProductsState],
  state => state.status
);

export const selectProductError = createSelector(
  [selectProductsState],
  state => state.error
);

export const selectProductFilters = createSelector(
  [selectProductsState],
  state => state.filters
);

export const selectProductPagination = createSelector(
  [selectProductsState],
  state => state.pagination
);

// 将静态数组移到组件外部并 memoize
const AVAILABLE_CATEGORIES = [
  'All',
  'Food',
  'Drink',
  'Snack',
  'Condiment',
  'Other'
];

export const selectAvailableCategories = createSelector(
  () => AVAILABLE_CATEGORIES,
  categories => categories
);

const SORT_OPTIONS = [
  { value: 'createdAt', order: 'desc', label: 'Newest First' },
  { value: 'createdAt', order: 'asc', label: 'Oldest First' },
  { value: 'price', order: 'asc', label: 'Price: Low to High' },
  { value: 'price', order: 'desc', label: 'Price: High to Low' }
];

export const selectSortOptions = createSelector(
  () => SORT_OPTIONS,
  options => options
);

// Enhanced filtered selector
export const selectFilteredProducts = createSelector(
  [selectAllProducts, selectProductFilters],
  (products, filters) => {
    if (!Array.isArray(products)) return [];
    
    return products.filter(product => {
      let matches = true;
      const { 
        category, 
        quickFilter,
        priceRange, 
        availableForDelivery, 
        stockStatus,
        search 
      } = filters;

      // Category filter
      if (category && category !== 'All') {
        matches = matches && product.category === category;
      }

      // Quick filter
      if (quickFilter) {
        switch (quickFilter) {
          case 'featured':
            matches = matches && product.isFeatured;
            break;
          case 'inStock':
            matches = matches && product.stockStatus === 'in_stock';
            break;
          case 'delivery':
            matches = matches && product.availableForDelivery;
            break;
          default:
            // 默认情况下不应用任何过滤
            break;
        }
      }

      // Price range
      if (priceRange?.min) matches = matches && product.price >= priceRange.min;
      if (priceRange?.max) matches = matches && product.price <= priceRange.max;

      // Delivery availability
      if (typeof availableForDelivery === 'boolean') {
        matches = matches && product.availableForDelivery === availableForDelivery;
      }

      // Stock status
      if (stockStatus && stockStatus !== 'all') {
        matches = matches && product.stockStatus === stockStatus;
      }

      // Search
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        matches = matches && (
          searchRegex.test(product.name) || 
          searchRegex.test(product.description) ||
          searchRegex.test(product.category)
        );
      }

      return matches;
    });
  }
);

export default productSlice.reducer;