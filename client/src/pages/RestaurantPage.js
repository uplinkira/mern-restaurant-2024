import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchRestaurantDetails } from '../redux/slices/restaurantSlice';
import { fetchDishes } from '../redux/slices/dishSlice';
import RestaurantDetails from '../components/RestaurantDetails';
import '../App.css'; 

const RestaurantPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [filteredDishes, setFilteredDishes] = useState([]);
  
  const { currentRestaurant, status: restaurantStatus, error: restaurantError } = useSelector(
    state => state.restaurants
  );
  const { list: dishes, status: dishStatus, error: dishError } = useSelector(
    state => state.dishes
  );

  useEffect(() => {
    dispatch(fetchRestaurantDetails(id));
    dispatch(fetchDishes(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (dishes.length && currentRestaurant) {
      const restaurantDishes = dishes.filter(dish => dish.restaurant.includes(currentRestaurant._id));
      setFilteredDishes(restaurantDishes);
    }
  }, [dishes, currentRestaurant]);

  if (restaurantStatus === 'loading' || dishStatus === 'loading') 
    return <div>Loading...</div>;
  
  if (restaurantError) 
    return <div>Error: {restaurantError}</div>;
  
  if (dishError) 
    return <div>Error loading dishes: {dishError}</div>;
  
  if (!currentRestaurant) 
    return <div>Restaurant not found</div>;

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