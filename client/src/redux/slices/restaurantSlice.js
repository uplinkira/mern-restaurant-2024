// client/src/redux/slices/restaurantSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import axiosInstance, { API_ENDPOINTS } from '../../utils/config';

// Async Thunks
export const fetchRestaurants = createAsyncThunk(
  'restaurants/fetchRestaurants',
  async ({ 
    page = 1, 
    limit = 12,
    sortBy = 'createdAt',
    order = 'desc',
    cuisineType,
    priceRange,
    isVRExperience,
    status = 'active'
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
          status
        }
      });
      
      // 新的错误处理逻辑
      if (!response.data.success) {
        return rejectWithValue(response.data);
      }
      
      return response.data;
    } catch (error) {
      // 增强错误处理
      if (error.response?.status === 404) {
        return rejectWithValue({
          message: 'No more restaurants found',
          noMore: true,
          meta: error.response.data.meta
        });
      }
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchRestaurantDetails = createAsyncThunk(
  'restaurants/fetchRestaurantDetails',
  async ({ 
    slug, 
    includeMenus = true, 
    includeDishes = true,
    menuStatus = 'active',
    dishStatus = 'active'
  }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.RESTAURANTS_DETAILS(slug), 
        {
          params: { 
            includeMenus, 
            includeDishes,
            menuStatus,
            dishStatus
          }
        }
      );

      if (!response.data.success) {
        return rejectWithValue(response.data);
      }

      return response.data.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return rejectWithValue({
          message: 'Restaurant not found',
          notFound: true
        });
      }

      return rejectWithValue(error.response?.data || { 
        message: error.message || 'Failed to fetch restaurant details'
      });
    }
  }
);

// 简化初始状态
const initialState = {
  list: [],
  currentRestaurant: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 12,
    totalItems: 0
  },
  listStatus: 'idle',
  detailStatus: 'idle',
  error: null,
  filters: {
    cuisineType: null,
    priceRange: null,
    isVRExperience: null,
    sortBy: 'createdAt',
    order: 'desc'
  },
  lastFetch: null,
  menuFilters: {
    category: null,
    status: 'active'
  },
  dishFilters: {
    isSignature: false,
    minPrice: null,
    maxPrice: null,
    allergens: []
  }
};

const restaurantSlice = createSlice({
  name: 'restaurants',
  initialState,
  reducers: {
    clearCurrentRestaurant: (state) => {
      state.currentRestaurant = null;
      state.error = null;
    },
    clearRestaurantList: (state) => {
      state.list = [];
      state.listStatus = 'idle';
      state.error = null;
      state.pagination = initialState.pagination;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      // 重置分页
      state.pagination.currentPage = 1;
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.currentPage = 1;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setMenuFilters: (state, action) => {
      state.menuFilters = { ...state.menuFilters, ...action.payload };
    },
    setDishFilters: (state, action) => {
      state.dishFilters = { ...state.dishFilters, ...action.payload };
    },
    clearMenuFilters: (state) => {
      state.menuFilters = initialState.menuFilters;
    },
    clearDishFilters: (state) => {
      state.dishFilters = initialState.dishFilters;
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
        const { data, meta } = action.payload;
        state.listStatus = 'succeeded';
        
        // 处理分页加载
        if (meta.page === 1) {
          state.list = data;
        } else {
          state.list = [...state.list, ...data];
        }

        state.pagination = {
          currentPage: meta.page,
          totalPages: meta.totalPages,
          itemsPerPage: meta.limit,
          totalItems: meta.total
        };
        
        state.lastFetch = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        // 处理"没有更多"的况
        if (action.payload?.noMore) {
          state.listStatus = 'noMore';
          state.pagination = {
            ...state.pagination,
            ...action.payload.meta
          };
        } else {
          state.listStatus = 'failed';
        }
        state.error = action.payload?.message;
      })
      .addCase(fetchRestaurantDetails.pending, (state) => {
        state.detailStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchRestaurantDetails.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.currentRestaurant = action.payload;
        if (action.payload.menuList?.length) {
          const menusByCategory = action.payload.menuList.reduce((acc, menu) => {
            if (!acc[menu.category]) {
              acc[menu.category] = [];
            }
            acc[menu.category].push(menu);
            return acc;
          }, {});
          state.currentRestaurant.menusByCategory = menusByCategory;
          state.currentRestaurant.menuCategories = Object.keys(menusByCategory);
        }
        state.error = null;
      })
      .addCase(fetchRestaurantDetails.rejected, (state, action) => {
        state.detailStatus = action.payload?.notFound ? 'notFound' : 'failed';
        state.error = action.payload?.message || 'Failed to fetch restaurant details';
        state.currentRestaurant = null;
      });
  }
});

