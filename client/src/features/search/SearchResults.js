// client/src/features/search/SearchResults.js
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const SearchResults = () => {
  const {
    activeFilter,
    restaurants,
    dishes,
    products,
    loading,
    error,
    totalItems,
    currentPage,
    itemsPerPage
  } = useSelector((state) => state.search);

  const resultConfigs = useMemo(() => ({
    restaurant: {
      title: 'Restaurant Results',
      items: restaurants,
      render: (restaurant) => (
        <Link to={`/restaurant/${restaurant.slug}`} className="restaurant-link">
          <h3>{restaurant.name}</h3>
          <p className="cuisine-type">{restaurant.cuisineType}</p>
          <div className="restaurant-details">
            {restaurant.vrExperience && <span className="vr-badge">VR Experience</span>}
            {restaurant.capacity && <span className="capacity">{restaurant.capacity}</span>}
            {restaurant.description && (
              <p className="description">{restaurant.description.substring(0, 150)}...</p>
            )}
          </div>
        </Link>
      )
    },
    dish: {
      title: 'Dish Results',
      items: dishes,
      render: (dish) => (
        <Link to={`/dish/${dish.slug}`} className="dish-link">
          <h3>{dish.name}</h3>
          <p>{dish.description}</p>
          <div className="dish-details">
            <span className="price">{dish.formattedPrice}</span>
            {dish.signature && <span className="signature">Signature Dish</span>}
            {dish.chenPiAge && (
              <span className="age">{dish.chenPiAge} Year Aged Chen Pi</span>
            )}
            {dish.allergenAlert && (
              <span className="allergens">{dish.allergenAlert}</span>
            )}
          </div>
        </Link>
      )
    },
    product: {
      title: 'Product Results',
      items: products,
      render: (product) => (
        <Link to={`/product/${product.slug}`} className="product-link">
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <div className="product-details">
            <span className="price">{product.formattedPrice}</span>
            {product.featured && <span className="featured">Featured</span>}
            <span className="availability">{product.availability}</span>
            {product.allergenAlert && (
              <span className="allergens">{product.allergenAlert}</span>
            )}
          </div>
        </Link>
      )
    }
  }), [restaurants, dishes, products]);

  if (loading) {
    return <div className="search-results-loading">Loading...</div>;
  }

  if (error) {
    return <div className="search-results-error">Error: {error}</div>;
  }

  const currentConfig = resultConfigs[activeFilter];
  if (!currentConfig) {
    return <div className="search-results-error">Please select a valid search category.</div>;
  }

  return (
    <div className="search-results">
      <div className="results-header">
        <h1>Search Results</h1>
        <p>
          Showing {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
        </p>
      </div>
      
      <div className={`${activeFilter}-results`}>
        <h2>{currentConfig.title} ({currentConfig.items.length})</h2>
        {currentConfig.items.length > 0 ? (
          <ul className={`${activeFilter}-list`}>
            {currentConfig.items.map(item => (
              <li key={item.slug} className={`${activeFilter}-item`}>
                {currentConfig.render(item)}
              </li>
            ))}
          </ul>
        ) : (
          <p>No {activeFilter}s found matching your search criteria.</p>
        )}
      </div>
    </div>
  );
};

export default SearchResults;