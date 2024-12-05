// client/src/redux/slices/menuSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import axiosInstance, { API_ENDPOINTS } from '../../utils/config';

// Async Thunks
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
    restaurantSlug
  } = {}, { rejectWithValue }) => {
    try {
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
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
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
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const searchMenus = createAsyncThunk(
  'menus/searchMenus',
  async ({ 
    q, 
    category,
    type,
    restaurant,
    status = 'active',
    page = 1,
    limit = 10
  }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.SEARCH_MENUS, {
        params: {
          q,
          category,
          type,
          restaurant,
          status,
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
  currentMenu: null,
  vrMenus: [],
  seasonalMenus: [],
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
    category: null,
    type: null,
    restaurant: null,
    status: 'active',
    sortBy: 'order',
    order: 'asc'
  },
  lastFetch: null
};

const menuSlice = createSlice({
  name: 'menus',
  initialState,
  reducers: {
    clearCurrentMenu: (state) => {
      state.currentMenu = null;
      state.detailStatus = 'idle';
      state.error = null;
    },
    clearMenuList: (state) => {
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
    setSorting: (state, action) => {
      const { sortBy, order } = action.payload;
      state.filters.sortBy = sortBy;
      state.filters.order = order;
    },
    updateMenuDishes: (state, action) => {
      const { menuSlug, dishes } = action.payload;
      if (state.currentMenu?.slug === menuSlug) {
        state.currentMenu.dishes = dishes;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchMenus
      .addCase(fetchMenus.pending, (state) => {
        state.listStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchMenus.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        
        // 检查返回的数据结构
        if (Array.isArray(action.payload)) {
          // 如果直接返回数组
          state.list = action.payload;
        } else if (action.payload.data) {
          // 如果是包装在data字段中
          state.list = action.payload.data;
        }

        // 安全地更新分页信息
        if (action.payload.meta) {
          state.pagination = {
            currentPage: action.payload.meta.page || 1,
            totalPages: action.payload.meta.totalPages || 1,
            itemsPerPage: action.payload.meta.limit || 10,
            totalItems: action.payload.meta.total || 0
          };
        }

        state.lastFetch = new Date().toISOString();
        state.error = null;

        // 安全地过滤特殊菜单
        state.vrMenus = state.list.filter(menu => menu.isVREnabled);
        state.seasonalMenus = state.list.filter(menu => menu.type === 'seasonal');
      })
      .addCase(fetchMenus.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.error = action.payload?.message || 'Failed to fetch menus';
      })

      // Handle fetchMenuDetails
      .addCase(fetchMenuDetails.pending, (state) => {
        state.detailStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchMenuDetails.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.currentMenu = action.payload.data;
        state.error = null;
      })
      .addCase(fetchMenuDetails.rejected, (state, action) => {
        state.detailStatus = 'failed';
        state.error = action.payload?.message || 'Failed to fetch menu details';
      })

      // Handle searchMenus
      .addCase(searchMenus.pending, (state) => {
        state.searchStatus = 'loading';
        state.error = null;
      })
      .addCase(searchMenus.fulfilled, (state, action) => {
        state.searchStatus = 'succeeded';
        state.list = action.payload.data;
        state.pagination = {
          currentPage: action.payload.meta.page,
          totalPages: action.payload.meta.totalPages,
          itemsPerPage: action.payload.meta.limit,
          totalItems: action.payload.meta.total
        };
      })
      .addCase(searchMenus.rejected, (state, action) => {
        state.searchStatus = 'failed';
        state.error = action.payload?.message || 'Search failed';
      });
  }
});

// Actions
export const {
  clearCurrentMenu,
  clearMenuList,
  setFilters,
  clearFilters,
  setPagination,
  setSorting,
  updateMenuDishes
} = menuSlice.actions;

// Base Selectors
export const selectAllMenus = (state) => state.menus.list;
export const selectCurrentMenu = (state) => state.menus.currentMenu;
export const selectMenuListStatus = (state) => state.menus.listStatus;
export const selectMenuDetailStatus = (state) => state.menus.detailStatus;
export const selectMenuSearchStatus = (state) => state.menus.searchStatus;
export const selectMenuError = (state) => state.menus.error;
export const selectMenuFilters = (state) => state.menus.filters;
export const selectMenuPagination = (state) => state.menus.pagination;
export const selectLastFetch = (state) => state.menus.lastFetch;

// Enhanced Selectors
export const selectVRMenus = (state) => state.menus.vrMenus;
export const selectSeasonalMenus = (state) => state.menus.seasonalMenus;

export const selectMenusByCategory = (category) => (state) =>
  state.menus.list.filter(menu => menu.category === category);

export const selectMenusByRestaurant = (restaurantSlug) => (state) =>
  state.menus.list.filter(menu => menu.restaurants.includes(restaurantSlug));

export const selectFilteredMenus = createSelector(
  [selectAllMenus, selectMenuFilters],
  (menus, filters) => {
    return menus.filter(menu => {
      let matches = true;
      const {
        category,
        type,
        restaurant,
        status
      } = filters;

      if (category) {
        matches = matches && menu.category === category;
      }
      if (type) {
        matches = matches && menu.type === type;
      }
      if (restaurant) {
        matches = matches && menu.restaurants.includes(restaurant);
      }
      if (status) {
        matches = matches && menu.status === status;
      }

      return matches;
    });
  }
);

export default menuSlice.reducer;