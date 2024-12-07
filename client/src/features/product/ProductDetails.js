// client/src/features/product/ProductDetails.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchProductDetails,
  selectCurrentProduct,
  selectRelatedProducts,
  selectProductStatus,
  selectProductError,
  clearCurrentProduct
} from '../../redux/slices/productSlice';
import { addItemToCart } from '../../redux/slices/cartSlice';
import '../../App.css';

const ProductDetails = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [quantity, setQuantity] = useState(1);
  
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

  const handleAddToCart = () => {
    if (product) {
      dispatch(addItemToCart({
        productId: product._id,
        quantity,
        price: product.price,
        name: product.name
      }));
    }
  };

  if (status === 'loading') {
    return <div className="loading">Loading product details...</div>;
  }

  if (status === 'failed') {
    return <div className="error">Error: {error}</div>;
  }

  if (!product) {
    return <div className="error">Product not found</div>;
  }

  return (
    <div className="product-details">
      <div className="product-header card">
        <h1>{product.name}</h1>
        <div className="product-meta">
          <span className="category">{product.category}</span>
          {product.isFeatured && (
            <span className="featured-badge">Featured Product</span>
          )}
        </div>
        <p className="description">{product.description}</p>
      </div>

      <div className="details-grid">
        <div className="info-card card">
          <div className="price-info">
            <h2>Price</h2>
            <span className="price">¥{product.price.toFixed(2)}</span>
          </div>
          <div className="quantity-selector">
            <label htmlFor="quantity">Quantity:</label>
            <select 
              id="quantity" 
              value={quantity} 
              onChange={(e) => setQuantity(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleAddToCart}
            className="btn add-to-cart-btn"
            disabled={!product.availableForDelivery}
          >
            Add to Cart
          </button>
          {!product.availableForDelivery && (
            <p className="availability-notice">
              This product is only available for in-store purchase
            </p>
          )}
        </div>

        {(product.ingredients?.length > 0 || product.allergens?.length > 0) && (
          <div className="ingredients-info card">
            {product.ingredients?.length > 0 && (
              <div className="ingredients-section">
                <h2>Ingredients</h2>
                <div className="ingredients-list">
                  {product.ingredients.map((ingredient, index) => (
                    <span key={index} className="ingredient-tag">
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {product.allergens?.length > 0 && (
              <div className="allergens-section">
                <h2>Allergen Information</h2>
                <div className="allergens-list">
                  {product.allergens.map((allergen, index) => (
                    <span key={index} className="allergen-tag">
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {product.caution && (
          <div className="caution-card card">
            <h2>Usage Information</h2>
            <p className="caution-text">{product.caution}</p>
          </div>
        )}
      </div>

      {relatedProducts?.length > 0 && (
        <div className="related-products card">
          <h2>You Might Also Like</h2>
          <div className="related-grid">
            {relatedProducts.map((relatedProduct) => (
              <Link 
                key={relatedProduct.slug} 
                to={`/product/${relatedProduct.slug}`}
                className="related-product-card"
              >
                <h4>{relatedProduct.name}</h4>
                <span className="price">¥{relatedProduct.price.toFixed(2)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;