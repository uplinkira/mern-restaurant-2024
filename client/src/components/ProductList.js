import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { addItemToCart } from '../redux/slices/cartSlice';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);  // Loading state
  const [error, setError] = useState('');  // Error state
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/api/products');
        setProducts(response.data);
      } catch (err) {
        setError('Failed to load products.');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const addToCart = (productId) => {
    dispatch(addItemToCart({ productId, quantity: 1 }));
  };

  // Show loading indicator
  if (loading) {
    return <p>Loading products...</p>;
  }

  // Show error message if fetching fails
  if (error) {
    return <p className="error">{error}</p>;
  }

  // Show message if no products are available
  if (!products.length) {
    return <p>No products available.</p>;
  }

  return (
    <div>
      <h2>Products</h2>
      <ul>
        {products.map((product) => (
          <li key={product._id}>
            {product.name} - ${product.price}
            <button onClick={() => addToCart(product._id)}>Add to Cart</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductList;
