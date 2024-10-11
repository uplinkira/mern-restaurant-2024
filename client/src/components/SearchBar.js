import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { searchRestaurantsAndDishes } from '../redux/slices/restaurantSlice';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trimmedQuery = query.trim(); // Ensure query is not empty or just spaces
    if (!trimmedQuery) {
      return; // Prevent submitting an empty search query
    }

    // Pass query via the URL to the /search page
    navigate(`/search?q=${trimmedQuery}`);
    // Dispatch search action with the query
    dispatch(searchRestaurantsAndDishes(trimmedQuery));
  };

  return (
    <form onSubmit={handleSubmit} className="search-bar">
      <input
        type="text"
        placeholder="Search restaurants, dishes, or products"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit">Search</button>
    </form>
  );
};

export default SearchBar;
