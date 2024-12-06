// 
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import axiosInstance, { API_ENDPOINTS } from '../../utils/config';

// Cache management
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const isCacheValid = (timestamp) => {
  if (!timestamp) return false;
  return Date.now() - new Date(timestamp).getTime() < CACHE_DURATION;
};

// Optimized Async Thunks with cache handling
export const fetchMenus = createAsyncThunk(
  'menus/fetchMenus',
  async ({ 
    page = 1, 
    limit = 10,
    sortBy = 'order',
    order = 'asc',
    category,
    type,
    status = 'active',
    restaurantSlug,
    forceFetch = false
  } = {}, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { lastFetch, filters } = state.menus;
      
      // Check cache validity if not forced fetch
      if (!forceFetch && 
          isCacheValid(lastFetch) && 
          restaurantSlug === filters.restaurant) {
        return null; // Use cached data
      }

      const response = await axiosInstance.get(
        restaurantSlug ? 
          API_ENDPOINTS.RESTAURANT_MENU(restaurantSlug) : 
          API_ENDPOINTS.MENU, 
        {
          params: { 
            page, 
            limit, 
            sortBy,
            order,
            category,
            type,
            status
          }
        }
      );

      // Normalize the response data
      const normalized = {
        data: response.data.data,
        meta: {
          page: response.data.meta?.page || 1,
          totalPages: response.data.meta?.totalPages || 1,
          limit: response.data.meta?.limit || limit,
          total: response.data.meta?.total || response.data.data.length
        }
      };

      return normalized;
    } catch (error) {
      console.error('Menu fetch error:', error);
      return rejectWithValue({
        message: error.response?.data?.message || error.message,
        statusCode: error.response?.status,
        timestamp: new Date().toISOString()
      });
    }
  }
);

export const fetchMenuDetails = createAsyncThunk(
  'menus/fetchMenuDetails',
  async ({ slug, includeDishes = true }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MENU(slug), {
        params: { includeDishes }
      });

      return {
        data: response.data.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Menu details fetch error:', error);
      return rejectWithValue({
        message: error.response?.data?.message || error.message,
        statusCode: error.response?.status,
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Normalized initial state
const initialState = {
  entities: {}, // Normalized menu data
  ids: [], // Menu IDs for order preservation
  currentMenuId: null,
  categoryMenus: {}, // Menus grouped by category
  restaurantMenus: {}, // Menus grouped by restaurant
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
    category: null,
    type: null,
    restaurant: null,
    status: 'active',
    sortBy: 'order',
    order: 'asc'
  },
  cache: {
    timestamp: null,
    lastRestaurant: null
  }
};

const menuSlice = createSlice({
  name: 'menus',
  initialState,
  reducers: {
    clearCurrentMenu: (state) => {
      state.currentMenuId = null;
      state.status.detail = 'idle';
      state.error.detail = null;
    },
    clearMenuList: (state) => {
      state.entities = {};
      state.ids = [];
      state.status.list = 'idle';
      state.error.list = null;
      state.cache.timestamp = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    invalidateCache: (state) => {
      state.cache.timestamp = null;
    },
    updateMenuDishes: (state, action) => {
      const { menuSlug, dishes } = action.payload;
      if (state.entities[menuSlug]) {
        state.entities[menuSlug].dishes = dishes;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchMenus
      .addCase(fetchMenus.pending, (state) => {
        state.status.list = 'loading';
        state.error.list = null;
      })
      .addCase(fetchMenus.fulfilled, (state, action) => {
        if (!action.payload) {
          // Using cached data
          state.status.list = 'succeeded';
          return;
        }

        state.status.list = 'succeeded';
        
        // Normalize data
        const { data, meta } = action.payload;
        state.entities = {};
        state.ids = [];
        state.categoryMenus = {};
        
        data.forEach(menu => {
          state.entities[menu.slug] = menu;
          state.ids.push(menu.slug);
          
          // Group by category
          if (!state.categoryMenus[menu.category]) {
            state.categoryMenus[menu.category] = [];
          }
          state.categoryMenus[menu.category].push(menu.slug);

          // Group by restaurant
          menu.restaurants.forEach(restaurantSlug => {
            if (!state.restaurantMenus[restaurantSlug]) {
              state.restaurantMenus[restaurantSlug] = [];
            }
            if (!state.restaurantMenus[restaurantSlug].includes(menu.slug)) {
              state.restaurantMenus[restaurantSlug].push(menu.slug);
            }
          });
        });

        state.pagination = meta;
        state.cache.timestamp = new Date().toISOString();
        state.cache.lastRestaurant = action.meta.arg.restaurantSlug;
      })
      .addCase(fetchMenus.rejected, (state, action) => {
        state.status.list = 'failed';
        state.error.list = action.payload;
      })

      // Handle fetchMenuDetails
      .addCase(fetchMenuDetails.pending, (state) => {
        state.status.detail = 'loading';
        state.error.detail = null;
      })
      .addCase(fetchMenuDetails.fulfilled, (state, action) => {
        const { data } = action.payload;
        state.status.detail = 'succeeded';
        state.entities[data.slug] = data;
        state.currentMenuId = data.slug;
        if (!state.ids.includes(data.slug)) {
          state.ids.push(data.slug);
        }
      })
      .addCase(fetchMenuDetails.rejected, (state, action) => {
        state.status.detail = 'failed';
        state.error.detail = action.payload;
      });
  }
});

export const {
  clearCurrentMenu,
  clearMenuList,
  setFilters,
  clearFilters,
  invalidateCache,
  updateMenuDishes
} = menuSlice.actions;

// Optimized selectors with memoization
export const selectMenuEntities = state => state.menus.entities;
export const selectMenuIds = state => state.menus.ids;

export const selectAllMenus = createSelector(
  [selectMenuEntities, selectMenuIds],
  (entities, ids) => ids.map(id => entities[id])
);

export const selectCurrentMenu = createSelector(
  [selectMenuEntities, state => state.menus.currentMenuId],
  (entities, currentId) => currentId ? entities[currentId] : null
);

export const selectMenusByCategory = category => createSelector(
  [selectMenuEntities, state => state.menus.categoryMenus[category]],
  (entities, menuIds) => menuIds?.map(id => entities[id]) || []
);

export const selectMenusByRestaurant = restaurantSlug => createSelector(
  [selectMenuEntities, state => state.menus.restaurantMenus[restaurantSlug]],
  (entities, menuIds) => menuIds?.map(id => entities[id]) || []
);

// Status and error selectors
export const selectMenuStatuses = state => state.menus.status;
export const selectMenuErrors = state => state.menus.error;
export const selectMenuFilters = state => state.menus.filters;
export const selectMenuPagination = state => state.menus.pagination;
export const selectMenuCache = state => state.menus.cache;

// Enhanced filtered selector with memoization
export const selectFilteredMenus = createSelector(
  [selectAllMenus, selectMenuFilters],
  (menus, filters) => {
    return menus.filter(menu => {
      const { category, type, restaurant, status } = filters;
      return (!category || menu.category === category) &&
             (!type || menu.type === type) &&
             (!restaurant || menu.restaurants.includes(restaurant)) &&
             (!status || menu.status === status);
    });
  }
);

export default menuSlice.reducer;