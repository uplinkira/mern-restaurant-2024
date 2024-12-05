// client/src/features/restaurant/MenuSection.js
import React, { useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchMenus,
  selectAllMenus,
  selectMenuListStatus,
  selectMenuError
} from '../../redux/slices/menuSlice';
import {
  selectCurrentRestaurant,
} from '../../redux/slices/restaurantSlice';
import '../../App.css';

const MenuSection = ({ restaurantSlug }) => {
  const dispatch = useDispatch();
  const currentRestaurant = useSelector(selectCurrentRestaurant);
  const menus = useSelector(selectAllMenus);
  const menuStatus = useSelector(selectMenuListStatus);
  const menuError = useSelector(selectMenuError);

  useEffect(() => {
    if (restaurantSlug) {
      dispatch(fetchMenus({ restaurantSlug }));
    }
  }, [dispatch, restaurantSlug]);

  // Move all useMemo hooks to the top level
  const categorizedDishes = useMemo(() => {
    return menus.reduce((acc, menu) => {
      if (menu.dishes && Array.isArray(menu.dishes)) {
        acc[menu.slug] = {
          ...menu,
          dishes: menu.dishes.sort((a, b) => {
            if (a.isSignatureDish !== b.isSignatureDish) {
              return b.isSignatureDish ? 1 : -1;
            }
            return a.name.localeCompare(b.name);
          })
        };
      }
      return acc;
    }, {});
  }, [menus]);

  const groupedMenus = useMemo(() => {
    return menus.reduce((acc, menu) => {
      if (!acc[menu.category]) {
        acc[menu.category] = [];
      }
      acc[menu.category].push(menu);
      return acc;
    }, {});
  }, [menus]);

  const renderMenu = (menu) => {
    const menuData = categorizedDishes[menu.slug];
    const menuDishes = menuData?.dishes || [];
    
    return (
      <div key={menu.slug} className="menu-section card">
        <div className="menu-header">
          <h3>{menu.name}</h3>
          {menu.type === 'seasonal' && (
            <span className="seasonal-badge">Seasonal</span>
          )}
          {menu.isVREnabled && (
            <span className="vr-badge">VR Experience</span>
          )}
        </div>
        
        <p className="menu-description">{menu.description}</p>
        
        {menuDishes.length > 0 ? (
          <div className="dishes-grid">
            {menuDishes.map(dish => (
              <DishCard 
                key={dish.slug} 
                dish={dish}
                restaurantName={currentRestaurant?.name}
              />
            ))}
          </div>
        ) : (
          <p className="no-dishes">No dishes available in this menu</p>
        )}

        {menu.availableTimes && (
          <div className="menu-availability">
            <p>Available: {formatAvailability(menu.availableTimes)}</p>
          </div>
        )}
      </div>
    );
  };

  if (menuStatus === 'loading') {
    return <div className="loading">Loading menus...</div>;
  }

  if (menuStatus === 'failed') {
    return <div className="error">Error: {menuError}</div>;
  }

  if (!menus?.length) {
    return <div className="no-menus">No menus available</div>;
  }

  return (
    <div className="menus-section">
      <h2>Our Menus</h2>
      {Object.entries(groupedMenus).map(([category, categoryMenus]) => (
        <div key={category} className="menu-category">
          <h3 className="category-title">{category}</h3>
          {categoryMenus.map(renderMenu)}
        </div>
      ))}
    </div>
  );
};

const DishCard = React.memo(({ dish, restaurantName }) => (
  <div className="dish-card">
    <Link to={`/dish/${dish.slug}`}>
      <div className="dish-header">
        <h4>{dish.name}</h4>
        <div className="dish-badges">
          {dish.isSignatureDish && (
            <span className="signature-badge">Signature</span>
          )}
          {dish.isNew && (
            <span className="new-badge">New</span>
          )}
        </div>
      </div>

      <p className="dish-description">{dish.description}</p>

      <div className="dish-details">
        <div className="price-info">
          <span className="price">¥{dish.price.toFixed(2)}</span>
          {dish.chenPiAge && (
            <span className="chen-pi-age">
              {dish.chenPiAge}Y Chen Pi
            </span>
          )}
        </div>

        {(dish.allergens?.length > 0 || dish.ingredients?.length > 0) && (
          <div className="dish-ingredients">
            {dish.allergens?.length > 0 && (
              <div className="allergens">
                <span className="label">Allergens:</span>
                {dish.allergens.join(', ')}
              </div>
            )}
            {dish.ingredients?.length > 0 && (
              <div className="ingredients">
                <span className="label">Ingredients:</span>
                {dish.ingredients.join(', ')}
              </div>
            )}
          </div>
        )}

        {restaurantName && (
          <div className="restaurant-info">
            <span>Available at: {restaurantName}</span>
          </div>
        )}
      </div>
    </Link>
  </div>
));

const formatAvailability = (availableTimes) => {
  if (!availableTimes) return '';

  if (availableTimes.pattern) {
    const { pattern } = availableTimes;
    return Object.entries(pattern)
      .filter(([_, times]) => !times.closed)
      .map(([day, times]) => `${day}: ${times.open}-${times.close}`)
      .join(', ');
  }

  if (availableTimes.seasonal) {
    const { startDate, endDate } = availableTimes.seasonal;
    return `Seasonal: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
  }

  return '';
};

export default MenuSection;