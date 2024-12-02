// client/src/features/restaurant/RestaurantList.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchRestaurants } from '../../redux/slices/restaurantSlice';
import '../../App.css';

const RestaurantList = () => {
  const dispatch = useDispatch();
  const { 
    list: restaurants, 
    status, 
    error 
  } = useSelector((state) => state.restaurants);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchRestaurants());
    }
  }, [dispatch, status]);

  if (status === 'loading') {
    return <div className="loading">Loading restaurants...</div>;
  }

  if (status === 'failed') {
    return <div className="error">Error: {error}</div>;
  }

  if (!restaurants || restaurants.length === 0) {
    return <div className="no-data">No restaurants available</div>;
  }

  return (
    <div className="restaurant-list">
      <h2>Explore Our Restaurants</h2>
      <div className="restaurant-grid">
        {restaurants.map((restaurant) => (
          <div key={restaurant.slug} className="restaurant-card">
            <div className="card-content">
              <h3>{restaurant.name}</h3>
              <div className="restaurant-info">
                <span className="cuisine-type">{restaurant.cuisineType}</span>
                {restaurant.isVRExperience && (
                  <span className="vr-badge">VR Experience</span>
                )}
              </div>
              <p className="description">
                {restaurant.description?.substring(0, 150)}
                {restaurant.description?.length > 150 ? '...' : ''}
              </p>
              <div className="specialties">
                {restaurant.specialties?.slice(0, 3).map((specialty, index) => (
                  <span key={index} className="specialty-tag">
                    {specialty}
                  </span>
                ))}
              </div>
              <div className="restaurant-footer">
                <div className="hours">
                  {restaurant.openingHours?.Monday !== 'Closed' ? (
                    <span>Open Today</span>
                  ) : (
                    <span>Closed Today</span>
                  )}
                </div>
                <div className="capacity">
                  {restaurant.maxCapacity && (
                    <span>Up to {restaurant.maxCapacity} guests</span>
                  )}
                </div>
              </div>
              <Link 
                to={`/restaurant/${restaurant.slug}`} 
                className="view-details-btn"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RestaurantList;