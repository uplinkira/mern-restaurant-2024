// client/src/features/restaurant/RestaurantDetails.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import {
  fetchRestaurantDetails,
  selectCurrentRestaurant,
  selectRestaurantDetailStatus,
  selectRestaurantError
} from '../../redux/slices/restaurantSlice';
import MenuSection from './MenuSection';
import '../../App.css';

const RestaurantDetails = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  
  const restaurant = useSelector(selectCurrentRestaurant);
  const status = useSelector(selectRestaurantDetailStatus);
  const error = useSelector(selectRestaurantError);

  useEffect(() => {
    let mounted = true;

    if (slug && status === 'idle') {
      dispatch(fetchRestaurantDetails({ 
        slug, 
        includeMenus: true, 
        includeDishes: true 
      }));
    }

    return () => {
      mounted = false;
    };
  }, [dispatch, slug, status]);

  const handleRetry = () => {
    if (slug) {
      dispatch(fetchRestaurantDetails({ 
        slug, 
        includeMenus: true, 
        includeDishes: true 
      }));
    }
  };

  if (status === 'loading') {
    return <div className="loading" role="alert">Loading restaurant details...</div>;
  }

  if (status === 'failed') {
    return (
      <div className="error" role="alert">
        <p>Error: {error}</p>
        <button onClick={handleRetry}>Retry</button>
        <Link to="/restaurants">Return to Restaurants</Link>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="error" role="alert">
        <p>Restaurant not found</p>
        <Link to="/restaurants">Return to Restaurants</Link>
      </div>
    );
  }

  return (
    <div className="restaurant-details">
      {/* Restaurant Header */}
      <div className="restaurant-header card">
        <div className="header-content">
          <h1>{restaurant.name}</h1>
          <div className="restaurant-info">
            {restaurant.cuisineType && (
              <span className="cuisine-type">{restaurant.cuisineType}</span>
            )}
            {restaurant.priceRange && (
              <span className="price-range">{restaurant.priceRange}</span>
            )}
            {restaurant.isVRExperience && (
              <span className="vr-badge">VR Experience Available</span>
            )}
            {restaurant.rating && (
              <div className="rating">
                <span className="rating-score">{restaurant.rating.average.toFixed(1)}</span>
                <span className="rating-count">({restaurant.rating.count} reviews)</span>
              </div>
            )}
          </div>
          {restaurant.description && (
            <p className="description">{restaurant.description}</p>
          )}
        </div>
        {restaurant.images?.length > 0 && (
          <div className="restaurant-images">
            {restaurant.images.map((image, index) => (
              <img
                key={index}
                src={image.url}
                alt={image.alt}
                className={`restaurant-image ${image.isPrimary ? 'primary' : ''}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Contact and Hours Grid */}
      <div className="info-grid">
        {restaurant.address && (
          <div className="contact-info card">
            <h2>Contact Information</h2>
            <div className="address">
              <i className="location-icon"></i>
              <div>
                {restaurant.address.street && <p>{restaurant.address.street}</p>}
                {restaurant.address.city && restaurant.address.state && (
                  <p>{restaurant.address.city}, {restaurant.address.state}</p>
                )}
                {restaurant.address.zipCode && <p>{restaurant.address.zipCode}</p>}
                {restaurant.address.country && <p>{restaurant.address.country}</p>}
              </div>
            </div>
            {restaurant.phone && <p><i className="phone-icon"></i>{restaurant.phone}</p>}
            {restaurant.email && <p><i className="email-icon"></i>{restaurant.email}</p>}
            {restaurant.website && (
              <p><i className="web-icon"></i>
                <a 
                  href={restaurant.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="website-link"
                >
                  Visit Website
                </a>
              </p>
            )}
          </div>
        )}

        <div className="hours-info card">
          <h2>Opening Hours</h2>
          {Object.entries(restaurant.openingHours || {}).map(([day, hours]) => (
            <div key={day} className="hours-row">
              <span className="day">{day}</span>
              <span className="hours">
                {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Specialties Section */}
      {restaurant.specialties?.length > 0 && (
        <div className="specialties card">
          <h2>Restaurant Specialties</h2>
          <div className="specialties-list">
            {restaurant.specialties.map((specialty, index) => (
              <span 
                key={`specialty-${index}`} 
                className="specialty-tag"
              >
                {specialty}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Menus Section */}
      {restaurant && (
        <MenuSection restaurantSlug={slug} />
      )}

      {/* Reservation Information */}
      {(restaurant.maxCapacity || restaurant.reservationTimeSlots?.length > 0) && (
        <div className="reservation-info card">
          <h2>Reservations</h2>
          {restaurant.maxCapacity && (
            <p className="capacity-info">
              <span className="label">Maximum Capacity:</span>
              <span className="value">{restaurant.maxCapacity} guests</span>
            </p>
          )}
          
          {restaurant.reservationTimeSlots?.length > 0 && (
            <div className="reservation-slots">
              <h3>Available Time Slots</h3>
              <div className="time-slots">
                {restaurant.reservationTimeSlots.map((slot, index) => (
                  <div 
                    key={`timeslot-${index}`} 
                    className="time-slot"
                  >
                    <span className="time">{slot.time}</span>
                    <span className="capacity">
                      Max bookings: {slot.maxBookings}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button className="reservation-btn">
            Make a Reservation
          </button>
        </div>
      )}

      {/* Location Map */}
      {restaurant.location?.coordinates && (
        <div className="location-map card">
          <h2>Location</h2>
          <div className="map-container">
            {/* Map component would go here */}
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetails;