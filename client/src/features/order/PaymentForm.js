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
 const [paymentMethod, setPaymentMethod] = useState('cash');
 const [orderNote, setOrderNote] = useState('');

 const handlePayment = async () => {
   try {
     setLoading(true);
     setError(null);

     // Create order
     const orderData = {
       paymentMethod,
       amount: totalAmount,
       note: orderNote.trim()
     };

     const result = await dispatch(createOrder(orderData)).unwrap();
     
     // Clear cart after successful order
     await dispatch(clearCart());

     // Navigate to order confirmation
     navigate(`/orders/${result.orderId}`, { 
       state: { 
         orderComplete: true,
         orderNumber: result.orderId 
       }
     });

   } catch (err) {
     setError(err.message || 'Failed to create order. Please try again.');
   } finally {
     setLoading(false);
   }
 };

 return (
   <div className="payment-form">
     <h3 className="payment-title">Order Details</h3>

     {error && (
       <div className="error-message card">
         {error}
       </div>
     )}

     <div className="payment-section card">
       <div className="amount-summary">
         <h4>Amount to Pay</h4>
         <p className="total-amount">¥{totalAmount.toFixed(2)}</p>
       </div>

       <div className="payment-method">
         <h4>Payment Method</h4>
         <div className="payment-options">
           <label className="payment-option">
             <input
               type="radio"
               value="cash"
               checked={paymentMethod === 'cash'}
               onChange={(e) => setPaymentMethod(e.target.value)}
               disabled={loading || disabled}
             />
             <span>Cash on Delivery</span>
           </label>

           <label className="payment-option">
             <input
               type="radio"
               value="bank"
               checked={paymentMethod === 'bank'}
               onChange={(e) => setPaymentMethod(e.target.value)}
               disabled={loading || disabled}
             />
             <span>Bank Transfer</span>
           </label>
         </div>
       </div>

       <div className="order-notes">
         <h4>Order Notes (Optional)</h4>
         <textarea
           value={orderNote}
           onChange={(e) => setOrderNote(e.target.value)}
           placeholder="Add any special instructions or notes for your order"
           maxLength={200}
           disabled={loading || disabled}
           className="order-note-input"
         />
       </div>
     </div>

     <div className="payment-actions">
       <button 
         className="btn confirm-order-btn" 
         onClick={handlePayment}
         disabled={loading || disabled}
       >
         {loading ? (
           <span>
             <span className="loading-spinner"></span>
             Processing Order...
           </span>
         ) : (
           'Confirm Order'
         )}
       </button>
       
       <p className="payment-note">
         By confirming your order, you agree to our Terms of Service and Privacy Policy
       </p>
     </div>
   </div>
 );
};

export default PaymentForm;