// client/src/common/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Header = ({ brandName }) => {
 const { user, isAuthenticated, logout } = useAuth();

 const handleLogout = async () => {
   if (window.confirm('Are you sure you want to logout?')) {
     await logout();
   }
 };

 return (
   <header className="header">
     <div className="header-content">
       <Link to="/" className="brand">
         {brandName || 'Chen Pi Cuisine'}
       </Link>
       
       <nav className="nav-links">
         <Link to="/" className="nav-link">Home</Link>
         <Link to="/restaurants" className="nav-link">Restaurants</Link>
         <Link to="/products" className="nav-link">Shop</Link>
         
         {isAuthenticated ? (
           <>
             <Link to="/cart" className="nav-link">Cart</Link>
             <div className="user-menu">
               <Link to="/profile" className="nav-link">
                 <span className="welcome-text">
                   Welcome, {user?.firstName || user?.username || 'User'}
                 </span>
               </Link>
               <button 
                 onClick={handleLogout}
                 className="btn logout-btn"
               >
                 Logout
               </button>
             </div>
           </>
         ) : (
           <div className="auth-links">
             <Link to="/register" className="nav-link">Register</Link>
             <Link to="/login" className="nav-link">Login</Link>
           </div>
         )}
       </nav>
     </div>
   </header>
 );
};

export default Header;