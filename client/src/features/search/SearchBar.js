import { useDispatch, useSelector } from 'react-redux';
import { searchItems, clearSearchResults, setFilter } from '../../redux/slices/searchSlice';
import { useState, useEffect } from 'react';

const SearchBar = () => {
 const [query, setQuery] = useState('');
 const dispatch = useDispatch();
 const { 
   activeFilter,
   restaurants, 
   menus, 
   dishes, 
   products, 
   loading, 
   error 
 } = useSelector((state) => state.search);

 useEffect(() => {
   const timer = setTimeout(() => {
     if (query.trim()) {
       dispatch(searchItems({ query, filter: activeFilter }));
     }
   }, 500);

   return () => clearTimeout(timer);
 }, [query, activeFilter, dispatch]);

 const handleFilterChange = (newFilter) => {
   dispatch(setFilter(newFilter));
   if (query.trim()) {
     dispatch(searchItems({ query, filter: newFilter }));
   }
 };

 const handleClear = () => {
   setQuery('');
   dispatch(clearSearchResults());
 };

 return (
   <div className="search-container">
     <div className="filter-buttons">
       <button
         className={`filter-btn ${activeFilter === 'restaurant' ? 'active' : ''}`}
         onClick={() => handleFilterChange('restaurant')}
       >
         Restaurants
       </button>
       <button
         className={`filter-btn ${activeFilter === 'menu' ? 'active' : ''}`}
         onClick={() => handleFilterChange('menu')}
       >
         Menus
       </button>
       <button
         className={`filter-btn ${activeFilter === 'dish' ? 'active' : ''}`}
         onClick={() => handleFilterChange('dish')}
       >
         Dishes
       </button>
       <button
         className={`filter-btn ${activeFilter === 'product' ? 'active' : ''}`}
         onClick={() => handleFilterChange('product')}
       >
         Products
       </button>
     </div>

     <div className="search-input-container">
       <input
         type="text"
         value={query}
         onChange={(e) => setQuery(e.target.value)}
         placeholder={`Search for ${activeFilter}s...`}
         className="search-input"
       />
       <button 
         onClick={handleClear} 
         disabled={loading || !query.trim()} 
         className="clear-btn"
       >
         Clear
       </button>
       <button 
         onClick={() => dispatch(searchItems({ query, filter: activeFilter }))} 
         disabled={loading} 
         className="search-btn"
       >
         {loading ? 'Searching...' : 'Search'}
       </button>
     </div>

     {error && <p className="error-message">{error}</p>}
     {loading && <p className="loading-message">Loading results...</p>}

     <div className="search-results">
       {activeFilter === 'restaurant' && (
         <>
           <h3>Restaurants</h3>
           {restaurants.length > 0 ? (
             <ul className="results-list">
               {restaurants.map((restaurant) => (
                 <li key={restaurant.slug} className="result-item">
                   <a href={`/restaurant/${restaurant.slug}`} className="result-link">
                     {restaurant.name}
                     {restaurant.cuisineType && <span className="cuisine-type">{restaurant.cuisineType}</span>}
                     {restaurant.vrExperience && <span className="vr-badge">VR</span>}
                   </a>
                 </li>
               ))}
             </ul>
           ) : (
             <p className="no-results">No restaurants found</p>
           )}
         </>
       )}

       {activeFilter === 'menu' && (
         <>
           <h3>Menus</h3>
           {menus.length > 0 ? (
             <ul className="results-list">
               {menus.map((menu) => (
                 <li key={menu.slug} className="result-item">
                   <a href={`/menu/${menu.slug}`} className="result-link">
                     {menu.name}
                     {menu.dishCount > 0 && 
                       <span className="dish-count">{menu.dishCount} dishes</span>
                     }
                   </a>
                 </li>
               ))}
             </ul>
           ) : (
             <p className="no-results">No menus found</p>
           )}
         </>
       )}

       {activeFilter === 'dish' && (
         <>
           <h3>Dishes</h3>
           {dishes.length > 0 ? (
             <ul className="results-list">
               {dishes.map((dish) => (
                 <li key={dish.slug} className="result-item">
                   <a href={`/dish/${dish.slug}`} className="result-link">
                     {dish.name}
                     <span className="price">{dish.formattedPrice}</span>
                     {dish.signature && <span className="signature-badge">Signature</span>}
                     {dish.allergenAlert && <span className="allergen-info">{dish.allergenAlert}</span>}
                   </a>
                 </li>
               ))}
             </ul>
           ) : (
             <p className="no-results">No dishes found</p>
           )}
         </>
       )}

       {activeFilter === 'product' && (
         <>
           <h3>Products</h3>
           {products.length > 0 ? (
             <ul className="results-list">
               {products.map((product) => (
                 <li key={product.slug} className="result-item">
                   <a href={`/product/${product.slug}`} className="result-link">
                     {product.name}
                     <span className="price">{product.formattedPrice}</span>
                     {product.featured && <span className="featured-badge">Featured</span>}
                     {product.availability && 
                       <span className="availability">{product.availability}</span>
                     }
                   </a>
                 </li>
               ))}
             </ul>
           ) : (
             <p className="no-results">No products found</p>
           )}
         </>
       )}
     </div>
   </div>
 );
};

export default SearchBar;