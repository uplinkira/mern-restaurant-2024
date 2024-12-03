// client/src/features/restaurant/RestaurantList.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
 fetchRestaurants, 
 selectFilteredRestaurants,
 selectRestaurantListStatus,
 selectRestaurantError,
 selectFeaturedRestaurants
} from '../../redux/slices/restaurantSlice';
import '../../App.css';

const RestaurantCard = React.memo(({ restaurant }) => {
 const truncateDescription = (text, maxLength = 150) => {
   if (!text) return '';
   return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
 };

 return (
   <div className="restaurant-card">
     <div className="card-content">
       <h3 className="restaurant-name">{restaurant.name}</h3>
       
       <div className="restaurant-info">
         <span className="cuisine-type">{restaurant.cuisineType}</span>
         {restaurant.isVRExperience && (
           <span className="vr-badge" aria-label="Virtual Reality Experience Available">
             VR Experience
           </span>
         )}
         {restaurant.priceRange && (
           <span className="price-range">
             {restaurant.priceRange}
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
           <span className="hours">
             {restaurant.openingHours?.Monday !== 'Closed' ? (
               <span className="open-status">Open Today</span>
             ) : (
               <span className="closed-status">Closed Today</span>
             )}
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
 const featuredRestaurants = useSelector(selectFeaturedRestaurants);
 const status = useSelector(selectRestaurantListStatus);
 const error = useSelector(selectRestaurantError);

 useEffect(() => {
   if (status === 'idle') {
     dispatch(fetchRestaurants({ 
       limit: displayAsFeatured ? 3 : limit,
       featured: displayAsFeatured 
     }));
   }
 }, [dispatch, status, limit, displayAsFeatured]);

 if (status === 'loading') {
   return (
     <div className="loading" role="status">
       <div className="loading-spinner"></div>
       <span>Loading restaurants...</span>
     </div>
   );
 }

 if (status === 'failed') {
   return (
     <div className="error" role="alert">
       <p>Unable to load restaurants</p>
       <p className="error-details">{error}</p>
     </div>
   );
 }

 const displayedRestaurants = displayAsFeatured 
   ? featuredRestaurants 
   : (limit ? restaurants.slice(0, limit) : restaurants);

 if (!displayedRestaurants?.length) {
   return (
     <div className="no-data" role="status">
       <p>No restaurants available</p>
       {showFilters && (
         <p>Try adjusting your filters to see more results</p>
       )}
     </div>
   );
 }

 return (
   <section 
     className={`restaurant-list ${className}`.trim()}
     aria-label={displayAsFeatured ? 'Featured Restaurants' : 'Restaurant List'}
   >
     {displayAsFeatured && (
       <div className="section-header">
         <h2>Featured Restaurants</h2>
         {displayedRestaurants.length >= 3 && (
           <Link to="/restaurants" className="view-all-link">
             View All
           </Link>
         )}
       </div>
     )}

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
           <RestaurantCard restaurant={restaurant} />
         </div>
       ))}
     </div>
   </section>
 );
};

export default RestaurantList;