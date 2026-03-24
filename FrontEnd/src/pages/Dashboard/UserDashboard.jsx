import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { WishlistContext } from "../../context/WishlistContext";
import api from "../../utils/api";
import "../../styles/dashboard.css";

const UserDashboard = () => {
  const { user } = useContext(AuthContext);
  const { wishlistItems } = useContext(WishlistContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const ordersResponse = await api.get("/orders/my-orders");
      setOrders(ordersResponse.data);

      // Calculate stats
      const totalOrders = ordersResponse.data.length;
      const totalSpent = ordersResponse.data.reduce(
        (sum, order) => sum + order.totalAmount,
        0,
      );
      const pendingOrders = ordersResponse.data.filter(
        (o) => o.orderStatus === "processing",
      ).length;
      const completedOrders = ordersResponse.data.filter(
        (o) => o.orderStatus === "delivered",
      ).length;

      setStats({
        totalOrders,
        totalSpent,
        pendingOrders,
        completedOrders,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      processing: "badge-warning",
      shipped: "badge-info",
      delivered: "badge-success",
      cancelled: "badge-danger",
    };
    return badges[status] || "badge-secondary";
  };

  if (loading) {
    return (
      <section className="dashboard">
        <div className="container">
          <div className="loading">Loading dashboard...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Welcome, {user?.name}!</h1>
          <p>
            {user?.createdAt
              ? `Member since ${new Date(user.createdAt).toLocaleDateString()}`
              : "Welcome aboard!"}
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Orders</h3>
            <div className="stat-number">{stats.totalOrders}</div>
          </div>
          <div className="stat-card">
            <h3>Total Spent</h3>
            <div className="stat-number">₹{stats.totalSpent.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <h3>Pending Orders</h3>
            <div className="stat-number">{stats.pendingOrders}</div>
          </div>
          <div className="stat-card">
            <h3>Completed Orders</h3>
            <div className="stat-number">{stats.completedOrders}</div>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Orders</h2>
            <Link to="/orders" className="view-all">
              View All
            </Link>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Products</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order) => (
                  <tr key={order._id}>
                    <td>#{order._id.slice(-8)}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>{order.products.length} items</td>
                    <td>₹{order.totalAmount.toFixed(2)}</td>
                    <td>
                      <span
                        className={`badge ${getStatusBadge(order.orderStatus)}`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${order.paymentStatus === "completed" ? "badge-success" : "badge-warning"}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <Link to={`/order/${order._id}`} className="btn-link">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Wishlist Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>❤️ My Wishlist</h2>
            <Link to="/wishlist" className="view-all">
              View All
            </Link>
          </div>

          {wishlistItems.length === 0 ? (
            <div className="wishlist-empty-dashboard">
              <div className="empty-icon">🤍</div>
              <h3>Your wishlist is empty</h3>
              <p>Start adding products you love!</p>
              <Link to="/products" className="btn btn-primary">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="dashboard-wishlist-grid">
              {wishlistItems.slice(0, 4).map((item) => {
                const product = item.product;
                if (!product) return null;

                const imageUrl =
                  product.images && product.images[0]
                    ? product.images[0].startsWith("/uploads")
                      ? "http://localhost:5000" + product.images[0]
                      : product.images[0]
                    : "https://via.placeholder.com/150x150?text=No+Image";

                return (
                  <div key={product._id} className="wishlist-item-card">
                    <Link
                      to={`/product/${product._id}`}
                      className="wishlist-item-link"
                    >
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="wishlist-item-image"
                      />
                      <div className="wishlist-item-info">
                        <h4>{product.name}</h4>
                        <p className="wishlist-item-price">
                          ₹{product.price.toFixed(2)}
                        </p>
                        {product.stock > 0 ? (
                          <span className="stock-status in-stock">
                            In Stock
                          </span>
                        ) : (
                          <span className="stock-status out-of-stock">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Profile Information</h3>
            <div className="profile-info">
              <p>
                <strong>Name:</strong> {user?.name}
              </p>
              <p>
                <strong>Email:</strong> {user?.email}
              </p>
              <p>
                <strong>Phone:</strong> {user?.phoneNumber || "Not provided"}
              </p>
              <p>
                <strong>Address:</strong>{" "}
                {user?.address
                  ? `${user.address.street}, ${user.address.city}`
                  : "Not provided"}
              </p>
            </div>
            <Link to="/profile/edit" className="btn btn-secondary">
              Edit Profile
            </Link>
          </div>

          <div className="dashboard-card">
            <h3>Quick Actions</h3>
            <div className="quick-actions">
              <Link to="/products" className="action-link">
                🛒 Browse Products
              </Link>
              <Link to="/cart" className="action-link">
                🛍️ View Cart
              </Link>
              <Link to="/wishlist" className="action-link">
                ❤️ Wishlist
              </Link>
              <Link to="/blogs" className="action-link">
                📚 Read Blogs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserDashboard;
