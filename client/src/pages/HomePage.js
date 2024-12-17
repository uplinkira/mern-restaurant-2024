// client/src/pages/HomePage.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import SearchBar from '../features/search/SearchBar';
import { selectSearchResults } from '../redux/slices/searchSlice';
import '../App.css';

const HomePage = () => {
  const searchResults = useSelector(selectSearchResults);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="home-container">
      <section className="hero-section" aria-label="welcome banner">
        <div className="search-section" aria-label="unified search">
          <div className="search-container">
            <h2>Begin Your Culinary Journey</h2>
            <SearchBar enhanced={true} showFilters={true} />
          </div>

          {searchResults.length > 0 && (
            <div className="quick-results">
              <Link to="/search" className="view-results-link">
                Explore All Results
              </Link>
            </div>
          )}
        </div>

        <div className="scroll-indicator">
          <div className="mouse">
            <div className="wheel"></div>
          </div>
          <div className="scroll-text">Scroll to explore</div>
        </div>

        <div className={`hero-content ${isVisible ? 'visible' : ''}`}>
          <div className="hero-text-container">
            <h1 className="hero-title">
              <span className="highlight">陳皮</span> Artistry in Every Bite
            </h1>
            <div className="hero-subtitle-container">
              <p className="hero-subtitle">Where tradition meets innovation</p>
              <p className="hero-description">
                Elevating culinary excellence through the art of aged Chen Pi
              </p>
            </div>
          </div>

          <div className="feature-cards">
            <div className="feature-card">
              <span className="feature-icon">🍊</span>
              <h3>Cultural Heritage</h3>
              <p>National Intangible Cultural Heritage of Chen Pi craftsmanship</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🌿</span>
              <h3>Medicinal Wisdom</h3>
              <p>Traditional Chinese Medicine essence with 30-year aging process</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">👨‍🍳</span>
              <h3>Master Crafted</h3>
              <p>Time-honored techniques by heritage artisans</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">💫</span>
              <h3>Modern Experience</h3>
              <p>Contemporary culinary art meets ancient wisdom</p>
            </div>
          </div>
        </div>
      </section>

      <section className="experience-section">
        <div className="experience-grid">
          <div className="experience-card">
            <div className="experience-number">30+</div>
            <h3>Years of Aging</h3>
            <p>Perfectly matured Chen Pi</p>
          </div>
          <div className="experience-card">
            <div className="experience-number">100+</div>
            <h3>Signature Dishes</h3>
            <p>Unique flavor combinations</p>
          </div>
          <div className="experience-card">
            <div className="experience-number">5</div>
            <h3>Master Chefs</h3>
            <p>Culinary excellence</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;