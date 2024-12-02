// client/src/features/cart/Cart.js
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  saveCartToServer,
  removeItemFromCart,
  updateItemQuantity,
  clearCart,
  selectCartItems,
  selectCartTotal,
  selectCartStatus,
  selectCartError
} from '../../redux/slices/cartSlice';
import '../../App.css';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => (
  <div className="cart-item card">
    <div className="item-details">
      <Link to={`/product/${item.product.slug}`} className="item-name">
        <h3>{item.product.name}</h3>
      </Link>
      <div className="item-meta">
        <span className="price">¥{item.product.price.toFixed(2)}</span>
        {item.product.category && (
          <span className="category">{item.product.category}</span>
        )}
      </div>
      {item.product.availableForDelivery === false && (
        <span className="store-only-badge">In-Store Only</span>
      )}
    </div>
    
    <div className="item-actions">
      <div className="quantity-controls">
        <button
          className="btn quantity-btn"
          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
          disabled={item.quantity <= 1}
        >
          -
        </button>
        <span className="quantity">{item.quantity}</span>
        <button
          className="btn quantity-btn"
          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
          disabled={item.quantity >= 99}
        >
          +
        </button>
      </div>
      
      <div className="item-subtotal">
        Subtotal: ¥{(item.quantity * item.product.price).toFixed(2)}
      </div>
      
      <button
        className="btn remove-btn"
        onClick={() => onRemove(item.productId)}
        aria-label={`Remove ${item.product.name} from cart`}
      >
        Remove
      </button>
    </div>
    
    {item.product.allergens?.length > 0 && (
      <div className="allergen-warning">
        Contains allergens: {item.product.allergens.join(', ')}
      </div>
    )}
  </div>
);

const EmptyCart = () => (
  <div className="empty-cart">
    <h3>Your cart is empty</h3>
    <p>Browse our products and add items to your cart!</p>
    <Link to="/products" className="btn shop-btn">
      Start Shopping
    </Link>
  </div>
);

const Cart = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const totalAmount = useSelector(selectCartTotal);
  const status = useSelector(selectCartStatus);
  const error = useSelector(selectCartError);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(saveCartToServer(cartItems));
    }
  }, [dispatch, isAuthenticated, cartItems]);

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= 99) {
      try {
        await dispatch(updateItemQuantity({ 
          productId: itemId, 
          quantity: newQuantity 
        })).unwrap();
      } catch (err) {
        console.error('Failed to update quantity:', err);
      }
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await dispatch(removeItemFromCart(itemId)).unwrap();
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        await dispatch(clearCart()).unwrap();
      } catch (err) {
        console.error('Failed to clear cart:', err);
      }
    }
  };

  if (status === 'loading') {
    return <div className="loading">Loading your cart...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Oops! Something went wrong</h3>
        <p>{error}</p>
        <button 
          className="btn retry-btn" 
          onClick={() => dispatch(saveCartToServer(cartItems))}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-required">
        <h3>Please log in to view your cart</h3>
        <Link to="/login" className="btn login-btn">
          Log In
        </Link>
      </div>
    );
  }

  if (!cartItems?.length) {
    return <EmptyCart />;
  }

  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h2>Shopping Cart ({totalQuantity} items)</h2>
        <button 
          className="btn clear-btn"
          onClick={handleClearCart}
          disabled={status === 'loading'}
        >
          Clear Cart
        </button>
      </div>

      <div className="cart-content">
        <div className="cart-items">
          {cartItems.map((item) => (
            <CartItem
              key={item.productId}
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemoveItem}
            />
          ))}
        </div>

        <div className="cart-summary card">
          <h3>Order Summary</h3>
          <div className="summary-details">
            <div className="summary-line">
              <span>Subtotal ({totalQuantity} items):</span>
              <span>¥{totalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="summary-total">
            <span>Total:</span>
            <span>¥{totalAmount.toFixed(2)}</span>
          </div>

          <Link 
            to="/checkout" 
            className="btn checkout-btn"
            disabled={status === 'loading'}
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;