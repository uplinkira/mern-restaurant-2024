// client/src/pages/RestaurantPage.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchRestaurantDetails } from '../redux/slices/restaurantSlice';
import { fetchDishesByRestaurant } from '../redux/slices/dishSlice';
import RestaurantDetails from '../features/restaurant/RestaurantInfo';
import '../App.css';

const RestaurantPage = () => {
  const { slug } = useParams(); // Use slug for fetching restaurant and dishes
  const dispatch = useDispatch();
  const [filteredDishes, setFilteredDishes] = useState([]);

  const {
    currentRestaurant,
    status: restaurantStatus,
    error: restaurantError,
  } = useSelector((state) => state.restaurants);

  const { list: dishes, status: dishStatus, error: dishError } = useSelector(
    (state) => state.dishes
  );

  useEffect(() => {
    if (slug) {
      dispatch(fetchRestaurantDetails(slug)); // Fetch restaurant details using slug
      dispatch(fetchDishesByRestaurant(slug)); // Fetch dishes using restaurant slug
    }
  }, [dispatch, slug]);

  useEffect(() => {
    if (dishes.length && currentRestaurant) {
      // Filter dishes by the current restaurant's slug
      const restaurantDishes = dishes.filter(
        (dish) => dish.restaurantSlug === currentRestaurant.slug
      );
      setFilteredDishes(restaurantDishes);
    }
  }, [dishes, currentRestaurant]);

  if (restaurantStatus === 'loading' || dishStatus === 'loading') {
    return <div className="loading">Loading...</div>;
  }

  if (restaurantError) {
    return <div className="error">Error: {restaurantError}</div>;
  }

  if (dishError) {
    return <div className="error">Error loading dishes: {dishError}</div>;
  }

  if (!currentRestaurant) {
    return <div className="error">Restaurant not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <RestaurantDetails
        restaurant={currentRestaurant}
        dishes={filteredDishes}
      />
    </div>
  );
};

export default RestaurantPage;
