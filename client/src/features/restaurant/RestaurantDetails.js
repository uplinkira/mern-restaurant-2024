// client/src/features/restaurant/RestaurantDetails.js
import React from 'react';
import { Link } from 'react-router-dom';
import MenuSection from './MenuSection';
import '../../App.css';

/**
 * 餐厅详情展示组件
 * 负责展示餐厅的详细信息，包括基本信息、特色、营业时间等
 * 
 * @param {Object} props
 * @param {Object} props.restaurant - 餐厅详细信息对象
 * @param {string} props.restaurant.name - 餐厅名称
 * @param {string} props.restaurant.cuisineType - 餐厅类型
 * @param {string} props.restaurant.description - 餐厅描述
 * @param {Object} props.restaurant.rating - 评分信息
 * @param {number} props.restaurant.maxCapacity - 最大容纳人数
 * @param {string} props.restaurant.priceRange - 价格区间
 * @param {Object} props.restaurant.address - 地址信息
 * @param {Object} props.restaurant.openingHours - 营业时间
 * @param {Array} props.restaurant.specialties - 特色菜品
 * @param {Array} props.restaurant.menuList - 菜单列表
 */
const RestaurantDetails = ({ restaurant }) => {
  /**
   * 解析时间范围字符串
   * @param {string} timeString - 格式为 "HH:MM - HH:MM" 的时间字符串
   * @returns {Object} 包含开始和结束时间的对象
   */
  const parseTimeRange = (timeString) => {
    if (!timeString) return { open: undefined, close: undefined };
    const [open, close] = timeString.split('-').map(t => t.trim());
    return { open, close };
  };

  /**
   * 渲染餐厅基本信息区域
   * 包括名称、类型、描述和关键特征（评分、容量、价格区间）
   * @returns {JSX.Element} 餐厅基本信息的 JSX
   */
  const renderHeroSection = () => (
    <div className="restaurant-hero">
      <div className="hero-header">
        <h1 className="restaurant-name">{restaurant.name}</h1>
        {restaurant.cuisineType && (
          <div className="restaurant-type">{restaurant.cuisineType}</div>
        )}
      </div>

      {restaurant.description && (
        <div className="restaurant-description">
          {restaurant.description}
        </div>
      )}

      {/* 关键信息卡片 - 只保留 Max Capacity */}
      {restaurant.maxCapacity && (
        <div className="key-features">
          <div className="key-feature-card">
            <div className="feature-icon">👥</div>
            <div className="feature-info">
              <div className="feature-value">{restaurant.maxCapacity}</div>
              <div className="feature-label">Max Capacity</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /**
   * 渲染餐厅详细信息区域
   * 包括联系方式、营业时间和特色菜品
   * @returns {JSX.Element} 餐厅详细信息的 JSX
   */
  const renderInfoSections = () => (
    <div className="info-sections">
      {/* 联系信息 */}
      {restaurant.address && (
        <div className="info-section">
          <h3 className="section-title">Contact</h3>
          <div className="contact-details">
            <div className="contact-item">
              <i className="location-icon"></i>
              <div>
                {restaurant.address.street && <p>{restaurant.address.street}</p>}
                {restaurant.address.city && restaurant.address.state && (
                  <p>{restaurant.address.city}, {restaurant.address.state}</p>
                )}
                {restaurant.address.zipCode && <p>{restaurant.address.zipCode}</p>}
              </div>
            </div>
            {restaurant.phone && (
              <div className="contact-item">
                <i className="phone-icon"></i>
                <p>{restaurant.phone}</p>
              </div>
            )}
            {restaurant.email && (
              <div className="contact-item">
                <i className="email-icon"></i>
                <p>{restaurant.email}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 营业时间 */}
      {restaurant.openingHours && (
        <div className="info-section">
          <h3 className="section-title">Hours</h3>
          <div className="hours-grid">
            {Object.entries(restaurant.openingHours).map(([day, hours]) => {
              const { open, close } = typeof hours === 'string' ? 
                parseTimeRange(hours) : hours;
              return (
                <div key={day} className="hours-row">
                  <span className="day">{day}</span>
                  <span className="hours">
                    {open && close ? `${open} - ${close}` : 'Closed'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 特色菜品 */}
      {restaurant.specialties?.length > 0 && (
        <div className="info-section">
          <h3 className="section-title">Specialties</h3>
          <div className="specialties-grid">
            {restaurant.specialties.map((specialty, index) => (
              <div 
                key={`specialty-${index}`} 
                className="specialty-card"
              >
                <div className="specialty-icon">
                  <i className="fas fa-star"></i>
                </div>
                <div className="specialty-content">
                  <h3>{specialty}</h3>
                  <span className="specialty-tag">
                    {specialty.includes('VR') ? 'VR Experience' : 
                     specialty.includes('Seasonal') ? 'Seasonal' : 
                     'Signature'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="restaurant-details">
      {renderHeroSection()}
      {renderInfoSections()}
      {/* Menus Section */}
      {restaurant?.menuList?.length > 0 && (
        <MenuSection 
          menus={restaurant.menuList} 
          restaurantSlug={restaurant.slug}
        />
      )}
    </div>
  );
};

export default RestaurantDetails;