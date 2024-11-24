import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';

const Header = () => {
  const { user, isAuthenticated, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Debugging logs to verify user and auth state
  console.log('Auth State:', { user, isAuthenticated, token });

  useEffect(() => {
    if (!token) {
      dispatch(logout()); // Auto-logout if token is missing
    }
  }, [token, dispatch]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      dispatch(logout());
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">MERN-Restaurant</Link>
        <nav>
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-4">
              {/* Debugging log to verify the user name */}
              {console.log('User Name:', user.name)}

              <span className="welcome-text">Welcome, {user.name}</span>
              <button 
                onClick={handleLogout} 
                className="btn" 
                aria-label="Logout"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login" className="nav-link" aria-label="Login">Login</Link>
              <Link to="/register" className="nav-link" aria-label="Register">Register</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
