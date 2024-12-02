import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createOrder } from '../../redux/slices/orderSlice';
import '../../App.css';

const PaymentForm = ({ totalAmount }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      // Dispatch the createOrder action to initiate the payment process
      await dispatch(createOrder({ paymentMethod: 'stripe', amount: totalAmount }));
      // If successful, you could redirect the user or show a success message
    } catch (err) {
      setError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-form">
      <h3 className="payment-title">Payment Details</h3>
      {error && <div className="error">{error}</div>}
      <div className="payment-summary">
        <p>Total Amount: ¥{totalAmount.toFixed(2)}</p>
      </div>
      <button 
        className="btn pay-btn" 
        onClick={handlePayment} 
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Pay with Stripe'}
      </button>
    </div>
  );
};

export default PaymentForm;
