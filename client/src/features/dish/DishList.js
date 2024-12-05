// client/src/features/dish/DishList.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchDishesByRestaurant,
  selectAllDishes,
  selectDishStatus,
  selectDishError,
  selectDishPagination,
  selectDishFilters,
  setFilters,
  setSorting,
  setPagination
} from '../../redux/slices/dishSlice';
import '../../App.css';

const SORT_OPTIONS = [
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
  { value: 'chenPiAge-desc', label: 'Chen Pi Age: Highest First' },
];

const DishList = ({ restaurantSlug }) => {
  const dispatch = useDispatch();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const dishes = useSelector(selectAllDishes);
  const status = useSelector(selectDishStatus);
  const error = useSelector(selectDishError);
  const pagination = useSelector(selectDishPagination);
  const filters = useSelector(selectDishFilters);

  const [activeFilters, setActiveFilters] = useState({
    signatureOnly: false,
    priceRange: null,
    allergenFree: [],
  });

  useEffect(() => {
    const loadDishes = async () => {
      if (restaurantSlug && (isInitialLoad || status === 'idle')) {
        try {
          await dispatch(fetchDishesByRestaurant({
            restaurantSlug,
            page: pagination.currentPage,
            limit: pagination.itemsPerPage,
            sortBy: filters.sortBy,
            order: filters.order,
            isSignature: activeFilters.signatureOnly || undefined,
            minPrice: activeFilters.priceRange?.min,
            maxPrice: activeFilters.priceRange?.max
          })).unwrap();
          setIsInitialLoad(false);
        } catch (err) {
          console.error('Failed to fetch dishes:', err);
        }
      }
    };

    loadDishes();
  }, [
    dispatch, 
    restaurantSlug, 
    pagination.currentPage, 
    filters.sortBy, 
    filters.order,
    activeFilters
  ]);

  const handleSortChange = (event) => {
    const [field, order] = event.target.value.split('-');
    dispatch(setSorting({ sortBy: field, order }));
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...activeFilters };
    
    switch (filterType) {
      case 'signature':
        newFilters.signatureOnly = value;
        break;
      case 'priceRange':
        newFilters.priceRange = value;
        break;
      case 'allergen':
        newFilters.allergenFree = value;
        break;
      default:
        break;
    }
    
    setActiveFilters(newFilters);
    dispatch(setFilters(newFilters));
  };

  const handlePageChange = (newPage) => {
    dispatch(setPagination({ currentPage: newPage }));
  };

  if (status === 'loading' && isInitialLoad) {
    return <div className="loading">Loading dishes...</div>;
  }

  if (status === 'failed') {
    return <div className="error">Error: {error}</div>;
  }

  if (!dishes?.length) {
    return <div className="empty-state">No dishes found</div>;
  }

  return (
    <div className="dish-list">
      {/* Filters and Sorting */}
      <div className="filters-section card">
        <select
          className="sort-select"
          onChange={handleSortChange}
          value={`${filters.sortBy}-${filters.order}`}
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="filter-label">
          <input
            type="checkbox"
            checked={activeFilters.signatureOnly}
            onChange={(e) => handleFilterChange('signature', e.target.checked)}
            className="filter-checkbox"
          />
          Signature Dishes Only
        </label>
      </div>

      {/* Dish Grid */}
      <div className="dish-grid">
        {dishes.map((dish) => (
          <div key={dish.slug} className="dish-card card">
            <div className="dish-content">
              <div className="dish-header">
                <h2 className="dish-title">{dish.name}</h2>
                <span className="dish-price">¥{dish.price.toFixed(2)}</span>
              </div>
              
              <p className="dish-description">{dish.description}</p>

              {/* Tags Section */}
              <div className="tags-container">
                {dish.isSignatureDish && (
                  <span className="signature-badge">Signature</span>
                )}
                {dish.chenPiAge && (
                  <span className="chen-pi-age">
                    {dish.chenPiAge}Y Chen Pi
                  </span>
                )}
                {dish.allergens?.length > 0 && (
                  <span className="allergen-tag">
                    {dish.allergens.join(', ')}
                  </span>
                )}
              </div>

              {/* Menu Tags - Fixed to use name property */}
              {dish.menus?.length > 0 && (
                <div className="menu-tags">
                  {typeof dish.menus === 'string' 
                    ? dish.menus 
                    : Array.isArray(dish.menus) 
                      ? dish.menus.map(menu => 
                          typeof menu === 'string' 
                            ? menu 
                            : menu.name
                        ).join(', ')
                      : ''
                  }
                </div>
              )}

              {/* Restaurant Tags - Fixed to use name property */}
              {dish.restaurants?.length > 0 && (
                <div className="restaurant-tags">
                  {typeof dish.restaurants === 'string'
                    ? dish.restaurants
                    : Array.isArray(dish.restaurants)
                      ? dish.restaurants.map(restaurant =>
                          typeof restaurant === 'string'
                            ? restaurant
                            : restaurant.name
                        ).join(', ')
                      : ''
                  }
                </div>
              )}

              <Link 
                to={`/dish/${dish.slug}`}
                className="view-details-btn"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      {/* Results Summary */}
      <div className="results-summary">
        Showing {dishes.length} of {pagination.totalItems} dishes
      </div>
    </div>
  );
};

export default DishList;