import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import axiosInstance, { API_ENDPOINTS } from '../../utils/config';

// Cache management
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const isCacheValid = (timestamp) => {
  if (!timestamp) return false;
  return Date.now() - new Date(timestamp).getTime() < CACHE_DURATION;
};

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
    radius,
    forceFetch = false
  } = {}, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { cache, filters } = state.restaurants;

      // 检查缓存
      if (!forceFetch && 
          isCacheValid(cache.timestamp) && 
          JSON.stringify(filters) === JSON.stringify({
            cuisineType, priceRange, isVRExperience, status, location, radius
          })) {
        return null;
      }

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

      if (!response.data?.success) {
        throw new Error('Invalid server response');
      }

      return {
        data: response.data.data,
        meta: response.data.meta || {
          page,
          totalPages: Math.ceil(response.data.data.length / limit),
          limit,
          total: response.data.data.length
        }
      };
    } catch (error) {
      console.error('Restaurant fetch error:', error);
      return rejectWithValue({
        message: error.response?.data?.message || error.message,
        status: error.response?.status || 500
      });
    }
  }
);

export const fetchRestaurantDetails = createAsyncThunk(
  'restaurants/fetchRestaurantDetails',
  async ({ slug }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { status: { detail: status }, entities, cache } = state.restaurants;
      const currentRestaurant = entities[slug];

      // 避免重复请求和使用缓存
      if (status === 'loading' || 
          (currentRestaurant && isCacheValid(cache.timestamp) && !cache.invalidated)) {
        return null;
      }

      const response = await axiosInstance.get(
        API_ENDPOINTS.RESTAURANT_DETAILS(slug),
        {
          params: {
            includeMenus: true,
            includeDishes: true
          }
        }
      );

      if (!response.data?.success || !response.data?.data) {
        throw new Error('Invalid server response');
      }

      return {
        data: {
          ...response.data.data,
          menuDetails: response.data.data?.menuDetails || [],
          dishes: response.data.data?.dishes || []
        }
      };
    } catch (error) {
      console.error('Restaurant details fetch error:', {
        error,
        slug,
        timestamp: new Date().toISOString()
      });
      return rejectWithValue({
        message: error.response?.data?.message || error.message,
        status: error.response?.status || 500
      });
    }
  }
);

// Initial state
const initialState = {
  entities: {},
  ids: [],
  currentRestaurantId: null,
  categorizedRestaurants: {
    featured: [],
    vr: [],
    nearby: []
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10,
    totalItems: 0
  },
  status: {
    list: 'idle',
    detail: 'idle',
    search: 'idle'
  },
  error: {
    list: null,
    detail: null,
    search: null
  },
  filters: {
    cuisineType: null,
    priceRange: null,
    isVRExperience: null,
    isFeatured: null,
    radius: 5000,
    location: null,
    sortBy: 'rating',
    order: 'desc'
  },
  cache: {
    timestamp: null,
    invalidated: false
  }
};

