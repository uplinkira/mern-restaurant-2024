// client/src/features/dish/DishDetails.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { fetchDishDetails } from '../../redux/slices/dishSlice';
import '../../App.css';

const DishDetails = () => {
 const { slug } = useParams();
 const dispatch = useDispatch();
 const { 
   currentDish: dish,
   status,
   error 
 } = useSelector((state) => state.dishes);

 useEffect(() => {
   if (slug) {
     dispatch(fetchDishDetails(slug));
   }
 }, [dispatch, slug]);

 if (status === 'loading') {
   return <div className="loading">Loading dish details...</div>;
 }

 if (error) {
   return <div className="error">Error: {error}</div>;
 }

 if (!dish) {
   return <div className="error">Dish not found</div>;
 }

 return (
   <div className="dish-details">
     {/* Main Info Section */}
     <div className="dish-header card">
       <h1>{dish.name}</h1>
       {dish.isSignatureDish && (
         <span className="signature-badge">Signature Dish</span>
       )}
       <p className="description">{dish.description}</p>
       <div className="price-info">
         <span className="price">${dish.price.toFixed(2)}</span>
         {dish.chenPiAge && (
           <span className="chen-pi-age">
             {dish.chenPiAge} Year Aged Chen Pi
           </span>
         )}
       </div>
     </div>

     {/* Details Grid */}
     <div className="details-grid">
       {/* Ingredients Section */}
       {dish.ingredients && dish.ingredients.length > 0 && (
         <div className="ingredients-section card">
           <h2>Ingredients</h2>
           <div className="ingredients-list">
             {dish.ingredients.map((ingredient, index) => (
               <span key={index} className="ingredient-tag">
                 {ingredient}
               </span>
             ))}
           </div>
         </div>
       )}

       {/* Allergens Section */}
       {dish.allergens && dish.allergens.length > 0 && (
         <div className="allergens-section card">
           <h2>Allergen Information</h2>
           <div className="allergens-list">
             {dish.allergens.map((allergen, index) => (
               <span key={index} className="allergen-tag">
                 {allergen}
               </span>
             ))}
           </div>
         </div>
       )}
     </div>

     {/* Restaurant & Menu Context */}
     {dish.restaurants && dish.restaurants.length > 0 && (
       <div className="context-section card">
         <h2>Available At</h2>
         <div className="restaurant-list">
           {dish.restaurants.map((restaurant) => (
             <Link 
               key={restaurant.slug} 
               to={`/restaurant/${restaurant.slug}`}
               className="restaurant-link"
             >
               <div className="restaurant-card">
                 <h3>{restaurant.name}</h3>
                 <span className="cuisine-type">{restaurant.cuisineType}</span>
               </div>
             </Link>
           ))}
         </div>
         {dish.menus && dish.menus.length > 0 && (
           <div className="menu-context">
             <h3>Featured In Menus</h3>
             <div className="menu-list">
               {dish.menus.map((menu, index) => (
                 <span key={index} className="menu-tag">
                   {menu}
                 </span>
               ))}
             </div>
           </div>
         )}
       </div>
     )}

     {/* Related Dishes */}
     {dish.relatedDishes && dish.relatedDishes.length > 0 && (
       <div className="related-section card">
         <h2>You Might Also Like</h2>
         <div className="related-dishes">
           {dish.relatedDishes.map((relatedDish) => (
             <Link 
               key={relatedDish.slug} 
               to={`/dish/${relatedDish.slug}`}
               className="related-dish-card"
             >
               <h4>{relatedDish.name}</h4>
               <span className="price">
                 ${relatedDish.price.toFixed(2)}
               </span>
             </Link>
           ))}
         </div>
       </div>
     )}
   </div>
 );
};

export default DishDetails;