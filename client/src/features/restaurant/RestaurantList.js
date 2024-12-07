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

const PRICE_RANGES = [
  { display: '¥', description: 'Under ¥50' },
  { display: '¥¥', description: '¥50-150' },
  { display: '¥¥¥', description: '¥150-300' },
  { display: '¥¥¥¥', description: 'Above ¥300' }
];

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
          {restaurant.priceRange && (
            <span className="price-range" title={
              PRICE_RANGES.find(r => r.display === restaurant.priceRange)?.description
            }>
              {restaurant.priceRange}
            </span>
          )}
          {restaurant.rating && (
            <span className="rating">
              ★ {restaurant.rating.average.toFixed(1)} ({restaurant.rating.count})
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
          
          {restaurant.location?.coordinates && (
            <span className="distance">
              {restaurant.distance ? 
                `${(restaurant.distance / 1000).toFixed(1)}km away` : 
                'View location'}
            </span>
          )}
          
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

const Filters = React.memo(({ onFilterChange }) => {
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
        <label>Price Range</label>
        <div className="price-range-buttons">
          {PRICE_RANGES.map(range => (
            <button
              key={range.display}
              className={`price-btn ${filters.priceRange === range.display ? 'active' : ''}`}
              onClick={() => onFilterChange('priceRange', 
                filters.priceRange === range.display ? null : range.display
              )}
              title={range.description}
            >
              {range.display}
            </button>
          ))}
        </div>
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
          limit: displayAsFeatured ? 3 : 12
        }));
      }
    });
    
    if (node) observer.current.observe(node);
  }, [status, hasMore, filters, pagination.currentPage, displayAsFeatured, dispatch]);

  useEffect(() => {
    dispatch(fetchRestaurants({ 
      ...filters,
      page: 1,
      limit: displayAsFeatured ? 3 : 12
    }));
  }, [dispatch, filters, displayAsFeatured]);

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
          Retry
        </button>
      </div>
    );
  }

  return (
    <section 
      className={`restaurant-list ${className}`.trim()}
      aria-label={displayAsFeatured ? 'Featured Restaurants' : 'Restaurant List'}
    >
      {displayAsFeatured ? (
        <div className="section-header">
          <h2>Featured Restaurants</h2>
          <Link to="/restaurants" className="view-all-link">
            View All
          </Link>
        </div>
      ) : showFilters && (
        <div className="list-header">
          <h2>Restaurants</h2>
          <div className="filters-container">
            <Filters onFilterChange={handleFilterChange} />
            <button 
              className="clear-filters-btn"
              onClick={() => dispatch(clearFilters())}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {!restaurants.length && status !== 'loading' ? (
        <div className="no-data" role="status">
          <p>No restaurants found</p>
          {showFilters && (
            <>
              <p>Try adjusting your filters to see more results</p>
              <button 
                className="clear-filters-btn"
                onClick={() => dispatch(clearFilters())}
              >
                Clear All Filters
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div 
            className={`restaurant-grid ${displayAsFeatured ? 'featured-grid' : ''}`}
            role="list"
          >
            {restaurants.map((restaurant, index) => (
              <div 
                key={restaurant.slug} 
                ref={restaurants.length === index + 1 ? lastRestaurantRef : null}
                className="restaurant-grid-item" 
                role="listitem"
              >
                <RestaurantCard restaurant={restaurant} />
              </div>
            ))}
          </div>
          
          {status === 'loading' && (
            <div className="loading-more" role="status">
              <div className="loading-spinner"></div>
              <span>Loading more restaurants...</span>
            </div>
          )}
          
          {status === 'noMore' && (
            <div className="no-more-results" role="status">
              <p>No more restaurants to load</p>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default RestaurantList;