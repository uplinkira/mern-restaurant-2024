// client/src/features/dish/DishList.js

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchDishesByRestaurant,
  selectAllDishes,
  selectDishStatus,
  selectDishError,
} from '../../redux/slices/dishSlice';
import '../../App.css';

const DishList = ({ restaurantSlug }) => {
  const dispatch = useDispatch();

  const dishes = useSelector(selectAllDishes);
  const status = useSelector(selectDishStatus);
  const error = useSelector(selectDishError);

  useEffect(() => {
    if (restaurantSlug) {
      dispatch(fetchDishesByRestaurant(restaurantSlug));
    }
  }, [dispatch, restaurantSlug]);

  if (status === 'loading') {
    return <div className="loading">Loading dishes...</div>;
  }

  if (status === 'failed') {
    return <div className="error">Error: {error}</div>;
  }

  if (!dishes || dishes.length === 0) {
    return <div className="error">No dishes found</div>;
  }

  return (
    <div className="dish-list">
      <h1>Dishes</h1>
      <div className="dish-grid">
        {dishes.map((dish) => (
          <div key={dish.slug} className="dish-card card">
            <h2>{dish.name}</h2>
            <p>{dish.description}</p>
            <span className="price">¥{dish.price.toFixed(2)}</span>
            <Link to={`/dish/${dish.slug}`} className="btn view-details-btn">
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DishList;
