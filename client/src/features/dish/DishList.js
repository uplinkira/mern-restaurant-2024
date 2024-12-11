// client/src/features/dish/DishList.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchSignatureDishes,
  selectSignatureDishes,
  selectDishStatus,
  selectDishError
} from '../../redux/slices/dishSlice';
import '../../App.css';

const DishList = () => {
  const dispatch = useDispatch();
  const [displayCount, setDisplayCount] = useState(3);

  const dishes = useSelector(selectSignatureDishes);
  const status = useSelector(selectDishStatus);
  const error = useSelector(selectDishError);

  useEffect(() => {
    dispatch(fetchSignatureDishes());
  }, [dispatch]);

  // 随机选择菜品
  const randomDishes = React.useMemo(() => {
    if (!dishes?.length) return [];
    const shuffled = [...dishes].sort(() => 0.5 - Math.random());
    return shuffled;
  }, [dishes]);

  const visibleDishes = randomDishes.slice(0, displayCount);
  const hasMore = displayCount < randomDishes.length;

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 3);
  };

  if (status === 'loading') {
    return (
      <div className="signature-dishes-container">
        <h1 className="section-title">Signature Dishes</h1>
        <div className="dishes-loading">
          <div className="loading-spinner"></div>
          <p>Discovering signature dishes...</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="signature-dishes-container">
        <h1 className="section-title">Signature Dishes</h1>
        <div className="dishes-error">
          <p>Unable to load signature dishes</p>
          <p className="error-details">{error}</p>
        </div>
      </div>
    );
  }

  if (!dishes?.length) {
    return (
      <div className="signature-dishes-container">
        <h1 className="section-title">Signature Dishes</h1>
        <div className="dishes-empty">
          <div className="empty-state-icon">🍽️</div>
          <h2>Our Chefs are Creating</h2>
          <p>Our signature dishes are being crafted with care.</p>
          <p>Please check back soon to discover our culinary masterpieces.</p>
          <Link to="/" className="return-home-btn">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="signature-dishes-container">
      <h1 className="section-title">Signature Dishes</h1>
      
      <div className="dish-grid">
        {visibleDishes.map((dish) => (
          <div key={dish.slug} className="dish-card">
            <div className="dish-content">
              <h2 className="dish-title">{dish.name}</h2>
              
              <p className="dish-description">{dish.description}</p>

              <div className="dish-details">
                <div className="dish-info">
                  <span className="chen-pi-age">
                    {dish.chenPiAge}Y Chen Pi
                  </span>
                  <span className="dish-price">¥{dish.price.toFixed(2)}</span>
                </div>

                {dish.restaurants?.length > 0 && (
                  <div className="restaurant-tags">
                    Available at: {dish.restaurants.map(restaurant =>
                      typeof restaurant === 'string'
                        ? restaurant
                        : restaurant.name
                    ).join(', ')}
                  </div>
                )}
              </div>

              <Link 
                to={`/dish/${dish.slug}`}
                className="view-details-btn"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button 
          onClick={handleLoadMore}
          className="load-more-btn"
        >
          Load More
        </button>
      )}
    </div>
  );
};

export default DishList;