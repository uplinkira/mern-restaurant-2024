// client/src/features/order/PaymentForm.js
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../../redux/slices/orderSlice';
import { clearCart } from '../../redux/slices/cartSlice';
import '../../App.css';

const PaymentForm = ({ totalAmount, disabled }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setDeliveryAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate delivery address
      if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.zipCode || !deliveryAddress.country) {
        setError('Please fill in all delivery address fields');
        setLoading(false);
        return;
      }

      // Create order with required fields only
      const orderData = {
        deliveryAddress,
        paymentMethod: 'cash',
        deliveryInstructions: ''
      };

      console.log('Submitting order with data:', {
        deliveryAddress: {
          street: orderData.deliveryAddress.street,
          city: orderData.deliveryAddress.city,
          state: orderData.deliveryAddress.state,
          zipCode: orderData.deliveryAddress.zipCode,
          country: orderData.deliveryAddress.country
        },
        paymentMethod: orderData.paymentMethod,
        deliveryInstructions: orderData.deliveryInstructions
      });

      const result = await dispatch(createOrder(orderData)).unwrap();
      console.log('Order creation successful:', result);
      
      // Clear cart after successful order
      await dispatch(clearCart());

      // Navigate to order history
      navigate('/orders');

    } catch (err) {
      console.error('Order creation failed:', {
        error: err,
        message: err.message,
        details: err.response?.data
      });
      setError(err.message || 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-form">
      {error && (
        <div className="error-message card">
          {error}
        </div>
      )}

      <div className="payment-section card">
        <div className="amount-summary">
          <h4>Total Amount: ¥{totalAmount.toFixed(2)}</h4>
        </div>

        <div className="delivery-address">
          <h4>Delivery Address</h4>
          <div className="address-fields">
            <div className="form-group">
              <input
                type="text"
                name="street"
                value={deliveryAddress.street}
                onChange={handleAddressChange}
                placeholder="Street Address*"
                disabled={loading || disabled}
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                name="city"
                value={deliveryAddress.city}
                onChange={handleAddressChange}
                placeholder="City*"
                disabled={loading || disabled}
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                name="state"
                value={deliveryAddress.state}
                onChange={handleAddressChange}
                placeholder="Prefecture*"
                disabled={loading || disabled}
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                name="zipCode"
                value={deliveryAddress.zipCode}
                onChange={handleAddressChange}
                placeholder="Postal Code*"
                disabled={loading || disabled}
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                name="country"
                value={deliveryAddress.country}
                onChange={handleAddressChange}
                placeholder="Country*"
                disabled={loading || disabled}
              />
            </div>
          </div>
        </div>

        <div className="payment-method">
          <h4>Payment Method</h4>
          <div className="payment-options">
            <label className="payment-option">
              <input
                type="radio"
                checked={true}
                disabled={true}
              />
              <span>Cash on Delivery</span>
            </label>
          </div>
        </div>
      </div>

      <button 
        className="btn confirm-order-btn" 
        onClick={handlePayment}
        disabled={loading || disabled}
      >
        {loading ? 'Processing...' : 'Confirm Order'}
      </button>
    </div>
  );
};

export default PaymentForm;