// Slice
const restaurantSlice = createSlice({
  name: 'restaurants',
  initialState,
  reducers: {
    clearCurrentRestaurant: (state) => {
      state.currentRestaurantId = null;
      state.status.detail = 'idle';
      state.error.detail = null;
    },
    clearRestaurantList: (state) => {
      state.entities = {};
      state.ids = [];
      state.status.list = 'idle';
      state.error.list = null;
      state.cache.timestamp = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.cache.invalidated = true;
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.cache.invalidated = true;
    },
    invalidateCache: (state) => {
      state.cache.timestamp = null;
      state.cache.invalidated = true;
    },
    updateRestaurantMenus: (state, action) => {
      const { restaurantSlug, menus } = action.payload;
      if (state.entities[restaurantSlug]) {
        state.entities[restaurantSlug].menuDetails = menus;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchRestaurants
      .addCase(fetchRestaurants.pending, (state) => {
        state.status.list = 'loading';
        state.error.list = null;
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        if (!action.payload) {
          state.status.list = 'succeeded';
          return;
        }

        const { data, meta } = action.payload;
        state.status.list = 'succeeded';
        
        // Normalize data
        data.forEach(restaurant => {
          state.entities[restaurant.slug] = restaurant;
          if (!state.ids.includes(restaurant.slug)) {
            state.ids.push(restaurant.slug);
          }
        });

        // Update categories
        state.categorizedRestaurants = {
          featured: data.filter(r => r.isFeatured).map(r => r.slug),
          vr: data.filter(r => r.isVRExperience).map(r => r.slug),
          nearby: []
        };

        state.pagination = meta;
        state.cache = {
          timestamp: new Date().toISOString(),
          invalidated: false
        };
        state.error.list = null;
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.status.list = 'failed';
        state.error.list = action.payload;
      })

      // Handle fetchRestaurantDetails
      .addCase(fetchRestaurantDetails.pending, (state, action) => {
        if (!state.currentRestaurantId || 
            state.currentRestaurantId !== action.meta.arg.slug) {
          state.status.detail = 'loading';
          state.error.detail = null;
        }
      })
      .addCase(fetchRestaurantDetails.fulfilled, (state, action) => {
        if (!action.payload) return;

        const { data } = action.payload;
        state.status.detail = 'succeeded';
        state.entities[data.slug] = data;
        state.currentRestaurantId = data.slug;
        if (!state.ids.includes(data.slug)) {
          state.ids.push(data.slug);
        }
        state.cache.timestamp = new Date().toISOString();
        state.cache.invalidated = false;
        state.error.detail = null;
      })
      .addCase(fetchRestaurantDetails.rejected, (state, action) => {
        state.status.detail = 'failed';
        state.error.detail = action.payload;
        state.cache.invalidated = true;
      });
  }
});

// Actions
export const {
  clearCurrentRestaurant,
  clearRestaurantList,
  setFilters,
  clearFilters,
  invalidateCache,
  updateRestaurantMenus
} = restaurantSlice.actions;

// Base Selectors
export const selectRestaurantEntities = state => state.restaurants.entities;
export const selectRestaurantIds = state => state.restaurants.ids;
export const selectRestaurantStatuses = state => state.restaurants.status;
export const selectRestaurantErrors = state => state.restaurants.error;
export const selectRestaurantFilters = state => state.restaurants.filters;
export const selectRestaurantPagination = state => state.restaurants.pagination;
export const selectRestaurantCache = state => state.restaurants.cache;

// Memoized Selectors
export const selectCurrentRestaurant = createSelector(
  [selectRestaurantEntities, state => state.restaurants.currentRestaurantId],
  (entities, currentId) => currentId ? {
    ...entities[currentId],
    menuDetails: entities[currentId]?.menuDetails || [],
    dishes: entities[currentId]?.dishes || []
  } : null
);

export const selectAllRestaurants = createSelector(
  [selectRestaurantEntities, selectRestaurantIds],
  (entities, ids) => ids.map(id => entities[id])
);

export const selectRestaurantMenus = createSelector(
  [selectCurrentRestaurant],
  (restaurant) => restaurant?.menuDetails || []
);

export const selectCategorizedRestaurants = createSelector(
  [selectRestaurantEntities, state => state.restaurants.categorizedRestaurants],
  (entities, categories) => ({
    featured: categories.featured.map(id => entities[id]).filter(Boolean),
    vr: categories.vr.map(id => entities[id]).filter(Boolean),
    nearby: categories.nearby.map(id => entities[id]).filter(Boolean)
  })
);

export const selectFilteredRestaurants = createSelector(
  [selectAllRestaurants, selectRestaurantFilters],
  (restaurants, filters) => {
    return restaurants.filter(restaurant => {
      if (!restaurant) return false;
      
      const {
        cuisineType,
        priceRange,
        isVRExperience,
        isFeatured
      } = filters;

      return (!cuisineType || restaurant.cuisineType === cuisineType) &&
             (!priceRange || restaurant.priceRange === priceRange) &&
             (typeof isVRExperience !== 'boolean' || 
              restaurant.isVRExperience === isVRExperience) &&
             (typeof isFeatured !== 'boolean' || 
              restaurant.isFeatured === isFeatured);
    });
  }
);

export default restaurantSlice.reducer;