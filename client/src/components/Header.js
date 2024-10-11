import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice'; // Import the logout action

const Header = () => {
  const { user, isAuthenticated } = useSelector(state => state.auth); // Directly destructure user and isAuthenticated
  const dispatch = useDispatch();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) { // Optional: Add logout confirmation
      dispatch(logout()); // Dispatch the logout action
    }
  };

  return (
    <header className="header">
      <nav className="container mx-auto flex justify-between items-center">
        <Link to="/" className="logo">MERN-Restaurant</Link>
        <div className="navigation">
          {isAuthenticated && user ? ( // Use isAuthenticated to conditionally render
            <>
              <span className="welcome-text">Welcome, {user.email}</span>
              <button 
                onClick={handleLogout} 
                className="logout-button" 
                aria-label="Logout" // Added aria-label for accessibility
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" aria-label="Login">Login</Link>
              <Link to="/register" className="nav-link" aria-label="Register">Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
