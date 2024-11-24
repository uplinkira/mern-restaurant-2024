import React from 'react';
import { useDispatch } from 'react-redux';
import { addItemToCart } from '../redux/slices/cartSlice';

const ProductDetails = ({ product }) => {
  const dispatch = useDispatch();

  const handleAddToCart = () => {
    dispatch(addItemToCart({ productId: product._id, quantity: 1 })); // Hardcoded quantity of 1 for simplicity
  };

  return (
    <div>
      <h2>{product.name}</h2>
      <p>{product.description}</p>
      <p>Price: ${product.price}</p>
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
};

export default ProductDetails;
