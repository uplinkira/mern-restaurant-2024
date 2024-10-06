
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchRestaurants } from '../redux/slices/restaurantSlice';

const RestaurantList = () => {
  const dispatch = useDispatch();
  const { list: restaurants, status, error } = useSelector(state => state.restaurants);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchRestaurants());
    }
  }, [dispatch, status]);

  // Log the restaurant data to ensure _id exists
  console.log(restaurants);

  if (status === 'loading') return <div className="loading">Loading...</div>;
  if (status === 'failed') return <div className="error">Error: {error}</div>;

  return (
    <div className="restaurant-list">
      <h2>Featured Restaurants</h2>
      {restaurants.length === 0 ? (
        <p>No restaurants found.</p>
      ) : (
        <div className="card-grid">
          {restaurants.map(restaurant => (
            <div key={restaurant._id} className="card">
              <h3>{restaurant.name}</h3>
              <p>{restaurant.cuisineType}</p>
              <p>{restaurant.description.substring(0, 100)}...</p>
              <Link to={`/restaurant/${restaurant._id}`} className="btn">View Details</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RestaurantList;

