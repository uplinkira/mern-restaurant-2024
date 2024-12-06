// client/src/features/restaurant/RestaurantList.js
import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  fetchRestaurants, 
  selectFilteredRestaurants,
  selectRestaurantStatuses,
  selectRestaurantErrors,
  selectCategorizedRestaurants,
  selectRestaurantFilters,
  setFilters,
  clearFilters
} from '../../redux/slices/restaurantSlice';
import '../../App.css';

// Constants remain the same
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

// RestaurantCard component remains the same
const RestaurantCard = React.memo(({ restaurant }) => {
  // ... RestaurantCard implementation remains unchanged ...
});

// Filters component remains the same
const Filters = React.memo(({ onFilterChange }) => {
  // ... Filters implementation remains unchanged ...
});

const RestaurantList = ({ 
  limit, 
  displayAsFeatured = false, 
  className = '',
  showFilters = false
}) => {
  const dispatch = useDispatch();
  const restaurants = useSelector(selectFilteredRestaurants);
  const { featured: featuredRestaurants } = useSelector(selectCategorizedRestaurants);
  const { list: status } = useSelector(selectRestaurantStatuses);
  const { list: error } = useSelector(selectRestaurantErrors);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchRestaurants({ 
        limit: displayAsFeatured ? 3 : limit,
        featured: displayAsFeatured 
      }));
    }
  }, [dispatch, limit, displayAsFeatured, status]);

  const handleFilterChange = (filterKey, value) => {
    dispatch(setFilters({ [filterKey]: value }));
  };

  const displayedRestaurants = useMemo(() => {
    const list = displayAsFeatured ? featuredRestaurants : restaurants;
    return limit ? list.slice(0, limit) : list;
  }, [displayAsFeatured, featuredRestaurants, restaurants, limit]);

  // Loading state
  if (status === 'loading' && !displayedRestaurants.length) {
    return (
      <div className="loading" role="status">
        <div className="loading-spinner"></div>
        <span>Loading restaurants...</span>
      </div>
    );
  }

  // Error state
  if (status === 'failed') {
    return (
      <div className="error" role="alert">
        <p>Unable to load restaurants</p>
        <p className="error-details">{error?.message || 'An unexpected error occurred'}</p>
        <button 
          onClick={() => dispatch(fetchRestaurants({
            limit: displayAsFeatured ? 3 : limit,
            featured: displayAsFeatured,
            forceFetch: true
          }))}
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
          {displayedRestaurants.length >= 3 && (
            <Link to="/restaurants" className="view-all-link">
              View All
            </Link>
          )}
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

      {!displayedRestaurants.length ? (
        <div className="no-data" role="status">
          {status === 'succeeded' ? (
            <>
              <p>No restaurants available</p>
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
            </>
          ) : (
            <p>Loading restaurants...</p>
          )}
        </div>
      ) : (
        <div 
          className={`restaurant-grid ${displayAsFeatured ? 'featured-grid' : ''}`}
          role="list"
        >
          {displayedRestaurants.map((restaurant) => (
            <div 
              key={restaurant.slug} 
              className="restaurant-grid-item" 
              role="listitem"
            >
              <Link to={`/restaurant/${restaurant.slug}`} className="restaurant-card">
                <RestaurantCard restaurant={restaurant} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default React.memo(RestaurantList, (prevProps, nextProps) => {
  return (
    prevProps.limit === nextProps.limit &&
    prevProps.displayAsFeatured === nextProps.displayAsFeatured &&
    prevProps.className === nextProps.className &&
    prevProps.showFilters === nextProps.showFilters
  );
});