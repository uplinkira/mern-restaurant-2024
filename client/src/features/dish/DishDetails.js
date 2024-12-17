// client/src/features/dish/DishDetails.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { 
  fetchDishDetails, 
  selectCurrentDish, 
  selectDishStatus, 
  selectDishError,
  selectRelatedDishes,
  clearCurrentDish 
} from '../../redux/slices/dishSlice';
import '../../App.css';

const DishDetails = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();

  const dish = useSelector(selectCurrentDish);
  const status = useSelector(selectDishStatus);
  const error = useSelector(selectDishError);
  const relatedDishes = useSelector(selectRelatedDishes);

  useEffect(() => {
    if (slug) {
      dispatch(fetchDishDetails({ slug, includeRelated: true }));
    }
    
    return () => {
      dispatch(clearCurrentDish());
    };
  }, [dispatch, slug]);

  const getRestaurantName = (restaurant) => {
    if (typeof restaurant === 'string') return restaurant;
    return restaurant?.name || 'Unknown Restaurant';
  };

  const getMenuName = (menu) => {
    if (typeof menu === 'string') return menu;
    return menu?.name || 'Unnamed Menu';
  };

  if (status === 'loading') {
    return <div className="loading">Loading dish details...</div>;
  }

  if (status === 'failed') {
    return <div className="error">Error: {error}</div>;
  }

  if (!dish) {
    return <div className="error">Dish not found</div>;
  }

  return (
    <div className="dish-details">
      {/* Main Info Section */}
      <div className="dish-header card">
        <div className="dish-title">
          <h1>{dish.name}</h1>
          {dish.isSignatureDish && (
            <span className="signature-badge">Signature Dish</span>
          )}
        </div>

        <div className="dish-price-info">
          <span className="price">¥{dish.price.toFixed(2)}</span>
          {dish.chenPiAge && (
            <span className="chen-pi-age">
              {dish.chenPiAge} Year Aged Chen Pi
            </span>
          )}
        </div>
        
        <p className="dish-description">{dish.description}</p>
      </div>

      {/* Details Grid */}
      <div className="details-grid">
        {/* Ingredients Section */}
        {dish.ingredients?.length > 0 && (
          <div className="ingredients-section card">
            <h2>Ingredients</h2>
            <div className="ingredients-list">
              {dish.ingredients.map((ingredient, index) => (
                <span key={index} className="ingredient-tag">
                  {ingredient}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Allergens Section */}
        {dish.allergens?.length > 0 && (
          <div className="allergens-section card">
            <h2>Allergen Information</h2>
            <div className="allergens-list">
              {dish.allergens.map((allergen, index) => (
                <span key={index} className="allergen-tag">
                  {allergen}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Restaurant & Menu Context */}
      {(dish.restaurants?.length > 0 || dish.menus?.length > 0) && (
        <div className="context-section card">
          {/* Restaurants Section with safe object handling */}
          {dish.restaurants?.length > 0 && (
            <div className="restaurants-section">
              <h2>Available At</h2>
              <div className="restaurant-list">
                {dish.restaurants.map((restaurant, index) => (
                  <Link
                    key={restaurant.slug || index}
                    to={`/restaurant/${restaurant.slug || ''}`}
                    className="restaurant-link"
                  >
                    <div className="restaurant-card">
                      <h3>{getRestaurantName(restaurant)}</h3>
                      {restaurant.cuisineType && (
                        <span className="cuisine-type">{restaurant.cuisineType}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Menus Section with safe object handling */}
          {dish.menus?.length > 0 && (
            <div className="menu-context">
              <h2>Featured In Menus</h2>
              <div className="menu-list">
                {dish.menus.map((menu, index) => (
                  <span key={menu.slug || index} className="menu-tag">
                    {getMenuName(menu)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Related Dishes */}
      {relatedDishes?.length > 0 && (
        <div className="related-section card">
          <h2>You Might Also Like</h2>
          <div className="related-dishes">
            {relatedDishes.map((relatedDish) => {
              // Skip rendering if essential data is missing
              if (!relatedDish?.name || !relatedDish?.slug) return null;
              
              return (
                <Link
                  key={relatedDish.slug}
                  to={`/dish/${relatedDish.slug}`}
                  className="related-dish-card"
                >
                  <div className="related-dish-info">
                    <h4>{relatedDish.name}</h4>
                    {relatedDish.isSignatureDish && (
                      <span className="signature-badge-small">Signature</span>
                    )}
                  </div>
                  <span className="price">
                    ¥{(relatedDish.price || 0).toFixed(2)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DishDetails;