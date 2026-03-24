import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import CheckIcon from '../assets/check.svg';
import '../styles/order-confirmation.css';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/orders/${orderId}`);
        setOrder(response.data);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="order-confirmation-page">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-confirmation-page">
        <div className="container">
          <div className="error-container">
            <h1>Error</h1>
            <p>{error || 'Order not found'}</p>
            <Link to="/products" className="btn btn-primary">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-confirmation-page">
      <div className="container">
        <div className="confirmation-box">
          <div className="success-icon">
            <img src={CheckIcon} alt="Success" className="success-icon-svg" />
          </div>
          
          <h1>Order Placed Successfully!</h1>
          <p className="confirmation-message">
            Thank you for your order. We'll send you a confirmation email shortly.
          </p>

          <div className="order-details-card">
            <div className="order-details-header">
              <h2>Order Details</h2>
              <span className="order-id">#{order._id?.slice(-8)}</span>
            </div>

            <div className="order-details-body">
              <div className="detail-row">
                <span className="detail-label">Order Date:</span>
                <span className="detail-value">{formatDate(order.createdAt)}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Order Status:</span>
                <span className={`detail-value status-${order.orderStatus}`}>
                  {order.orderStatus}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Payment Method:</span>
                <span className="detail-value">{order.paymentMethod}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Payment Status:</span>
                <span className={`detail-value status-${order.paymentStatus}`}>
                  {order.paymentStatus}
                </span>
              </div>

              {order.deliveryType && (
                <div className="detail-row">
                  <span className="detail-label">Delivery:</span>
                  <span className="detail-value capitalize">{order.deliveryType}</span>
                </div>
              )}

              {order.deliveryCharge > 0 && (
                <div className="detail-row">
                  <span className="detail-label">Delivery Charge:</span>
                  <span className="detail-value">{formatCurrency(order.deliveryCharge)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="shipping-address-card">
            <h3>Shipping Address</h3>
            <p className="address-text">
              {order.shippingAddress?.street}<br />
              {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}<br />
              {order.shippingAddress?.country}
            </p>
          </div>

          <div className="order-items-card">
            <h3>Order Items</h3>
            <div className="order-items-list">
              {order.products?.map((item, index) => (
                <div key={index} className="order-item">
                  <span className="item-name">{item.product?.name || 'Product'}</span>
                  <span className="item-quantity">× {item.quantity}</span>
                  <span className="item-price">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="order-total-card">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.totalAmount - (order.deliveryCharge || 0))}</span>
            </div>
            {order.deliveryCharge > 0 && (
              <div className="total-row">
                <span>Delivery:</span>
                <span>{formatCurrency(order.deliveryCharge)}</span>
              </div>
            )}
            <div className="total-row grand-total">
              <span>Total:</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          <div className="confirmation-actions">
            <Link to="/orders" className="btn btn-primary">View My Orders</Link>
            <Link to="/products" className="btn btn-secondary">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
