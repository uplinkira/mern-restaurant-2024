// client/src/features/search/SearchResults.js
import React, { useEffect } from 'react';
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

  useEffect(() => {
    console.log('Current search state:', {
      activeFilter,
      restaurants,
      dishes,
      products
    });
  }, [activeFilter, restaurants, dishes, products]);

  const renderRestaurant = (restaurant) => (
    <Link to={`/restaurant/${restaurant.slug}`} className="restaurant-link">
      <h3>{restaurant.name}</h3>
      {restaurant.cuisineType && <p className="cuisine-type">{restaurant.cuisineType}</p>}
      <div className="restaurant-details">
        {restaurant.vrExperience && <span className="vr-badge">VR Experience</span>}
        {restaurant.capacity && <span className="capacity">Capacity: {restaurant.capacity}</span>}
        {restaurant.description && <p className="description">{restaurant.description}</p>}
      </div>
    </Link>
  );

  const renderDish = (dish) => (
    <Link to={`/dish/${dish.slug}`} className="dish-link">
      <h3>{dish.name}</h3>
      <p>{dish.description}</p>
      <div className="dish-details">
        <span className="price">{dish.formattedPrice || `¥${dish.price?.toFixed(2)}`}</span>
        {dish.signature && <span className="signature">Signature Dish</span>}
        {dish.chenPiAge && (
          <span className="age">{dish.chenPiAge} Year Aged Chen Pi</span>
        )}
        {dish.allergenAlert && (
          <span className="allergens">{dish.allergenAlert}</span>
        )}
      </div>
    </Link>
  );

  const renderProduct = (product) => (
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
  );

  const renderResults = () => {
    const config = {
      restaurant: {
        items: restaurants,
        render: renderRestaurant,
        emptyMessage: 'No restaurants found'
      },
      dish: {
        items: dishes,
        render: renderDish,
        emptyMessage: 'No dishes found'
      },
      product: {
        items: products,
        render: renderProduct,
        emptyMessage: 'No products found'
      }
    }[activeFilter];

    if (!config) return null;

    const { items, render, emptyMessage } = config;
    
    if (!items?.length) {
      return <div>{emptyMessage}</div>;
    }

    return (
      <div>
        {items.map(item => (
          <div key={item.slug}>
            {render(item)}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

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