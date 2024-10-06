import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchDishDetails } from '../redux/slices/dishSlice';

const DishDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentDish, status, error } = useSelector(state => state.dishes);

  useEffect(() => {
    dispatch(fetchDishDetails(id));
  }, [dispatch, id]);

  // Log the currentDish to ensure it's being fetched
  console.log(currentDish);

  if (status === 'loading') return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!currentDish) return <div>Dish not found</div>;

  return (
    <div className="dish-details">
      <h1>{currentDish.name}</h1>
      <p>{currentDish.description}</p>
      <p>Price: ${currentDish.price}</p>
      <p>Chen Pi Age: {currentDish.chenPiAge} years</p>
      <p>Signature Dish: {currentDish.isSignatureDish ? 'Yes' : 'No'}</p>
    </div>
  );
};

export default DishDetails;
