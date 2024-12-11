// client/src/features/product/ProductList.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
 fetchProducts,
 setFilters,
 setSorting,
 setPagination,
 selectAllProducts,
 selectProductStatus,
 selectProductError,
 selectProductFilters,
 selectProductPagination,
 selectAvailableCategories,
 selectSortOptions
} from '../../redux/slices/productSlice';
import {
  addToCart,
  selectCartStatus
} from '../../redux/slices/cartSlice';
import '../../App.css';

// Filter Section Component
const FilterSection = ({ categories, currentCategory, onCategoryChange }) => (
 <div className="filters-container">
   <div className="filter-buttons">
     {categories.map(category => (
       <button
         key={category}
         className={`filter-btn ${currentCategory === category ? 'active' : ''}`}
         onClick={() => onCategoryChange(category)}
       >
         {category}
       </button>
     ))}
   </div>
 </div>
);

// Sorting Section Component
const SortingSection = ({ options, currentSort, onSortChange }) => (
 <div className="sorting-section">
   <select
     value={`${currentSort.sortBy}-${currentSort.order}`}
     onChange={(e) => {
       const [sortBy, order] = e.target.value.split('-');
       onSortChange({ sortBy, order });
     }}
     className="form-input"
   >
     {options.map(option => (
       <option 
         key={`${option.value}-${option.order}`}
         value={`${option.value}-${option.order}`}
       >
         {option.label}
       </option>
     ))}
   </select>
 </div>
);

// Product Grid Component
const ProductGrid = ({ products, onAddToCart }) => (
 <div className="card-grid">
   {products.map(product => (
     <div key={product.slug} className="card">
       <Link to={`/product/${product.slug}`} className="product-link">
         <h3>{product.name}</h3>
         <div className="product-meta">
           <span className="category">{product.category}</span>
           {product.isFeatured && (
             <span className="featured-badge">Featured</span>
           )}
         </div>
         <p className="description">{product.description}</p>
         <div className="price-info">
           <span className="price">¥{product.price.toFixed(2)}</span>
         </div>
       </Link>
       <div className="product-actions">
         {!product.availableForDelivery ? (
           <p className="availability-notice">In-store purchase only</p>
         ) : (
           <button
             onClick={() => onAddToCart(product)}
             className="btn add-to-cart-btn"
           >
             Add to Cart
           </button>
         )}
       </div>
     </div>
   ))}
 </div>
);

// Pagination Component
const Pagination = ({ pagination, onChange }) => (
 <div className="pagination">
   <button
     className="btn"
     onClick={() => onChange(pagination.currentPage - 1)}
     disabled={pagination.currentPage === 1}
   >
     Previous
   </button>
   <span className="page-info">
     Page {pagination.currentPage} of {pagination.totalPages}
   </span>
   <button
     className="btn"
     onClick={() => onChange(pagination.currentPage + 1)}
     disabled={pagination.currentPage === pagination.totalPages}
   >
     Next
   </button>
 </div>
);

// Main ProductList Component
const ProductList = () => {
 const dispatch = useDispatch();
 const products = useSelector(selectAllProducts);
 const status = useSelector(selectProductStatus);
 const error = useSelector(selectProductError);
 const filters = useSelector(selectProductFilters);
 const pagination = useSelector(selectProductPagination);
 const categories = useSelector(selectAvailableCategories);
 const sortOptions = useSelector(selectSortOptions);

 useEffect(() => {
   dispatch(fetchProducts({
     page: pagination.currentPage,
     limit: pagination.itemsPerPage,
     category: filters.category === 'All' ? '' : filters.category,
     sortBy: filters.sortBy,
     order: filters.order
   }));
 }, [dispatch, pagination.currentPage, filters.category, filters.sortBy, filters.order]);

 const handleCategoryChange = (category) => {
   dispatch(setFilters({ category }));
 };

 const handleSortChange = (sorting) => {
   dispatch(setSorting(sorting));
 };

 const handlePageChange = (newPage) => {
   dispatch(setPagination({ currentPage: newPage }));
 };

 const handleAddToCart = async (product, quantity = 1) => {
   try {
     await dispatch(addToCart({ product, quantity })).unwrap();
   } catch (error) {
   }
 };

 if (status === 'loading') {
   return <div className="loading">Loading products...</div>;
 }

 if (status === 'failed') {
   return <div className="error">Error: {error}</div>;
 }

 return (
   <div className="product-list">
     <div className="product-list-header">
       <FilterSection
         categories={categories}
         currentCategory={filters.category}
         onCategoryChange={handleCategoryChange}
       />
       <SortingSection
         options={sortOptions}
         currentSort={{ sortBy: filters.sortBy, order: filters.order }}
         onSortChange={handleSortChange}
       />
     </div>

     {products.length === 0 ? (
       <div className="no-products">No products found</div>
     ) : (
       <>
         <ProductGrid 
           products={products}
           onAddToCart={handleAddToCart}
         />
         <Pagination 
           pagination={pagination}
           onChange={handlePageChange}
         />
       </>
     )}
   </div>
 );
};

export default ProductList;