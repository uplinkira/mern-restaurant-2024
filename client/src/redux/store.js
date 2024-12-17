// client/src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import restaurantReducer from './slices/restaurantSlice';
import menuReducer from './slices/menuSlice';
import dishReducer from './slices/dishSlice';
import userReducer from './slices/userSlice';
import cartReducer from './slices/cartSlice';
import searchReducer from './slices/searchSlice';
import productReducer from './slices/productSlice';
import orderReducer from './slices/orderSlice';

// Configure the Redux store
const store = configureStore({
  reducer: {
    auth: authReducer,         // 处理认证状态
    restaurants: restaurantReducer, // 处理餐厅数据
    menus: menuReducer,        // 处理菜单数据
    dishes: dishReducer,       // 处理菜品数据
    products: productReducer,  // 处理产品数据
    orders: orderReducer,      // 处理订单数据
    user: userReducer,         // 处理用户档案数据
    cart: cartReducer,         // 处理购物车数据
    search: searchReducer,     // 处理搜索结果
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略特定 action 和 path 的序列化检查
        ignoredActions: ['persist/PERSIST'],
        ignoredPaths: ['payload.timestamp', 'payload.lastUpdated'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production', // 在非生产环境启用 Redux DevTools
});

export default store;
