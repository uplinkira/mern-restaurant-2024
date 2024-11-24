import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from './redux/slices/authSlice'; 
import SearchBar from './components/SearchBar';
import SearchResults from './components/SearchResults';
import RestaurantList from './components/RestaurantList';
import RestaurantDetails from './components/RestaurantDetails';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserProfile from './components/UserProfile'; 
import Cart from './components/Cart';
import './App.css';

function App() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout()); 
  };

  return (
    <Router>
      <div className="App">
        <header className="header">
          <div className="header-content">
            <Link to="/" className="logo">Chen Pi Cuisine</Link>
            <nav>
              <Link to="/" className="nav-link">Home</Link>
              {isAuthenticated ? (
                <>
                  <span className="nav-link">Welcome, {user?.username}</span>
                  <Link to="/profile" className="nav-link">Profile</Link>
                  <Link to="/cart" className="nav-link">Cart</Link>
                  <button className="btn logout-btn" onClick={handleLogout}>Logout</button>
                </>
              ) : (
                <>
                  <Link to="/register" className="nav-link">Register</Link>
                  <Link to="/login" className="nav-link">Login</Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="main-content">
          <SearchBar />
          <Routes>
            <Route path="/" element={<RestaurantList />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/restaurant/:id" element={<RestaurantDetails />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/profile" element={isAuthenticated ? <UserProfile /> : <Navigate to="/login" />} />
            <Route path="/cart" element={isAuthenticated ? <Cart /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;