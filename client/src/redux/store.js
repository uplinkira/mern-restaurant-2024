import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import restaurantReducer from './slices/restaurantSlice';
import dishReducer from './slices/dishSlice';
import userReducer from './slices/userSlice';
import cartReducer from './slices/cartSlice';

// Configure the Redux store
const store = configureStore({
  reducer: {
    auth: authReducer, // Handles authentication state
    restaurants: restaurantReducer, // Handles restaurant data
    dishes: dishReducer, // Handles dish-related data
    user: userReducer, // Handles user profile data
    cart: cartReducer, // Handles shopping cart data
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Allow non-serializable values such as Dates or Maps
    }),
  devTools: process.env.NODE_ENV !== 'production', // Enable Redux DevTools in non-production environments
});

export default store;
