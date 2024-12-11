// client/src/features/cart/AddToCartButton.js
import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/slices/cartSlice';
import '../../App.css';

const AddToCartButton = ({ product, quantity = 1, className = '' }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isDisabled = useCallback(() => {
    return (
      loading || 
      !product.availableForDelivery || 
      product.stockStatus === 'out_of_stock' ||
      (product.stockStatus === 'low_stock' && quantity > 1)
    );
  }, [loading, product, quantity]);

  const getButtonText = useCallback(() => {
    if (loading) return 'Adding...';
    if (!product.availableForDelivery) return 'In-Store Only';
    if (product.stockStatus === 'out_of_stock') return 'Out of Stock';
    if (product.stockStatus === 'low_stock' && quantity > 1) return 'Limited Stock';
    return 'Add to Cart';
  }, [loading, product, quantity]);

  const handleAddToCart = async () => {
    if (isDisabled()) return;
    
    setLoading(true);
    setError(null);

    console.log('Original product data:', product);

    try {
      // Ensure we have either id or _id
      if (!product || (!product.id && !product._id)) {
        throw new Error('Invalid product data: Missing product ID');
      }

      // Use the original product object to maintain all necessary data
      const result = await dispatch(addToCart({
        product,
        quantity
      })).unwrap();

      console.log('Add to cart result:', result);
      
      // Show success feedback
      setError(null);
    } catch (err) {
      console.error('Failed to add to cart:', err);
      setError(err.message || 'Failed to add the item to the cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`add-to-cart-container ${className}`}>
      <button
        onClick={handleAddToCart}
        disabled={isDisabled()}
        className={`add-to-cart-btn ${product.stockStatus}`}
        aria-label={getButtonText()}
      >
        {getButtonText()}
      </button>

      {error && <div className="error-message">{error}</div>}
      {product.stockStatus === 'low_stock' && (
        <div className="stock-warning">Limited quantity available</div>
      )}
    </div>
  );
};

export default AddToCartButton;