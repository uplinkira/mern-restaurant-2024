// client/src/pages/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import RestaurantList from '../features/restaurant/RestaurantList';
import SearchBar from '../features/search/SearchBar';
import ProductList from '../features/product/ProductList'; // 添加这个导入用于显示特色产品
import '../App.css';

const HomePage = () => {
  return (
    <div className="home-container">
      <section className="hero-section">
        <h1>Welcome to Chen Pi Cuisine</h1>
        <p>Discover authentic Chinese dishes and premium Chen Pi products</p>
        <div className="search-container">
          <SearchBar />
        </div>
      </section>

      <section className="main-content">
        <div className="section-header">
          <h2>Our Restaurants</h2>
          <Link to="/restaurants" className="view-all-link">
            View All
          </Link>
        </div>
        <RestaurantList limit={3} /> {/* Show only 3 restaurants on homepage */}
      </section>

      <section className="featured-section">
        <div className="section-header">
          <h2>Featured Products</h2>
          <Link to="/products" className="view-all-link">
            Shop All
          </Link>
        </div>
        <ProductList featured={true} limit={4} />
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>Experience Chen Pi</h2>
          <p>Join us for an authentic dining experience or shop our premium products</p>
          <div className="cta-buttons">
            <Link to="/restaurants" className="btn btn-primary">
              Find a Restaurant
            </Link>
            <Link to="/products" className="btn btn-secondary">
              Shop Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
