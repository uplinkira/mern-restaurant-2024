// client/src/features/order/OrderHistory.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderHistory } from '../../redux/slices/orderSlice';
import format from 'date-fns/format';
import { Link } from 'react-router-dom';
import axiosInstance, { API_ENDPOINTS } from '../../utils/config';

const ErrorMessage = ({ message }) => (
  <div className="error-message">
    <p>{message}</p>
  </div>
);

const OrderHistory = () => {
  const dispatch = useDispatch();
  const status = useSelector(state => state.orders.status);
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  
  // 定义所有可能的订单状态
  const ORDER_STATUS = {
    ALL: 'all',
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    READY: 'ready',
    DELIVERING: 'delivering',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  };

  // 状态配置
  const statusConfig = {
    [ORDER_STATUS.ALL]: {
      label: 'All Orders',
      icon: '📊',
      filter: () => true
    },
    [ORDER_STATUS.PENDING]: {
      label: 'Pending',
      icon: '⏳',
      filter: (order) => order.status === 'pending'
    },
    [ORDER_STATUS.CONFIRMED]: {
      label: 'Confirmed',
      icon: '✔️',
      filter: (order) => order.status === 'confirmed'
    },
    [ORDER_STATUS.PREPARING]: {
      label: 'Preparing',
      icon: '👨‍🍳',
      filter: (order) => order.status === 'preparing'
    },
    [ORDER_STATUS.READY]: {
      label: 'Ready',
      icon: '✨',
      filter: (order) => order.status === 'ready'
    },
    [ORDER_STATUS.DELIVERING]: {
      label: 'Delivering',
      icon: '🚚',
      filter: (order) => order.status === 'delivering'
    },
    [ORDER_STATUS.COMPLETED]: {
      label: 'Completed',
      icon: '✅',
      filter: (order) => order.status === 'completed'
    },
    [ORDER_STATUS.CANCELLED]: {
      label: 'Cancelled',
      icon: '❌',
      filter: (order) => order.status === 'cancelled'
    }
  };

  // 计算每个状态的订单数量
  const orderStats = Object.keys(statusConfig).reduce((acc, statusKey) => {
    acc[statusKey] = orders.filter(statusConfig[statusKey].filter).length;
    return acc;
  }, {});

  // 处理筛选点击
  const handleFilterClick = (statusKey) => {
    setActiveFilter(statusKey);
    if (statusKey === ORDER_STATUS.ALL) {
      dispatch(fetchOrderHistory());
    } else {
      // 直接使用状态值，因为已经是小写了
      dispatch(fetchOrderHistory({ status: ORDER_STATUS[statusKey] }));
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axiosInstance.get(API_ENDPOINTS.USER_ORDERS);
        console.log('Orders response:', response.data);
        
        if (!response.data.success) {
          throw new Error(response.data.message);
        }
        
        setOrders(response.data.data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        setError(error.message || 'Failed to fetch orders');
      }
    };

    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    console.log('Current orders:', orders);
    console.log('Current filter:', activeFilter);
  }, [orders, activeFilter]);

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Do you want to cancel this order? This action cannot be undone.')) {
      try {
        setCancellingOrderId(orderId);
        const response = await axiosInstance.post(`${API_ENDPOINTS.ORDERS}/${orderId}/cancel`);
        
        if (response.data.success) {
          // 重新获取订单列表
          const updatedOrdersResponse = await axiosInstance.get(API_ENDPOINTS.USER_ORDERS);
          setOrders(updatedOrdersResponse.data.data);
        } else {
          throw new Error(response.data.message || 'Failed to cancel order');
        }
      } catch (error) {
        console.error('Failed to cancel order:', error);
        setError(error.message || 'Unable to cancel order. Please try again later.');
      } finally {
        setCancellingOrderId(null);
      }
    }
  };

  // Order status badge component
  const OrderStatusBadge = ({ status }) => {
    const statusMap = {
      pending: { label: 'Pending', icon: '⏳' },
      processing: { label: 'Processing', icon: '⚙️' },
      shipped: { label: 'Shipped', icon: '🚚' },
      completed: { label: 'Completed', icon: '✅' },
      cancelled: { label: 'Cancelled', icon: '❌' }
    };

    const { label, icon } = statusMap[status] || { label: status, icon: '❓' };

    return (
      <span className={`status-badge ${status}`}>
        <span className="status-icon">{icon}</span>
        {label}
      </span>
    );
  };

  const OrderCard = ({ order }) => {
    return (
      <div className="order-card">
        <div className="order-header">
          <div className="order-info">
            <span className="order-number">
              {order?._id ? `Order #${order._id}` : 'N/A'}
            </span>
            <span className="order-date">
              {order?.createdAt ? 
                format(new Date(order.createdAt), 'MMM dd, yyyy') : 
                'N/A'
              }
            </span>
          </div>
          <OrderStatusBadge status={order?.status || 'unknown'} />
        </div>

        <div className="order-items">
          {order?.items?.map(item => (
            <div key={item?._id || Math.random()} className="order-item">
              <div className="item-info">
                <img 
                  src={item?.product?.image || '/placeholder-image.jpg'} 
                  alt={item?.product?.name || 'Product'}
                  className="order-item-image"
                />
                <div>
                  <div className="item-name">
                    {item?.product?.name || 'Unknown Product'}
                  </div>
                  <div className="item-meta">
                    <span className="item-quantity">
                      Qty: {item?.quantity || 0}
                    </span>
                    <span className="item-price">
                      ¥{(item?.price || 0).toFixed(2)} each
                    </span>
                  </div>
                </div>
              </div>
              <div className="item-subtotal">
                ¥{((item?.price || 0) * (item?.quantity || 0)).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <div className="order-footer">
          <div className="order-summary">
            <div className="summary-row">
              <span>Total:</span>
              <span className="total-amount">
                ¥{(order?.totalPrice || 0).toFixed(2)}
              </span>
            </div>
          </div>
          
          <div className="order-actions">
            {order?.status === 'pending' && (
              <button
                className="order-btn cancel"
                onClick={() => handleCancelOrder(order._id)}
                disabled={cancellingOrderId === order._id}
              >
                {cancellingOrderId === order._id ? (
                  'Processing...'
                ) : (
                  'Cancel Order'
                )}
              </button>
            )}
            
            <Link 
              to={`/order/details/${order._id}`}
              className="order-btn view"
            >
              Order Details
            </Link>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Order History</h1>
        <p className="page-subtitle">View and track your orders</p>
      </div>

      <div className="status-filters">
        {Object.entries(statusConfig).map(([key, config]) => (
          <button 
            key={key}
            className={`status-filter-btn ${activeFilter === key ? 'active' : ''}`}
            onClick={() => handleFilterClick(key)}
          >
            <span className="filter-icon">{config.icon}</span>
            <span className="filter-count">{orderStats[key]}</span>
            <span className="filter-label">{config.label}</span>
          </button>
        ))}
      </div>

      {/* Orders List */}
      {status === 'loading' ? (
        <div className="loading">Loading orders...</div>
      ) : status === 'failed' ? (
        <div className="error">Failed to load orders</div>
      ) : (
        <div className="order-list">
          {orders?.map(order => (
            <OrderCard key={order?._id} order={order} />
          ))}

          {/* 如果没有订单，显示空态 */}
          {(!orders || orders.length === 0) && (
            <div className="empty-state">
              <p>No orders found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;