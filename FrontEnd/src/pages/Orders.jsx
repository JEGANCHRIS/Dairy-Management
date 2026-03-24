import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import api from "../utils/api";
import { success, error, confirm } from "../utils/toast.jsx";
import "../styles/orders.css";
import ProductBoxIcon from "../assets/product-box.svg";
import CheckIcon from "../assets/check.svg";
import CrossMarkIcon from "../assets/cross-mark.svg";
import TruckIcon from "../assets/delivery-truck.svg";

const Orders = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("current");
  const [hiddenOrders, setHiddenOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/orders/my-orders");
      setOrders(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyAgain = async (order) => {
    try {
      const cartItems = order.products.map((item) => ({
        productId: item.product._id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.images?.[0] || "/placeholder.jpg",
        quantity: item.quantity,
      }));

      const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
      const updatedCart = [...existingCart, ...cartItems];
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      navigate("/cart");
    } catch (err) {
      console.error("Error adding to cart:", err);
      error("Failed to add items to cart. Please try again.");
    }
  };

  const handleTrackOrder = (orderId) => {
    const orderElement = document.getElementById(`order-${orderId}`);
    if (orderElement) {
      orderElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const getTimelineSteps = (orderStatus) => {
    const steps = [
      {
        status: "processing",
        label: "Processing",
        icon: (
          <img
            src={ProductBoxIcon}
            alt="Processing"
            className="timeline-icon-svg"
          />
        ),
      },
      {
        status: "shipped",
        label: "Shipped",
        icon: (
          <img src={TruckIcon} alt="Shipped" className="timeline-icon-svg" />
        ),
      },
      {
        status: "delivered",
        label: "Delivered",
        icon: (
          <img src={CheckIcon} alt="Delivered" className="timeline-icon-svg" />
        ),
      },
    ];

    const statusOrder = ["processing", "shipped", "delivered"];
    const currentIndex = statusOrder.indexOf(orderStatus);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      processing: "#f39c12",
      shipped: "#3498db",
      delivered: "#27ae60",
      cancelled: "#e74c3c",
    };
    return colors[status] || "#95a5a6";
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  const currentOrders = orders.filter(
    (order) =>
      order.orderStatus !== "delivered" && order.orderStatus !== "cancelled",
  );
  const previousOrders = orders.filter(
    (order) =>
      (order.orderStatus === "delivered" ||
        order.orderStatus === "cancelled") &&
      !hiddenOrders.includes(order._id),
  );

  const displayedOrders =
    activeTab === "current" ? currentOrders : previousOrders;

  const handleClearPreviousOrders = () => {
    confirm(
      "Are you sure you want to clear all previous orders? This will hide them from view but they will still be stored in your order history.",
      () => {
        const allPreviousOrderIds = orders
          .filter(
            (order) =>
              order.orderStatus === "delivered" ||
              order.orderStatus === "cancelled",
          )
          .map((order) => order._id);
        setHiddenOrders(allPreviousOrderIds);
        success("Previous orders cleared successfully");
      },
    );
  };

  const handleRestorePreviousOrders = () => {
    setHiddenOrders([]);
    success("Previous orders restored successfully");
  };

  if (loading) {
    return (
      <div className="orders-loading">
        <div className="loading-spinner"></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-error">
        <span className="error-icon">⚠️</span>
        <p>{error}</p>
        <button onClick={fetchOrders} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        <div className="orders-header">
          <h1 className="orders-title">My Orders</h1>
          <p className="orders-subtitle">Track and manage your orders</p>
        </div>

        <div className="orders-tabs">
          <button
            className={`tab-btn ${activeTab === "current" ? "active" : ""}`}
            onClick={() => setActiveTab("current")}
          >
            <span className="tab-icon">
              <img
                src={ProductBoxIcon}
                alt="Current"
                className="tab-icon-svg"
              />
            </span>
            Current Orders ({currentOrders.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "previous" ? "active" : ""}`}
            onClick={() => setActiveTab("previous")}
          >
            <span className="tab-icon">
              <img src={CheckIcon} alt="Previous" className="tab-icon-svg" />
            </span>
            Previous Orders ({previousOrders.length})
          </button>
          {activeTab === "previous" && previousOrders.length > 0 && (
            <button
              className="tab-btn clear-btn"
              onClick={handleClearPreviousOrders}
              title="Clear all previous orders"
            >
              <span className="tab-icon">🗑️</span>
              Clear All
            </button>
          )}
          {activeTab === "previous" && hiddenOrders.length > 0 && (
            <button
              className="tab-btn restore-btn"
              onClick={handleRestorePreviousOrders}
              title="Restore cleared orders"
            >
              <span className="tab-icon">↩️</span>
              Restore
            </button>
          )}
        </div>

        <div className="orders-content">
          {displayedOrders.length === 0 ? (
            <div className="empty-orders">
              <span className="empty-icon">
                {activeTab === "current" ? "📦" : "📋"}
              </span>
              <p className="empty-text">
                {activeTab === "current"
                  ? "No current orders"
                  : "No previous orders"}
              </p>
              <p className="empty-subtext">
                {activeTab === "current"
                  ? "Your active orders will appear here"
                  : "Your order history will appear here"}
              </p>
              {activeTab === "current" && (
                <button
                  className="shop-now-btn"
                  onClick={() => navigate("/products")}
                >
                  Start Shopping
                </button>
              )}
            </div>
          ) : (
            <div className="orders-list">
              {displayedOrders.map((order) => (
                <div
                  key={order._id}
                  className="order-card"
                  id={`order-${order._id}`}
                >
                  <div className="order-header">
                    <div className="order-info">
                      <span className="order-id">
                        Order #{order._id.slice(-8)}
                      </span>
                      <span className="order-date">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <div className="order-status-badge">
                      <span
                        className="status-dot"
                        style={{
                          backgroundColor: getStatusColor(order.orderStatus),
                        }}
                      ></span>
                      <span className="status-text">
                        {order.orderStatus.charAt(0).toUpperCase() +
                          order.orderStatus.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="order-products">
                    {order.products.map((item, index) => (
                      <div key={index} className="order-product-item">
                        <div className="product-image">
                          <img
                            src={item.product.images?.[0] || "/placeholder.jpg"}
                            alt={item.product.name}
                            onError={(e) => {
                              e.target.src = "/placeholder.jpg";
                            }}
                          />
                        </div>
                        <div className="product-details">
                          <h4 className="product-name">{item.product.name}</h4>
                          <div className="product-meta">
                            <span>Quantity: {item.quantity}</span>
                            <span>Price: {formatCurrency(item.price)}</span>
                          </div>
                          <div className="product-price">
                            Total: {formatCurrency(item.quantity * item.price)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {activeTab === "current" &&
                    order.orderStatus !== "cancelled" && (
                      <div className="tracking-section">
                        <h4 className="tracking-title">Track Your Order</h4>
                        <div className="tracking-timeline">
                          {getTimelineSteps(order.orderStatus).map(
                            (step, index) => (
                              <React.Fragment key={step.status}>
                                <div
                                  className={`timeline-step ${step.completed ? "completed" : ""} ${
                                    step.active ? "active" : ""
                                  }`}
                                >
                                  <div className="step-indicator">
                                    <span className="step-icon">
                                      {step.icon}
                                    </span>
                                  </div>
                                  <span className="step-label">
                                    {step.label}
                                  </span>
                                </div>
                                {index < 2 && (
                                  <div
                                    className={`timeline-connector ${
                                      step.completed ? "completed" : ""
                                    }`}
                                  ></div>
                                )}
                              </React.Fragment>
                            ),
                          )}
                        </div>
                        {order.orderStatus === "processing" && (
                          <p className="tracking-note">
                            ⏱️ Your order is being prepared for shipment
                          </p>
                        )}
                        {order.orderStatus === "shipped" && (
                          <p className="tracking-note">
                            <img
                              src={TruckIcon}
                              alt="Truck"
                              className="inline-icon"
                            />
                            Your order is on the way!
                          </p>
                        )}
                      </div>
                    )}

                  {order.orderStatus === "cancelled" && (
                    <div className="cancelled-message">
                      <span className="cancel-icon">
                        <img
                          src={CrossMarkIcon}
                          alt="Cancelled"
                          className="cancel-icon-svg"
                        />
                      </span>
                      <p>This order has been cancelled</p>
                    </div>
                  )}

                  <div className="order-footer">
                    <div className="order-total">
                      <span className="total-label">Total Amount:</span>
                      <span className="total-amount">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                    <div className="order-actions">
                      {activeTab === "previous" &&
                        order.orderStatus === "delivered" && (
                          <button
                            className="buy-again-btn"
                            onClick={() => handleBuyAgain(order)}
                          >
                            <span className="btn-icon">
                              <img
                                src={ProductBoxIcon}
                                alt="Buy Again"
                                className="btn-icon-svg"
                              />
                            </span>
                            Buy Again
                          </button>
                        )}
                      {activeTab === "current" &&
                        order.orderStatus === "processing" && (
                          <button
                            className="cancel-order-btn"
                            onClick={() => {
                              confirm(
                                "Are you sure you want to cancel this order?",
                                async () => {
                                  try {
                                    await api.put(
                                      `/orders/${order._id}/cancel`,
                                    );
                                    success("Order cancelled successfully");
                                    fetchOrders();
                                  } catch (err) {
                                    error(
                                      "Failed to cancel order. Please try again.",
                                    );
                                  }
                                },
                              );
                            }}
                          >
                            Cancel Order
                          </button>
                        )}
                      <button
                        className="view-details-btn"
                        onClick={() => handleTrackOrder(order._id)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
