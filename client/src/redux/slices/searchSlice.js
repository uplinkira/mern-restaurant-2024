// client/src/redux/slices/searchSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance, { API_ENDPOINTS } from '../../utils/config';

// Async action for search
export const searchItems = createAsyncThunk(
 'search/searchItems',
 async ({ query, filter }, { rejectWithValue }) => {
   try {
     const response = await axiosInstance.get(API_ENDPOINTS.SEARCH, {
       params: { query, filter }
     });
     return { ...response.data, filter };
   } catch (error) {
     return rejectWithValue(error.message);
   }
 }
);

// Initial state
const initialState = {
 activeFilter: 'restaurant',
 restaurants: [],
 menus: [],
 dishes: [],
 products: [],
 loading: false,
 error: null,
 currentPage: 1,
 totalItems: 0,
 itemsPerPage: 10,
 lastQuery: '',
 searchResults: {}
};

// Slice definition
const searchSlice = createSlice({
 name: 'search',
 initialState,
 reducers: {
   clearSearchResults: (state) => {
     state.restaurants = [];
     state.menus = [];
     state.dishes = [];
     state.products = [];
     state.error = null;
     state.totalItems = 0;
     state.currentPage = 1;
     state.lastQuery = '';
     state.searchResults = {};
   },
   setFilter: (state, action) => {
     state.activeFilter = action.payload;
     state.currentPage = 1;
   },
   setPage: (state, action) => {
     state.currentPage = action.payload;
   },
   setLastQuery: (state, action) => {
     state.lastQuery = action.payload;
   }
 },
 extraReducers: (builder) => {
   builder
     .addCase(searchItems.pending, (state) => {
       state.loading = true;
       state.error = null;
     })
     .addCase(searchItems.fulfilled, (state, action) => {
       state.loading = false;
       state.error = null;
       
       // Clear all arrays first
       state.restaurants = [];
       state.menus = [];
       state.dishes = [];
       state.products = [];

       const { data, meta, filter } = action.payload;
       console.log('Received search results:', { data, meta, filter });
       
       // Update state based on filter
       switch (filter) {
         case 'restaurant':
           state.restaurants = data || [];
           break;
         case 'menu':
           state.menus = data || [];
           break;
         case 'dish':
           state.dishes = data || [];
           break;
         case 'product':
           state.products = data || [];
           break;
       }

       // Update metadata
       state.totalItems = meta.total;
       state.currentPage = meta.page;
       state.itemsPerPage = meta.limit;
       state.activeFilter = filter;
       
       // Store complete search results
       state.searchResults = data || {};

       console.log('Updated state:', {
         filter: state.activeFilter,
         results: {
           restaurants: state.restaurants.length,
           menus: state.menus.length,
           dishes: state.dishes.length,
           products: state.products.length
         },
         total: state.totalItems
       });
     })
     .addCase(searchItems.rejected, (state, action) => {
       state.loading = false;
       state.error = action.payload || 'An error occurred';
       state.totalItems = 0;
       console.error('Search failed:', state.error);
     });
 },
});

// Export actions and reducer
export const { 
 clearSearchResults, 
 setFilter, 
 setPage,
 setLastQuery 
} = searchSlice.actions;

export default searchSlice.reducer;