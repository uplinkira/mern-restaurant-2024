import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  saveCartToServer, 
  clearCart,
  selectCartItems,
  selectCartTotal,
  selectCartStatus,
  selectCartError
} from '../../redux/slices/cartSlice';
import PaymentForm from '../order/PaymentForm';
import '../../App.css';

const Checkout = () => {
  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);
  const totalAmount = useSelector(selectCartTotal);
  const status = useSelector(selectCartStatus);
  const error = useSelector(selectCartError);

  useEffect(() => {
    if (items.length) {
      dispatch(saveCartToServer(items));
    }
  }, [dispatch, items]);

  const handleClearCart = () => {
    dispatch(clearCart());
  };

  // Loading State
  if (status === 'loading') {
    return <div className="loading">Loading your cart...</div>;
  }

  // Error State
  if (status === 'failed') {
    return (
      <div className="error">
        <h3>Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  // Empty Cart State
  if (!items.length) {
    return <div className="empty-cart">Your cart is empty. Please add items before proceeding to checkout.</div>;
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="checkout-container">
      <h2 className="checkout-title">Checkout</h2>
      <div className="checkout-items">
        {items.map((item) => (
          <div key={item.productId} className="checkout-item">
            <div className="item-details">
              <h3>{item.name}</h3>
              <p>Price: ¥{item.price.toFixed(2)}</p>
              <p>Quantity: {item.quantity}</p>
              <p>Subtotal: ¥{(item.price * item.quantity).toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="checkout-summary">
        <h3>Order Summary</h3>
        <p>Total Items: {totalQuantity}</p>
        <p>Total Amount: ¥{totalAmount.toFixed(2)}</p>
        <button className="btn clear-btn" onClick={handleClearCart}>
          Clear Cart
        </button>
      </div>

      {/* Payment Section */}
      <div className="payment-section">
        <h3>Payment Details</h3>
        <PaymentForm totalAmount={totalAmount} />
      </div>
    </div>
  );
};

export default Checkout;
