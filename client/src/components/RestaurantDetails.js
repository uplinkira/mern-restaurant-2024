import React from 'react';

const RestaurantDetails = ({ restaurant, dishes }) => {
  return (
    <div className="main-content">
      <div className="card">
        <h1>{restaurant.name}</h1>
        <p>{restaurant.cuisineType}</p>
        <p>{restaurant.description}</p>
        <div>
          <h2>Contact Information</h2>
          <p>Address: {restaurant.address}</p>
          <p>Phone: {restaurant.phone}</p>
          <p>Email: {restaurant.email}</p>
        </div>
      </div>

      <h2>Menu</h2>
      {dishes.length ? (
        <div className="card-grid">
          {dishes.map(dish => (
            <div key={dish._id} className="card">
              <h3>{dish.name}</h3>
              <p>{dish.description}</p>
              <p className="price">Price: ${dish.price}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No dishes available for this restaurant.</p>
      )}
    </div>
  );
};

export default RestaurantDetails;