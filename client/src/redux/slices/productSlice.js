import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import axiosInstance, { API_ENDPOINTS } from '../../utils/config';

// Async thunks for product operations
export const fetchProducts = createAsyncThunk(
 'products/fetchProducts',
 async ({ 
   page = 1, 
   limit = 8,  // Changed default to 8
   sortBy = 'createdAt',
   order = 'desc',
   search = '',
   category = '',
   status = 'active',
   stockStatus = 'all'
 } = {}, { rejectWithValue }) => {
   try {
     const response = await axiosInstance.get(API_ENDPOINTS.PRODUCTS, {
       params: { 
         page, 
         limit, 
         sortBy,
         order,
         search,
         category,
         status,
         stockStatus
       }
     });
     
     if (!response.data.success) {
       return rejectWithValue(response.data);
     }
     
     return response.data;
   } catch (error) {
     return rejectWithValue(error.response?.data || { message: error.message });
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
 list: [],
 currentProduct: null,
 relatedProducts: [],
 status: 'idle',
 error: null,
 pagination: {
   currentPage: 1,
   totalPages: 1,
   itemsPerPage: 8,    // Changed to 8
   totalItems: 0
 },
 filters: {
   category: null,
   quickFilter: null,  // Added for quick filter
   priceRange: null,
   availableForDelivery: null,
   stockStatus: 'all',  // Added for stock status
   status: 'active',
   sortBy: 'createdAt',
   order: 'desc',
   search: ''
 },
 lastFetch: null
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
       state.status = 'succeeded';
       state.list = action.payload.data;
       state.pagination = {
         currentPage: action.payload.meta.page,
         totalPages: action.payload.meta.totalPages,
         itemsPerPage: action.payload.meta.limit,
         totalItems: action.payload.meta.total
       };
       state.lastFetch = new Date().toISOString();
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

export const selectAllProducts = state => selectProductsState(state).list;
export const selectCurrentProduct = state => selectProductsState(state).currentProduct;
export const selectRelatedProducts = state => selectProductsState(state).relatedProducts;
export const selectProductStatus = state => selectProductsState(state).status;
export const selectProductError = state => selectProductsState(state).error;
export const selectProductFilters = state => selectProductsState(state).filters;
export const selectProductPagination = state => selectProductsState(state).pagination;

// New selectors
export const selectAvailableCategories = () => [
 'All',
 'Food',
 'Drink',
 'Snack',
 'Condiment',
 'Other'
];

export const selectQuickFilters = () => [
 { id: 'all', label: 'All' },
 { id: 'featured', label: 'Featured' },
 { id: 'inStock', label: 'In Stock' },
 { id: 'delivery', label: 'Delivery Available' }
];

export const selectSortOptions = () => [
 { value: 'createdAt', label: 'Newest', order: 'desc' },
 { value: 'price', label: 'Price: Low to High', order: 'asc' },
 { value: 'price', label: 'Price: High to Low', order: 'desc' }
];

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