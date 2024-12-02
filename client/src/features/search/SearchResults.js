// src/features/search/SearchResults.js
import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import '../../App.css';

const SearchResults = () => {
 const {
   activeFilter,
   restaurants,
   menus,
   dishes,
   products,
   loading,
   error,
   totalItems,
   currentPage,
   itemsPerPage
 } = useSelector((state) => state.search);

 if (loading) {
   return <div className="search-results-loading">Loading...</div>;
 }

 if (error) {
   return <div className="search-results-error">Error: {error}</div>;
 }

 const renderResults = () => {
   switch (activeFilter) {
     case 'restaurant':
       return (
         <div className="restaurants-results">
           <h2>Restaurant Results ({restaurants.length})</h2>
           {restaurants.length > 0 ? (
             <ul className="restaurant-list">
               {restaurants.map(restaurant => (
                 <li key={restaurant.slug} className="restaurant-item">
                   <Link to={`/restaurant/${restaurant.slug}`} className="restaurant-link">
                     <h3>{restaurant.name}</h3>
                     <p className="cuisine-type">{restaurant.cuisineType}</p>
                     {restaurant.vrExperience && <span className="vr-badge">VR Experience</span>}
                     {restaurant.capacity && <span className="capacity">{restaurant.capacity}</span>}
                   </Link>
                 </li>
               ))}
             </ul>
           ) : (
             <p>No restaurants found matching your search criteria.</p>
           )}
         </div>
       );

     case 'menu':
       return (
         <div className="menus-results">
           <h2>Menu Results ({menus.length})</h2>
           {menus.length > 0 ? (
             <ul className="menu-list">
               {menus.map(menu => (
                 <li key={menu.slug} className="menu-item">
                   <Link to={`/menu/${menu.slug}`} className="menu-link">
                     <h3>{menu.name}</h3>
                     <p>{menu.description}</p>
                     {menu.dishCount > 0 && <span className="dish-count">{menu.dishCount} dishes</span>}
                   </Link>
                 </li>
               ))}
             </ul>
           ) : (
             <p>No menus found matching your search criteria.</p>
           )}
         </div>
       );

     case 'dish':
       return (
         <div className="dishes-results">
           <h2>Dish Results ({dishes.length})</h2>
           {dishes.length > 0 ? (
             <ul className="dish-list">
               {dishes.map(dish => (
                 <li key={dish.slug} className="dish-item">
                   <Link to={`/dish/${dish.slug}`} className="dish-link">
                     <h3>{dish.name}</h3>
                     <p>{dish.description}</p>
                     <div className="dish-details">
                       <span className="price">{dish.formattedPrice}</span>
                       {dish.signature && <span className="signature">Signature Dish</span>}
                       {dish.chenPiAge && <span className="age">{dish.chenPiAge}</span>}
                       {dish.allergenAlert && <span className="allergens">{dish.allergenAlert}</span>}
                     </div>
                   </Link>
                 </li>
               ))}
             </ul>
           ) : (
             <p>No dishes found matching your search criteria.</p>
           )}
         </div>
       );

     case 'product':
       return (
         <div className="products-results">
           <h2>Product Results ({products.length})</h2>
           {products.length > 0 ? (
             <ul className="product-list">
               {products.map(product => (
                 <li key={product.slug} className="product-item">
                   <Link to={`/product/${product.slug}`} className="product-link">
                     <h3>{product.name}</h3>
                     <p>{product.description}</p>
                     <div className="product-details">
                       <span className="price">{product.formattedPrice}</span>
                       {product.featured && <span className="featured">Featured</span>}
                       <span className="availability">{product.availability}</span>
                       {product.allergenAlert && <span className="allergens">{product.allergenAlert}</span>}
                     </div>
                   </Link>
                 </li>
               ))}
             </ul>
           ) : (
             <p>No products found matching your search criteria.</p>
           )}
         </div>
       );

     default:
       return <p>Please select a search category.</p>;
   }
 };

 return (
   <div className="search-results">
     <div className="results-header">
       <h1>Search Results</h1>
       <p>
         Showing {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
       </p>
     </div>
     {renderResults()}
   </div>
 );
};

export default SearchResults;