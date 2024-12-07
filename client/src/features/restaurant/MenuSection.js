// client/src/features/restaurant/MenuSection.js
import React, { useMemo, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  selectMenusByRestaurantSlug,
  selectMenuCategoriesByRestaurantSlug,
  selectMenuFilters,
  selectRestaurantDetailStatus,
  selectRestaurantError,
  fetchRestaurantDetails,
  setMenuFilters
} from '../../redux/slices/restaurantSlice';
import '../../App.css';

const MenuSectionSkeleton = () => {
  return (
    <div className="menus-section skeleton">
      <div className="skeleton-header">
        <div className="skeleton-title"></div>
      </div>
      
      {[1, 2, 3].map((item) => (
        <div key={item} className="menu-category skeleton">
          <div className="skeleton-category-title"></div>
          
          {[1, 2].map((menuItem) => (
            <div key={menuItem} className="menu-card skeleton">
              <div className="skeleton-menu-header">
                <div className="skeleton-menu-title"></div>
                <div className="skeleton-badges"></div>
              </div>
              <div className="skeleton-description"></div>
              <div className="skeleton-dishes-grid">
                {[1, 2, 3].map((dish) => (
                  <div key={dish} className="skeleton-dish-card">
                    <div className="skeleton-dish-header"></div>
                    <div className="skeleton-dish-description"></div>
                    <div className="skeleton-dish-price"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const MenuSection = ({ restaurantSlug }) => {
  const dispatch = useDispatch();
  // 使用新的选择器
  const menus = useSelector(state => selectMenusByRestaurantSlug(state, restaurantSlug));
  const menusByCategory = useSelector(state => selectMenuCategoriesByRestaurantSlug(state, restaurantSlug));
  const menuCategories = useMemo(() => Object.keys(menusByCategory), [menusByCategory]);
  const menuFilters = useSelector(selectMenuFilters);
  const detailStatus = useSelector(selectRestaurantDetailStatus);
  const error = useSelector(selectRestaurantError);

  // 渲染加载状态
  if (detailStatus === 'loading') {
    return <MenuSectionSkeleton />;
  }

  // 渲染错误状态
  if (detailStatus === 'failed') {
    return (
      <div className="menu-section-error">
        <p>Failed to load menus: {error}</p>
        <button onClick={() => dispatch(fetchRestaurantDetails({ 
          slug: restaurantSlug,
          includeMenus: true,
          includeDishes: true 
        }))}>
          Retry
        </button>
      </div>
    );
  }

  // 渲染空数据状态
  if (!menus.length) {
    return (
      <div className="menu-section-empty">
        <p>No menus available at this time.</p>
      </div>
    );
  }

  return (
    <div className="menus-section">
      <h2>Our Menus</h2>
      {/* 菜单分类过滤器 */}
      {menuCategories.length > 0 && (
        <div className="menu-filters">
          <select
            value={menuFilters.category || ''}
            onChange={(e) => dispatch(setMenuFilters({ 
              category: e.target.value || null 
            }))}
          >
            <option value="">All Categories</option>
            {menuCategories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 菜单分类展示 */}
      {Object.entries(menusByCategory).map(([category, categoryMenus]) => (
        (!menuFilters.category || menuFilters.category === category) && (
          <MenuCategory 
            key={category} 
            category={category} 
            menus={categoryMenus}
            restaurantSlug={restaurantSlug}
          />
        )
      ))}
    </div>
  );
};

// 分离出 MenuCategory 组件
const MenuCategory = ({ category, menus, restaurantSlug }) => {
  return (
    <div className="menu-category">
      <h3 className="category-title">{category}</h3>
      <div className="menu-grid">
        {menus.map(menu => (
          <MenuCard 
            key={menu.slug} 
            menu={menu}
            restaurantSlug={restaurantSlug}
          />
        ))}
      </div>
    </div>
  );
};

// 分离出 MenuCard 组件
const MenuCard = ({ menu, restaurantSlug }) => {
  return (
    <div className="menu-card">
      <div className="menu-header">
        <h4>{menu.name}</h4>
        {menu.type !== 'regular' && (
          <span className={`menu-type ${menu.type}`}>
            {menu.type.charAt(0).toUpperCase() + menu.type.slice(1)}
          </span>
        )}
      </div>
      
      <p className="menu-description">{menu.description}</p>
      
      {/* 价格分类展示 */}
      <div className="price-categories">
        {menu.priceCategories.map((category, index) => (
          <div key={index} className="price-category">
            <h5>{category.name}</h5>
            <p className="description">{category.description}</p>
            <span className="price">¥{category.price}</span>
          </div>
        ))}
      </div>

      {/* 可用时间展示 */}
      {menu.availableTimes && (
        <div className="availability-info">
          <p>{formatAvailability(menu.availableTimes)}</p>
        </div>
      )}

      {/* 预订信息展示 */}
      {menu.requiresReservation && (
        <div className="reservation-info">
          <p>
            Reservation required 
            {menu.minimumDiners && ` (${menu.minimumDiners}-${menu.maximumDiners} guests)`}
          </p>
        </div>
      )}

      {/* 菜品列表展示 */}
      {menu.dishes?.length > 0 && (
        <DishList 
          dishes={menu.dishes} 
          restaurantSlug={restaurantSlug}
        />
      )}
    </div>
  );
};

// 分离出 DishList 组件
const DishList = ({ dishes, restaurantSlug }) => {
  if (!dishes?.length) {
    return <p className="no-dishes">No dishes available in this menu</p>;
  }

  return (
    <div className="dishes-grid">
      {dishes.map(dish => (
        <DishCard 
          key={dish.slug} 
          dish={dish}
          restaurantSlug={restaurantSlug}
        />
      ))}
    </div>
  );
};

const DishCard = React.memo(({ dish, restaurantSlug }) => (
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