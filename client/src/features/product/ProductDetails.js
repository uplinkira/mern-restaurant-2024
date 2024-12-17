// client/src/features/product/ProductDetails.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProductDetails,
  clearCurrentProduct,
  selectCurrentProduct,
  selectRelatedProducts,
  selectProductStatus,
  selectProductError
} from '../../redux/slices/productSlice';
import { addToCart } from '../../redux/slices/cartSlice';
import AddToCartButton from '../cart/AddToCartButton';
import '../../App.css';

const ProductDetails = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  
  const product = useSelector(selectCurrentProduct);
  const relatedProducts = useSelector(selectRelatedProducts);
  const status = useSelector(selectProductStatus);
  const error = useSelector(selectProductError);

  useEffect(() => {
    if (slug) {
      dispatch(fetchProductDetails({ slug, includeRelated: true }));
    }
    return () => {
      dispatch(clearCurrentProduct());
    };
  }, [dispatch, slug]);

  const getStockStatusDisplay = (stockStatus) => {
    switch (stockStatus) {
      case 'out_of_stock':
        return <span className="stock-status out-of-stock">Out of Stock</span>;
      case 'low_stock':
        return <span className="stock-status low-stock">Low Stock</span>;
      case 'in_stock':
        return <span className="stock-status in-stock">In Stock</span>;
      default:
        return null;
    }
  };

  if (status === 'loading') {
    return <div className="loading">Loading product details...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!product) {
    return <div className="not-found">Product not found</div>;
  }

  return (
    <div className="product-details-container">
      <div className="product-details-content">
        <div className="product-info">
          <h1 className="product-title">{product.name}</h1>
          <p className="product-description">{product.description}</p>
          
          <div className="product-meta">
            <div className="price-stock">
              <span className="product-price">¥{product.price?.toFixed(2)}</span>
              {getStockStatusDisplay(product.stockStatus)}
            </div>
            
            {product.category && (
              <span className="product-category">{product.category}</span>
            )}
          </div>

          {!product.availableForDelivery && (
            <div className="delivery-notice">
              This item is available for in-store purchase only
            </div>
          )}

          {product.allergens?.length > 0 && (
            <div className="allergen-info">
              <h3>Allergen Information</h3>
              <p>{product.allergens.join(', ')}</p>
            </div>
          )}

          <div className="add-to-cart-section">
            <AddToCartButton 
              product={product}
              initialQuantity={1}
              className="product-details-add-btn"
            />
          </div>
        </div>

        {relatedProducts?.length > 0 && (
          <div className="related-products">
            <h2>Related Products</h2>
            <div className="related-products-grid">
              {relatedProducts.map(relatedProduct => (
                <div key={relatedProduct.slug} className="related-product-card">
                  {/* Related product content */}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;