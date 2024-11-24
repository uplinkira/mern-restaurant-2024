import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderHistory } from '../redux/slices/orderSlice';

const OrderHistory = () => {
  const dispatch = useDispatch();
  const { orders, status, error } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrderHistory());
  }, [dispatch]);

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Order History</h2>
      {orders.map(order => (
        <div key={order._id}>
          <h3>Order ID: {order._id}</h3>
          <ul>
            {order.items.map(item => (
              <li key={item._id}>{item.product.name} - {item.quantity}</li>
            ))}
          </ul>
          <p>Total Price: ${order.totalPrice}</p>
        </div>
      ))}
    </div>
  );
};

export default OrderHistory;
