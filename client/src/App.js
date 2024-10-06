
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import SearchBar from './components/SearchBar';
import SearchResults from './components/SearchResults';
import RestaurantList from './components/RestaurantList';
import RestaurantDetails from './components/RestaurantDetails';
import Register from './components/Register';
import Login from './components/Login';
import DishDetails from './components/DishDetails';  // Import DishDetails
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="header">
          <div className="header-content">
            <Link to="/" className="logo">Chen Pi Cuisine</Link>
            <nav>
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/register" className="nav-link">Register</Link>
              <Link to="/login" className="nav-link">Login</Link>
            </nav>
          </div>
        </header>
        <main className="main-content">
          <SearchBar />
          <Routes>
            <Route path="/" element={<RestaurantList />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/restaurant/:id" element={<RestaurantDetails />} />
            <Route path="/dish/:id" element={<DishDetails />} />  {/* Add route for DishDetails */}
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
