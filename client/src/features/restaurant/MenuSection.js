import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchMenus,
  selectMenusByRestaurant,
  selectMenuStatuses,
  selectMenuErrors,
  selectMenuCache
} from '../../redux/slices/menuSlice';
import '../../App.css';

const MenuSection = ({ restaurant, restaurantSlug }) => {
  const dispatch = useDispatch();
  const menuStatus = useSelector(state => selectMenuStatuses(state).list);
  const menuError = useSelector(state => selectMenuErrors(state).list);
  const cache = useSelector(selectMenuCache);
  const storeMenus = useSelector(state => selectMenusByRestaurant(restaurantSlug)(state));
  
  // 使用 restaurant prop 中的菜单或从 store 获取
  const menus = restaurant?.menuDetails || storeMenus;

  useEffect(() => {
    if (restaurantSlug && !restaurant?.menuDetails?.length) {
      const shouldFetch = !cache.timestamp || 
                         cache.invalidated || 
                         cache.lastRestaurant !== restaurantSlug;

      if (shouldFetch) {
        dispatch(fetchMenus({ 
          restaurantSlug,
          forceFetch: cache.invalidated 
        }));
      }
    }
  }, [dispatch, restaurantSlug, restaurant?.menuDetails, cache]);

  // 菜单分类
  const categoryMenuMap = useMemo(() => {
    return menus?.reduce((acc, menu) => {
      if (!menu) return acc;
      const category = menu.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(menu);
      return acc;
    }, {}) || {};
  }, [menus]);

  // 渲染菜品卡片
  const renderDishCard = (dish) => (
    <DishCard 
      key={dish.slug} 
      dish={dish}
      restaurantName={restaurant?.name}
    />
  );

  // 渲染菜单
  const renderMenu = (menu) => {
    if (!menu) return null;
    
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
        
        {menu.dishes?.length > 0 ? (
          <div className="dishes-grid">
            {menu.dishes.map(renderDishCard)}
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

  // 加载状态
  if (menuStatus === 'loading' && !menus?.length) {
    return <div className="loading" role="alert">Loading menus...</div>;
  }

  // 错误状态
  if (menuStatus === 'failed') {
    return (
      <div className="error" role="alert">
        <p>Error loading menus: {menuError?.message}</p>
        <button 
          onClick={() => dispatch(fetchMenus({ 
            restaurantSlug, 
            forceFetch: true 
          }))}
          className="retry-button"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  // 空状态
  if (!menus?.length) {
    return (
      <div className="no-menus" role="alert">
        <h2>Our Menus</h2>
        <p>No menus available at the moment.</p>
      </div>
    );
  }

  // 主渲染
  return (
    <div className="menus-section">
      <h2>Our Menus</h2>
      {Object.entries(categoryMenuMap).map(([category, categoryMenus]) => (
        <div key={category} className="menu-category">
          <h3 className="category-title">{category}</h3>
          {categoryMenus.map(renderMenu)}
        </div>
      ))}
    </div>
  );
};

// DishCard 组件
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
), (prevProps, nextProps) => {
  return JSON.stringify(prevProps.dish) === JSON.stringify(nextProps.dish) &&
         prevProps.restaurantName === nextProps.restaurantName;
});

// 格式化可用时间辅助函数
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

export default React.memo(MenuSection, (prevProps, nextProps) => {
  return prevProps.restaurantSlug === nextProps.restaurantSlug &&
         prevProps.restaurant?.slug === nextProps.restaurant?.slug;
});