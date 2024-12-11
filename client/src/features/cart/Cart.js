// client/src/features/cart/Cart.js
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  selectCartItems,
  selectCartTotal,
  selectCartStatus,
  selectCartError,
  setError
} from '../../redux/slices/cartSlice';
import '../../App.css';

// 提取库存状态显示组件
const StockStatus = ({ status }) => {
  const getStatusDisplay = () => {
    switch (status) {
      case 'out_of_stock':
        return <span className="stock-status out-of-stock">Out of Stock</span>;
      case 'low_stock':
        return <span className="stock-status low-stock">Low Stock</span>;
      default:
        return null;
    }
  };
  return getStatusDisplay();
};

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const isQuantityChangeDisabled = (newQuantity) => {
    return (
      !item?.product?.availableForDelivery ||
      item?.product?.stockStatus === 'out_of_stock' ||
      (item?.product?.stockStatus === 'low_stock' && newQuantity > 1)
    );
  };

  // Get the correct product ID and ensure it exists
  const productId = item?.product?.id || item?.product?._id;
  if (!productId || !item?.product) {
    console.error('Invalid cart item:', item);
    return null;
  }

  // Format price with proper null checks
  const price = item?.product?.price;
  const formattedPrice = typeof price === 'number' ? price.toFixed(2) : '0.00';
  const subtotal = typeof price === 'number' ? (price * (item?.quantity || 1)).toFixed(2) : '0.00';

  return (
    <div className="cart-item card">
      <div className="item-details">
        <Link to={`/product/${item.product.slug}`} className="item-name">
          <h3>{item.product.name}</h3>
        </Link>
        <div className="item-meta">
          <span className="price">¥{formattedPrice}</span>
          {item.product.category && (
            <span className="category">{item.product.category}</span>
          )}
          <StockStatus status={item.product.stockStatus} />
        </div>
        {!item.product.availableForDelivery && (
          <span className="store-only-badge">In-Store Only</span>
        )}
      </div>
      
      <div className="item-actions">
        <div className="quantity-controls">
          <button
            className="btn quantity-btn"
            onClick={() => onUpdateQuantity(productId, (item?.quantity || 1) - 1)}
            disabled={item.quantity <= 1 || isQuantityChangeDisabled(item.quantity - 1)}
          >
            -
          </button>
          <span className="quantity">{item?.quantity || 1}</span>
          <button
            className="btn quantity-btn"
            onClick={() => onUpdateQuantity(productId, (item?.quantity || 1) + 1)}
            disabled={item.quantity >= 99 || isQuantityChangeDisabled(item.quantity + 1)}
          >
            +
          </button>
        </div>
        
        <div className="item-subtotal">
          Subtotal: ¥{subtotal}
        </div>
        
        <button
          className="btn remove-btn"
          onClick={() => onRemove(productId)}
          aria-label={`Remove ${item.product.name} from cart`}
        >
          Remove
        </button>
      </div>
      
      {item.product.stockStatus === 'low_stock' && (
        <div className="stock-warning">
          Limited quantity available
        </div>
      )}
      
      {item.product.allergens?.length > 0 && (
        <div className="allergen-warning">
          Contains allergens: {item.product.allergens.join(', ')}
        </div>
      )}
    </div>
  );
};

// EmptyCart component remains unchanged
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

  // Fetch cart data when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= 99) {
      try {
        await dispatch(updateCartItem({ 
          productId: itemId, 
          quantity: newQuantity 
        })).unwrap();
      } catch (err) {
        console.error('Failed to update quantity:', err);
        dispatch(setError(err.message || 'Failed to update quantity'));
      }
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      console.log('Removing item - Start:', {
        itemId,
        cartItems: cartItems.length
      });

      if (!itemId) {
        throw new Error('Invalid item ID');
      }

      // Dispatch the removeFromCart action
      const result = await dispatch(removeFromCart(itemId)).unwrap();
      
      console.log('Removing item - Success:', {
        result,
        newItemCount: result.items.length
      });

      // Refresh cart data after successful removal
      dispatch(fetchCart());
    } catch (err) {
      console.error('Removing item - Error:', {
        error: err,
        message: err.message
      });
      
      dispatch(setError(err.message || 'Failed to remove item from cart'));
      
      // Always refresh cart data to ensure consistency
      dispatch(fetchCart());
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        await dispatch(clearCart()).unwrap();
      } catch (err) {
        console.error('Failed to clear cart:', err);
        dispatch(setError(err.message || 'Failed to clear cart'));
      }
    }
  };

  if (status === 'loading' && !cartItems.length) {
    return <div className="loading">Loading your cart...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Oops! Something went wrong</h3>
        <p>{error}</p>
        <button 
          className="btn retry-btn" 
          onClick={() => dispatch(fetchCart())}
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
  const hasUnavailableItems = cartItems.some(
    item => item.product.stockStatus === 'out_of_stock' || !item.product.availableForDelivery
  );

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

          {hasUnavailableItems && (
            <div className="cart-warning">
              Some items in your cart are unavailable for delivery or out of stock.
            </div>
          )}

          <Link 
            to="/checkout" 
            className="btn checkout-btn"
            disabled={status === 'loading' || hasUnavailableItems}
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;