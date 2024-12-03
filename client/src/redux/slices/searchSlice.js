// client/src/redux/slices/searchSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance, { API_ENDPOINTS } from '../../utils/config';

export const searchItems = createAsyncThunk(
  'search/searchItems',
  async ({ query, filter, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.SEARCH, {
        params: { 
          query, 
          filter,
          page,
          limit
        }
      });
      return { ...response.data, filter };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  activeFilter: 'restaurant',
  restaurants: [],
  dishes: [],
  products: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 0,
  totalItems: 0,
  itemsPerPage: 10,
  lastQuery: '',
  searchHistory: [],
  recentSearches: []
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    clearSearchResults: (state) => {
      state.restaurants = [];
      state.dishes = [];
      state.products = [];
      state.error = null;
      state.totalItems = 0;
      state.currentPage = 1;
      state.lastQuery = '';
      // Preserve searchHistory and recentSearches
    },
    setFilter: (state, action) => {
      const validFilters = ['restaurant', 'dish', 'product'];
      if (validFilters.includes(action.payload)) {
        state.activeFilter = action.payload;
        state.currentPage = 1;
      }
    },
    setPage: (state, action) => {
      if (action.payload > 0 && action.payload <= state.totalPages) {
        state.currentPage = action.payload;
      }
    },
    setItemsPerPage: (state, action) => {
      const validLimits = [10, 20, 50];
      if (validLimits.includes(action.payload)) {
        state.itemsPerPage = action.payload;
        state.currentPage = 1;
      }
    },
    addToSearchHistory: (state, action) => {
      const { query, filter, timestamp = Date.now() } = action.payload;
      state.searchHistory.unshift({ query, filter, timestamp });
      state.searchHistory = state.searchHistory.slice(0, 10);
    },
    updateRecentSearches: (state, action) => {
      const search = action.payload;
      state.recentSearches = [
        search,
        ...state.recentSearches.filter(item => item !== search)
      ].slice(0, 5);
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
        
        const { data, meta, filter } = action.payload;
        
        // Reset only the current filter's results
        state[`${filter}s`] = [];

        // Update results for the current filter
        switch (filter) {
          case 'restaurant':
          case 'dish':
          case 'product':
            state[`${filter}s`] = data || [];
            break;
          default:
            console.warn(`Unexpected filter type: ${filter}`);
        }

        if (meta) {
          state.totalItems = meta.total;
          state.currentPage = meta.page;
          state.itemsPerPage = meta.limit;
          state.totalPages = Math.ceil(meta.total / meta.limit);
          state.activeFilter = filter;
          state.lastQuery = meta.query || '';
          
          // Update search history
          if (meta.query) {
            state.searchHistory.unshift({
              query: meta.query,
              filter,
              timestamp: Date.now()
            });
            state.searchHistory = state.searchHistory.slice(0, 10);
            
            // Update recent searches
            if (!state.recentSearches.includes(meta.query)) {
              state.recentSearches = [
                meta.query,
                ...state.recentSearches
              ].slice(0, 5);
            }
          }
        }
      })
      .addCase(searchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'An error occurred';
        state.totalItems = 0;
      });
  },
});

export const { 
  clearSearchResults, 
  setFilter, 
  setPage,
  setItemsPerPage,
  addToSearchHistory,
  updateRecentSearches
} = searchSlice.actions;

// Selectors
export const selectSearchResults = (state) => {
  const { activeFilter } = state.search;
  return state.search[`${activeFilter}s`] || [];
};

export const selectSearchMetadata = (state) => ({
  currentPage: state.search.currentPage,
  totalPages: state.search.totalPages,
  totalItems: state.search.totalItems,
  itemsPerPage: state.search.itemsPerPage,
  loading: state.search.loading,
  error: state.search.error
});

export const selectSearchHistory = (state) => state.search.searchHistory;
export const selectRecentSearches = (state) => state.search.recentSearches;

export default searchSlice.reducer;