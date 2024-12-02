import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addItemToCart } from '../../redux/slices/cartSlice';
import '../../App.css';

const AddToCartButton = ({ product }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddToCart = async () => {
    setLoading(true);
    setError(null); // Clear previous errors

    try {
      // Dispatch action to add the item to the cart
      await dispatch(addItemToCart({ productId: product._id, quantity: 1 }));
      // Optionally show success feedback or perform additional actions
    } catch (err) {
      setError('Failed to add the item to the cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-to-cart-container">
      <button
        onClick={handleAddToCart}
        disabled={loading}
        className="add-to-cart-btn"
        aria-label="Add item to cart"
      >
        {loading ? 'Adding...' : 'Add to Cart'}
      </button>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default AddToCartButton;
