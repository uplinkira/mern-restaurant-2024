import React from 'react';
import { useDispatch } from 'react-redux';
import { addItemToCart } from '../redux/slices/cartSlice';

const AddToCartButton = ({ product }) => {
  const dispatch = useDispatch();

  const handleAddToCart = () => {
    dispatch(addItemToCart({ productId: product._id, quantity: 1 }));
  };

  return (
    <button onClick={handleAddToCart}>
      Add to Cart
    </button>
  );
};

export default AddToCartButton;
