import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import restaurantReducer from './slices/restaurantSlice';
import dishReducer from './slices/dishSlice';
import userReducer from './slices/userSlice';  // Import user reducer
import cartReducer from './slices/cartSlice';  // Import cart reducer

const store = configureStore({
  reducer: {
    auth: authReducer,
    restaurants: restaurantReducer,
    dishes: dishReducer,
    user: userReducer, 
    cart: cartReducer,
  },
});

export default store;
