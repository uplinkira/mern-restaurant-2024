import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const SearchResults = () => {
  const { searchResults, status, error } = useSelector(state => state.restaurants);

  console.log(searchResults);  // Log the results to check the response data

  // Loading state
  if (status === 'loading') return <div>Searching...</div>;

  // Error state
  if (error) return <div>Error: {error}</div>;

  // No results state
  if (status === 'succeeded' && (!searchResults || (!searchResults.restaurants.length && !searchResults.dishes.length && !searchResults.products.length))) {
    return <div>No results found for your search query.</div>;
  }

  return (
    <div className="search-results main-content">
      <h2>Search Results</h2>

      {/* Display Restaurant Cards */}
      {searchResults.restaurants?.length > 0 && (
        <div className="results-section">
          <h3>Restaurants</h3>
          <div className="card-grid">
            {searchResults.restaurants.map(restaurant => (
              <div key={restaurant._id} className="card">
                <h4>{restaurant.name}</h4>
                <p>{restaurant.cuisineType}</p>
                <Link to={`/restaurant/${restaurant._id}`} className="btn">View Details</Link> {/* Link to restaurant details */}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Display Dish Cards */}
      {searchResults.dishes?.length > 0 && (
        <div className="results-section">
          <h3>Dishes</h3>
          <div className="card-grid">
            {searchResults.dishes.map(dish => (
              <div key={dish._id} className="card">
                <h4>{dish.name}</h4>
                <p>{dish.description}</p>
                <p className="price">Price: ${dish.price}</p>
                <Link to={`/dish/${dish._id}`} className="btn">View Dish Details</Link> {/* Link to dish details */}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Display Product Cards */}
      {searchResults.products?.length > 0 && (
        <div className="results-section">
          <h3>Products</h3>
          <div className="card-grid">
            {searchResults.products.map(product => (
              <div key={product._id} className="card">
                <h4>{product.name}</h4>
                <p>{product.description}</p>
                <p className="price">Price: ${product.price}</p>
                <Link to={`/product/${product._id}`} className="btn">View Product Details</Link> {/* Link to product details */}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
