import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchRestaurantDetails } from '../redux/slices/restaurantSlice';
import { fetchDishes } from '../redux/slices/dishSlice';

const RestaurantDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentRestaurant, status: restaurantStatus, error: restaurantError } = useSelector(state => state.restaurants);
  const { list: dishes, status: dishStatus, error: dishError } = useSelector(state => state.dishes);

  useEffect(() => {
    dispatch(fetchRestaurantDetails(id));
    dispatch(fetchDishes(id));
  }, [dispatch, id]);

  if (restaurantStatus === 'loading' || dishStatus === 'loading') return <div>Loading...</div>;
  if (restaurantError) return <div>Error: {restaurantError}</div>;
  if (dishError) return <div>Error loading dishes: {dishError}</div>;
  if (!currentRestaurant) return <div>Restaurant not found</div>;

  return (
    <div className="main-content">
      <div className="card">
        <h1>{currentRestaurant.name}</h1>
        <p>{currentRestaurant.cuisineType}</p>
        <p>{currentRestaurant.description}</p>
        <div>
          <h2>Contact Information</h2>
          <p>Address: {currentRestaurant.address}</p>
          <p>Phone: {currentRestaurant.phone}</p>
          <p>Email: {currentRestaurant.email}</p>
        </div>
      </div>
      <h2>Menu</h2>
      <div className="card-grid">
        {dishes.map(dish => (
          <div key={dish._id} className="card">
            <h3>{dish.name}</h3>
            <p>{dish.description}</p>
            <p className="price">Price: ${dish.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RestaurantDetails;