// client/src/features/product/ProductList.js
import React, { useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
 fetchProducts,
 setFilters,
 setSorting,
 setPagination,
 selectAllProducts,
 selectProductStatus,
 selectProductError,
 selectProductFilters,
 selectProductPagination,
 selectAvailableCategories,
 selectSortOptions
} from '../../redux/slices/productSlice';
import {
  addToCart
} from '../../redux/slices/cartSlice';
import '../../App.css';
import Masonry from 'masonry-layout';
import AddToCartButton from '../cart/AddToCartButton';

// Filter Section Component
const FilterSection = ({ categories, currentCategory, onCategoryChange }) => (
 <div className="filters-container">
   <div className="filter-buttons">
     {categories.map(category => (
       <button
         key={category}
         className={`filter-btn ${currentCategory === category ? 'active' : ''}`}
         onClick={() => onCategoryChange(category)}
       >
         {category}
       </button>
     ))}
   </div>
 </div>
);

// Sorting Section Component
const SortingSection = ({ options, currentSort, onSortChange }) => (
 <div className="sorting-section">
   <select
     value={`${currentSort.sortBy}-${currentSort.order}`}
     onChange={(e) => {
       const [sortBy, order] = e.target.value.split('-');
       onSortChange({ sortBy, order });
     }}
     className="form-input"
   >
     {options.map(option => (
       <option 
         key={`${option.value}-${option.order}`}
         value={`${option.value}-${option.order}`}
       >
         {option.label}
       </option>
     ))}
   </select>
 </div>
);

// Product Grid Component
const ProductGrid = ({ products, onAddToCart }) => {
  const gridRef = useRef(null);
  const masonryRef = useRef(null);

  useEffect(() => {
    if (gridRef.current) {
      // 初始化前先销毁已存在的实例
      if (masonryRef.current) {
        masonryRef.current.destroy();
      }

      // 初始化 Masonry
      masonryRef.current = new Masonry(gridRef.current, {
        itemSelector: '.card',
        columnWidth: '.card-sizer',
        percentPosition: false,
        gutter: 32, // 增加间距
        fitWidth: true, // 启用自适应宽度
        horizontalOrder: true, // 保持水平顺序
        initLayout: false, // 等待图片加载后再初始化布局
        transitionDuration: '0.3s'
      });

      // 优化图片加载后的布局
      const images = gridRef.current.getElementsByTagName('img');
      let loadedImages = 0;
      const totalImages = images.length;

      function onImageLoad() {
        loadedImages++;
        if (loadedImages === totalImages && masonryRef.current) {
          masonryRef.current.layout();
        }
      }

      Array.from(images).forEach(img => {
        if (img.complete) {
          onImageLoad();
        } else {
          img.addEventListener('load', onImageLoad);
        }
      });

      // 优化窗口调整时的重新布局
      const handleResize = debounce(() => {
        if (masonryRef.current) {
          masonryRef.current.layout();
        }
      }, 150);

      window.addEventListener('resize', handleResize);

      // 初始布局
      masonryRef.current.layout();
      
      return () => {
        window.removeEventListener('resize', handleResize);
        Array.from(images).forEach(img => {
          img.removeEventListener('load', onImageLoad);
        });
        if (masonryRef.current) {
          masonryRef.current.destroy();
        }
      };
    }
  }, [products]);

  // Debounce helper function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  return (
    <div className="masonry-wrapper">
      <div className="card-grid" ref={gridRef}>
        <div className="card-sizer"></div>
        {products.map(product => (
          <div key={product.slug} className="card">
            <Link to={`/product/${product.slug}`} className="product-link">
              {product.image && (
                <img 
                  className="product-image" 
                  src={product.image} 
                  alt={product.name}
                  loading="lazy"
                />
              )}
              <div className="product-content">
                <h3>{product.name}</h3>
                <div className="product-meta">
                  <span className="category">{product.category}</span>
                  {product.isFeatured && (
                    <span className="featured-badge">Featured</span>
                  )}
                </div>
                <p className="description">{product.description}</p>
                <div className="price-info">
                  <span className="price">¥{product.price.toFixed(2)}</span>
                </div>
              </div>
            </Link>
            <div className="product-actions">
              {!product.availableForDelivery ? (
                <p className="availability-notice">In-store purchase only</p>
              ) : (
                <AddToCartButton 
                  product={product}
                  initialQuantity={1}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Pagination Component
const Pagination = ({ pagination, onChange }) => (
  <div className="pagination">
    <button
      onClick={() => onChange(pagination.currentPage - 1)}
      disabled={pagination.currentPage === 1}
    >
      <span>← Previous</span>
    </button>
    <div className="page-info">
      Page {pagination.currentPage} of {pagination.totalPages}
    </div>
    <button
      onClick={() => onChange(pagination.currentPage + 1)}
      disabled={pagination.currentPage === pagination.totalPages}
    >
      <span>Next →</span>
    </button>
  </div>
);

// Main ProductList Component
const ProductList = () => {
  const dispatch = useDispatch();
  const products = useSelector(selectAllProducts) || [];
  const status = useSelector(selectProductStatus);
  const error = useSelector(selectProductError);
  const filters = useSelector(selectProductFilters);
  const pagination = useSelector(selectProductPagination);
  const categories = useSelector(selectAvailableCategories);
  const sortOptions = useSelector(selectSortOptions);

  // 使用 useMemo 来记忆请求参数
  const requestParams = useMemo(() => ({
    page: pagination?.currentPage || 1,
    limit: pagination?.itemsPerPage || 10,
    category: filters?.category === 'All' ? '' : filters?.category,
    sortBy: filters?.sortBy || 'createdAt',
    order: filters?.order || 'desc'
  }), [
    pagination?.currentPage,
    pagination?.itemsPerPage,
    filters?.category,
    filters?.sortBy,
    filters?.order
  ]);

  useEffect(() => {
    let timeoutId;
    
    // 只在组件挂载时或请求参数变化时发送请求
    if (requestParams) {
      timeoutId = setTimeout(() => {
        dispatch(fetchProducts(requestParams));
      }, 300);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [dispatch, requestParams]); // 只依赖 dispatch 和 requestParams

  const handleCategoryChange = (category) => {
    dispatch(setFilters({ category }));
    dispatch(setPagination({ currentPage: 1 }));
  };

  const handleSortChange = (sorting) => {
    dispatch(setSorting(sorting));
    dispatch(setPagination({ currentPage: 1 }));
  };

  const handlePageChange = (newPage) => {
    dispatch(setPagination({ currentPage: newPage }));
  };

  const handleAddToCart = async (product, quantity = 1) => {
    try {
      await dispatch(addToCart({ product, quantity })).unwrap();
    } catch (err) {
      console.error('Failed to add to cart:', err);
      // 可以在这里添加错误提示
    }
  };

  if (status === 'loading') {
    return <div className="loading">Loading products...</div>;
  }

  if (status === 'failed') {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="product-list">
      <div className="product-list-header">
        <FilterSection
          categories={categories}
          currentCategory={filters.category}
          onCategoryChange={handleCategoryChange}
        />
        <SortingSection
          options={sortOptions}
          currentSort={{ sortBy: filters.sortBy, order: filters.order }}
          onSortChange={handleSortChange}
        />
      </div>

      {products.length === 0 ? (
        <div className="no-products">No products found</div>
      ) : (
        <>
          <ProductGrid 
            products={products}
            onAddToCart={handleAddToCart}
          />
          <Pagination 
            pagination={pagination}
            onChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default ProductList;