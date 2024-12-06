// client/src/features/restaurant/RestaurantDetails.js
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import {
  fetchRestaurantDetails,
  selectCurrentRestaurant,
  selectRestaurantStatuses,
  selectRestaurantErrors,
  selectRestaurantCache,
  clearCurrentRestaurant
} from '../../redux/slices/restaurantSlice';
import MenuSection from './MenuSection';
import '../../App.css';

const LoadingSkeleton = () => (
  <div className="restaurant-details-skeleton" role="alert" aria-busy="true">
    <div className="header-skeleton animate-pulse">
      <div className="title-skeleton h-8 w-3/4 bg-gray-200 rounded"></div>
      <div className="info-skeleton mt-4 space-y-2">
        <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
        <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

const ErrorView = ({ error, onRetry }) => (
  <div className="error-container" role="alert">
    <h2>Error Loading Restaurant</h2>
    <p>{error?.message || 'Failed to load restaurant details'}</p>
    <div className="error-actions">
      <button 
        onClick={onRetry}
        className="retry-button"
      >
        Retry Loading
      </button>
      <Link 
        to="/restaurants"
        className="return-link"
      >
        Back to Restaurants
      </Link>
    </div>
  </div>
);

const NotFoundView = () => (
  <div className="not-found-container" role="alert">
    <h2>Restaurant Not Found</h2>
    <p>The restaurant you're looking for doesn't exist or has been removed.</p>
    <Link 
      to="/restaurants"
      className="return-link"
    >
      Browse All Restaurants
    </Link>
  </div>
);

const MenuList = ({ menus }) => {
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (menuSlug) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuSlug]: !prev[menuSlug]
    }));
  };

  return (
    <div className="menus-section">
      <h2>Our Menus</h2>
      {menus.map(menu => (
        <div key={menu.slug} className="menu-card">
          <div 
            className="menu-header"
            onClick={() => toggleMenu(menu.slug)}
            style={{ cursor: 'pointer' }}
          >
            <h3>{menu.name}</h3>
            <span>{expandedMenus[menu.slug] ? '▼' : '▶'}</span>
          </div>
          
          {expandedMenus[menu.slug] && (
            <div className="menu-content">
              <p>{menu.description}</p>
              {menu.dishes?.length > 0 ? (
                <div className="dishes-grid">
                  {menu.dishes.map(dish => (
                    <Link 
                      key={dish.slug}
                      to={`/dish/${dish.slug}`}
                      className="dish-card"
                    >
                      <h4>{dish.name}</h4>
                      <p>{dish.description}</p>
                      <div className="dish-price">¥{dish.price}</div>
                      {dish.isSignatureDish && (
                        <span className="signature-badge">Signature</span>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p>No dishes available in this menu</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const RestaurantDetails = ({ restaurant: propRestaurant }) => {
  const dispatch = useDispatch();
  
  const restaurant = propRestaurant || useSelector(selectCurrentRestaurant);
  const { detail: status } = useSelector(selectRestaurantStatuses);
  const { detail: error } = useSelector(selectRestaurantErrors);
  const cache = useSelector(selectRestaurantCache);

  // Moved useMemo to top level before any conditional returns
  const sections = useMemo(() => ({
    hasContact: !!(restaurant?.address || restaurant?.phone || restaurant?.email || restaurant?.website),
    hasHours: !!restaurant?.openingHours,
    hasSpecialties: restaurant?.specialties?.length > 0,
    hasReservation: !!(restaurant?.maxCapacity || restaurant?.reservationTimeSlots?.length > 0),
    hasLocation: !!restaurant?.location?.coordinates
  }), [restaurant]);

  useEffect(() => {
    return () => {
      dispatch(clearCurrentRestaurant());
    };
  }, [dispatch]);

  const handleRetry = () => {
    if (slug) {
      dispatch(fetchRestaurantDetails({ 
        slug, 
        includeMenus: true, 
        includeDishes: true,
        forceFetch: true
      }));
    }
  };

  if (status === 'loading' && !restaurant) {
    return <LoadingSkeleton />;
  }

  if (status === 'failed') {
    return <ErrorView error={error} onRetry={handleRetry} />;
  }

  if (!restaurant && status === 'succeeded') {
    return <NotFoundView />;
  }

  if (!restaurant) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="restaurant-details">
      <header className="restaurant-header card">
        <div className="header-content">
          <h1>{restaurant?.name}</h1>
          <div className="restaurant-info">
            {restaurant?.cuisineType && (
              <span className="cuisine-type">{restaurant.cuisineType}</span>
            )}
            {restaurant?.priceRange && (
              <span className="price-range">{restaurant.priceRange}</span>
            )}
            {restaurant?.isVRExperience && (
              <span className="vr-badge">VR Experience Available</span>
            )}
            {restaurant?.rating && (
              <div className="rating">
                <span className="rating-score">
                  {restaurant.rating.average.toFixed(1)}
                </span>
                <span className="rating-count">
                  ({restaurant.rating.count} reviews)
                </span>
              </div>
            )}
          </div>
          {restaurant?.description && (
            <p className="description">{restaurant.description}</p>
          )}
        </div>
        {restaurant?.images?.length > 0 && (
          <div className="restaurant-images">
            {restaurant.images.map((image, index) => (
              <img
                key={index}
                src={image.url}
                alt={image.alt}
                className={`restaurant-image ${image.isPrimary ? 'primary' : ''}`}
                loading={image.isPrimary ? 'eager' : 'lazy'}
              />
            ))}
          </div>
        )}
      </header>

      {(sections.hasContact || sections.hasHours) && (
        <div className="info-grid">
          {sections.hasContact && (
            <div className="contact-info card">
              <h2>Contact Information</h2>
              {restaurant?.address && (
                <div className="address">
                  <i className="location-icon" aria-hidden="true"></i>
                  <div>
                    {restaurant.address.street && <p>{restaurant.address.street}</p>}
                    {restaurant.address.city && restaurant.address.state && (
                      <p>{restaurant.address.city}, {restaurant.address.state}</p>
                    )}
                    {restaurant.address.zipCode && <p>{restaurant.address.zipCode}</p>}
                    {restaurant.address.country && <p>{restaurant.address.country}</p>}
                  </div>
                </div>
              )}
              {restaurant?.phone && (
                <p>
                  <i className="phone-icon" aria-hidden="true"></i>
                  <a href={`tel:${restaurant.phone}`}>{restaurant.phone}</a>
                </p>
              )}
              {restaurant?.email && (
                <p>
                  <i className="email-icon" aria-hidden="true"></i>
                  <a href={`mailto:${restaurant.email}`}>{restaurant.email}</a>
                </p>
              )}
              {restaurant?.website && (
                <p>
                  <i className="web-icon" aria-hidden="true"></i>
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

          {sections.hasHours && restaurant?.openingHours && (
            <div className="hours-info card">
              <h2>Opening Hours</h2>
              {Object.entries(restaurant.openingHours).map(([day, hours]) => (
                <div key={day} className="hours-row">
                  <span className="day">{day}</span>
                  <span className="hours">
                    {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {sections.hasSpecialties && restaurant?.specialties && (
        <section className="specialties card">
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
        </section>
      )}

      {restaurant?.slug && (
        <MenuSection 
          restaurantSlug={restaurant.slug}
          restaurant={restaurant}
        />
      )}

      {sections.hasReservation && (
        <section className="reservation-info card">
          <h2>Reservations</h2>
          {restaurant?.maxCapacity && (
            <p className="capacity-info">
              <span className="label">Maximum Capacity:</span>
              <span className="value">{restaurant.maxCapacity} guests</span>
            </p>
          )}
          
          {restaurant?.reservationTimeSlots?.length > 0 && (
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

          <button 
            className="reservation-btn"
            onClick={() => {/* Add reservation logic */}}
          >
            Make a Reservation
          </button>
        </section>
      )}

      {sections.hasLocation && (
        <section className="location-map card">
          <h2>Location</h2>
          <div className="map-container">
            {/* Map component implementation */}
          </div>
        </section>
      )}
    </div>
  );
};

export default React.memo(RestaurantDetails);