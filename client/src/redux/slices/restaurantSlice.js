// client/src/redux/slices/restaurantSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance, { API_ENDPOINTS } from '../../utils/config';

// Fetch restaurants with pagination
export const fetchRestaurants = createAsyncThunk(
  'restaurants/fetchRestaurants',
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.RESTAURANTS, {
        params: { page, limit },
      });
      const responseData = response.data; // Assuming API returns data directly
      return {
        data: responseData.data,
        meta: responseData.meta,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch restaurant details by slug
export const fetchRestaurantDetails = createAsyncThunk(
  'restaurants/fetchRestaurantDetails',
  async (slug, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.RESTAURANT_DETAILS(slug));
      const responseData = response.data; // Assuming API returns data directly
      return responseData.data; // Return the restaurant data
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  list: [],
  currentRestaurant: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10,
    totalItems: 0,
  },
  listStatus: 'idle',
  detailStatus: 'idle',
  error: null,
  filters: {
    cuisineType: null,
    priceRange: null,
    hasVRExperience: null,
  },
};

const restaurantSlice = createSlice({
  name: 'restaurants',
  initialState,
  reducers: {
    clearCurrentRestaurant: (state) => {
      state.currentRestaurant = null;
      state.detailStatus = 'idle';
      state.error = null;
    },
    clearRestaurantList: (state) => {
      state.list = [];
      state.listStatus = 'idle';
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchRestaurants
      .addCase(fetchRestaurants.pending, (state) => {
        state.listStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.list = action.payload.data || [];

        if (action.payload.meta) {
          state.pagination = {
            currentPage: action.payload.meta.page || 1,
            totalPages: Math.ceil(action.payload.meta.total / action.payload.meta.limit) || 1,
            itemsPerPage: action.payload.meta.limit || 10,
            totalItems: action.payload.meta.total || 0,
          };
        }

        state.error = null;
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.error = action.payload || 'Error fetching restaurants';
      })

      // Handle fetchRestaurantDetails
      .addCase(fetchRestaurantDetails.pending, (state) => {
        state.detailStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchRestaurantDetails.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.currentRestaurant = action.payload; // action.payload is the restaurant data
        state.error = null;
      })
      .addCase(fetchRestaurantDetails.rejected, (state, action) => {
        state.detailStatus = 'failed';
        state.error = action.payload || 'Error fetching restaurant details';
      });
  },
});

export const {
  clearCurrentRestaurant,
  clearRestaurantList,
  setFilters,
  clearFilters,
  setPagination,
} = restaurantSlice.actions;

// Base Selectors
export const selectAllRestaurants = (state) => state.restaurants.list;
export const selectCurrentRestaurant = (state) => state.restaurants.currentRestaurant;
export const selectRestaurantListStatus = (state) => state.restaurants.listStatus;
export const selectRestaurantDetailStatus = (state) => state.restaurants.detailStatus;
export const selectRestaurantError = (state) => state.restaurants.error;
export const selectRestaurantFilters = (state) => state.restaurants.filters;
export const selectRestaurantPagination = (state) => state.restaurants.pagination;

// **Add the missing selectors:**

/** Featured Restaurants Selector */
export const selectFeaturedRestaurants = (state) => {
  return state.restaurants.list.filter((restaurant) => restaurant.isFeatured);
};

/** Filtered Restaurants Selector */
export const selectFilteredRestaurants = (state) => {
  const { list, filters } = state.restaurants;
  return list.filter((restaurant) => {
    let matches = true;
    const { cuisineType, priceRange, hasVRExperience } = filters;

    if (cuisineType && cuisineType !== 'All') {
      matches = matches && restaurant.cuisineType === cuisineType;
    }
    if (priceRange) {
      matches = matches && restaurant.priceRange === priceRange;
    }
    if (hasVRExperience !== null) {
      matches = matches && restaurant.isVRExperience === hasVRExperience;
    }

    return matches;
  });
};

export default restaurantSlice.reducer;
