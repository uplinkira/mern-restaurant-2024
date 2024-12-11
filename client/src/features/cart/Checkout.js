// client/src/features/cart/Checkout.js
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  addToCart,
  clearCart,
  selectCartItems,
  selectCartTotal,
  selectCartStatus,
  selectCartError
} from '../../redux/slices/cartSlice';
import PaymentForm from '../order/PaymentForm';
import '../../App.css';

const CheckoutItem = ({ item }) => {
  // Get the product data
  const product = item.product || {};
  const price = product.price || item.price || 0;
  const name = product.name || item.name || 'Unknown Product';
  const category = product.category || item.category || '';
  
  return (
    <div className="checkout-item card">
      <div className="item-details">
        <h3>{name}</h3>
        <div className="item-meta">
          <span className="category">{category}</span>
          {product.stockStatus === 'low_stock' && (
            <span className="stock-warning">Limited Stock</span>
          )}
        </div>
        <div className="item-pricing">
          <p>Price: ¥{price.toFixed(2)}</p>
          <p>Quantity: {item.quantity}</p>
          <p className="subtotal">Subtotal: ¥{(price * item.quantity).toFixed(2)}</p>
        </div>
        {product.allergens?.length > 0 && (
          <div className="allergen-info">
            Contains allergens: {product.allergens.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);
  const totalAmount = useSelector(selectCartTotal);
  const status = useSelector(selectCartStatus);
  const error = useSelector(selectCartError);
  const [validationError, setValidationError] = useState(null);

  // 检查购物车商品有效性
  const validateCart = () => {
    const invalidItems = items.filter(item => 
      item.product?.stockStatus === 'out_of_stock' || 
      !item.product?.availableForDelivery
    );

    if (invalidItems.length > 0) {
      setValidationError('Some items in your cart are no longer available.');
      return false;
    }

    const lowStockItems = items.filter(item =>
      item.product?.stockStatus === 'low_stock' && item.quantity > 1
    );

    if (lowStockItems.length > 0) {
      setValidationError('Some items have limited stock and quantity needs to be adjusted.');
      return false;
    }

    setValidationError(null);
    return true;
  };

  useEffect(() => {
    if (!items.length) {
      navigate('/cart');
      return;
    }

    validateCart();
  }, [items, navigate]);

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      dispatch(clearCart());
      navigate('/cart');
    }
  };

  // Loading State
  if (status === 'loading') {
    return <div className="loading">Processing your order...</div>;
  }

  // Error State
  if (status === 'failed') {
    return (
      <div className="error-container">
        <h3>Error</h3>
        <p>{error}</p>
        <button 
          className="btn retry-btn"
          onClick={() => dispatch(addToCart(items))}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty Cart State
  if (!items.length) {
    return (
      <div className="empty-cart">
        <h3>Your cart is empty</h3>
        <p>Please add items before proceeding to checkout.</p>
        <button 
          className="btn shop-btn"
          onClick={() => navigate('/products')}
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="checkout-container">
      <h2 className="checkout-title">Checkout</h2>
      
      {validationError && (
        <div className="validation-error card">
          <p>{validationError}</p>
          <button 
            className="btn"
            onClick={() => navigate('/cart')}
          >
            Return to Cart
          </button>
        </div>
      )}

      <div className="checkout-content">
        <div className="checkout-items">
          {items.map((item) => (
            <CheckoutItem 
              key={item.productId} 
              item={item}
            />
          ))}
        </div>

        <div className="checkout-summary card">
          <h3>Order Summary</h3>
          <div className="summary-details">
            <p>Total Items: {totalQuantity}</p>
            <p>Subtotal: ¥{totalAmount.toFixed(2)}</p>
            {/* 可以添加其他费用，如配送费等 */}
            <div className="total-amount">
              <strong>Total Amount: ¥{totalAmount.toFixed(2)}</strong>
            </div>
          </div>
          
          <div className="checkout-actions">
            <button 
              className="btn clear-btn" 
              onClick={handleClearCart}
              disabled={status === 'loading'}
            >
              Clear Cart
            </button>
          </div>
        </div>

        {/* Payment Section */}
        {!validationError && (
          <div className="payment-section card">
            <h3>Payment Details</h3>
            <PaymentForm 
              totalAmount={totalAmount}
              disabled={!!validationError || status === 'loading'}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;