// client/src/features/restaurant/RestaurantInfo.js
import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchRestaurantDetails } from '../../redux/slices/restaurantSlice';
import { fetchDishesByRestaurant } from '../../redux/slices/dishSlice';
import '../../App.css';

const RestaurantDetails = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const {
    currentRestaurant: restaurant,
    status: restaurantStatus,
    error: restaurantError,
  } = useSelector((state) => state.restaurants);
  const {
    list: dishes,
    status: dishesStatus,
    error: dishesError,
  } = useSelector((state) => state.dishes);

  useEffect(() => {
    if (slug) {
      dispatch(fetchRestaurantDetails(slug));
      dispatch(fetchDishesByRestaurant(slug));
    }
  }, [dispatch, slug]);

  if (restaurantStatus === 'loading' || dishesStatus === 'loading') {
    return <div className="loading">Loading...</div>;
  }

  if (restaurantStatus === 'failed') {
    return <div className="error">Error: {restaurantError}</div>;
  }

  if (!restaurant) {
    return <div className="error">Restaurant not found</div>;
  }

  // Group dishes by menu
  const dishesByMenu = dishes.reduce((acc, dish) => {
    dish.menus.forEach(menu => {
      if (!acc[menu]) acc[menu] = [];
      acc[menu].push(dish);
    });
    return acc;
  }, {});

  return (
    <div className="restaurant-details">
      {/* Header Section */}
      <div className="restaurant-header card">
        <h1>{restaurant.name}</h1>
        <div className="restaurant-info">
          <span className="cuisine-type">{restaurant.cuisineType}</span>
          {restaurant.isVRExperience && <span className="vr-badge">VR Experience Available</span>}
        </div>
        <p className="description">{restaurant.description}</p>
      </div>

      {/* Contact & Hours Section */}
      <div className="info-grid">
        <div className="contact-info card">
          <h2>Contact Information</h2>
          <p><i className="location-icon"></i>{restaurant.address}</p>
          <p><i className="phone-icon"></i>{restaurant.phone}</p>
          <p><i className="email-icon"></i>{restaurant.email}</p>
          {restaurant.website && (
            <p><i className="web-icon"></i>
              <a href={restaurant.website} target="_blank" rel="noopener noreferrer">
                Visit Website
              </a>
            </p>
          )}
        </div>

        <div className="hours-info card">
          <h2>Opening Hours</h2>
          {Object.entries(restaurant.openingHours).map(([day, hours]) => (
            <div key={day} className="hours-row">
              <span className="day">{day}</span>
              <span className="hours">{hours || 'Closed'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Specialties Section */}
      {restaurant.specialties && restaurant.specialties.length > 0 && (
        <div className="specialties card">
          <h2>Restaurant Specialties</h2>
          <div className="specialties-list">
            {restaurant.specialties.map((specialty, index) => (
              <span key={index} className="specialty-tag">{specialty}</span>
            ))}
          </div>
        </div>
      )}

      {/* Menus Section */}
      <div className="menus-section">
        <h2>Our Menus</h2>
        {Object.entries(dishesByMenu).map(([menuName, menuDishes]) => (
          <div key={menuName} className="menu-section card">
            <h3>{menuName}</h3>
            <div className="dishes-grid">
              {menuDishes.map((dish) => (
                <div key={dish.slug} className="dish-card">
                  <Link to={`/dish/${dish.slug}`}>
                    <h4>{dish.name}</h4>
                    {dish.isSignatureDish && <span className="signature-badge">Signature Dish</span>}
                    <p className="dish-description">{dish.description}</p>
                    <div className="dish-footer">
                      <span className="price">${dish.price.toFixed(2)}</span>
                      {dish.chenPiAge && (
                        <span className="chen-pi-age">{dish.chenPiAge} Year Aged Chen Pi</span>
                      )}
                    </div>
                    {dish.allergens && dish.allergens.length > 0 && (
                      <div className="allergens">
                        Allergens: {dish.allergens.join(', ')}
                      </div>
                    )}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Capacity & Reservations */}
      {restaurant.maxCapacity && (
        <div className="reservation-info card">
          <h2>Reservations</h2>
          <p>Maximum Capacity: {restaurant.maxCapacity} guests</p>
          {restaurant.reservationTimeSlots && restaurant.reservationTimeSlots.length > 0 && (
            <>
              <h3>Available Time Slots</h3>
              <div className="time-slots">
                {restaurant.reservationTimeSlots.map((slot, index) => (
                  <span key={index} className="time-slot">{slot}</span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RestaurantDetails;