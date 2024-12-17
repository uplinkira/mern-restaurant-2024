// client/src/pages/RestaurantPage.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import {
  fetchRestaurantDetails,
  selectCurrentRestaurant,
  selectRestaurantDetailStatus,
  selectRestaurantError
} from '../redux/slices/restaurantSlice';
import RestaurantDetails from '../features/restaurant/RestaurantDetails';

const RestaurantPage = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const restaurant = useSelector(selectCurrentRestaurant);
  const status = useSelector(selectRestaurantDetailStatus);
  const error = useSelector(selectRestaurantError);

  useEffect(() => {
    if (slug) {
      dispatch(fetchRestaurantDetails({ 
        slug, 
        includeMenus: true, 
        includeDishes: true 
      }));
    }
  }, [dispatch, slug]);

  if (status === 'loading') {
    return <div className="loading">Loading restaurant details...</div>;
  }

  if (status === 'failed') {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <Link to="/restaurants">Return to Restaurants</Link>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="error">
        <p>Restaurant not found</p>
        <Link to="/restaurants">Return to Restaurants</Link>
      </div>
    );
  }

  return <RestaurantDetails restaurant={restaurant} />;
};

export default RestaurantPage;