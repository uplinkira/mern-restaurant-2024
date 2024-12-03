// client/src/features/restaurant/MenuSection.js
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import '../../App.css';

const MenuSection = ({ menus, dishes }) => {
  const dishesByMenu = useMemo(() => {
    return dishes.reduce((acc, dish) => {
      if (dish.menus && Array.isArray(dish.menus)) {
        dish.menus.forEach(menuName => {
          if (!acc[menuName]) acc[menuName] = [];
          acc[menuName].push(dish);
        });
      }
      return acc;
    }, {});
  }, [dishes]);

  const renderMenu = (menu) => {
    const menuDishes = dishesByMenu[menu.name] || [];
    
    return (
      <div key={menu.slug} className="menu-section card">
        <h3>{menu.name}</h3>
        <p className="menu-description">{menu.description}</p>
        {menuDishes.length > 0 ? (
          <div className="dishes-grid">
            {menuDishes.map(dish => (
              <DishCard key={dish.slug} dish={dish} />
            ))}
          </div>
        ) : (
          <p className="no-dishes">No dishes available in this menu</p>
        )}
      </div>
    );
  };

  if (!menus?.length) {
    return <p className="no-menus">No menus available</p>;
  }

  return (
    <div className="menus-section">
      <h2>Our Menus</h2>
      {menus.map(renderMenu)}
    </div>
  );
};

const DishCard = React.memo(({ dish }) => (
  <div className="dish-card">
    <Link to={`/dish/${dish.slug}`}>
      <h4>{dish.name}</h4>
      {dish.isSignatureDish && (
        <span className="signature-badge">Signature Dish</span>
      )}
      <p className="dish-description">{dish.description}</p>
      <div className="dish-footer">
        <span className="price">${dish.price.toFixed(2)}</span>
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
      {dish.ingredients?.length > 0 && (
        <div className="ingredients">
          {dish.ingredients.join(', ')}
        </div>
      )}
    </Link>
  </div>
));

export default MenuSection;