import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCart } from '../redux/slices/cartSlice';
import PaymentForm from './PaymentForm';

const Checkout = () => {
  const dispatch = useDispatch();
  const { cart, status, error } = useSelector((state) => state.cart);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Checkout</h2>
      <ul>
        {cart.items.map(item => (
          <li key={item._id}>{item.product.name} - {item.quantity}</li>
        ))}
      </ul>
      <h3>Total Price: ${cart.totalPrice}</h3>

      <PaymentForm />
    </div>
  );
};

export default Checkout;
