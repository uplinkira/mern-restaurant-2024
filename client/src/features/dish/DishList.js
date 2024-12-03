// client/src/features/dish/DishList.js

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchDishesByRestaurant,
  selectAllDishes,
  selectDishStatus,
  selectDishError,
  selectDishPagination
} from '../../redux/slices/dishSlice';
import '../../App.css';

const DishList = ({ restaurantSlug }) => {
  const dispatch = useDispatch();

  const dishes = useSelector(selectAllDishes);
  const status = useSelector(selectDishStatus);
  const error = useSelector(selectDishError);
  const pagination = useSelector(selectDishPagination);

  useEffect(() => {
    console.log('🔄 DishList mounted/updated:', {
      restaurantSlug,
      currentStatus: status
    });

    if (restaurantSlug) {
      console.log('📡 Dispatching fetchDishesByRestaurant for:', restaurantSlug);
      dispatch(fetchDishesByRestaurant(restaurantSlug))
        .unwrap()
        .then(response => {
          console.log('✅ fetchDishesByRestaurant succeeded:', {
            dishCount: response.data.length,
            pagination: response.meta
          });
        })
        .catch(error => {
          console.error('❌ fetchDishesByRestaurant failed:', {
            error,
            restaurantSlug
          });
        });
    }

    return () => {
      console.log('🧹 DishList cleanup for restaurant:', restaurantSlug);
    };
  }, [dispatch, restaurantSlug]);

  // Log component state on each render
  console.log('🎯 DishList render state:', {
    dishCount: dishes?.length,
    status,
    error,
    pagination,
    restaurantSlug
  });

  if (status === 'loading') {
    console.log('⏳ DishList showing loading state');
    return <div className="loading">Loading dishes...</div>;
  }

  if (status === 'failed') {
    console.error('💥 DishList error state:', error);
    return <div className="error">Error: {error}</div>;
  }

  if (!dishes || dishes.length === 0) {
    console.log('ℹ️ DishList empty state');
    return <div className="error">No dishes found</div>;
  }

  return (
    <div className="dish-list">
      <h1>Dishes</h1>
      <div className="dish-grid">
        {dishes.map((dish) => {
          console.log('🍽️ Rendering dish:', {
            name: dish.name,
            slug: dish.slug,
            price: dish.price
          });
          
          return (
            <div key={dish.slug} className="dish-card card">
              <h2>{dish.name}</h2>
              <p>{dish.description}</p>
              <span className="price">¥{dish.price.toFixed(2)}</span>
              {dish.isSignatureDish && (
                <span className="signature-badge">Signature Dish</span>
              )}
              {dish.chenPiAge && (
                <span className="chen-pi-age">
                  {dish.chenPiAge} Year Aged Chen Pi
                </span>
              )}
              <Link 
                to={`/dish/${dish.slug}`} 
                className="btn view-details-btn"
                onClick={() => console.log('🔗 Navigating to dish details:', dish.slug)}
              >
                View Details
              </Link>
            </div>
          );
        })}
      </div>
      
      {pagination && (
        <div className="pagination">
          <p>
            Showing {dishes.length} of {pagination.totalItems} dishes
            (Page {pagination.currentPage} of {pagination.totalPages})
          </p>
        </div>
      )}
    </div>
  );
};

export default DishList;
