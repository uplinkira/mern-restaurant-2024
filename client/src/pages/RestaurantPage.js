// client/src/pages/RestaurantPage.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchRestaurantDetails,
  selectCurrentRestaurant,
  selectRestaurantStatuses,
  selectRestaurantErrors,
} from '../redux/slices/restaurantSlice';
import RestaurantDetails from '../features/restaurant/RestaurantDetails';
import '../App.css';

const LoadingSkeleton = () => (
  <div className="loading-container" role="status">
    <div className="loading-spinner"></div>
    <p className="loading-text">Loading restaurant information...</p>
  </div>
);

const ErrorView = ({ error, onRetry, onBack }) => (
  <div className="error-container" role="alert">
    <h2>Unable to Load Restaurant</h2>
    <p className="error-message">
      {error?.message || 'An unexpected error occurred'}
    </p>
    <div className="error-actions">
      <button
        onClick={onRetry}
        className="retry-button"
      >
        Retry
      </button>
      <button
        onClick={onBack}
        className="back-button"
      >
        Return to Restaurants
      </button>
    </div>
  </div>
);

const NotFoundView = ({ onBack }) => (
  <div className="not-found-container" role="alert">
    <h2>Restaurant Not Found</h2>
    <p>The restaurant you're looking for doesn't exist or has been removed.</p>
    <button
      onClick={onBack}
      className="back-button"
    >
      Browse Restaurants
    </button>
  </div>
);

const RestaurantPage = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentRestaurant = useSelector(selectCurrentRestaurant);
  const { detail: restaurantStatus } = useSelector(selectRestaurantStatuses);
  const { detail: restaurantError } = useSelector(selectRestaurantErrors);

  useEffect(() => {
    if (slug) {
      dispatch(fetchRestaurantDetails({ slug }));
    }
  }, [dispatch, slug]);

  const handleRetry = () => {
    dispatch(fetchRestaurantDetails({ slug }));
  };

  const handleBack = () => {
    navigate('/restaurants');
  };

  // Initial loading state
  if (restaurantStatus === 'loading' && !currentRestaurant) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (restaurantStatus === 'failed') {
    return (
      <ErrorView 
        error={restaurantError}
        onRetry={handleRetry}
        onBack={handleBack}
      />
    );
  }

  // Success state
  return (
    <div className="restaurant-page">
      <div className="restaurant-page-content">
        {restaurantStatus === 'loading' && !currentRestaurant && (
          <div className="loading-overlay">
            <LoadingSkeleton />
          </div>
        )}
        {currentRestaurant && (
          <RestaurantDetails 
            restaurant={currentRestaurant}
          />
        )}
      </div>
    </div>
  );
};

export default React.memo(RestaurantPage);