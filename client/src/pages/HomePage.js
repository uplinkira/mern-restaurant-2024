import React, { useEffect } from 'react';
import RestaurantList from '../components/RestaurantList';
import '../App.css'; 

const HomePage = () => {
  useEffect(() => {
    console.log('HomePage component mounted');
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Welcome to MERN-Restaurant</h1>
      <RestaurantList />
    </div>
  );
};

export default HomePage;
