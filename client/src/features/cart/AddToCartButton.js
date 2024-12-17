// client/src/features/cart/AddToCartButton.js
import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/slices/cartSlice';
import '../../App.css';
import api from '../../utils/config';

const AddToCartButton = ({ product, initialQuantity = 1, className = '' }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [quantity, setQuantity] = useState(initialQuantity);

  useEffect(() => {
    let timer;
    if (success) {
      timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setSuccess(false);
          setFadeOut(false);
        }, 300);
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [success]);

  const isDisabled = useCallback(() => {
    return (
      loading || 
      !product.availableForDelivery || 
      product.stockStatus === 'out_of_stock' ||
      (product.stockStatus === 'low_stock' && quantity > 1)
    );
  }, [loading, product, quantity]);

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    if (value >= 0 && value <= 99) {
      setQuantity(value);
    }
  };

  const handleIncrement = () => {
    if (quantity < 99) {
      setQuantity(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    if (isDisabled() || quantity < 1) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!product || (!product.id && !product._id)) {
        throw new Error('Invalid product data: Missing product ID');
      }

      await dispatch(addToCart({
        product,
        quantity
      })).unwrap();

      setSuccess(true);
      setError(null);
    } catch (err) {
      console.error('Failed to add to cart:', err);
      setError(err.message || 'Failed to add the item to the cart. Please try again.');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-to-cart-container">
      <div className="quantity-control">
        <button 
          className="quantity-btn"
          onClick={handleDecrement}
          disabled={quantity <= 1 || isDisabled()}
          aria-label="Decrease quantity"
        >
          -
        </button>
        <input
          type="number"
          min="1"
          max="99"
          value={quantity}
          onChange={handleQuantityChange}
          className="quantity-input"
          disabled={isDisabled()}
          aria-label="Product quantity"
        />
        <button 
          className="quantity-btn"
          onClick={handleIncrement}
          disabled={quantity >= 99 || isDisabled()}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      <button
        onClick={handleAddToCart}
        disabled={isDisabled() || quantity < 1}
        className={`add-to-cart-btn ${product.stockStatus} ${className}`}
        aria-label="Add to cart"
      >
        {loading ? (
          <span className="loading-text">Adding...</span>
        ) : product.stockStatus === 'out_of_stock' ? (
          'Out of Stock'
        ) : !product.availableForDelivery ? (
          'In-Store Only'
        ) : product.stockStatus === 'low_stock' && quantity > 1 ? (
          'Limited Stock'
        ) : (
          <>
            <span className="default-text">Add to Cart</span>
            {quantity > 1 && <span className="quantity-badge">{quantity}</span>}
          </>
        )}
      </button>

      {error && (
        <div className="notification error-notification">
          <span className="notification-icon">❌</span>
          {error}
        </div>
      )}

      {success && (
        <div className={`notification success-notification ${fadeOut ? 'fade-out' : ''}`}>
          <span className="notification-icon">✅</span>
          {quantity} {quantity > 1 ? 'items' : 'item'} added to cart
        </div>
      )}

      {product.stockStatus === 'low_stock' && (
        <div className="notification warning-notification">
          <span className="notification-icon">⚠️</span>
          Limited quantity available
        </div>
      )}
    </div>
  );
};

export default AddToCartButton;