export const {
  clearCurrentRestaurant,
  clearRestaurantList,
  setFilters,
  clearFilters,
  setPagination,
  setMenuFilters,
  setDishFilters,
  clearMenuFilters,
  clearDishFilters
} = restaurantSlice.actions;

// Selectors
const selectRestaurantsState = state => state.restaurants;

// Base Selectors
export const selectAllRestaurants = state => selectRestaurantsState(state).list;
export const selectCurrentRestaurant = state => selectRestaurantsState(state).currentRestaurant;
export const selectRestaurantListStatus = state => selectRestaurantsState(state).listStatus;
export const selectRestaurantDetailStatus = state => selectRestaurantsState(state).detailStatus;
export const selectRestaurantError = state => selectRestaurantsState(state).error;
export const selectRestaurantFilters = state => selectRestaurantsState(state).filters;
export const selectRestaurantPagination = state => selectRestaurantsState(state).pagination;
export const selectMenuFilters = state => selectRestaurantsState(state).menuFilters;
export const selectDishFilters = state => selectRestaurantsState(state).dishFilters;

// Menu Selectors
export const selectRestaurantMenus = createSelector(
  [selectCurrentRestaurant],
  restaurant => restaurant?.menuList || []
);

// Restaurant-specific Menu Selectors
export const selectMenusByRestaurantSlug = createSelector(
  [selectRestaurantMenus, (_, slug) => slug],
  (menus, slug) => menus.filter(menu => menu.restaurants.includes(slug))
);

export const selectMenuCategoriesByRestaurantSlug = createSelector(
  [selectMenusByRestaurantSlug],
  menus => {
    const categories = {};
    menus.forEach(menu => {
      if (!categories[menu.category]) {
        categories[menu.category] = [];
      }
      categories[menu.category].push(menu);
    });
    return categories;
  }
);

// Filtered Menu Selectors
export const selectFilteredMenus = createSelector(
  [selectRestaurantMenus, selectMenuFilters],
  (menus, filters) => {
    let filteredMenus = [...menus];
    
    if (filters.category) {
      filteredMenus = filteredMenus.filter(menu => menu.category === filters.category);
    }
    
    if (filters.status) {
      filteredMenus = filteredMenus.filter(menu => menu.status === filters.status);
    }
    
    return filteredMenus;
  }
);

// Restaurant List Selectors
export const selectFilteredRestaurants = createSelector(
  [selectAllRestaurants, selectRestaurantFilters],
  (restaurants, filters) => {
    if (!Array.isArray(restaurants)) return [];
    
    return restaurants.filter(restaurant => {
      let matches = true;
      const { cuisineType, priceRange, isVRExperience } = filters;

      if (cuisineType) matches = matches && restaurant.cuisineType === cuisineType;
      if (priceRange) matches = matches && restaurant.priceRange === priceRange;
      if (typeof isVRExperience === 'boolean') {
        matches = matches && restaurant.isVRExperience === isVRExperience;
      }

      return matches;
    });
  }
);

export const selectIsLastPage = createSelector(
  [selectRestaurantPagination],
  pagination => pagination.currentPage >= pagination.totalPages
);

export const selectHasMore = createSelector(
  [selectRestaurantListStatus, selectIsLastPage],
  (status, isLastPage) => status !== 'noMore' && !isLastPage
);

export default restaurantSlice.reducer;