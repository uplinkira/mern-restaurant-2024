import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchRestaurants } from '../redux/slices/restaurantSlice';

const RestaurantList = () => {
  const dispatch = useDispatch();
  const { list: restaurants, status, error } = useSelector((state) => state.restaurants);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchRestaurants());
    }
  }, [dispatch, status]);

  // Loading state
  if (status === 'loading') {
    return <div className="loading">Loading...</div>;
  }

  // Error state
  if (status === 'failed') {
    return <div className="error">Error: {error ? error : 'Failed to load restaurants'}</div>;
  }

  // Display message if no restaurants are found
  if (status === 'succeeded' && restaurants.length === 0) {
    return <p>No restaurants found.</p>;
  }

  return (
    <div className="restaurant-list">
      <h2>Featured Restaurants</h2>
      <div className="card-grid">
        {restaurants.map((restaurant) => (
          <div key={restaurant._id} className="card">
            <h3>{restaurant.name}</h3>
            <p>{restaurant.cuisineType}</p>
            <p>{restaurant.description.substring(0, 100)}...</p>
            <Link to={`/restaurant/${restaurant._id}`} className="btn">
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RestaurantList;
