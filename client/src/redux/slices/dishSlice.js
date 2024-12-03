// client/src/redux/slices/dishSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance, { API_ENDPOINTS } from '../../utils/config';

// Async Thunks
export const fetchDishes = createAsyncThunk(
  'dishes/fetchDishes',
  async ({ page = 1, limit = 10, search = '' } = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.DISHES, {
        params: { page, limit, search }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchDishDetails = createAsyncThunk(
  'dishes/fetchDishDetails',
  async (slug, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.DISH_DETAILS(slug));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchDishesByRestaurant = createAsyncThunk(
  'dishes/fetchDishesByRestaurant',
  async (restaurantSlug, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.DISHES_BY_RESTAURANT(restaurantSlug));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const searchDishes = createAsyncThunk(
  'dishes/searchDishes',
  async ({ query, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.SEARCH_DISHES, {
        params: { q: query, page, limit }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  list: [],
  filteredDishes: [],
  currentDish: null,
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
    allergens: []
  }
};

const dishSlice = createSlice({
  name: 'dishes',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      // Apply filters to the dish list
      state.filteredDishes = state.list.filter(dish => {
        let matches = true;
        const { priceRange, isSignatureDish, restaurant, allergens } = state.filters;

        if (priceRange) {
          const [min, max] = priceRange;
          matches = matches && dish.price >= min && dish.price <= max;
        }
        if (isSignatureDish !== null) {
          matches = matches && dish.isSignatureDish === isSignatureDish;
        }
        if (restaurant) {
          matches = matches && dish.restaurants.includes(restaurant);
        }
        if (allergens.length > 0) {
          matches = matches && allergens.every(allergen => 
            !dish.allergens.includes(allergen)
          );
        }
        return matches;
      });
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.filteredDishes = state.list;
    },
    clearCurrentDish: (state) => {
      state.currentDish = null;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
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
          totalPages: Math.ceil(action.payload.meta.total / action.payload.meta.limit),
          itemsPerPage: action.payload.meta.limit,
          totalItems: action.payload.meta.total
        };
      })
      .addCase(fetchDishes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Handle fetchDishDetails
      .addCase(fetchDishDetails.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDishDetails.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentDish = action.payload.data;
      })
      .addCase(fetchDishDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
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
          totalPages: Math.ceil(action.payload.meta.total / action.payload.meta.limit),
          itemsPerPage: action.payload.meta.limit,
          totalItems: action.payload.meta.total
        };
      })
      .addCase(searchDishes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

// Export actions
export const {
  setFilters,
  clearFilters,
  clearCurrentDish,
  setPagination
} = dishSlice.actions;

// Export selectors
export const selectAllDishes = (state) => state.dishes.list;
export const selectFilteredDishes = (state) => state.dishes.filteredDishes;
export const selectCurrentDish = (state) => state.dishes.currentDish;
export const selectDishStatus = (state) => state.dishes.status;
export const selectDishError = (state) => state.dishes.error;
export const selectDishFilters = (state) => state.dishes.filters;
export const selectDishPagination = (state) => state.dishes.pagination;

export default dishSlice.reducer;