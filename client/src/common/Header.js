// client/src/common/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Header = ({ brandName, navItems }) => {
 const { user } = useAuth();

 return (
   <header className="header">
     <div className="header-content">
       <Link to="/" className="logo">
         {brandName || 'Chen Pi Cuisine'}
       </Link>
       
       <nav className="nav-links">
         {navItems.map((item, index) => (
           item.onClick ? (
             <button
               key={index}
               onClick={item.onClick}
               className={item.className || 'nav-link'}
             >
               {item.label}
             </button>
           ) : (
             <Link
               key={index}
               to={item.to}
               className={item.className || 'nav-link'}
             >
               {item.label}
             </Link>
           )
         ))}
         
         {user && (
           <span className="welcome-text">
             Welcome, {user.firstName || user.username || 'User'}
           </span>
         )}
       </nav>
     </div>
   </header>
 );
};

export default Header;