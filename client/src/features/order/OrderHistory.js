// client/src/features/order/OrderHistory.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchOrderHistory } from '../../redux/slices/orderSlice';
import '../../App.css';

// 订单项组件
const OrderItem = ({ item }) => (
 <div className="order-item">
   <div className="item-details">
     <Link to={`/product/${item.product.slug}`}>
       {item.product.name}
     </Link>
     <div className="item-meta">
       <span className="quantity">Qty: {item.quantity}</span>
       <span className="price">¥{item.product.price.toFixed(2)}</span>
     </div>
   </div>
   <div className="item-subtotal">
     ¥{(item.quantity * item.product.price).toFixed(2)}
   </div>
 </div>
);

// 订单卡片组件
const OrderCard = ({ order }) => {
 const formatDate = (dateString) => {
   return new Date(dateString).toLocaleDateString('en-US', {
     year: 'numeric',
     month: 'long',
     day: 'numeric',
     hour: '2-digit',
     minute: '2-digit'
   });
 };

 const getStatusBadgeClass = (status) => {
   switch(status.toLowerCase()) {
     case 'pending':
       return 'status-pending';
     case 'processing':
       return 'status-processing';
     case 'completed':
       return 'status-completed';
     case 'cancelled':
       return 'status-cancelled';
     default:
       return '';
   }
 };

 return (
   <div className="order-card card">
     <div className="order-header">
       <div className="order-info">
         <h3>Order #{order._id}</h3>
         <span className="order-date">{formatDate(order.createdAt)}</span>
       </div>
       <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
         {order.status}
       </span>
     </div>

     <div className="order-items">
       {order.items.map((item) => (
         <OrderItem key={item._id} item={item} />
       ))}
     </div>

     <div className="order-footer">
       <div className="order-summary">
         <div className="summary-row">
           <span>Subtotal:</span>
           <span>¥{order.subtotal?.toFixed(2) || order.totalPrice.toFixed(2)}</span>
         </div>
         {order.deliveryFee > 0 && (
           <div className="summary-row">
             <span>Delivery Fee:</span>
             <span>¥{order.deliveryFee.toFixed(2)}</span>
           </div>
         )}
         <div className="summary-row total">
           <strong>Total:</strong>
           <strong>¥{order.totalPrice.toFixed(2)}</strong>
         </div>
       </div>

       {order.status === 'pending' && (
         <div className="order-actions">
           <button className="btn btn-primary">Track Order</button>
           <button className="btn btn-secondary">Cancel Order</button>
         </div>
       )}
     </div>
   </div>
 );
};

// 空状态组件
const EmptyState = () => (
 <div className="empty-state">
   <h3>No Orders Yet</h3>
   <p>You haven't placed any orders yet. Start shopping to place your first order!</p>
   <Link to="/products" className="btn shop-btn">
     Browse Products
   </Link>
 </div>
);

// 主组件
const OrderHistory = () => {
 const dispatch = useDispatch();
 const { orders, status, error } = useSelector((state) => state.orders);

 useEffect(() => {
   dispatch(fetchOrderHistory());
 }, [dispatch]);

 if (status === 'loading') {
   return (
     <div className="loading-container">
       <div className="loading">Loading order history...</div>
     </div>
   );
 }

 if (status === 'failed') {
   return (
     <div className="error-container">
       <h3>Error Loading Orders</h3>
       <p>{error || 'Failed to load order history. Please try again later.'}</p>
       <button 
         className="btn retry-btn"
         onClick={() => dispatch(fetchOrderHistory())}
       >
         Retry
       </button>
     </div>
   );
 }

 if (status === 'succeeded' && !orders.length) {
   return <EmptyState />;
 }

 return (
   <div className="order-history">
     <div className="page-header">
       <h2>Order History</h2>
       <p>View and track your orders</p>
     </div>

     <div className="order-filters">
       <select className="filter-select" defaultValue="all">
         <option value="all">All Orders</option>
         <option value="pending">Pending</option>
         <option value="processing">Processing</option>
         <option value="completed">Completed</option>
         <option value="cancelled">Cancelled</option>
       </select>

       <select className="filter-select" defaultValue="recent">
         <option value="recent">Most Recent</option>
         <option value="oldest">Oldest First</option>
       </select>
     </div>

     <div className="order-list">
       {orders.map((order) => (
         <OrderCard key={order._id} order={order} />
       ))}
     </div>
   </div>
 );
};

export default OrderHistory;