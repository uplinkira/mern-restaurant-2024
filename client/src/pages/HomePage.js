// client/src/pages/HomePage.js - Simplified version
import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import RestaurantList from '../features/restaurant/RestaurantList';
import SearchBar from '../features/search/SearchBar';
import ProductList from '../features/product/ProductList';
import { selectSearchResults } from '../redux/slices/searchSlice';
import '../App.css';

const HomePage = () => {
  const searchResults = useSelector(selectSearchResults);
  
  return (
    <div className="home-container">
      <section className="hero-section" aria-label="welcome banner">
        <div className="hero-content">
          <h1>Welcome to Chen Pi Cuisine</h1>
          <p>Discover authentic Chinese dishes and premium Chen Pi products</p>
          <p className="subtitle">Experience traditional flavors enhanced by aged Chen Pi</p>
        </div>
        
        <div className="search-section" aria-label="unified search">
          <div className="search-container">
            <h2>Explore Our Collection</h2>
            <SearchBar enhanced={true} showFilters={true} />
          </div>

          {searchResults.length > 0 && (
            <div className="quick-results">
              <Link to="/search" className="view-results-link">
                View All Results
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="featured-content">
        <article className="featured-restaurants">
          <div className="section-header">
            <h2>Featured Restaurants</h2>
            <Link to="/restaurants" className="view-all-link">
              View All Restaurants
            </Link>
          </div>
          <RestaurantList 
            limit={3} 
            displayAsFeatured={true} 
            className="featured-grid"
          />
        </article>

        <article className="featured-products">
          <div className="section-header">
            <h2>Premium Products</h2>
            <Link to="/products" className="view-all-link">
              Shop All Products
            </Link>
          </div>
          <ProductList 
            featured={true} 
            limit={4} 
            className="featured-grid"
          />
        </article>
      </section>
    </div>
  );
};

export default HomePage;