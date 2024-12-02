// client/src/features/restaurant/MenuSection.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../../App.css';

const MenuSection = ({ menus, dishes }) => {
  // Group dishes by menu
  const dishesByMenu = dishes.reduce((acc, dish) => {
    dish.menus.forEach(menuName => {
      if (!acc[menuName]) acc[menuName] = [];
      acc[menuName].push(dish);
    });
    return acc;
  }, {});

  return (
    <div className="menus-section">
      <h2>Our Menus</h2>
      {menus.length > 0 ? (
        menus.map((menu) => (
          <div key={menu.slug} className="menu-section card">
            <h3>{menu.name}</h3>
            <p className="menu-description">{menu.description}</p>
            {dishesByMenu[menu.name] && dishesByMenu[menu.name].length > 0 ? (
              <div className="dishes-grid">
                {dishesByMenu[menu.name].map((dish) => (
                  <div key={dish.slug} className="dish-card">
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
                ))}
              </div>
            ) : (
              <p className="no-dishes">No dishes available in this menu</p>
            )}
          </div>
        ))
      ) : (
        <p className="no-menus">No menus available</p>
      )}
    </div>
  );
};

export default MenuSection;