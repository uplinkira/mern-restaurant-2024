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
      
      {/* 菜单筛选器 */}
      <div className="menu-filters">
        <select
          className="filter-select"
          value={menuFilters.category || ''}
          onChange={(e) => dispatch(setMenuFilters({ category: e.target.value || null }))}
        >
          <option value="">All Categories</option>
          {menuCategories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* 菜单分类展示 */}
      <div className="menu-categories">
        {Object.entries(menusByCategory).map(([category, categoryMenus]) => (
          (!menuFilters.category || menuFilters.category === category) && (
            <div key={category} className="menu-category-card">
              <div className="category-header">
                <h3 className="category-title">{category}</h3>
                <p className="category-description">
                  {categoryMenus[0]?.description}
                </p>
              </div>

              {/* 价格档次展示 */}
              {categoryMenus[0]?.priceCategories?.length > 0 && (
                <div className="price-tiers">
                  {categoryMenus[0].priceCategories.map((tier, index) => (
                    <div key={index} className="price-tier">
                      <div className="tier-header">
                        <h4 className="tier-name">{tier.name}</h4>
                        <span className="tier-price">¥{tier.price}</span>
                      </div>
                      {tier.description && (
                        <p className="tier-description">{tier.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 该分类下的菜品 */}
              <div className="category-dishes">
                <div className="dishes-grid">
                  {categoryMenus.map(menu => 
                    menu.dishes?.map(dish => (
                      <Link 
                        key={dish.slug} 
                        to={`/dish/${dish.slug}`}
                        className="dish-card"
                      >
                        <div className="dish-content">
                          <div className="dish-header">
                            <h4 className="dish-name">{dish.name}</h4>
                            <p className="dish-description">{dish.description}</p>
                          </div>
                          <div className="dish-footer">
                            <span className="dish-price">¥{dish.price}</span>
                            {dish.isSignatureDish && (
                              <span className="signature-badge">Signature</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default MenuSection;