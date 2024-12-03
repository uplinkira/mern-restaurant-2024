// client/src/features/restaurant/RestaurantDetails.js

import React from 'react';
import { Link } from 'react-router-dom';
import '../../App.css';

const RestaurantDetails = ({ restaurant, dishes }) => {
  if (!restaurant) {
    return <div className="error" role="alert">Restaurant not found</div>;
  }

  // 将菜品按照菜单分类
  const dishesByMenu = dishes.reduce((acc, dish) => {
    if (dish.menus && Array.isArray(dish.menus)) {
      dish.menus.forEach(menu => {
        if (!acc[menu]) acc[menu] = [];
        acc[menu].push(dish);
      });
    }
    return acc;
  }, {});

  return (
    <div className="restaurant-details">
      {/* 餐厅头部信息 */}
      <div className="restaurant-header card">
        <h1>{restaurant.name}</h1>
        <div className="restaurant-info">
          <span className="cuisine-type">{restaurant.cuisineType}</span>
          {restaurant.isVRExperience && (
            <span className="vr-badge">VR Experience Available</span>
          )}
        </div>
        <p className="description">{restaurant.description}</p>
      </div>

      {/* 联系信息和营业时间 */}
      <div className="info-grid">
        <div className="contact-info card">
          <h2>Contact Information</h2>
          <p><i className="location-icon"></i>{restaurant.address}</p>
          <p><i className="phone-icon"></i>{restaurant.phone}</p>
          <p><i className="email-icon"></i>{restaurant.email}</p>
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

        <div className="hours-info card">
          <h2>Opening Hours</h2>
          {Object.entries(restaurant.openingHours || {}).map(([day, hours]) => (
            <div key={day} className="hours-row">
              <span className="day">{day}</span>
              <span className="hours">{hours || 'Closed'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 餐厅特色 */}
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

      {/* 菜单和菜品 */}
      <div className="menus-section">
        <h2>Our Menus</h2>
        {Object.entries(dishesByMenu).map(([menuName, menuDishes]) => (
          <div key={menuName} className="menu-section card">
            <h3>{menuName}</h3>
            <div className="dishes-grid">
              {menuDishes.map((dish) => (
                <div key={dish.slug} className="dish-card">
                  <Link 
                    to={`/dish/${dish.slug}`}
                    className="dish-link"
                  >
                    <h4>{dish.name}</h4>
                    {dish.isSignatureDish && (
                      <span className="signature-badge">
                        Signature Dish
                      </span>
                    )}
                    <p className="dish-description">
                      {dish.description}
                    </p>
                    <div className="dish-footer">
                      <span className="price">
                        ¥{dish.price.toFixed(2)}
                      </span>
                      {dish.chenPiAge && (
                        <span className="chen-pi-age">
                          {dish.chenPiAge} Year Aged Chen Pi
                        </span>
                      )}
                    </div>
                    {dish.allergens?.length > 0 && (
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

      {/* 预订信息 */}
      {restaurant.maxCapacity && (
        <div className="reservation-info card">
          <h2>Reservations</h2>
          <p>Maximum Capacity: {restaurant.maxCapacity} guests</p>
          {restaurant.reservationTimeSlots?.length > 0 && (
            <>
              <h3>Available Time Slots</h3>
              <div className="time-slots">
                {restaurant.reservationTimeSlots.map((slot, index) => (
                  <span 
                    key={`timeslot-${index}`} 
                    className="time-slot"
                  >
                    {slot}
                  </span>
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
