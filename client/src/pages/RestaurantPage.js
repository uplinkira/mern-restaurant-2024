// client/src/pages/RestaurantPage.js

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchRestaurantDetails,
  selectCurrentRestaurant,
  selectRestaurantDetailStatus,
  selectRestaurantError,
} from '../redux/slices/restaurantSlice';
import {
  fetchDishesByRestaurant,
  selectAllDishes,
  selectDishStatus,
  selectDishError,
} from '../redux/slices/dishSlice';
import RestaurantDetails from '../features/restaurant/RestaurantDetails';
import '../App.css';

const RestaurantPage = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentRestaurant = useSelector(selectCurrentRestaurant);
  const restaurantStatus = useSelector(selectRestaurantDetailStatus);
  const restaurantError = useSelector(selectRestaurantError);

  const dishes = useSelector(selectAllDishes);
  const dishStatus = useSelector(selectDishStatus);
  const dishError = useSelector(selectDishError);

  useEffect(() => {
    if (slug) {
      dispatch(fetchRestaurantDetails(slug));
      dispatch(fetchDishesByRestaurant(slug));
    }
  }, [dispatch, slug]);

  const isLoading = restaurantStatus === 'loading' || dishStatus === 'loading';
  const hasError = restaurantError || dishError;

  if (isLoading) {
    return (
      <div className="loading-container" role="status">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading restaurant information...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="error-container" role="alert">
        <h2>Unable to Load Restaurant</h2>
        <p className="error-message">
          {restaurantError || dishError}
        </p>
        <button
          onClick={() => navigate('/restaurants')}
          className="back-button"
        >
          Return to Restaurants
        </button>
      </div>
    );
  }

  if (!currentRestaurant) {
    return (
      <div className="not-found-container" role="alert">
        <h2>Restaurant Not Found</h2>
        <p>The restaurant you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/restaurants')}
          className="back-button"
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="restaurant-page">
      <div className="restaurant-page-content">
        <RestaurantDetails
          restaurant={currentRestaurant}
          dishes={dishes}
        />
      </div>
    </div>
  );
};

export default RestaurantPage;
