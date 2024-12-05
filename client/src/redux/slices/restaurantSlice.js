// client/src/redux/slices/restaurantSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import axiosInstance, { API_ENDPOINTS } from '../../utils/config';

// Async Thunks
export const fetchRestaurants = createAsyncThunk(
  'restaurants/fetchRestaurants',
  async ({ 
    page = 1, 
    limit = 10,
    sortBy = 'createdAt',
    order = 'desc',
    cuisineType,
    priceRange,
    isVRExperience,
    status = 'active',
    location,
    radius
  } = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.RESTAURANTS, {
        params: { 
          page, 
          limit, 
          sortBy,
          order,
          cuisineType,
          priceRange,
          isVRExperience,
          status,
          ...(location && { location: location.join(',') }),
          ...(radius && { radius })
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchRestaurantDetails = createAsyncThunk(
  'restaurants/fetchRestaurantDetails',
  async ({ slug, includeMenus = true, includeDishes = true }, { rejectWithValue }) => {
    try {
      const [restaurantResponse, menuResponse] = await Promise.all([
        axiosInstance.get(API_ENDPOINTS.RESTAURANT_DETAILS(slug)),
        includeMenus ? axiosInstance.get(API_ENDPOINTS.RESTAURANT_MENU(slug), {
          params: { includeDishes }
        }) : Promise.resolve({ data: { data: [] } })
      ]);

      const restaurant = restaurantResponse.data.data;
      const menus = menuResponse.data.data;

      return {
        ...restaurant,
        menuDetails: menus
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const searchRestaurants = createAsyncThunk(
  'restaurants/searchRestaurants',
  async ({ 
    q, 
    cuisineType,
    priceRange,
    isVRExperience,
    location,
    radius,
    page = 1,
    limit = 10
  }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.SEARCH_RESTAURANTS, {
        params: {
          q,
          cuisineType,
          priceRange,
          isVRExperience,
          location: location?.join(','),
          radius,
          page,
          limit
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
  currentRestaurant: null,
  nearbyRestaurants: [],
  featuredRestaurants: [], // 新增
  pagination: {
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10,
    totalItems: 0
  },
  listStatus: 'idle',
  detailStatus: 'idle',
  searchStatus: 'idle',
  error: null,
  filters: {
    cuisineType: null,
    priceRange: null,
    isVRExperience: null,
    isFeatured: null, // 新增
    radius: 5000,
    location: null,
    sortBy: 'rating',
    order: 'desc'
  },
  lastFetch: null
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
    setLocation: (state, action) => {
      state.filters.location = action.payload;
    },
    setSorting: (state, action) => {
      const { sortBy, order } = action.payload;
      state.filters.sortBy = sortBy;
      state.filters.order = order;
    },
    updateRestaurantMenus: (state, action) => {
      const { restaurantSlug, menus } = action.payload;
      if (state.currentRestaurant?.slug === restaurantSlug) {
        state.currentRestaurant.menuDetails = menus;
      }
    }
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
        state.list = Array.isArray(action.payload?.data) ? action.payload.data : [];
        state.featuredRestaurants = Array.isArray(action.payload?.data) 
          ? action.payload.data.filter(r => r.isFeatured) 
          : [];
        state.pagination = {
          currentPage: action.payload?.meta?.page || 1,
          totalPages: action.payload?.meta?.totalPages || 1,
          itemsPerPage: action.payload?.meta?.limit || 10,
          totalItems: action.payload?.meta?.total || 0
        };
        state.lastFetch = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.error = action.payload?.message || 'Failed to fetch restaurants';
      })

      // Handle fetchRestaurantDetails
      .addCase(fetchRestaurantDetails.pending, (state) => {
        state.detailStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchRestaurantDetails.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.currentRestaurant = action.payload;
        state.error = null;
      })
      .addCase(fetchRestaurantDetails.rejected, (state, action) => {
        state.detailStatus = 'failed';
        state.error = action.payload?.message || 'Failed to fetch restaurant details';
      })

      // Handle searchRestaurants
      .addCase(searchRestaurants.pending, (state) => {
        state.searchStatus = 'loading';
        state.error = null;
      })
      .addCase(searchRestaurants.fulfilled, (state, action) => {
        state.searchStatus = 'succeeded';
        state.list = action.payload.data;
        state.pagination = {
          currentPage: action.payload.meta.page,
          totalPages: action.payload.meta.totalPages,
          itemsPerPage: action.payload.meta.limit,
          totalItems: action.payload.meta.total
        };
      })
      .addCase(searchRestaurants.rejected, (state, action) => {
        state.searchStatus = 'failed';
        state.error = action.payload?.message || 'Search failed';
      });
  }
});

export const {
  clearCurrentRestaurant,
  clearRestaurantList,
  setFilters,
  clearFilters,
  setPagination,
  setLocation,
  setSorting,
  updateRestaurantMenus
} = restaurantSlice.actions;

// Base Selectors
export const selectAllRestaurants = (state) => 
  Array.isArray(state.restaurants?.list) ? state.restaurants.list : [];
export const selectCurrentRestaurant = (state) => state.restaurants.currentRestaurant;
export const selectRestaurantListStatus = (state) => state.restaurants.listStatus;
export const selectRestaurantDetailStatus = (state) => state.restaurants.detailStatus;
export const selectRestaurantSearchStatus = (state) => state.restaurants.searchStatus;
export const selectRestaurantError = (state) => state.restaurants.error;
export const selectRestaurantFilters = (state) => state.restaurants.filters;
export const selectRestaurantPagination = (state) => state.restaurants.pagination;
export const selectLastFetch = (state) => state.restaurants.lastFetch;

// Enhanced Selectors
export const selectRestaurantMenus = (state) => 
  state.restaurants.currentRestaurant?.menuDetails || [];

export const selectRestaurantDishes = (state) => 
  state.restaurants.currentRestaurant?.dishDetails || [];

export const selectVRRestaurants = (state) => 
  Array.isArray(state.restaurants?.list) 
    ? state.restaurants.list.filter(r => r?.isVRExperience)
    : [];

export const selectFeaturedRestaurants = (state) => 
  Array.isArray(state.restaurants?.featuredRestaurants) 
    ? state.restaurants.featuredRestaurants 
    : [];

export const selectRestaurantsByPriceRange = (priceRange) => (state) =>
  Array.isArray(state.restaurants?.list) 
    ? state.restaurants.list.filter(r => r?.priceRange === priceRange)
    : [];

export const selectRestaurantsByCuisine = (cuisineType) => (state) =>
  Array.isArray(state.restaurants?.list)
    ? state.restaurants.list.filter(r => r?.cuisineType === cuisineType)
    : [];

export const selectFeaturedAndVRRestaurants = createSelector(
  [selectFeaturedRestaurants, selectVRRestaurants],
  (featured, vr) => ({
    featured,
    vr,
    combined: featured.filter(r => r.isVRExperience)
  })
);

export const selectFilteredRestaurants = createSelector(
  [selectAllRestaurants, selectRestaurantFilters],
  (restaurants, filters) => {
    if (!Array.isArray(restaurants)) return [];
    
    return restaurants.filter(restaurant => {
      if (!restaurant) return false;
      
      let matches = true;
      const {
        cuisineType,
        priceRange,
        isVRExperience,
        isFeatured
      } = filters || {};

      if (cuisineType) {
        matches = matches && restaurant.cuisineType === cuisineType;
      }
      if (priceRange) {
        matches = matches && restaurant.priceRange === priceRange;
      }
      if (typeof isVRExperience === 'boolean') {
        matches = matches && restaurant.isVRExperience === isVRExperience;
      }
      if (typeof isFeatured === 'boolean') {
        matches = matches && restaurant.isFeatured === isFeatured;
      }

      return matches;
    });
  }
);

export default restaurantSlice.reducer;