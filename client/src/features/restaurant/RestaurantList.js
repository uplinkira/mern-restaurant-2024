// client/src/features/restaurant/RestaurantList.js
import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  fetchRestaurants, 
  selectFilteredRestaurants,
  selectRestaurantListStatus,
  selectRestaurantError,
  selectRestaurantFilters,
  selectRestaurantPagination,
  selectHasMore,
  setFilters,
  clearFilters
} from '../../redux/slices/restaurantSlice';
import '../../App.css';

const CUISINE_TYPES = [
  'Modern Cantonese',
  'Traditional Cantonese',
  'Fusion'
];

const FiltersComponent = React.memo(({ onFilterChange }) => {
  const filters = useSelector(selectRestaurantFilters);

  return (
    <div className="filters-section">
      <div className="filter-group">
        <label>Cuisine Type</label>
        <select 
          value={filters.cuisineType || ''}
          onChange={(e) => onFilterChange('cuisineType', e.target.value || null)}
        >
          <option value="">All Cuisines</option>
          {CUISINE_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={filters.isVRExperience || false}
            onChange={(e) => onFilterChange('isVRExperience', e.target.checked)}
          />
          VR Experience Only
        </label>
      </div>
    </div>
  );
});

const RestaurantCard = React.memo(({ restaurant }) => {
  const truncateDescription = (text, maxLength = 150) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const isCurrentlyOpen = useMemo(() => {
    if (!restaurant.openingHours) return false;
    
    const now = new Date();
    const day = now.toLocaleString('en-us', { weekday: 'long' });
    const currentTime = now.toLocaleString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });

    const hours = restaurant.openingHours[day];
    if (!hours || hours.closed) return false;

    return currentTime >= hours.open && currentTime <= hours.close;
  }, [restaurant.openingHours]);

  return (
    <div className="restaurant-card">
      <div className="card-content">
        <h3 className="restaurant-name">
          {restaurant.name}
          {restaurant.status === 'coming_soon' && (
            <span className="coming-soon-badge">Coming Soon</span>
          )}
        </h3>
        
        <div className="restaurant-info">
          <span className="cuisine-type">{restaurant.cuisineType}</span>
          {restaurant.isVRExperience && (
            <span className="vr-badge" aria-label="Virtual Reality Experience Available">
              VR Experience
            </span>
          )}
        </div>
        
        <p className="description">
          {truncateDescription(restaurant.description)}
        </p>
        
        {restaurant.specialties?.length > 0 && (
          <div className="specialties">
            {restaurant.specialties.slice(0, 3).map((specialty, index) => (
              <span 
                key={`${restaurant.slug}-specialty-${index}`} 
                className="specialty-tag"
              >
                {specialty}
              </span>
            ))}
            {restaurant.specialties.length > 3 && (
              <span className="more-specialties">
                +{restaurant.specialties.length - 3} more
              </span>
            )}
          </div>
        )}
        
        <div className="restaurant-footer">
          <div className="status-info">
            <span className={`hours ${isCurrentlyOpen ? 'open' : 'closed'}`}>
              {isCurrentlyOpen ? 'Open Now' : 'Closed'}
            </span>
            {restaurant.maxCapacity && (
              <span className="capacity">
                Up to {restaurant.maxCapacity} guests
              </span>
            )}
          </div>
          
          <Link 
            to={`/restaurant/${restaurant.slug}`} 
            className="view-details-btn"
            aria-label={`View details for ${restaurant.name}`}
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
});

const RestaurantList = ({ 
  limit, 
  displayAsFeatured = false, 
  className = '',
  showFilters = false
}) => {
  const dispatch = useDispatch();
  const restaurants = useSelector(selectFilteredRestaurants);
  const status = useSelector(selectRestaurantListStatus);
  const error = useSelector(selectRestaurantError);
  const filters = useSelector(selectRestaurantFilters);
  const pagination = useSelector(selectRestaurantPagination);
  const hasMore = useSelector(selectHasMore);

  const observer = useRef();
  const lastRestaurantRef = useCallback(node => {
    if (status === 'loading') return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        dispatch(fetchRestaurants({ 
          ...filters,
          page: pagination.currentPage + 1,
          limit: 12
        }));
      }
    });
    
    if (node) observer.current.observe(node);
  }, [status, hasMore, filters, pagination.currentPage, dispatch]);

  useEffect(() => {
    dispatch(fetchRestaurants({ 
      ...filters,
      page: 1,
      limit: 12
    }));
  }, [dispatch, filters]);

  const handleFilterChange = (filterKey, value) => {
    dispatch(setFilters({ [filterKey]: value }));
  };

  if (status === 'loading' && !restaurants.length) {
    return (
      <div className="loading" role="status">
        <div className="loading-spinner"></div>
        <span>Loading restaurants...</span>
      </div>
    );
  }

  if (status === 'failed' && !restaurants.length) {
    return (
      <div className="error" role="alert">
        <p>Unable to load restaurants</p>
        <p className="error-details">{error}</p>
        <button 
          onClick={() => dispatch(fetchRestaurants({...filters, page: 1}))}
          className="retry-btn"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!restaurants.length) {
    return (
      <div className="no-results">
        <p>No restaurants found</p>
        <button 
          onClick={() => dispatch(clearFilters())}
          className="clear-filters-btn"
        >
          Clear Filters
        </button>
      </div>
    );
  }

  return (
    <div className={`restaurant-list-container ${className}`}>
      {showFilters && (
        <div className="filters-container">
          <h2>Find Your Restaurant</h2>
          <FiltersComponent onFilterChange={handleFilterChange} />
          <button 
            onClick={() => dispatch(clearFilters())}
            className="clear-filters-btn"
          >
            Clear All Filters
          </button>
        </div>
      )}

      <div className="restaurant-grid">
        {restaurants.map((restaurant, index) => (
          <div
            key={restaurant.slug}
            ref={index === restaurants.length - 1 ? lastRestaurantRef : null}
          >
            <RestaurantCard restaurant={restaurant} />
          </div>
        ))}
      </div>

      {status === 'loading' && restaurants.length > 0 && (
        <div className="loading-more">
          <div className="loading-spinner"></div>
          <span>Loading more restaurants...</span>
        </div>
      )}
    </div>
  );
};

export default RestaurantList;