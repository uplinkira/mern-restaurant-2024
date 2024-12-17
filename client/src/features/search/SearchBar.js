// client/src/features/search/SearchBar.js
import { useDispatch, useSelector } from 'react-redux';
import { searchItems, clearSearchResults, setFilter } from '../../redux/slices/searchSlice';
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const dispatch = useDispatch();
  const { 
    activeFilter,
    restaurants, 
    dishes, 
    products, 
    loading, 
    error 
  } = useSelector((state) => state.search);

  const handleSearch = useCallback((searchQuery, filter) => {
    if (searchQuery.trim()) {
      dispatch(searchItems({ query: searchQuery, filter }));
    }
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query, activeFilter);
    }, 500);

    return () => clearTimeout(timer);
  }, [query, activeFilter, handleSearch]);

  const handleFilterChange = (newFilter) => {
    dispatch(setFilter(newFilter));
    handleSearch(query, newFilter);
  };

  const handleClear = () => {
    setQuery('');
    dispatch(clearSearchResults());
  };

  const renderSearchResults = () => {
    if (!query.trim()) return null;

    const resultMap = {
      restaurant: {
        items: restaurants,
        title: 'Restaurants',
        render: (item) => (
          <Link to={`/restaurant/${item.slug}`} className="result-link">
            <span className="name">{item.name}</span>
            {item.cuisineType && <span className="cuisine-type">{item.cuisineType}</span>}
            {item.vrExperience && <span className="vr-badge">VR</span>}
          </Link>
        )
      },
      dish: {
        items: dishes,
        title: 'Dishes',
        render: (item) => (
          <Link to={`/dish/${item.slug}`} className="result-link">
            <span className="name">{item.name}</span>
            <span className="price">{item.formattedPrice}</span>
            {item.signature && <span className="signature-badge">Signature</span>}
            {item.allergenAlert && <span className="allergen-info">{item.allergenAlert}</span>}
          </Link>
        )
      },
      product: {
        items: products,
        title: 'Products',
        render: (item) => (
          <Link to={`/product/${item.slug}`} className="result-link">
            <span className="name">{item.name}</span>
            <span className="price">{item.formattedPrice}</span>
            {item.featured && <span className="featured-badge">Featured</span>}
            {item.availability && <span className="availability">{item.availability}</span>}
          </Link>
        )
      }
    };

    const currentResult = resultMap[activeFilter];
    if (!currentResult) return null;

    return (
      <div className="search-results">
        <h3>{currentResult.title}</h3>
        {currentResult.items.length > 0 ? (
          <ul className="results-list">
            {currentResult.items.map((item) => (
              <li key={item.slug} className="result-item">
                {currentResult.render(item)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-results">No {activeFilter}s found</p>
        )}
      </div>
    );
  };

  return (
    <div className="search-container">
      <div className="filter-buttons">
        {['restaurant', 'dish', 'product'].map((filter) => (
          <button
            key={filter}
            className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => handleFilterChange(filter)}
          >
            {filter === 'dish' ? 'Dishes' : `${filter.charAt(0).toUpperCase() + filter.slice(1)}s`}
          </button>
        ))}
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
          onClick={() => handleSearch(query, activeFilter)}
          disabled={loading || !query.trim()} 
          className="search-btn"
        >
          Go
        </button>
        <button 
          onClick={handleClear} 
          disabled={loading || !query.trim()} 
          className="clear-btn"
        >
          Clear
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}
      {loading && <p className="loading-message">Loading results...</p>}

      {renderSearchResults()}
    </div>
  );
};

export default SearchBar;