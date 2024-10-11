import React from 'react';
import { useDispatch } from 'react-redux';
import { createOrder } from '../redux/slices/orderSlice';

const PaymentForm = () => {
  const dispatch = useDispatch();

  const handlePayment = () => {
    dispatch(createOrder({ paymentMethod: 'stripe' }));
  };

  return (
    <div>
      <button onClick={handlePayment}>Pay with Stripe</button>
    </div>
  );
};

export default PaymentForm;
