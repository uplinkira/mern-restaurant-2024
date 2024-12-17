// client/src/redux/slices/dishSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance, { API_ENDPOINTS } from '../../utils/config';

// Async Thunks
export const fetchDishes = createAsyncThunk(
  'dishes/fetchDishes',
  async ({ 
    page = 1, 
    limit = 10, 
    sortBy = 'createdAt',
    order = 'desc',
    restaurant,
    menu,
    minPrice,
    maxPrice,
    isSignature,
    status = 'active'
  } = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.DISHES, {
        params: { 
          page, 
          limit, 
          sortBy,
          order,
          restaurant,
          menu,
          minPrice,
          maxPrice,
          isSignature,
          status
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchDishDetails = createAsyncThunk(
  'dishes/fetchDishDetails',
  async ({ slug, includeRelated = true }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.DISH_DETAILS(slug),
        { params: { includeRelated } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchDishesByRestaurant = createAsyncThunk(
  'dishes/fetchDishesByRestaurant',
  async ({ 
    restaurantSlug, 
    page = 1, 
    limit = 10,
    sortBy = 'createdAt',
    order = 'desc',
    status = 'active'
  }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.DISHES_BY_RESTAURANT(restaurantSlug),
        { 
          params: { 
            page, 
            limit, 
            sortBy,
            order,
            status 
          } 
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const searchDishes = createAsyncThunk(
  'dishes/searchDishes',
  async ({ 
    q, 
    page = 1, 
    limit = 10,
    restaurant,
    menu,
    minPrice,
    maxPrice,
    isSignature,
    status = 'active'
  }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.SEARCH_DISHES, {
        params: { 
          q, 
          page, 
          limit,
          restaurant,
          menu,
          minPrice,
          maxPrice,
          isSignature,
          status
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchSignatureDishes = createAsyncThunk(
  'dishes/fetchSignatureDishes',
  async (_, { rejectWithValue }) => {
    try {
      // 获取所有餐厅的特色菜品
      const response = await axiosInstance.get(API_ENDPOINTS.DISHES, {
        params: {
          isSignature: true,
          status: 'active'
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  list: [],
  filteredDishes: [],
  currentDish: null,
  relatedDishes: [],
  signatureDishes: [],
  status: 'idle',
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10,
    totalItems: 0
  },
  filters: {
    priceRange: null,
    isSignatureDish: null,
    restaurant: null,
    menu: null,
    allergens: [],
    status: 'active',
    sortBy: 'createdAt',
    order: 'desc'
  },
  lastFetch: null
};

const dishSlice = createSlice({
  name: 'dishes',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.filteredDishes = state.list;
    },
    clearCurrentDish: (state) => {
      state.currentDish = null;
      state.relatedDishes = [];
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setSorting: (state, action) => {
      const { sortBy, order } = action.payload;
      state.filters.sortBy = sortBy;
      state.filters.order = order;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchDishes
      .addCase(fetchDishes.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDishes.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload.data;
        state.filteredDishes = action.payload.data;
        state.pagination = {
          currentPage: action.payload.meta.page,
          totalPages: action.payload.meta.totalPages,
          itemsPerPage: action.payload.meta.limit,
          totalItems: action.payload.meta.total
        };
        state.lastFetch = new Date().toISOString();
      })
      .addCase(fetchDishes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to fetch dishes';
      })
      // Handle fetchDishDetails
      .addCase(fetchDishDetails.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDishDetails.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentDish = action.payload.data;
        state.relatedDishes = action.payload.data.relatedDishes || [];
      })
      .addCase(fetchDishDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to fetch dish details';
      })
      // Handle search
      .addCase(searchDishes.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(searchDishes.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload.data;
        state.filteredDishes = action.payload.data;
        state.pagination = {
          currentPage: action.payload.meta.page,
          totalPages: action.payload.meta.totalPages,
          itemsPerPage: action.payload.meta.limit,
          totalItems: action.payload.meta.total
        };
      })
      .addCase(searchDishes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to search dishes';
      })
      // Handle signature dishes
      .addCase(fetchSignatureDishes.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSignatureDishes.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.signatureDishes = action.payload.data;
      })
      .addCase(fetchSignatureDishes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to fetch signature dishes';
      });
  }
});

// Export actions
export const {
  setFilters,
  clearFilters,
  clearCurrentDish,
  setPagination,
  setSorting
} = dishSlice.actions;

// Export selectors
export const selectAllDishes = (state) => state.dishes.list;
export const selectFilteredDishes = (state) => state.dishes.filteredDishes;
export const selectCurrentDish = (state) => state.dishes.currentDish;
export const selectRelatedDishes = (state) => state.dishes.relatedDishes;
export const selectSignatureDishes = (state) => state.dishes.signatureDishes;
export const selectDishStatus = (state) => state.dishes.status;
export const selectDishError = (state) => state.dishes.error;
export const selectDishFilters = (state) => state.dishes.filters;
export const selectDishPagination = (state) => state.dishes.pagination;
export const selectLastFetch = (state) => state.dishes.lastFetch;

// Memoized selectors
export const selectDishById = (id) => (state) => 
  state.dishes.list.find(dish => dish._id === id);

export const selectDishBySlug = (slug) => (state) =>
  state.dishes.list.find(dish => dish.slug === slug);

export default dishSlice.reducer;