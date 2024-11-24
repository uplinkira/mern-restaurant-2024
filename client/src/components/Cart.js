
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCart, removeItemFromCart } from '../redux/slices/cartSlice';

const Cart = () => {
  const dispatch = useDispatch();
  const { cart, status, error } = useSelector((state) => state.cart);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return <div>Error: {error}</div>;

  return (
    <div className="cart">
      <h2>Your Cart</h2>
      {cart && cart.items.length > 0 ? (
        <>
          <ul>
            {cart.items.map((item) => (
              <li key={item._id}>
                {item.product.name} - {item.quantity}
                <button onClick={() => dispatch(removeItemFromCart(item._id))}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <h3>Total Price: ${cart.totalPrice}</h3>
        </>
      ) : (
        <p>Your cart is empty.</p>
      )}
    </div>
  );
};

export default Cart;

