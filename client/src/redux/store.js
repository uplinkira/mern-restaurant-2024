import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import restaurantReducer from './slices/restaurantSlice';
import dishReducer from './slices/dishSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    restaurants: restaurantReducer,
    dishes: dishReducer,
  },
});

export default store;
