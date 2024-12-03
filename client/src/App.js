// src/App.js
import React from 'react';
import { Route, Routes, Link, Navigate, useLocation } from 'react-router-dom';
import useAuth from './hooks/useAuth';

// Common Components
import Header from './common/Header';
import Footer from './common/Footer';

// Feature Components
import SearchBar from './features/search/SearchBar';
import SearchResults from './features/search/SearchResults';

import RestaurantPage from './pages/RestaurantPage';
import RestaurantList from './features/restaurant/RestaurantList';
import RestaurantDetails from './features/restaurant/RestaurantDetails';  
import MenuSection from './features/restaurant/MenuSection';  

import DishDetails from './features/dish/DishDetails';
import DishList from './features/dish/DishList';

import ProductDetails from './features/product/ProductDetails';
import ProductList from './features/product/ProductList';
import Cart from './features/cart/Cart';
import Checkout from './features/cart/Checkout';

// Pages
import UserProfile from './pages/UserProfile';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';

// Styles
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
 const { isAuthenticated, isLoading } = useAuth();
 const location = useLocation();

 if (isLoading) {
   return (
     <div className="loading-container">
       <div className="loading-spinner">Loading...</div>
     </div>
   );
 }

 if (!isAuthenticated) {
   return <Navigate to="/login" state={{ from: location.pathname }} replace />;
 }

 return children;
};

// Public Route Component
const PublicRoute = ({ children }) => {
 const { isAuthenticated, isLoading } = useAuth();
 const location = useLocation();

 if (isLoading) {
   return <div className="loading">Loading...</div>;
 }

 if (isAuthenticated) {
   return <Navigate to={location.state?.from || '/'} replace />;
 }

 return children;
};

function App() {
 const { isAuthenticated, user, logout, isLoading } = useAuth();

 const handleLogout = async () => {
   try {
     await logout();
   } catch (error) {
     console.error('Logout failed:', error);
   }
 };

 // Navigation items configuration
 const navItems = isAuthenticated 
   ? [
       { to: '/', label: 'Home' },
       { to: '/profile', label: 'Profile' },
       { to: '/cart', label: 'Cart' },
       { 
         onClick: handleLogout, 
         label: 'Logout', 
         className: 'btn logout-btn'
       }
     ]
   : [
       { to: '/', label: 'Home' },
       { to: '/register', label: 'Register' },
       { to: '/login', label: 'Login' }
     ];

 if (isLoading) {
   return (
     <div className="app-loading-container">
       <div className="app-loading-spinner">Loading application...</div>
     </div>
   );
 }

 return (
   <div className="App">
     <Header 
       brandName="Chen Pi Cuisine"
       navItems={navItems}
       user={user}
       isAuthenticated={isAuthenticated}
     />

     <main className="main-content">
       <div className="content-container">
         <Routes>
           {/* Public Routes */}
           <Route path="/" element={<HomePage />} />
           <Route path="/restaurants" element={<RestaurantList />} />
           <Route path="/products" element={<ProductList />} />
           <Route path="/restaurant/:slug" element={<RestaurantDetails />} />
           <Route path="/menu/:slug" element={<MenuSection />} />
           <Route path="/dish/:slug" element={<DishDetails />} />
           <Route path="/product/:slug" element={<ProductDetails />} />
           <Route path="/search" element={<SearchResults />} />

           {/* Auth Routes */}
           <Route 
             path="/register" 
             element={
               <PublicRoute>
                 <RegisterPage />
               </PublicRoute>
             } 
           />
           <Route 
             path="/login" 
             element={
               <PublicRoute>
                 <LoginPage />
               </PublicRoute>
             } 
           />

           {/* Protected Routes */}
           <Route 
             path="/profile" 
             element={
               <ProtectedRoute>
                 <UserProfile />
               </ProtectedRoute>
             } 
           />
           <Route 
             path="/cart" 
             element={
               <ProtectedRoute>
                 <Cart />
               </ProtectedRoute>
             } 
           />
           <Route 
             path="/checkout" 
             element={
               <ProtectedRoute>
                 <Checkout />
               </ProtectedRoute>
             } 
           />

           {/* 404 Route */}
           <Route 
             path="*" 
             element={
               <div className="not-found">
                 <h1>404 - Page Not Found</h1>
                 <p>The page you're looking for doesn't exist.</p>
                 <Link to="/" className="btn-primary">
                   Return to Home
                 </Link>
               </div>
             } 
           />
         </Routes>
       </div>
     </main>

     <Footer />
   </div>
 );
}

export default App;