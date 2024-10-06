import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Menu = ({ restaurantId }) => {
  const [menuCategories, setMenuCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await axios.get(`/api/restaurants/${restaurantId}/menu`);
        setMenuCategories(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch menu');
        setLoading(false);
      }
    };

    fetchMenu();
  }, [restaurantId]);

  if (loading) return <div>Loading menu...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-semibold mb-4">Menu</h3>
      {menuCategories.map((category) => (
        <div key={category._id} className="mb-6">
          <h4 className="text-xl font-semibold mb-2">{category.name}</h4>
          <p className="mb-2 text-gray-600">{category.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.dishes.map((dish) => (
              <div key={dish._id} className="border p-4 rounded shadow">
                <h5 className="text-lg font-semibold">{dish.name}</h5>
                <p className="text-sm text-gray-600 mb-2">{dish.description}</p>
                <p className="font-bold">¥{dish.price}</p>
                {dish.isSignatureDish && (
                  <span className="bg-yellow-200 text-yellow-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">
                    Signature Dish
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Menu;
