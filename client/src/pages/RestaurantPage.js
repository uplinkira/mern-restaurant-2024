// client/src/pages/RestaurantPage.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import {
  fetchRestaurantDetails,
  selectCurrentRestaurant,
  selectRestaurantDetailStatus,
  selectRestaurantError,
  clearCurrentRestaurant
} from '../redux/slices/restaurantSlice';
import RestaurantDetails from '../features/restaurant/RestaurantDetails';
import RestaurantList from '../features/restaurant/RestaurantList';

const RestaurantPage = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const status = useSelector(selectRestaurantDetailStatus);
  const restaurant = useSelector(selectCurrentRestaurant);
  const error = useSelector(selectRestaurantError);

  useEffect(() => {
    if (slug) {
      dispatch(fetchRestaurantDetails({ slug }));
    }

    return () => {
      dispatch(clearCurrentRestaurant());
    };
  }, [dispatch, slug]);

  if (status === 'loading') {
    return <div className="loading">Loading...</div>;
  }

  if (status === 'failed') {
    return <div className="error">{error}</div>;
  }

  if (status === 'notFound' || !restaurant) {
    return <div className="not-found">Restaurant not found</div>;
  }

  return <RestaurantDetails restaurant={restaurant} />;
};

export default RestaurantPage;