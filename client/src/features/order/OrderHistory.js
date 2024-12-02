import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderHistory } from '../../redux/slices/orderSlice';
import '../../App.css';

const OrderHistory = () => {
  const dispatch = useDispatch();
  const { orders, status, error } = useSelector((state) => state.orders);

  // Fetch order history when component mounts
  useEffect(() => {
    dispatch(fetchOrderHistory());
  }, [dispatch]);

  // Loading state
  if (status === 'loading') {
    return <div className="loading">Loading order history...</div>;
  }

  // Error state
  if (status === 'failed') {
    return (
      <div className="error">
        <h3>Error</h3>
        <p>{error || 'Failed to load order history. Please try again later.'}</p>
      </div>
    );
  }

  // Empty state
  if (status === 'succeeded' && !orders.length) {
    return <div>No orders found. You haven't placed any orders yet.</div>;
  }

  // Render order history
  return (
    <div className="order-history">
      <h2>Order History</h2>
      <div className="order-list">
        {orders.map((order) => (
          <div key={order._id} className="order-card">
            <h3>Order ID: {order._id}</h3>
            <p><strong>Status:</strong> {order.status}</p>
            <ul>
              {order.items.map((item) => (
                <li key={item._id}>
                  {item.product.name} - {item.quantity} x ¥{item.product.price.toFixed(2)}
                </li>
              ))}
            </ul>
            <p className="order-total">
              <strong>Total Price:</strong> ¥{order.totalPrice.toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;
