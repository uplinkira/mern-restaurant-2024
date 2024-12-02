// client/src/features/product/ProductList.js
import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../../redux/slices/productSlice';
import { addItemToCart } from '../../redux/slices/cartSlice';
import '../../App.css';

const ProductList = ({ featured = false, limit }) => {
  const dispatch = useDispatch();
  const { 
    list: allProducts, 
    status, 
    error 
  } = useSelector((state) => state.products);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchProducts());
    }
  }, [dispatch, status]);

  // Filter and limit products based on props
  const products = useMemo(() => {
    let filtered = allProducts;
    if (featured) {
      filtered = allProducts.filter(product => product.isFeatured);
    }
    if (limit && limit > 0) {
      filtered = filtered.slice(0, limit);
    }
    return filtered;
  }, [allProducts, featured, limit]);

  const handleAddToCart = (product) => {
    dispatch(addItemToCart({ 
      productId: product._id, 
      quantity: 1,
      price: product.price,
      name: product.name
    }));
  };

  if (status === 'loading') {
    return <div className="loading">Loading products...</div>;
  }

  if (status === 'failed') {
    return <div className="error">Error: {error}</div>;
  }

  if (!products?.length) {
    return <div className="no-data">No products available</div>;
  }

  return (
    <div className="product-list">
      {!featured && <h2>Our Products</h2>}
      <div className="product-grid">
        {products.map((product) => (
          <div key={product.slug} className="product-card card">
            <div className="card-content">
              <h3>{product.name}</h3>
              <div className="product-info">
                <span className="category">{product.category}</span>
                {product.isFeatured && (
                  <span className="featured-badge">Featured</span>
                )}
              </div>
              <p className="description">
                {product.description?.substring(0, 150)}
                {product.description?.length > 150 ? '...' : ''}
              </p>
              <div className="product-meta">
                {product.ingredients?.length > 0 && (
                  <div className="ingredients">
                    Main ingredients: {product.ingredients.slice(0, 3).join(', ')}
                    {product.ingredients.length > 3 ? '...' : ''}
                  </div>
                )}
                {product.allergens?.length > 0 && (
                  <div className="allergens">
                    Contains: {product.allergens.join(', ')}
                  </div>
                )}
              </div>
              <div className="product-footer">
                <span className="price">¥{product.price.toFixed(2)}</span>
                <span className="availability">
                  {product.availableForDelivery ? 'Available for Delivery' : 'In-Store Only'}
                </span>
              </div>
              <div className="action-buttons">
                <button 
                  onClick={() => handleAddToCart(product)}
                  className="btn add-to-cart-btn"
                >
                  Add to Cart
                </button>
                <Link 
                  to={`/product/${product.slug}`} 
                  className="btn view-details-btn"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;