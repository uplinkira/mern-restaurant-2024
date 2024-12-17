// client/src/App.js
import React from 'react';
import { Route, Routes, Link, Navigate, useLocation, useParams } from 'react-router-dom';
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

import OrderHistory from './features/order/OrderHistory';

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

// NotFound Component
const NotFound = () => {
 const location = useLocation();
 const path = location.pathname.split('/')[1];

 const getRecommendations = () => {
   switch(path) {
     case 'restaurant':
       return (
         <div className="recommendations">
           <h2>Recommended Restaurants</h2>
           <RestaurantList limit={3} displayAsFeatured={true} />
         </div>
       );
     case 'product':
       return (
         <div className="recommendations">
           <h2>Featured Products</h2>
           <ProductList limit={3} displayFeatured={true} />
         </div>
       );
     case 'dish':
       return (
         <div className="recommendations">
           <h2>Signature Dishes</h2>
           <DishList limit={3} displaySignature={true} />
         </div>
       );
     default:
       return null;
   }
 };

 return (
   <div className="not-found-page">
     <div className="not-found-content">
       <h1>Page Not Found</h1>
       <p>
         {path === 'restaurant' && "Sorry, we couldn't find this restaurant."}
         {path === 'product' && "Sorry, we couldn't find this product."}
         {path === 'dish' && "Sorry, we couldn't find this dish."}
         {!['restaurant', 'product', 'dish'].includes(path) && 
           "The page you're looking for doesn't exist."}
       </p>
       <div className="action-buttons">
         <Link to="/" className="btn-primary">
           Return to Home
         </Link>
         {path === 'restaurant' && (
           <Link to="/restaurants" className="btn-secondary">
             Browse All Restaurants
           </Link>
         )}
         {path === 'product' && (
           <Link to="/products" className="btn-secondary">
             Browse All Products
           </Link>
         )}
         {path === 'dish' && (
           <Link to="/dishes" className="btn-secondary">
             Browse All Dishes
           </Link>
         )}
       </div>
     </div>
     {getRecommendations()}
   </div>
 );
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

 const navItems = isAuthenticated 
   ? [
       { to: '/', label: 'Find' },
       { to: '/restaurants', label: 'Reservation' },
       { to: '/dishes', label: 'Signature' },
       { to: '/products', label: 'Shop' },
       { to: '/cart', label: 'Cart' },
       { to: '/orders', label: 'Orders' },
       { to: '/profile', label: 'Profile' },
       { 
         onClick: handleLogout, 
         label: 'Logout', 
         className: 'btn logout-btn'
       }
     ]
   : [
       { to: '/', label: 'Find' },
       { to: '/restaurants', label: 'Reservation' },
       { to: '/dishes', label: 'Signature' },
       { to: '/products', label: 'Shop' },
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
           
           {/* Restaurant Routes */}
           <Route path="/restaurants" element={<RestaurantList showFilters={true} />} />
           <Route path="/restaurant/:slug" element={<RestaurantPage />} />
           
           {/* Product Routes */}
           <Route path="/products" element={<ProductList />} />
           <Route path="/product" element={<ProductList />} />
           <Route path="/product/:slug" element={<ProductDetails />} />
           
           {/* Dish Routes */}
           <Route path="/dishes" element={<DishList />} />
           <Route path="/dish" element={<DishList />} />
           <Route path="/dish/:slug" element={<DishDetails />} />

           {/* Search Route */}
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

           <Route 
             path="/orders" 
             element={
               <ProtectedRoute>
                 <OrderHistory />
               </ProtectedRoute>
             } 
           />

           {/* 404 Route */}
           <Route path="*" element={<NotFound />} />
         </Routes>
       </div>
     </main>
     <Footer />
   </div>
 );
}

export default App;